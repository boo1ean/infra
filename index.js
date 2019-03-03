#!/usr/bin/env node
const { spawn } = require('child_process')
const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const yargs = require('yargs')
const initialConfig = require('./src/initial-config')
const conf = new Conf()
const projects = conf.get('projects')

// Check if config is initialized
if (!projects) {
	conf.store = { ...initialConfig }
}

var argv = yargs
	.usage('usage: $0 <command>')
	.command(['project', 'proj', 'p'], 'manage projects', yargs => {
		return yargs
			.command(['list', 'ls', 'l'], 'list projects', _.noop, () => {
				const projects = conf.get('projects')
				projects.forEach((proj, index) => {
					console.log(
						_.padEnd(index, 2, ' ')
						+ chalk.bold(chalk.green(_.padEnd(proj.name, 15, ' ')))
						+ proj.path
					)
				})
			})
			.command('add <path>', 'add project', _.noop, argv => {
				const projectPath = path.resolve(process.cwd(), argv.path)
				const projectName = path.basename(projectPath)
				const servicesConfigPath = path.resolve(projectPath, `${projectName}-infra/config.js`)
				const updatedProjects = conf.get('projects').concat([{
					name: projectName,
					path: projectPath,
					servicesConfigPath,
				}])
				conf.set('projects', updatedProjects)
				console.log(`Added project ${chalk.bold(chalk.green(projectName))}`)
			})
			.command(['remove <index>', 'rm <index>'], 'remove project', _.noop, argv => {
				const projects = conf.get('projects')
				if (!projects[argv.index]) {
					console.error(chalk.bgRed(`Project with id ${argv.index} doesn't exist`))
				}
				projects.splice(argv.index, 1)
				conf.set('projects', projects)
			})
	})
	.command('service', 'manage project services', yargs => {
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
	})
	.command('work', 'start workspace', (argv) => {
		const config = {
			commands: [
				{
					path: '$HOME/src/boxes/boxes-consumer-frontend',
					cmd: 'npm run dev',
				},
				{
					path: '$HOME/src/boxes/boxes-consumer-api',
					cmd: 'nodemon src',
				},
				{
					path: '$HOME/src/boxes/boxes-infra',
					cmd: 'node index.js boxes-postgres -n; docker exec -it boxes-postgres psql boxes',
				},
			]
		}
		config.commands.forEach(conf => {
			spawn('terminator', ['-x', `zshcnfg=\`cat $HOME/.zshrc\` && zsh -c "$zshcnfg; cd ${conf.path}; ${conf.cmd}";`], {
				detached: true,
			}).unref()
		})
	})
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
	.strict()
	.help()
	.argv

function renderConfig () {
	console.log(JSON.stringify(conf.store, null, 4))
}
