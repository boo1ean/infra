const Conf = require('conf')
const path = require('path')
const chalk = require('chalk')
const _ = require('lodash')
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
		.command(['use <projectName>'], 'set active project', _.noop, useCommand)
		.command(['remove <index>', 'rm <index>'], 'remove project', _.noop, argv => {
			const projects = conf.get('projects')
			if (!projects[argv.index]) {
				console.error(chalk.bgRed(`Project with id ${argv.index} doesn't exist`))
			}
			projects.splice(argv.index, 1)
			conf.set('projects', projects)
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
	useCommand({ projectName });
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
