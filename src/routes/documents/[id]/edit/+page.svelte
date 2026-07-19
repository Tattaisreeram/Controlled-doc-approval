<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>Edit document</h1>

{#if form?.message}
	<p class="banner {form.conflict ? 'banner-conflict' : 'banner-error'}">{form.message}</p>
{/if}

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
	<button type="submit" class="primary">Save changes</button>
	<a class="button" href="/documents/{data.doc.id}">Cancel</a>
</form>
