<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '$lib/Icon.svelte';

	let { data, form }: PageProps = $props();
</script>

<div class="auth-shell">
	<div class="auth-card">
		<div class="auth-hero">
			<span class="brand-mark">CD</span>
			<h2>Controlled document approval, done right.</h2>
			<p>
				One place to draft, review, approve, and publish documents — with a full audit trail on
				every change.
			</p>
			<ul class="auth-hero-list">
				<li><Icon name="file-text" size={13} /> Draft and submit for review</li>
				<li><Icon name="check-circle" size={13} /> Approve or reject with a reason</li>
				<li><Icon name="globe" size={13} /> Publish and archive with confidence</li>
			</ul>
		</div>

		<div class="auth-form">
			<h1>Welcome back</h1>
			<p class="page-subtitle" style="margin-bottom: 1.5rem">Sign in to continue.</p>

			{#if form?.message}
				<p class="banner banner-error">{form.message}</p>
			{/if}

			<form method="POST">
				<fieldset>
					<legend>Choose a seeded user</legend>
					{#each data.users as user, i (user.id)}
						<label class="user-option">
							<input type="radio" name="email" value={user.email} checked={i === 0} />
							<span>{user.name} — {user.email} <span class="role-tag">{user.role}</span></span>
						</label>
					{/each}
				</fieldset>

				<label>
					<span>Password</span>
					<input type="password" name="password" value="password123" required />
				</label>

				<button type="submit" class="primary" style="width: 100%; justify-content: center"
					>Log in</button
				>
			</form>

			<p class="auth-hint">
				<small>All seeded users share the password <code>password123</code>.</small>
			</p>
		</div>
	</div>
</div>
