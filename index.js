#!/usr/bin/env node
const { spawn } = require('child_process')
const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const yargs = require('yargs')
const execa = require('execa')
const initialConfig = require('./src/initial-config')
const projectsCommands = require('./src/commands/projects')
const servicesCommands = require('./src/commands/services')
const workCommands = require('./src/commands/work')
const conf = new Conf()
const projects = conf.get('projects')

// Check if config is initialized
if (!projects) {
	conf.store = { ...initialConfig }
}

yargs
	.usage('usage: $0 <command>')
	.command(['use <projectName>'], 'set active project', _.noop, useCommand)
	.command(['dev <service>'], 'start service in dev mode', _.noop, startCommand)
	.command(['project', 'proj', 'p'], 'manage projects', projectsCommands)
	.command(['service', 's'], 'manage project services', servicesCommands)
	.command('work', 'start workspace', _.noop, workCommands)
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

function useCommand (argv) {
	const project = _.find(conf.get('projects'), { name: argv.projectName })
	conf.set('activeProject', project)
	console.log('Now using %s as active project', chalk.bold(project.name))
	console.log('Project path: %s', chalk.green(project.path))
	console.log('Services config path: %s', chalk.green(project.servicesConfigPath))
}

function startCommand (argv) {
	const projectPath = conf.get('activeProject.path')
	execa.shell(`cd ${projectPath}/${argv.service}; npm run dev`, { stdio: 'inherit' })
}

function renderConfig () {
	console.log(JSON.stringify(conf.store, null, 4))
}
