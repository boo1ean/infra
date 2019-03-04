const assert = require('assert')
const Promise = require('bluebird')
const _ = require('lodash')
const execa = require('execa')

const COMMAND_DELAY = 200

module.exports = config => {
	return run

	// -n recreate all services
	// -d run only service dependencies (without target services)
	// -f follow logs of target service after execution
	async function run (targetService, argv) {
		if (argv.n) {
			await destroyAllContainers()
		}
		runningContainers = ((await shell('docker ps --format "{{.Names}}"')).stdout).split('\n')

		await runService(targetService, argv.d)

		// -f --follow follow container log after execution
		if (argv.f && !argv.d) {
			const proc = execa.shell(`docker logs -f ${targetService}`)
			proc.stdout.pipe(process.stdout)
			proc.stderr.pipe(process.stderr)
		}
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

	async function runService (serviceName, dontRunTargetService) {
		const conf = config.services[serviceName]
		for (let dep of conf.deps || []) {
			await runService(dep)
		}
		if (!containerExists(serviceName) && !dontRunTargetService) {
			await assureOldContainerRemoved(serviceName)
			await runContainer(serviceName)
			for (let dep of conf.postdeps || []) {
				await runService(dep)
			}
		}
	}

	function containerExists (name) {
		return runningContainers.indexOf(name) !== -1
	}

	async function assureOldContainerRemoved (containerName) {
		try {
			await shell(`docker rm ${containerName}`)
		} catch (error) {
			// skip error
		}
	}

	async function runContainer (containerName) {
		console.log('run %s', containerName)
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
				docker build --build-arg NPM_TOKEN=$NPM_TOKEN -t ${image} ${dockerfile} .;
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
		const links = _.uniq(
			(conf.deps || []).concat(conf.links || [])
		).map(link => `--link ${link}`).join(' ') || ''
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
			try {
				await shell(step)
			} catch (e) {
				console.log('\n\n\n-------------\n\n\n')
				console.error(e.stderr)
			}
		}
	}

	async function shell (cmd) {
		console.log(pretty(cmd))
		await Promise.delay(COMMAND_DELAY)
		return execa.shell(cmd)
	}

	function pretty (cmd) {
		return cmd.replace(/\s+/g, ' ')
	}
}
