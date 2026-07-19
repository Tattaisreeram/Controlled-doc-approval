<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Controlled Document Approval System</title>
</svelte:head>

<header class="site-header">
	<a class="brand" href="/">Controlled Document Approval System</a>
	{#if data.user}
		<div class="session">
			<span class="whoami">{data.user.name} <span class="role-tag">{data.user.role}</span></span>
			<form method="POST" action="/logout">
				<button type="submit" class="link-button">Log out</button>
			</form>
		</div>
	{/if}
</header>

<main>
	{@render children()}
</main>
