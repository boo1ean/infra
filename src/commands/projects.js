const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
const fs = require('fs')
const scaffolder = require('../scaffolder')
const conf = new Conf()

module.exports = yargs => {
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
		.command('add <path>', 'add project', _.noop, addProject)
		.command(['remove <index>', 'rm <index>'], 'remove project', _.noop, argv => {
			const projects = conf.get('projects')
			if (!projects[argv.index]) {
				console.error(chalk.bgRed(`Project with id ${argv.index} doesn't exist`))
			}
			projects.splice(argv.index, 1)
			conf.set('projects', projects)
		})
		.command(['init <projectName>'], 'initialize new project', _.noop, argv => {
			const projectPath = path.resolve(process.cwd(), argv.projectName)

			console.log('Generating project: %s', chalk.bold(argv.projectName))
			console.log('Under path: %s', chalk.bold(projectPath))

			if (fs.existsSync(projectPath)) {
				console.error(chalk.red('ERROR: Directory %s already exists under path %s'), chalk.bold(argv.projectName), chalk.bold(projectPath))
				process.exit(-1)
			}

			scaffolder.generate('empty-project', projectPath)

			addProject({ path: projectPath })

			const project = _.find(conf.get('projects'), { name: argv.projectName })
			conf.set('activeProject', project)
			console.log('Now using %s as active project', chalk.bold(project.name))
			console.log('Project path: %s', chalk.green(project.path))

		})
		.demandCommand()
		.strict()
		.help()
}

function addProject (argv) {
	const projectPath = path.resolve(process.cwd(), argv.path)
	const projectName = path.basename(projectPath)

	const updatedProjects = conf.get('projects').concat([{
		name: projectName,
		path: projectPath,
	}])

	conf.set('projects', updatedProjects)
	console.log(`Added project ${chalk.bold(chalk.green(projectName))}`)
}
