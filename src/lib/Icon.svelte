<script lang="ts">
	let { name, size = 16 }: { name: string; size?: number } = $props();

	const paths: Record<string, string> = {
		plus: 'M12 5v14M5 12h14',
		'log-out': 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
		send: 'M22 2 11 13M22 2 15 22l-4-9-9-4 20-7Z',
		check: 'M20 6 9 17l-5-5',
		'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
		x: 'M18 6 6 18M6 6l12 12',
		'x-circle': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6',
		'rotate-ccw': 'M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10',
		upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
		archive: 'M21 8v13H3V8M1 3h22v5H1V3ZM10 12h4',
		'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M16 13H8M16 17H8M10 9H8',
		clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
		circle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
		globe:
			'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
		pencil:
			'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
		inbox:
			'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="icon"
	aria-hidden="true"
>
	<path d={paths[name] ?? ''} />
</svg>
