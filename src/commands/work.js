const { spawn } = require('child_process')

module.exports = () => {
	const config = {
		commands: [
			{
				path: '$HOME',
				cmd: 'infra dev boxes-consumer-frontend',
			},
			{
				path: '$HOME',
				cmd: 'infra dev boxes-consumer-api',
			},
			{
				path: '$HOME',
				cmd: 'infra s s boxes-postgres',
			},
		]
	}
	config.commands.forEach(conf => {
		spawn('terminator', ['-x', `zshcnfg=\`cat $HOME/.zshrc\` && zsh -c "$zshcnfg; cd ${conf.path}; ${conf.cmd}"`], {
			detached: true,
		}).unref()
	})
}
