const Conf = require('conf')
const conf = new Conf()

function getServicesConfig () {
	return require(conf.get('activeProject.servicesConfigPath')).services
}

function getServiceNames () {
	return Object.keys(getServicesConfig())
}

module.exports = {
	getServicesConfig,
	getServiceNames,
}
