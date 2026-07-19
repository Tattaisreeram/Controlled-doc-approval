<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '$lib/Icon.svelte';

	let { form }: PageProps = $props();
</script>

<h1>New document</h1>

{#if form?.message}
	<p class="banner banner-error"><Icon name="x-circle" size={16} />{form.message}</p>
{/if}

<div class="card">
	<form method="POST">
		<label>
			<span>Title</span>
			<input type="text" name="title" required />
		</label>
		<label>
			<span>Body</span>
			<textarea name="body" required></textarea>
		</label>
		<button type="submit" class="primary"><Icon name="plus" size={14} /> Create draft</button>
	</form>
</div>
