const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const fs = require('fs')
const app = express()

const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
	const nuxt = new Nuxt(config)
	const { host, port } = nuxt.options.server

	if (config.dev) {
		const builder = new Builder(nuxt)
		await builder.build()
	} else {
		await nuxt.ready()
	}

	if (config.ssl && config.ssl.privateKeyPath && config.ssl.certPath) {
		const privateKey = fs.readFileSync(config.ssl.privateKeyPath, 'utf8')
		const certificate = fs.readFileSync(config.ssl.certPath, 'utf8')
		const credentials = { key: privateKey, cert: certificate }
		if (config.ssl.caPath) {
			credentials.ca = fs.readFileSync(config.ssl.caPath, 'utf8')
		}

		app.use(function ensureSecure (req, res, next) {
			if (req.secure) {
				return next()
			}
			res.redirect('https://' + req.hostname + req.url)
		})

		const httpsServer = https.createServer(credentials, app)
		httpsServer.listen(443)
	}

	app.use(nuxt.render)
	app.listen(port, host)

	consola.ready({
		message: `Server listening on http://${host}:${port}`,
		badge: true
	})
}

start()
