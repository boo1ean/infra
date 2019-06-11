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

let dockerComposeConfigPath
let dockerComposeConfig
let devDockerComposeConfigPath
let devDockerComposeConfig
if (conf.get('activeProject.path')) {
	// docker-compose.yml
	dockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'docker-compose.yml')
	if (!fs.existsSync(dockerComposeConfigPath)) {
		fs.writeFileSync(dockerComposeConfigPath, `version: "${COMPOSE_CONFIG_VERSION}"`)
	}
	dockerComposeConfig = yaml.parse(fs.readFileSync(dockerComposeConfigPath).toString())

	// dev.docker-compose.yml
	devDockerComposeConfigPath = path.resolve(conf.get('activeProject.path'), 'dev.docker-compose.yml')
	if (!fs.existsSync(devDockerComposeConfigPath)) {
		fs.writeFileSync(devDockerComposeConfigPath, `version: "${COMPOSE_CONFIG_VERSION}"`)
	}
	devDockerComposeConfig = yaml.parse(fs.readFileSync(devDockerComposeConfigPath).toString())
}


const config = {
	pg: {
		default_user: 'root',
		default_password: 'root',
		default_db: 'sample',
	}
}

module.exports = yargs => {
	return yargs

		.command(['frontend <name>', 'f <name>'], 'Create frontend app in active project', _.noop, argv => {
			assertActiveProject()
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
				assertActiveProject()
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

				updateDockerCompose(dockerComposeConfigPath, dockerComposeConfig)
				updateDockerCompose(devDockerComposeConfigPath, devDockerComposeConfig)

				console.log('Updated docker-compose.yml')
				console.log(chalk.green('Success!'))

				function updateDockerCompose (dockerComposeConfigPath, dockerComposeConfig) {
					if (!dockerComposeConfig.services) {
						dockerComposeConfig.services = {}
					}
					dockerComposeConfig.services[serviceName] = {
						container_name: serviceName,
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
					writeDockerComposeConfig(dockerComposeConfigPath, dockerComposeConfig)
				}

			}
		)

		.demandCommand()
		.strict()
		.help()
}

function createServiceFromTemplate (templateName) {
	return argv => {
		assertActiveProject()
		const deps = resolveDependenciesNames(argv.dep)
		const serviceName = `${conf.get('activeProject.name')}-${argv.name}`
		const postgresServiceName = `${conf.get('activeProject.name')}-postgres`
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
				container_name: serviceName,
				build: `./${serviceName}`,
				restart: 'always',
				environment: {
					PG_HOST: postgresServiceName,
				},
			}

			if (deps) {
				dockerComposeConfig.services[serviceName].depends_on = deps
			}

			writeDockerComposeConfig(dockerComposeConfigPath, dockerComposeConfig)
			console.log('Updated docker-compose.yml')
		}

		function updateDevDockerCompose () {
			if (!devDockerComposeConfig.services) {
				devDockerComposeConfig.services = {}
			}
			devDockerComposeConfig.services[serviceName] = {
				container_name: serviceName,
				build: {
					context: `./${serviceName}`,
					dockerfile: 'dev.Dockerfile',
				},
				restart: 'always',
				volumes: [
					`./${serviceName}/src:/app/src`,
					'/app/node_modules',
				],
				environment: {
					PG_HOST: postgresServiceName,
				},

			}

			if (deps) {
				devDockerComposeConfig.services[serviceName].depends_on = deps
			}

			writeDockerComposeConfig(devDockerComposeConfigPath, devDockerComposeConfig)
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

function writeDockerComposeConfig (configPath, config) {
	fs.writeFileSync(configPath, yaml.stringify(config))
}

function assertActiveProject () {
	if (!conf.get('activeProject.path')) {
		console.log('No active project')
		process.exit(0)
	}
}
