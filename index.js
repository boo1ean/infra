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
	.command('project', 'manage projects', yargs => {
		return yargs
			.command('list', 'list projects', () => {
				const projects = conf.get('projects')
				projects.forEach(proj => {
					console.log(chalk.bold(chalk.green(_.padEnd(proj.name, 15, ' '))) + proj.path)
				})
			})
			.command('add <path>', 'add project', _.noop, argv => {
				const projectPath = path.resolve(process.cwd(), argv.path)
				const projectName = path.basename(projectPath)
				const updatedProjects = conf.get('projects').concat([{
					name: projectName,
					path: projectPath,
				}])
				conf.set('projects', updatedProjects)
				console.log(`Added project ${chalk.bold(chalk.green(projectName))}`)
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
	.help()
	.argv
