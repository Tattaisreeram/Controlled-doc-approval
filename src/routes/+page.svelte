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

	type SortKey = 'title' | 'status' | 'version' | 'updatedAt';

	let search = $state('');
	let statusFilter = $state<string | null>(null);
	let sortKey = $state<SortKey>('updatedAt');
	let sortDir = $state<'asc' | 'desc'>('desc');

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'updatedAt' ? 'desc' : 'asc';
		}
	}

	const statusCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const doc of data.documents) counts[doc.status] = (counts[doc.status] ?? 0) + 1;
		return statusOrder.filter((s) => counts[s]).map((s) => ({ status: s, count: counts[s] }));
	});

	const visibleDocuments = $derived.by(() => {
		let docs = data.documents;

		if (statusFilter) {
			docs = docs.filter((doc) => doc.status === statusFilter);
		}

		const query = search.trim().toLowerCase();
		if (query) {
			docs = docs.filter((doc) => doc.title.toLowerCase().includes(query));
		}

		return [...docs].sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
			return sortDir === 'asc' ? cmp : -cmp;
		});
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
	<div class="stat-grid">
		<div class="stat-card">
			<span class="stat-icon stat-icon-total">
				<Icon name="inbox" size={17} />
			</span>
			<div>
				<div class="stat-value">{data.documents.length}</div>
				<div class="stat-label">Total</div>
			</div>
		</div>
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

	<div class="toolbar">
		<div class="search-box">
			<Icon name="search" size={15} />
			<input type="text" placeholder="Search by title…" bind:value={search} />
		</div>
	</div>

	<div class="filter-pills">
		<button class="pill" class:active={!statusFilter} onclick={() => (statusFilter = null)}>
			All <span class="pill-count">{data.documents.length}</span>
		</button>
		{#each statusCounts as stat (stat.status)}
			<button
				class="pill"
				class:active={statusFilter === stat.status}
				onclick={() => (statusFilter = statusFilter === stat.status ? null : stat.status)}
			>
				<Icon name={statusIcon[stat.status]} size={12} />
				{stat.status}
				<span class="pill-count">{stat.count}</span>
			</button>
		{/each}
	</div>

	{#if visibleDocuments.length === 0}
		<div class="empty-state">
			<Icon name="search" size={24} />
			<p style="margin: 0.75rem 0 0">No documents match your search.</p>
		</div>
	{:else}
		<div class="table-card">
			<table>
				<thead>
					<tr>
						<th>
							<button
								class="th-sort"
								class:active={sortKey === 'title'}
								onclick={() => toggleSort('title')}
							>
								Title
								<Icon name={sortKey === 'title' && sortDir === 'asc' ? 'chevron-up' : sortKey === 'title' ? 'chevron-down' : 'chevrons-up-down'} size={13} />
							</button>
						</th>
						<th>
							<button
								class="th-sort"
								class:active={sortKey === 'status'}
								onclick={() => toggleSort('status')}
							>
								Status
								<Icon name={sortKey === 'status' && sortDir === 'asc' ? 'chevron-up' : sortKey === 'status' ? 'chevron-down' : 'chevrons-up-down'} size={13} />
							</button>
						</th>
						<th>
							<button
								class="th-sort"
								class:active={sortKey === 'version'}
								onclick={() => toggleSort('version')}
							>
								Version
								<Icon name={sortKey === 'version' && sortDir === 'asc' ? 'chevron-up' : sortKey === 'version' ? 'chevron-down' : 'chevrons-up-down'} size={13} />
							</button>
						</th>
						<th>
							<button
								class="th-sort"
								class:active={sortKey === 'updatedAt'}
								onclick={() => toggleSort('updatedAt')}
							>
								Updated
								<Icon name={sortKey === 'updatedAt' && sortDir === 'asc' ? 'chevron-up' : sortKey === 'updatedAt' ? 'chevron-down' : 'chevrons-up-down'} size={13} />
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each visibleDocuments as doc (doc.id)}
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
{/if}
