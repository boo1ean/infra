#!/usr/bin/env node
const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const execa = require('execa')
const fuzzy = require('fuzzysearch')
const open = require('open')
const initialConfig = require('../src/initial-config')
const projectsCommands = require('../src/commands/projects')
const servicesCommands = require('../src/commands/services')

const conf = new Conf()
const projects = conf.get('projects')

// Check if config is initialized
if (!projects) {
	conf.store = { ...initialConfig }
}

const utils = require('../src/utils')

yargs(hideBin(process.argv))
	.usage('usage: infra <command>')
	.coerce('service', transformServiceArgument)
	.command(['cd [service]'], 'Go to service source code directory', _.noop, cdCommand)
	.command(['project', 'proj', 'p'], 'manage projects', projectsCommands)
	.command(['service', 's'], 'manage project services', servicesCommands)
	.command(['open [service]', 'o [service]'], 'Open service in browser', _.noop, openCommand)
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
	.parse()

function transformServiceArgument (service) {
	if (!service) {
		return service
	}
	const services = utils.getServicesNames()
	if (services.includes(service)) {
		return service
	}
	return _.first(services.filter(fuzzy.bind(null, service))) || service
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
