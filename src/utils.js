const path = require('path')
const Conf = require('conf')
const yaml = require('yaml')
const fs = require('fs')

const conf = new Conf()

const DOCKER_COMPOSE_PROD = 'docker-compose.yml'
const DOCKER_COMPOSE_DEV = 'dev.docker-compose.yml'

const activeProjectPath = conf.get('activeProject.path')
const devDockerComposeExists = activeProjectPath && fs.existsSync(path.resolve(
	activeProjectPath,
	DOCKER_COMPOSE_DEV,
))

function getServicesNames () {
	return Object.keys(getCurrentEnvDockerComposeConfig().services || {})
}

function getCurrentEnvDockerComposeConfig () {
	return readYaml(path.resolve(
		conf.get('activeProject.path'),
		getComposeFilename(),
	))
}

function getComposeFilename () {
	if (!devDockerComposeExists || ['prod', 'production'].includes(process.env.NODE_ENV)) {
		return DOCKER_COMPOSE_PROD
	}
	return DOCKER_COMPOSE_DEV
}

function readYaml (path) {
	return yaml.parse(fs.readFileSync(path).toString())
}

module.exports = {
	getServicesNames,
	getCurrentEnvDockerComposeConfig,
	getComposeFilename,
}
