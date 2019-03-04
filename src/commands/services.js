const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const createRunner = require('../run-service')
const conf = new Conf()

module.exports = yargs => {
	return yargs
		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const { services } = require(conf.get('activeProject.servicesConfigPath'))
			console.log(chalk.bold(conf.get('activeProject.name')))
			Object.keys(services).forEach(s => console.log(chalk.magenta(s)))
		})
		.command('start <serviceName>', 'start service', _.noop, argv => {
			const servicesConfig = require(conf.get('activeProject.servicesConfigPath'))
			const run = createRunner({
				...servicesConfig,
				projectBasePath: conf.get('activeProject.path'),
			})
			run(argv.serviceName, { n: true })
		})
		.command('connect', 'connect to service', _.noop, () => {
			console.log('connect service')
		})
		.demandCommand()
		.strict()
		.help()
}
