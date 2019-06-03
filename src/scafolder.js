const fs = require('fs')
const path = require('path')

const templatesBasePath = path.resolve(__dirname, '..', 'templates')

function generate (templateName, destPath) {
	const templatePath = path.resolve(templatesBasePath, templateName)

	if (!fs.existsSync(templatePath)) {
		console.error('Template %s doesn\'t exist under path %s', templateName, templatesBasePath)
		process.exit(-1)
	}

	return fs.copyFileSync(templatePath, destPath)
}

module.exports = {
	generate,
}
