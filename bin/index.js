#!/usr/bin/env node
const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const yargs = require('yargs')
const execa = require('execa')
const fuzzy = require('fuzzysearch')
const open = require('open')
const initialConfig = require('../src/initial-config')
const projectsCommands = require('../src/commands/projects')
const servicesCommands = require('../src/commands/services')
const migrationsCommands = require('../src/commands/migrations')
const generatorsCommands = require('../src/commands/generators')
const utils = require('../src/utils')

const conf = new Conf()
const projects = conf.get('projects')

// Check if config is initialized
if (!projects) {
	conf.store = { ...initialConfig }
}

yargs
	.usage('usage: $0 <command>')
	.coerce('service', transformServiceArgument)
	.command(['use <projectName>'], 'set active project', _.noop, useCommand)
	.command(['cd [service]'], 'Go to service source code directory', _.noop, cdCommand)
	.command(['project', 'proj', 'p'], 'manage projects', projectsCommands)
	.command(['service', 's'], 'manage project services', servicesCommands)
	.command(['generate', 'g'], 'generate services from templates', generatorsCommands)
	.command(['open [service]', 'o [service]'], 'Open service in browser or somehow', openCommand)
	.command(['migration <name>', 'm <name>'], 'create migration', _.noop, migrationsCommands)
	.command('state', 'show infra current configuration', _.noop, renderConfig)
	.command(
		'set-value <key> <value>',
		'manually set config value using dot notation',
		_.noop,
		({ key, value }) => {
			conf.set(key, value)
			renderConfig()
		})
	.command('reset-really-hard', 'reset infra configuration', _.noop, () => {
		conf.store = { ...initialConfig }
		renderConfig()
	})
	.demandCommand()
	.strict()
	.help()
	.argv

function transformServiceArgument (service) {
	const services = utils.getServicesNames()
	if (services.includes(service)) {
		return service
	}
	return _.first(services.filter(fuzzy.bind(null, service))) || service
}

function useCommand (argv) {
	const project = _.find(conf.get('projects'), { name: argv.projectName })

	if (!project) {
		console.error(chalk.red('Project %s doesn\'t exist'), chalk.bold(argv.projectName))
		process.exit(1)
	}

	conf.set('activeProject', project)
	console.log('Now using %s as active project', chalk.bold(project.name))
	console.log('Project path: %s', chalk.green(project.path))
}

function openCommand ({ service }) {
	const { services } = utils.getCurrentEnvDockerComposeConfig()
	if (service) {
		const serviceConfig = services[service]
		openService(service, serviceConfig)
	} else {
		for (const serviceName in services) {
			const serviceConfig = services[serviceName]
			openService(serviceName, serviceConfig)
		}
	}
}

async function openService (serviceName, serviceConfig) {
	if (serviceConfig.ports) {
		const hostPort = getHostPort(serviceConfig.ports)
		const url = `http://localhost:${hostPort}`
		await open(url)
		console.log('Opened %s for %s', chalk.bold(url), chalk.green(serviceName))
	} else {
		console.log('No ports specified for %s, omitting...', chalk.green(serviceName))
	}
}

function getHostPort (ports) {
	return _.first(_.first(ports).split(':'))
}


function cdCommand (argv) {
	const projectPath = conf.get('activeProject.path')
	execa.shell(`cd ${projectPath}/${argv.service || ''} && $SHELL`, { stdio: 'inherit' })
}

function renderConfig () {
	console.log(JSON.stringify(conf.store, null, 4))
}
