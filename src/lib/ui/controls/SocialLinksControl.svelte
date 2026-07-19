<script lang="ts">
	import { SOCIAL_NETWORKS, type SocialElement } from '../../core/schema/types.js';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const rows = $derived((value as SocialElement[]) ?? []);

	function update(index: number, patch: Partial<SocialElement>) {
		setValue(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	}

	function remove(index: number) {
		setValue(rows.filter((_, i) => i !== index));
	}

	function add() {
		setValue([...rows, { network: 'web', href: 'https://' }]);
	}
</script>

<div class="sme-social-links">
	{#each rows as row, i (i)}
		<div class="sme-social-row">
			<select
				aria-label="{field.label} network"
				value={row.network}
				onchange={(e) => update(i, { network: e.currentTarget.value as SocialElement['network'] })}
			>
				{#each SOCIAL_NETWORKS as network (network)}
					<option value={network}>{network}</option>
				{/each}
			</select>
			<input
				type="text"
				aria-label="{field.label} URL"
				value={row.href}
				oninput={(e) => update(i, { href: e.currentTarget.value })}
			/>
			<button type="button" aria-label="Remove link" title="Remove link" onclick={() => remove(i)}>
				✕
			</button>
		</div>
	{/each}
	<button type="button" class="sme-social-add" onclick={add}>+ Add link</button>
</div>

<style>
	.sme-social-links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sme-social-row {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr) auto;
		gap: 4px;
		align-items: center;
	}

	/* FieldControl's shared :global rules cover input/textarea only — match them here. */
	.sme-social-row select {
		font: inherit;
		font-size: 13px;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		padding: 5px 4px;
		min-width: 0;
		width: 100%;
	}

	.sme-social-row button {
		border: 1px solid var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-text-muted, #64748b);
		border-radius: var(--sme-radius, 6px);
		padding: 4px 7px;
		font-size: 11px;
		line-height: 1.4;
		cursor: pointer;
	}

	.sme-social-row button:hover {
		background: #fef2f2;
		border-color: #fecaca;
		color: #b91c1c;
	}

	.sme-social-add {
		align-self: flex-start;
		border: 1px dashed var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-accent, #2563eb);
		border-radius: var(--sme-radius, 6px);
		padding: 4px 10px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.sme-social-add:hover {
		border-color: var(--sme-accent, #2563eb);
	}
</style>
