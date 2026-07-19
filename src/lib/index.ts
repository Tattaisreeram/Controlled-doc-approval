// place files you want to import through the `$lib` alias in this folder.

export const statusIcon: Record<string, string> = {
	draft: 'file-text',
	submitted: 'clock',
	approved: 'check-circle',
	rejected: 'x-circle',
	published: 'globe',
	archived: 'archive'
};

export const actionIcon: Record<string, string> = {
	submit: 'send',
	approve: 'check',
	reject: 'x',
	reopen: 'rotate-ccw',
	publish: 'upload',
	archive: 'archive'
};
