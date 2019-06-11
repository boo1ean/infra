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

// docker-compose.yml
const dockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'docker-compose.yml')
if (!fs.existsSync(dockerComposeConfigPath)) {
	fs.writeFileSync(dockerComposeConfigPath, `version: "${COMPOSE_CONFIG_VERSION}"`)
}
const dockerComposeConfig = yaml.parse(fs.readFileSync(dockerComposeConfigPath).toString())

// dev.docker-compose.yml
const devDockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'dev.docker-compose.yml')
if (!fs.existsSync(devDockerComposeConfigPath)) {
	fs.writeFileSync(devDockerComposeConfigPath, `version: "${COMPOSE_CONFIG_VERSION}"`)
}
const devDockerComposeConfig = yaml.parse(fs.readFileSync(devDockerComposeConfigPath).toString())


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
		.alias('d', 'dep')
		.describe('d', 'Dependency service name')

		.command(
			['api-workframe <name>', 'api-wf <name>'],
			'Create workframe-powered express app in active project',
			_.noop,
			createServiceFromTemplate('express-api-workframe')
		)
		.alias('d', 'dep')
		.describe('d', 'Dependency service name')

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
		console.log(argv)
		return
		const serviceName = `${conf.get('activeProject.name')}-${argv.name}`
		const destPath = path.resolve(
			conf.get('activeProject.path'),
			serviceName
		)

		console.log('Generating service: %s', chalk.bold(serviceName))
		console.log('Under path: %s', chalk.bold(destPath))
		scaffolder.generate(templateName, destPath)

		updateDockerCompose()
		updateDevDockerCompose()

		console.log(chalk.green('Success!'))

		function updateDockerCompose () {
			if (!dockerComposeConfig.services) {
				dockerComposeConfig.services = {}
			}
			dockerComposeConfig.services[serviceName] = {
				build: `./${serviceName}`,
				restart: 'always',
			}
			writeDockerComposeConfig(dockerComposeConfig)
			console.log('Updated docker-compose.yml')
		}

		function updateDevDockerCompose () {
			if (!devDockerComposeConfig.services) {
				devDockerComposeConfig.services = {}
			}
			devDockerComposeConfig.services[serviceName] = {
				build: `./${serviceName}`,
				restart: 'always',
			}
			writeDockerComposeConfig(devDockerComposeConfig)
			console.log('Updated docker-compose.yml')
		}
	}
}

function resolveDependenciesNames (deps) {
	deps = Array.isArray(deps) ? deps : [deps]
	// get list of services
	// get matching srevice by name using regex match
	// compose list of deps
	// put it to compose file deps property
	// find out if dependency has some ports to wait for
	return deps
}

function writeDockerComposeConfig (config) {
	fs.writeFileSync(dockerComposeConfigPath, yaml.stringify(config))
}
