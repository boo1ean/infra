const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const execa = require('execa')
const createRunner = require('../run-service')
const utils = require('../utils')
const conf = new Conf()

module.exports = yargs => {
	return yargs
		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const services = utils.getServicesNames()
			console.log(chalk.bold(conf.get('activeProject.name')))
			services.forEach(s => console.log(chalk.magenta(s)))
		})
		.command(['start <service>', 's <service>'], 'start service', _.noop, argv => {
			const services = utils.getServicesConfig()
			const run = createRunner({
				services,
				projectBasePath: conf.get('activeProject.path'),
			})
			run(argv.service, { n: true })
		})
		.command(['connect <service>', 'c <service>'], 'connect to service', _.noop, argv => {
			const services = utils.getServicesConfig()
			const service = services[argv.service]
			if (!service) {
				return console.error(chalk.bgRed('Service %s not found'), argv.service)
			}
			if (service.connect) {
				execa.shell(`docker exec -it ${argv.service} ${service.connect}`, { stdio: 'inherit' })
			} else {
				execa.shell(`docker logs --tail 1000 -f ${argv.service}`, { stdio: 'inherit' })
			}
		})
		.command(['logs <service>', 'l <service>'], 'show service logs', _.noop, argv => {
			const services = utils.getServicesConfig()
			const service = services[argv.service]
			if (!service) {
				return console.error(chalk.bgRed('Service %s not found'), argv.service)
			}
			execa.shell(`docker logs --tail 1000 -f ${argv.service}`, { stdio: 'inherit' })
		})
		.demandCommand()
		.strict()
		.help()
}
