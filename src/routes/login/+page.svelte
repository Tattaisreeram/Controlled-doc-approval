<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="auth-shell">
	<h1>Welcome back</h1>
	<p class="auth-subtitle">Sign in to review, approve, and publish documents.</p>

	{#if form?.message}
		<p class="banner banner-error">{form.message}</p>
	{/if}

	<div class="card">
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
	</div>

	<p class="auth-hint">
		<small>All seeded users share the password <code>password123</code>.</small>
	</p>
</div>
