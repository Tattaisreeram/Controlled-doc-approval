<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '$lib/Icon.svelte';

	let { data, form }: PageProps = $props();
</script>

<h1>Edit document</h1>

{#if form?.message}
	<p class="banner {form.conflict ? 'banner-conflict' : 'banner-error'}">
		<Icon name={form.conflict ? 'rotate-ccw' : 'x-circle'} size={16} />
		{form.message}
	</p>
{/if}

<div class="card">
	<form method="POST">
		<input type="hidden" name="expectedVersion" value={data.doc.version} />
		<label>
			<span>Title</span>
			<input type="text" name="title" value={data.doc.title} required />
		</label>
		<label>
			<span>Body</span>
			<textarea name="body" required>{data.doc.body}</textarea>
		</label>
		<div class="actions" style="border-top: none; padding-top: 0; margin-top: 0.25rem">
			<button type="submit" class="primary"><Icon name="check" size={14} /> Save changes</button>
			<a class="button" href="/documents/{data.doc.id}">Cancel</a>
		</div>
	</form>
</div>
