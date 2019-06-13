#!/usr/bin/env node
const { spawn } = require('child_process')
const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const yargs = require('yargs')
const execa = require('execa')
const fuzzy = require('fuzzysearch')
const initialConfig = require('./src/initial-config')
const projectsCommands = require('./src/commands/projects')
const servicesCommands = require('./src/commands/services')
const workCommands = require('./src/commands/work')
const migrationsCommands = require('./src/commands/migrations')
const generatorsCommands = require('./src/commands/generators')
const utils = require('./src/utils')
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
	.command(['dev <service>', 'd <service>'], 'start service in dev mode', _.noop, startCommand)
	.command(['cd [service]'], 'Go to service source code directory', _.noop, cdCommand)
	.command(['project', 'proj', 'p'], 'manage projects', projectsCommands)
	.command(['service', 's'], 'manage project services', servicesCommands)
	.command(['generate', 'g'], 'generate services from templates', generatorsCommands)
	.command('work', 'start workspace', _.noop, workCommands)
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
	conf.set('activeProject', project)
	console.log('Now using %s as active project', chalk.bold(project.name))
	console.log('Project path: %s', chalk.green(project.path))
}

function cdCommand (argv) {
	const projectPath = conf.get('activeProject.path')
	execa.shell(`cd ${projectPath}/${argv.service || ''} && $SHELL`, { stdio: 'inherit' })
}

function startCommand ({ service }) {
	const projectPath = conf.get('activeProject.path')
	const { services } = utils.getDevDockerComposeConfig()
	const serviceConfig = services[service]
	if (!serviceConfig) {
		return console.error(chalk.red('Service %s not found'), service)
	}

	const cmd = `cd ${projectPath} && docker-compose -f dev.docker-compose.yml run --service-ports --rm --name ${serviceConfig.container_name} ${service}`
	execa.shell(cmd, { stdio: 'inherit' })
}

function renderConfig () {
	console.log(JSON.stringify(conf.store, null, 4))
}
