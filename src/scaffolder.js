const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const fg = require('fast-glob')
const chalk = require('chalk')
const hb = require('handlebars')

const templatesBasePath = path.resolve(__dirname, '..', 'templates')

function generate (templateName, destPath, templateParams = {}) {
	const templatePath = path.resolve(templatesBasePath, templateName)

	if (!fs.existsSync(templatePath)) {
		console.error(
			chalk.red('Template %s doesn\'t exist under path %s'),
			chalk.bold(templateName),
			chalk.bold(templatesBasePath)
		)
		process.exit(-1)
	}

	if (fs.existsSync(destPath) && !templateParams.bareboneOnly) {
		console.error(
			chalk.red('Destination target %s already exists'),
			chalk.bold(destPath)
		)
		process.exit(-1)
	}

	if (templateParams.bareboneOnly) {
		fsExtra.ensureDirSync(`${destPath}/src`)
		fsExtra.copySync(`${templatePath}/Dockerfile.hbs`, `${destPath}/Dockerfile.hbs`)
		fsExtra.copySync(`${templatePath}/dev.Dockerfile.hbs`, `${destPath}/dev.Dockerfile.hbs`)
	} else {
		fsExtra.copySync(templatePath, destPath)
	}

	if (templateParams.sharedDirectories) {
		console.log(chalk.bold('\n--- Link shared directories ---'))
		const parentDir = path.dirname(destPath)
		for (const sharedDirectory of templateParams.sharedDirectories) {

			const source = path.resolve(parentDir, sharedDirectory, 'src')
			const dest = path.resolve(destPath, 'src', sharedDirectory)

			fsExtra.ensureSymlinkSync(
				path.relative(path.dirname(dest), source),
				dest,
			)

			console.log('\nShared directory linked:')

			console.log(
				'%s\n%s🠋\n%s',
				chalk.green(dest),
				_.pad('', source.length / 2, ' '),
				chalk.green(source)
			)
		}
	}

	const templateFiles = fg.sync('**/*.hbs', { cwd: destPath })
	if (templateFiles.length) {
		console.log(chalk.bold('\n--- Evaluate templates ---\n'))
	}
	for (const templateFile of templateFiles) {
		const templateFilePath = path.resolve(destPath, templateFile)
		const result = hb.compile(fs.readFileSync(templateFilePath).toString())(templateParams)

		fs.writeFileSync(templateFilePath, result)
		fsExtra.moveSync(templateFilePath, templateFilePath.slice(0, -4), { overwrite: true })
		console.log('Template %s evaluated', chalk.bold(templateFilePath))
	}

	console.log(chalk.bold('\n--- Scaffolding finished ---\n'))
}

module.exports = {
	generate,
}
