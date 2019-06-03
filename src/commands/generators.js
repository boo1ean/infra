const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const execa = require('execa')
const yaml = require('yaml')
const createRunner = require('../run-service')
const utils = require('../utils')
const scaffolder = require('../scaffolder')
const conf = new Conf()

const dockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'docker-compose.yml')
const dockerComposeConfig = yaml.parse(fs.readFileSync(dockerComposeConfigPath).toString())

module.exports = yargs => {
	return yargs
		.command(['postgres [name]', 'pg [name]'], 'Create postgres service in active project', _.noop, argv => {

			// copy sample express api app
			// update templates placeholders
			// update docker-compose.yml

		})

		.command(['frontend <name>', 'f <name>'], 'Create frontend app in active project', _.noop, argv => {

			// copy sample express api app
			// update templates placeholders
			// update docker-compose.yml

		})

		.command(
			['api <name>'],
			'Create express app in active project',
			_.noop,
			createApiApp('express-api')
		)

		.command(
			['api-workframe <name>', 'api-wf <name>'],
			'Create workframe-powered express app in active project',
			_.noop,
			createApiApp('express-api-workframe')
		)

		.command(['workframe-api <name>', 'wf-api <name>'], 'Create workframe-powered express app in active project', _.noop, argv => {

			// copy sample express api app
			// update templates placeholders
			// update docker-compose.yml

		})

		.demandCommand()
		.strict()
		.help()
}

function createApiApp (templateName) {
	return argv => {
		const serviceName = `${conf.get('activeProject.name')}-${argv.name}`
		const destPath = path.resolve(
			conf.get('activeProject.path'),
			serviceName
		)

		console.log('Generating service: %s', chalk.bold(serviceName))
		console.log('Under path: %s', chalk.bold(destPath))
		scaffolder.generate(templateName, destPath)

		if (!dockerComposeConfig.services) {
			dockerComposeConfig.services = {}
		}
		dockerComposeConfig.services[serviceName] = {
			build: `./${serviceName}`,
		}
		writeDockerComposeConfig(dockerComposeConfig)
		console.log('Updated docker-compose.yml')

		console.log(chalk.green('Success!'))
	}
}

function writeDockerComposeConfig (config) {
	fs.writeFileSync(dockerComposeConfigPath, yaml.stringify(config))
}
