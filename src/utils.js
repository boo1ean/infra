const path = require('path')
const Conf = require('conf')
const yaml = require('yaml')
const fs = require('fs')

const conf = new Conf()

const envPrefix = process.env.NODE_ENV || ''
const currentEnvDockerComposeFileName = [envPrefix, 'docker-compose.yml'].join('.')

function getServicesNames () {
	return Object.keys(getCurrentEnvDockerComposeConfig().services)
}

function getDockerComposeConfig () {
	return readYaml(path.resolve(
		conf.get('activeProject.path'),
		'docker-compose.yml'
	))
}
function getDevDockerComposeConfig () {
	return readYaml(path.resolve(
		conf.get('activeProject.path'),
		'dev.docker-compose.yml'
	))
}

function getCurrentEnvDockerComposeConfig () {
	return readYaml(path.resolve(
		conf.get('activeProject.path'),
		getComposeFilename(),
	))
}

function getComposeFilename () {
	if (['prod', 'production'].includes(process.env.NODE_ENV)) {
		return 'docker-compose.yml'
	}
	return 'dev.docker-compose.yml'
}

function readYaml (path) {
	return yaml.parse(fs.readFileSync(path).toString())
}

module.exports = {
	getDockerComposeConfig,
	getDevDockerComposeConfig,
	getServicesNames,
	getCurrentEnvDockerComposeConfig,
	getComposeFilename,
}
