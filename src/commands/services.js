const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const execa = require('execa')
const utils = require('../utils')
const conf = new Conf()

const composeConfigFileName = utils.getComposeFilename()
const projectPath = conf.get('activeProject.path')

const BASE_COMMAND = `cd ${projectPath} && DOCKER_BUILDKIT=1 docker-compose -f ${composeConfigFileName}`

module.exports = yargs => {
	return yargs

		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const services = utils.getServicesNames()
			console.log(chalk.bold(conf.get('activeProject.name')))
			services.forEach(s => console.log(chalk.magenta(s)))
		})

		.command(['start <service>', 's <service>'], 'start service', _.noop, startService)
		.alias('l', 'logs')
		.describe('l', 'Attach to service logs')

		.command(['connect <service>', 'c <service>'], 'connect to service', _.noop, ({ service }) => {
			const serviceConfig = getServiceConfig(service)
			const connectCommand = _.get(serviceConfig, 'labels.["infra.connect"]', 'sh')
			execa.shell(`${BASE_COMMAND} exec ${service} ${connectCommand}`, { stdio: 'inherit' })
		})

		.command(['logs [service]', 'l [service]'], 'show service logs', _.noop, ({ service }) => attachToLogs(service))

		.command(['down [service]', 'd [service]'], 'stop all services', _.noop, ({ service }) => dockerComposeDown(service))
		.demandCommand()
		.strict()
		.help()
}

async function startService ({ service, l }) {
	const cmd = `${BASE_COMMAND} up --build -d ${service}`
	await execa.shell(cmd, { stdio: 'inherit' })
	if (l) {
		await attachToLogs(service)
	}
}

async function dockerComposeDown (service) {
	let cmd = `${BASE_COMMAND} down`
	return execa.shell(cmd, { stdio: 'inherit' })
}

async function attachToLogs (service) {
	return execa.shell(`${BASE_COMMAND} logs --tail 1000 -f ${service || ''}`, { stdio: 'inherit' })
}

async function removeVolumes (service) {
	console.log('hit remove volumes')
}

function getServiceConfig (service) {
	const { services } = utils.getCurrentEnvDockerComposeConfig()
	if (!services[service]) {
		console.error(chalk.bgRed('Service %s not found'), service)
		process.exit(-1)
	}
	return services[service]
}
