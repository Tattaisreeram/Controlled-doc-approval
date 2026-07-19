<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dashboardTitle: Record<string, string> = {
		admin: 'All documents',
		reviewer: 'Review queue, your documents, and published',
		author: 'Your documents and published',
		viewer: 'Published documents'
	};
</script>

<h1>{dashboardTitle[data.user?.role ?? ''] ?? 'Documents'}</h1>

{#if data.user?.role === 'author'}
	<p><a class="button primary" href="/documents/new">New document</a></p>
{/if}

{#if data.documents.length === 0}
	<p>No documents to show.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Title</th>
				<th>Status</th>
				<th>Version</th>
				<th>Updated</th>
			</tr>
		</thead>
		<tbody>
			{#each data.documents as doc (doc.id)}
				<tr>
					<td><a href="/documents/{doc.id}">{doc.title}</a></td>
					<td><span class="badge badge-{doc.status}">{doc.status}</span></td>
					<td>{doc.version}</td>
					<td>{new Date(doc.updatedAt).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
