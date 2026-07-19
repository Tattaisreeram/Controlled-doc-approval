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

<div class="page-head">
	<div>
		<h1>{dashboardTitle[data.user?.role ?? ''] ?? 'Documents'}</h1>
		<p class="page-subtitle">
			{data.documents.length} document{data.documents.length === 1 ? '' : 's'}
		</p>
	</div>
	{#if data.user?.role === 'author'}
		<a class="button primary" href="/documents/new">+ New document</a>
	{/if}
</div>

{#if data.documents.length === 0}
	<div class="empty-state">No documents to show yet.</div>
{:else}
	<div class="table-card">
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
	</div>
{/if}
