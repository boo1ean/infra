const fs = require('fs')
const path = require('path')
const Conf = require('conf')
const chalk = require('chalk')
const _ = require('lodash')
const yaml = require('yaml')
const scaffolder = require('../scaffolder')
const conf = new Conf()

const COMPOSE_CONFIG_VERSION = 3.7

let dockerComposeConfigPath
let dockerComposeConfig
let devDockerComposeConfigPath
let devDockerComposeConfig
if (conf.get('activeProject.path')) {
	try {
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
	} catch (e) {
		console.error(e)
		return
	}
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
		.command(
			['node <name>', 'n <name>', 'бандит <name>'],
			'Create node app in active project',
			_.noop,
			createServiceFromTemplate('node', 'worker')
		)

		.command(
			['shared [name]', 's [name]', 'шареный [name]'],
			'Create shared code directory',
			_.noop,
			argv => {
				const serviceName = argv.name || 'shared'
				const destPath = path.resolve(
					conf.get('activeProject.path'),
					serviceName
				)
				const templateParams = {
					serviceName,
					sharedDirectories: [],
					bareboneOnly: argv.barebone,
				}

				console.log('Generating shared directory: %s', chalk.bold(serviceName))
				console.log('Under path: %s', chalk.bold(destPath))
				scaffolder.generate('shared-code', destPath, templateParams)
				console.log(chalk.green('Success!'))
			}
		)

		.alias('d', 'dep')
		.describe('d', 'Dependency service name')
		.alias('s', 'shared')
		.describe('s', 'Use shared codebase')
		.alias('b', 'barebone')
		.describe('b', 'Barebone-only (dockerfiles + docker-compose changes + links)')

		.demandCommand()
		.strict()
		.help()
}

// test front app
// generate webserver

function createServiceFromTemplate (templateName, type, startPort) {
	return argv => {
		assertActiveProject()

		const serviceName = argv.name
		const destPath = path.resolve(
			conf.get('activeProject.path'),
			serviceName
		)

		console.log('Generating service: %s', chalk.bold(serviceName))
		console.log('Under path: %s', chalk.bold(destPath))

		const templateParams = {
			serviceName,
			sharedDirectories: [],
			bareboneOnly: argv.barebone,
		}

		let devVolumes = [
			`./${serviceName}/src:/app/src`,
			'/app/node_modules',
		]

		// Process shared folders option
		if (argv.shared) {
			const shared = Array.isArray(argv.shared) ? argv.shared : [argv.shared]
			for (const sharedDirectory of shared) {
				if (!fs.existsSync(path.resolve(conf.get('activeProject.path'), sharedDirectory))) {
					console.error(
						chalk.red('Directory %s doesn\'t exist and can\'t be shared'),
						chalk.bold(argv.sharedDirectory)
					)
					process.exit(-1)
				}
				devVolumes.push(`./${sharedDirectory}:/${sharedDirectory}`)
				devVolumes.push(`/${sharedDirectory}/node_modules`)
			}

			templateParams.sharedDirectories = shared
		}

		scaffolder.generate(templateName, destPath, templateParams)

		const prodExtra = {
			build: {
				context: `./`,
				dockerfile: `${serviceName}/Dockerfile`,
			},
		}
		const devExtra = {
			build: {
				context: `./`,
				dockerfile: `${serviceName}/dev.Dockerfile`,
			},
			volumes: devVolumes,
		}
		if (startPort) {
			devExtra.ports = [`${getUnusedPort(devDockerComposeConfig, startPort)}:3000`]
		}

		updateDockerCompose(dockerComposeConfig, dockerComposeConfigPath, prodExtra)
		updateDockerCompose(devDockerComposeConfig, devDockerComposeConfigPath, devExtra)

		console.log(chalk.green('Success!'))

		function updateDockerCompose (dockerComposeConfig, dockerComposeConfigPath, extra = {}) {
			const deps = resolveDependenciesNames(argv.dep)

			if (!dockerComposeConfig.services) {
				dockerComposeConfig.services = {}
			}

			dockerComposeConfig.services[serviceName] = {
				restart: 'always',
				labels: {
					'infra.type': type,
				},
			}

			// TODO refactor to flag and template on depth dependency
			if (type === 'api') {
				const postgresServiceName = getServiceByType(dockerComposeConfig, 'postgres')
				if (postgresServiceName) {
					dockerComposeConfig.services[serviceName].environment = {
						PG_HOST: postgresServiceName,
					}
					deps.push(postgresServiceName)
				}
			}

			// TODO refactor to flag and template on depth dependency
			if (type === 'frontend') {
				const apiServiceName = getServiceByType(dockerComposeConfig, 'api')
				if (apiServiceName) {
					dockerComposeConfig.services[serviceName].environment = {
						API_PROXY_URL: `http://${apiServiceName}:3000`,
					}
					deps.push(apiServiceName)
				}
			}

			if (deps.length) {
				dockerComposeConfig.services[serviceName].depends_on = _.uniq(deps)
			}

			dockerComposeConfig.services[serviceName] = Object.assign(
				dockerComposeConfig.services[serviceName],
				extra
			)

			writeDockerComposeConfig(dockerComposeConfigPath, dockerComposeConfig)
			console.log('Updated docker-compose.yml')
		}
	}
}



function getServiceByType ({ services }, type) {
	for (const serviceName in services) {
		const service = services[serviceName]
		if (_.get(service, 'labels.["infra.type"]') === type) {
			return serviceName
		}
	}
	return null
}

function getUnusedPort (dockerComposeConfig, startPort) {
	const ports = findPortsInUse(dockerComposeConfig)
	let port = startPort - 1
	while (ports.includes(++port)) {}
	return port
}

function findPortsInUse ({ services }) {
	let portsInUse = []
	for (const serviceName in services) {
		const s = services[serviceName]
		if (s.ports) {
			portsInUse = portsInUse.concat(s.ports.map(x => _.first(x.split(':'))))
		}
	}
	return portsInUse.map(Number)
}

function resolveDependenciesNames (deps) {
	deps = Array.isArray(deps) ? deps : [deps]
	// get list of services
	// get matching srevice by name using regex match
	// compose list of deps
	// put it to compose file deps property
	// find out if dependency has some ports to wait for
	return deps.filter(Boolean)
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
