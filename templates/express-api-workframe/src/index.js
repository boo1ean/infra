const config = require('./config')
const routes = require('./routes')
const { log, createApp, middlewares } = require('./workframe')

const { app } = createApp(log, middlewares, config)
routes(app)
app.use(middlewares.handleError)

app.listen(config.port, () => {
	log.info(`Application started at ${config.port}`, { config })
})
