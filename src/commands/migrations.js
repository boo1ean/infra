const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const execa = require('execa')
const Conf = require('conf')
const conf = new Conf()


module.exports = async argv => {
	const dirs = fs.readdirSync(conf.get('activeProject.path'))
	const migratorServiceName = _.first(dirs.filter(s => s.indexOf('migrator') !== -1))
	const migratorPath = path.resolve(conf.get('activeProject.path'), migratorServiceName)
	const results = await execa.shell(`cd ${migratorPath}; knex migrate:make ${argv.name}`)
	const needle = 'Created Migration: '
	const sliceIndex = results.stdout.indexOf(needle) + needle.length
	const newMigrationPath = results.stdout.slice(sliceIndex)
	execa.shell(`$EDITOR ${newMigrationPath}`, { stdio: 'inherit' })
}
