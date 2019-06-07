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

const COMPOSE_CONFIG_VERSION = 3.7

const dockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'docker-compose.yml')

if (!fs.existsSync(dockerComposeConfigPath)) {
	fs.writeFileSync(dockerComposeConfigPath, `version: "${COMPOSE_CONFIG_VERSION}"`)
}

const dockerComposeConfig = yaml.parse(fs.readFileSync(dockerComposeConfigPath).toString())

const config = {
	pg: {
		default_user: 'root',
		default_password: 'root',
		default_db: 'sample',
	}
}

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
			createServiceFromTemplate('express-api')
		)

		.command(
			['api-workframe <name>', 'api-wf <name>'],
			'Create workframe-powered express app in active project',
			_.noop,
			createServiceFromTemplate('express-api-workframe')
		)

		.command(
			['postgres [name]', 'pg [name]'],
			'Create postgres service in active project',
			_.noop,
			argv => {
				const name = argv.name || 'postgres'
				const serviceName = `${conf.get('activeProject.name')}-${name}`
				const destPath = path.resolve(
					conf.get('activeProject.path'),
					serviceName
				)

				console.log('Generating service: %s', chalk.bold(serviceName))
				console.log('Under path: %s', chalk.bold(destPath))
				scaffolder.generate('postgres', destPath)

				const volumeName = `${serviceName}-data`
				if (!dockerComposeConfig.services) {
					dockerComposeConfig.services = {}
				}
				dockerComposeConfig.services[serviceName] = {
					build: `./${serviceName}`,
					restart: 'always',
					environment: {
						POSTGRES_USER: config.pg.default_user,
						POSTGRES_PASSWORD: config.pg.default_password,
						POSTGRES_DB: config.pg.default_db,
					},
					volumes: [
						`${volumeName}:/var/lib/postgresql/data`,
					],
				}

				if (!dockerComposeConfig.volumes) {
					dockerComposeConfig.volumes = {}
				}
				dockerComposeConfig.volumes[volumeName] = { driver: 'local' }

				writeDockerComposeConfig(dockerComposeConfig)

				console.log('Updated docker-compose.yml')
				console.log(chalk.green('Success!'))
			}
		)

		.demandCommand()
		.strict()
		.help()
}

function createServiceFromTemplate (templateName) {
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
			restart: 'always',
		}
		writeDockerComposeConfig(dockerComposeConfig)
		console.log('Updated docker-compose.yml')

		console.log(chalk.green('Success!'))
	}
}

function writeDockerComposeConfig (config) {
	fs.writeFileSync(dockerComposeConfigPath, yaml.stringify(config))
}
