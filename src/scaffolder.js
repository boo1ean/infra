const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const chalk = require('chalk')

const templatesBasePath = path.resolve(__dirname, '..', 'templates')

function generate (templateName, destPath) {
	const templatePath = path.resolve(templatesBasePath, templateName)

	if (!fs.existsSync(templatePath)) {
		console.error(chalk.red('Template %s doesn\'t exist under path %s'), chalk.bold(templateName), chalk.bold(templatesBasePath))
		process.exit(-1)
	}

	if (fs.existsSync(destPath)) {
		console.error(chalk.red('Destination target %s already exists'), chalk.bold(destPath))
		process.exit(-1)
	}

	return fsExtra.copy(templatePath, destPath)
}

module.exports = {
	generate,
}
