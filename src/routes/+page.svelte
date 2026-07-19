<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '$lib/Icon.svelte';
	import { statusIcon } from '$lib';

	let { data }: PageProps = $props();

	const dashboardTitle: Record<string, string> = {
		admin: 'All documents',
		reviewer: 'Review queue, your documents, and published',
		author: 'Your documents and published',
		viewer: 'Published documents'
	};

	const statusOrder = ['draft', 'submitted', 'approved', 'rejected', 'published', 'archived'];

	const statusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const doc of data.documents) counts[doc.status] = (counts[doc.status] ?? 0) + 1;
		return statusOrder.filter((s) => counts[s]).map((s) => ({ status: s, count: counts[s] }));
	});
</script>

<div class="page-head">
	<div>
		<h1>{dashboardTitle[data.user?.role ?? ''] ?? 'Documents'}</h1>
		<p class="page-subtitle">
			{data.documents.length} document{data.documents.length === 1 ? '' : 's'}
		</p>
	</div>
	{#if data.user?.role === 'author'}
		<a class="button primary" href="/documents/new"><Icon name="plus" size={15} /> New document</a
		>
	{/if}
</div>

{#if data.documents.length === 0}
	<div class="empty-state">
		<Icon name="inbox" size={28} />
		<p style="margin: 0.75rem 0 0">No documents to show yet.</p>
	</div>
{:else}
	{#if statusCounts.length > 1}
		<div class="stat-grid">
			{#each statusCounts as stat (stat.status)}
				<div class="stat-card">
					<span class="stat-icon badge-{stat.status}">
						<Icon name={statusIcon[stat.status]} size={17} />
					</span>
					<div>
						<div class="stat-value">{stat.count}</div>
						<div class="stat-label">{stat.status}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

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
						<td
							><span class="badge badge-{doc.status}"
								><Icon name={statusIcon[doc.status]} size={12} />{doc.status}</span
							></td
						>
						<td>{doc.version}</td>
						<td>{new Date(doc.updatedAt).toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
