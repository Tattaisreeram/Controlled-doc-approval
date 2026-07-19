<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Icon from '$lib/Icon.svelte';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Controlled Document Approval System</title>
</svelte:head>

<header class="site-header">
	<a class="brand" href="/">
		<span class="brand-mark">CD</span>
		Controlled Document Approval
	</a>
	{#if data.user}
		<div class="session">
			<span class="whoami">
				<span class="avatar">{data.user.name.charAt(0)}</span>
				{data.user.name}
				<span class="role-tag">{data.user.role}</span>
			</span>
			<form method="POST" action="/logout">
				<button type="submit" class="link-button"><Icon name="log-out" size={14} /> Log out</button>
			</form>
		</div>
	{/if}
</header>

<main>
	{@render children()}
</main>
