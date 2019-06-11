const path = require('path')
const Conf = require('conf')
const yaml = require('yaml')
const fs = require('fs')

const conf = new Conf()

const envPrefix = process.env.NODE_ENV || ''
const currentEnvDockerComposeFileName = [envPrefix, 'docker-compose.yml'].join('.')

function getServicesNames () {
	return Object.keys(getDockerComposeConfig().services)
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
		currentEnvDockerComposeFileName,
	))
}

function readYaml (path) {
	return yaml.parse(fs.readFileSync(path).toString())
}

module.exports = {
	getDockerComposeConfig,
	getDevDockerComposeConfig,
	getServicesNames,
	getCurrentEnvDockerComposeConfig,
}
