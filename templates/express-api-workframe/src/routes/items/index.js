// This is example feature/entity-specific route handleres file

const { controller } = require('../../workframe')

function query (params, req, res) {
	return [1, 2, 3]
}

const handlers = controller({
	query,
})

module.exports = router => {
	router.get('/api/items', handlers.query)
}
