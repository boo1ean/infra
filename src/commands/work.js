const { spawn } = require('child_process')

module.exports = () => {
	const config = {
		commands: [
			{
				path: '$HOME/src/boxes/boxes-consumer-frontend',
				cmd: 'npm run dev',
			},
			{
				path: '$HOME/src/boxes/boxes-consumer-api',
				cmd: 'nodemon src',
			},
			{
				path: '$HOME/src/boxes/boxes-infra',
				cmd: 'node index.js boxes-postgres -n; docker exec -it boxes-postgres psql boxes',
			},
		]
	}
	config.commands.forEach(conf => {
		spawn('terminator', ['-x', `zshcnfg=\`cat $HOME/.zshrc\` && zsh -c "$zshcnfg; cd ${conf.path}; ${conf.cmd}"`], {
			detached: true,
		}).unref()
	})
}
