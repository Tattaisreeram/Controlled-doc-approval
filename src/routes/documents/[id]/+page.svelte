<script lang="ts">
	import type { PageProps } from './$types';
	import type { TransitionName } from '$lib/server/transitions';

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

<h1>{data.doc.title}</h1>

{#if form?.message}
	<p class="banner {form.conflict ? 'banner-conflict' : 'banner-error'}">{form.message}</p>
{/if}

<div class="card">
	<p>
		<span class="badge badge-{data.doc.status}">{data.doc.status}</span>
		<small>version {data.doc.version}</small>
	</p>
	<p style="white-space: pre-wrap">{data.doc.body}</p>

	<div class="actions">
		{#if data.canEdit}
			<a class="button" href="/documents/{data.doc.id}/edit">Edit</a>
		{/if}

		{#each data.actions as action (action)}
			{#if action === 'reject'}
				<form method="POST" action="?/reject">
					<input type="hidden" name="expectedVersion" value={data.doc.version} />
					<label>
						<span>Reason for rejection</span>
						<textarea name="comment" required></textarea>
					</label>
					<button type="submit" class="danger">{actionLabels[action]}</button>
				</form>
			{:else}
				<form method="POST" action="?/{action}">
					<input type="hidden" name="expectedVersion" value={data.doc.version} />
					<button type="submit" class={action === 'archive' ? 'danger' : 'primary'}
						>{actionLabels[action]}</button
					>
				</form>
			{/if}
		{/each}
	</div>
</div>

<h2>History</h2>
{#if data.history.length === 0}
	<p>No activity yet.</p>
{:else}
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
					<td>{new Date(event.createdAt).toLocaleString()}</td>
					<td>{event.actorName}</td>
					<td>{event.action}</td>
					<td>{event.fromStatus ?? '—'} → {event.toStatus ?? '—'}</td>
					<td>{event.comment ?? '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
