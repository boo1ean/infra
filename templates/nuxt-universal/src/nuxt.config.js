module.exports = {
	mode: 'universal',
	rootDir: __dirname,
	server: {
		host: process.env.HOST || '0.0.0.0',
		port: process.env.PORT || 3000,
	},
	head: {
		title: process.env.npm_package_name || '',
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
		],
		link: [
			{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
		]
	},
	loading: { color: '#fff' },
	css: [
		'~/assets/scss/index.scss',
	],
	plugins: [],
	modules: [
		'@nuxtjs/proxy',
		'@nuxtjs/axios',
		'@nuxtjs/pwa',
	],
	proxy: {
		'/api': {
			target: process.env.API_PROXY_URL || 'http://localhost:3005',
			xfwd: true,
		},
	},
	axios: {
		proxy: true,
		proxyHeaders: true,
	},
	ssl: {
		privateKeyPath: process.env.SSL_PRIVATE_KEY_PATH,
		certPath: process.env.SSL_CERT_PATH,
		caPath: process.env.SSL_CA_PATH,
	},
}
