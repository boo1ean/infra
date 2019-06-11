const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const execa = require('execa')
const createRunner = require('../run-service')
const utils = require('../utils')
const conf = new Conf()

const envPrefix = process.env.NODE_ENV || ''
const composeConfigFileName = [envPrefix, 'docker-compose.yml'].join('.')
const projectPath = conf.get('activeProject.path')

module.exports = yargs => {
	return yargs
		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const services = utils.getServicesNames()
			console.log(chalk.bold(conf.get('activeProject.name')))
			services.forEach(s => console.log(chalk.magenta(s)))
		})
		.command(['start <service>', 's <service>'], 'start service', _.noop, ({ service }) => {
			getServiceConfig(service)
			const cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} run -d --name ${service} ${service}`
			execa.shell(cmd, { stdio: 'inherit' })
		})
		.command(['connect <service>', 'c <service>'], 'connect to service', _.noop, ({ service }) => {
			const serviceConfig = getServiceConfig(service)
			const connectCommand = _.get(serviceConfig, 'labels.["infra.connect"]', 'sh')
			execa.shell(`docker exec -it ${service} ${connectCommand}`, { stdio: 'inherit' })
		})
		.command(['logs <service>', 'l <service>'], 'show service logs', _.noop, ({ service }) => {
			getServiceConfig(service)
			execa.shell(`docker logs --tail 1000 -f ${service}`, { stdio: 'inherit' })
		})
		.command(['down', 'd'], 'stop all services', _.noop, () => {
			const cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} down`
			execa.shell(cmd, { stdio: 'inherit' })
		})
		.demandCommand()
		.strict()
		.help()
}

function getServiceConfig (service) {
	const { services } = utils.getCurrentEnvDockerComposeConfig()
	if (!services[service]) {
		console.error(chalk.bgRed('Service %s not found'), service)
		process.exit(-1)
	}
	return services[service]
}
