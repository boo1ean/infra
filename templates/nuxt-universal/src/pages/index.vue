<template>
	<div class="container">
		<div>
			<logo />
			<h1 class="title">
				frontend
			</h1>
			<h2 class="subtitle">
				infra frontend template
			</h2>
			<div v-for="i in items" class="list-item" :key="i">
				Item from backend: {{i}}
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped>
@import '../assets/scss/variables';
.list-item {
	color: $color-main;
}
</style>
<script>
import Logo from '~/components/Logo.vue'

export default {
	components: {
		Logo,
	},
	async asyncData ({ $axios }) {
		try {
			const res = await $axios.get('/api/items')
			return {
				items: res.data,
			}
		} catch (e) {
			return {
				items: ['this', 'is', 'not', 'from', 'api'],
			}
		}
	}
}
</script>

<style>
.container {
	margin: 0 auto;
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
}

.title {
	font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	display: block;
	font-weight: 300;
	font-size: 100px;
	color: #35495e;
	letter-spacing: 1px;
}

.subtitle {
	font-weight: 300;
	font-size: 42px;
	color: #526488;
	word-spacing: 5px;
	padding-bottom: 15px;
}

.links {
	padding-top: 15px;
}
</style>
