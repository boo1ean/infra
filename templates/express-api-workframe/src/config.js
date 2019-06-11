const _ = (varName, defaults) => process.env[varName] || defaults || null

module.exports = {
	port: _('PORT', 3000),
	appBaseUrl: _('BASE_URL', 'http://localhost:3000'),
	db: {
		client: 'postgresql',
		connection: {
			host:     _('PG_HOST', 'localhost'),
			database: _('PG_DB', 'sample'),
			user:     _('PG_USER', 'root'),
			password: _('PG_PASSWORD', 'root')
		},
		pool: {
			min: _('PG_POOL_MIN', 1),
			max: _('PG_POOL_MAX', 10),
		},
	},
	session: {
		secret: _('SESSION_SECRET', 'go away'),
		name: _('SESSION_NAME', 'connect.sid'),
		resave: true,
		saveUninitialized: true,
		cookies: {
			domain: _('SESSION_DOMAIN', 'localhost'),
			path: '/',
			expires: new Date(_('SESSION_EXPIRES', '2030-12-12')),
		},
	},
	log: {
		label: _('LOG_LABEL', 'express-api-workframe'),
		level: _('LOG_LEVEL', 'debug'),
	},
}
