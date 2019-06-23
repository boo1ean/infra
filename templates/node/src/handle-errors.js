process.on('uncaughtException', shutdown)
process.on('unhandledRejection', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

function shutdown (e) {
	console.error(e)
	process.exit(-1)
}
