<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Icon from '$lib/Icon.svelte';
	import { page } from '$app/stores';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Controlled Document Approval System</title>
</svelte:head>

{#if data.user}
	<div class="app-shell">
		<aside class="sidebar">
			<a class="brand" href="/">
				<span class="brand-mark">CD</span>
				Controlled Docs
			</a>

			<nav class="sidebar-nav">
				<a class="sidebar-link" class:active={$page.url.pathname === '/'} href="/">
					<Icon name="layout-grid" size={16} /> Dashboard
				</a>
				{#if data.user.role === 'author'}
					<a
						class="sidebar-link"
						class:active={$page.url.pathname === '/documents/new'}
						href="/documents/new"
					>
						<Icon name="plus" size={16} /> New document
					</a>
				{/if}
			</nav>

			<div class="sidebar-footer">
				<div class="sidebar-user">
					<span class="avatar">{data.user.name.charAt(0)}</span>
					<div class="sidebar-user-info">
						<div class="sidebar-user-name">{data.user.name}</div>
						<span class="role-tag">{data.user.role}</span>
					</div>
				</div>
				<form method="POST" action="/logout">
					<button type="submit" class="link-button sidebar-logout">
						<Icon name="log-out" size={14} /> Log out
					</button>
				</form>
			</div>
		</aside>

		<div class="app-main">
			<main>
				{@render children()}
			</main>
		</div>
	</div>
{:else}
	<header class="site-header">
		<a class="brand" href="/">
			<span class="brand-mark">CD</span>
			Controlled Document Approval
		</a>
	</header>
	<main>
		{@render children()}
	</main>
{/if}
