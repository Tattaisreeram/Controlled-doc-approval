<script lang="ts">
	import type { PageProps } from './$types';
	import type { TransitionName } from '$lib/server/transitions';
	import Icon from '$lib/Icon.svelte';
	import { statusIcon, actionIcon } from '$lib';

	let { data, form }: PageProps = $props();

	const actionLabels: Record<TransitionName, string> = {
		submit: 'Submit for review',
		approve: 'Approve',
		reject: 'Reject',
		reopen: 'Reopen as draft',
		publish: 'Publish',
		archive: 'Archive'
	};
</script>

<div class="page-head">
	<h1>{data.doc.title}</h1>
</div>

{#if form?.message}
	<p class="banner {form.conflict ? 'banner-conflict' : 'banner-error'}">
		<Icon name={form.conflict ? 'rotate-ccw' : 'x-circle'} size={16} />
		{form.message}
	</p>
{/if}

<div class="card">
	<div class="card-head">
		<span class="badge badge-{data.doc.status}"
			><Icon name={statusIcon[data.doc.status]} size={12} />{data.doc.status}</span
		>
		<small>version {data.doc.version}</small>
	</div>
	<div class="card-body">{data.doc.body}</div>

	<div class="actions">
		{#if data.canEdit}
			<a class="button" href="/documents/{data.doc.id}/edit"><Icon name="pencil" size={14} /> Edit</a
			>
		{/if}

		{#each data.actions as action (action)}
			{#if action === 'reject'}
				<form method="POST" action="?/reject">
					<input type="hidden" name="expectedVersion" value={data.doc.version} />
					<label>
						<span>Reason for rejection</span>
						<textarea name="comment" required></textarea>
					</label>
					<button type="submit" class="danger"
						><Icon name={actionIcon[action]} size={14} />{actionLabels[action]}</button
					>
				</form>
			{:else}
				<form method="POST" action="?/{action}">
					<input type="hidden" name="expectedVersion" value={data.doc.version} />
					<button type="submit" class={action === 'archive' ? 'danger' : 'primary'}
						><Icon name={actionIcon[action]} size={14} />{actionLabels[action]}</button
					>
				</form>
			{/if}
		{/each}
	</div>
</div>

<h2>History</h2>
{#if data.history.length === 0}
	<div class="empty-state">No activity yet.</div>
{:else}
	<div class="table-card">
		<table>
			<thead>
				<tr>
					<th>When</th>
					<th>Actor</th>
					<th>Action</th>
					<th>From → To</th>
					<th>Comment</th>
				</tr>
			</thead>
			<tbody>
				{#each data.history as event (event.id)}
					<tr>
						<td class="history-meta">{new Date(event.createdAt).toLocaleString()}</td>
						<td>{event.actorName}</td>
						<td>{event.action}</td>
						<td class="history-meta">{event.fromStatus ?? '—'} → {event.toStatus ?? '—'}</td>
						<td>{event.comment ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
