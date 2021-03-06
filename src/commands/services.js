const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const execa = require('execa')
const utils = require('../utils')
const conf = new Conf()

const composeConfigFileName = utils.getComposeFilename()
const projectPath = conf.get('activeProject.path')

module.exports = yargs => {
	return yargs
		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const services = utils.getServicesNames()
			console.log(chalk.bold(conf.get('activeProject.name')))
			services.forEach(s => console.log(chalk.magenta(s)))
		})
		.command(['start <service>', 's <service>'], 'start service', _.noop, async ({ service }) => {
			const cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} up --build -d ${service}`
			execa.shell(cmd, { stdio: 'inherit' })
		})
		.command(['restart <service>', 'r <service>'], 'restart service', _.noop, async ({ service }) => {
			const cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} restart ${service}`
			execa.shell(cmd, { stdio: 'inherit' })
		})
		.command(['connect <service>', 'c <service>'], 'connect to service', _.noop, ({ service }) => {
			const serviceConfig = getServiceConfig(service)
			const connectCommand = _.get(serviceConfig, 'labels.["infra.connect"]', 'bash')
			execa.shell(`cd ${projectPath} && docker-compose -f ${composeConfigFileName} exec ${service} ${connectCommand}`, { stdio: 'inherit' })
		})
		.command(['logs [service]', 'l [service]'], 'show service logs', _.noop, ({ service }) => {
			execa.shell(`cd ${projectPath} && docker-compose -f ${composeConfigFileName} logs --tail 1000 -f ${service || ''}`, { stdio: 'inherit' })
		})
		.command(['down [service]', 'd [service]'], 'stop all services', _.noop, dockerComposeDown)
		.demandCommand()
		.strict()
		.help()
}

function dockerComposeDown ({ service }) {
	let cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} down`
	if (service) {
		cmd = `cd ${projectPath} && docker-compose -f ${composeConfigFileName} stop ${service}`
	}
	return execa.shell(cmd, { stdio: 'inherit' })
}

function getServiceConfig (service) {
	const { services } = utils.getCurrentEnvDockerComposeConfig()
	if (!services[service]) {
		console.error(chalk.bgRed('Service %s not found'), service)
		process.exit(-1)
	}
	return services[service]
}
