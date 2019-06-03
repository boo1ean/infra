const express = require('express')
const config = require('./config')
const app = express()

app.all('*', (req, res) => {
	res.send('Hello, world!')
})

app.listen(config.port, () => {
	console.log('App started at %s', config.port)
})
