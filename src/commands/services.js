const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const conf = new Conf()

module.exports = yargs => {
	return yargs
		.command(['list', 'ls'], 'list current project services', _.noop, () => {
			const { services } = require(conf.get('activeProject.servicesConfigPath'))
			console.log(chalk.bold(conf.get('activeProject.name')))
			Object.keys(services).forEach(s => console.log(chalk.magenta(s)))
		})
		.command('start', 'start service', _.noop, () => {
			console.log('start service')
		})
		.command('connect', 'connect to service', _.noop, () => {
			console.log('connect service')
		})
		.demandCommand()
		.strict()
		.help()
}
