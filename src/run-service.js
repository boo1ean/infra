const assert = require('assert')
const Promise = require('bluebird')
const _ = require('lodash')
const execa = require('execa')
const Graph = require('graph-data-structure')
const Listr = require('listr')
const chalk = require('chalk')

const COMMAND_DELAY = 200

module.exports = config => {
	let runningContainers
	let startedContainers = {}
	let graph = new Graph()

	return run

	// -n recreate all services
	// -d run only service dependencies (without target services)
	// -f follow logs of target service after execution
	async function run (targetService, argv) {
		if (argv.n) {
			await destroyAllContainers()
		}

		buildDeps(null, targetService)
		const executionQueue = graph.topologicalSort().slice(1).reverse()
		const tasks = new Listr(executionQueue.map(title => ({
			title,
			task: async () => {
				await assureOldContainerRemoved(title)
				await runContainer(title)
			}
		})))

		console.log('Starting %s', chalk.bold(targetService))
		tasks.run().catch(err => {
			console.error(err.message)
		})

		//runningContainers = getRunningContainers()

		//await runService(targetService, argv.d)
		//console.log(executionQueue)

		//// -f --follow follow container log after execution
		//if (argv.f && !argv.d) {
			//const proc = execa.shell(`docker logs -f ${targetService}`)
			//proc.stdout.pipe(process.stdout)
			//proc.stderr.pipe(process.stderr)
		//}
	}

	function buildDeps (parent, child) {
		graph.addEdge(parent, child)
		const conf = config.services[child]

		for (let childDep of conf.deps || []) {
			buildDeps(child, childDep)
		}
		for (let childPostDep of conf.postdeps || []) {
			graph.removeEdge(parent, child)
			graph.addEdge(parent, childPostDep)
			graph.addEdge(childPostDep, child)
		}
	}

	async function getRunningContainers () {
		return ((await shell('docker ps --format "{{.Names}}"')).stdout).split('\n')
	}

	async function destroyAllContainers () {
		try {
			await shell('docker kill $(docker ps -a -q)')
		} catch (error) {
			// not a big deal
		}
		try {
			await shell('docker rm $(docker ps -a -q)')
		} catch (error) {
			// not a big deal
		}
	}

	function containerExists (name) {
		return runningContainers.indexOf(name) !== -1 || startedContainers[name]
	}

	async function assureOldContainerRemoved (containerName) {
		try {
			await shell(`docker rm ${containerName}`)
		} catch (error) {
			// skip error
		}
	}

	async function runContainer (containerName) {
		const conf = config.services[containerName]
		const image = conf.image || containerName
		const pipeline = []

		// some services don't require to be built (e.g. postgres)
		if (!conf.skipBuild) {
			const dockerfile = conf.dockerfile ? `-f ${conf.dockerfile}` : ''
			// build image
			pipeline.push(`
				cd ${config.projectBasePath}/${image};
				git pull;
				docker build -t ${image} ${dockerfile} .;
			`)
		}

		if (conf.delay) {
			pipeline.push(`sleep ${conf.delay}`)
		}

		let opts = ''
		if (conf.env) {
			for (let key in conf.env) {
				opts += `-e ${key}=${conf.env[key]} `
			}
		}

		if (conf.ports) {
			for (let ports in conf.ports) {
				opts += `-p ${conf.ports[ports]} `
			}
		}

		const envFile = conf.envFile && `--env-file ../${image}/env` || ''
		const links = _.uniq(conf.deps || []).map(link => `--link ${link}`).join(' ') || ''
		const cmd = conf.cmd || ''

		//
		// THE RUN
		//

		pipeline.push(`
			docker run -d \
			--name ${containerName} \
			${envFile} \
			${links} \
			${opts} \
			${image} \
			${cmd}
		`)

		for (let step of pipeline) {
			await shell(step)
		}
		startedContainers[containerName] = true
	}

	async function shell (cmd) {
		await Promise.delay(COMMAND_DELAY)
		return execa.shell(cmd)
	}

	function pretty (cmd) {
		return cmd.replace(/\s+/g, ' ')
	}
}
