<script lang="ts">
	import { isValidParameterKey } from '../core/params/params.js';
	import type { DocumentSettings, ParameterDef } from '../core/schema/types.js';

	interface Props {
		settings: Readonly<DocumentSettings>;
		hostParameters: ParameterDef[];
		onSetParameters: (parameters: ParameterDef[]) => void;
	}

	let { settings, hostParameters, onSetParameters }: Props = $props();
	let error = $state('');
	let entries = $derived(settings.parameters ?? []);

	function locked(key: string) {
		return hostParameters.some((parameter) => parameter.key === key);
	}

	function add() {
		const keys = new Set([...entries, ...hostParameters].map((parameter) => parameter.key));
		let key = 'parameter';
		let suffix = 2;
		while (keys.has(key)) key = `parameter${suffix++}`;
		onSetParameters([...entries, { key, label: key }]);
		error = '';
	}

	function update(index: number, field: keyof ParameterDef, value: string) {
		const current = entries[index];
		if (!current || locked(current.key)) return;
		const next = { ...current, [field]: value || undefined } as ParameterDef;
		if (field === 'key') {
			if (!value || !isValidParameterKey(value)) {
				error = 'Key must start with a letter, number, or underscore and use only letters, numbers, _, ., or -.';
				return;
			}
			if (entries.some((parameter, candidate) => candidate !== index && parameter.key === value)) {
				error = 'Parameter keys must be unique.';
				return;
			}
			next.key = value;
		}
		onSetParameters(entries.map((parameter, candidate) => (candidate === index ? next : parameter)));
		error = '';
	}

	function remove(index: number) {
		const current = entries[index];
		if (!current || locked(current.key)) return;
		onSetParameters(entries.filter((_, candidate) => candidate !== index));
	}
</script>

<fieldset class="sme-parameters">
	<legend>Template parameters</legend>
	{#each entries as parameter, index (parameter.key)}
		{@const isLocked = locked(parameter.key)}
		<div class="sme-parameter-row" class:sme-parameter-locked={isLocked}>
			<input aria-label="Parameter key" value={parameter.key} disabled={isLocked} onchange={(event) => update(index, 'key', event.currentTarget.value)} />
			<input aria-label="Parameter label" value={parameter.label ?? ''} disabled={isLocked} placeholder="Label" onchange={(event) => update(index, 'label', event.currentTarget.value)} />
			<input aria-label="Parameter sample" value={parameter.sample ?? ''} disabled={isLocked} placeholder="Sample" onchange={(event) => update(index, 'sample', event.currentTarget.value)} />
			{#if isLocked}
				<span title="Provided by the host application">🔒</span>
			{:else}
				<button type="button" aria-label={`Remove ${parameter.key}`} onclick={() => remove(index)}>×</button>
			{/if}
		</div>
	{/each}
	<button type="button" class="sme-add-parameter" onclick={add}>+ Add parameter</button>
	{#if error}<small class="sme-parameter-error" role="alert">{error}</small>{/if}
</fieldset>

<style>
	.sme-parameters { display: flex; flex-direction: column; gap: 6px; margin: 8px 0 0; padding: 10px; border: 1px solid var(--sme-border, #e2e8f0); border-radius: var(--sme-radius, 6px); }
	.sme-parameters legend { font-size: 11px; font-weight: 600; color: var(--sme-text-muted, #64748b); }
	.sme-parameter-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 4px; align-items: center; }
	.sme-parameter-row input { min-width: 0; }
	.sme-parameter-row button, .sme-add-parameter { border: 1px solid var(--sme-border, #e2e8f0); border-radius: var(--sme-radius, 6px); background: var(--sme-panel-bg, #fff); color: var(--sme-accent, #2563eb); cursor: pointer; font: inherit; font-size: 12px; }
	.sme-parameter-row button { color: #b91c1c; padding: 3px 7px; }
	.sme-add-parameter { align-self: flex-start; padding: 3px 7px; }
	.sme-parameter-locked { opacity: 0.7; }
	.sme-parameter-error { color: #b91c1c; font-size: 11px; }
</style>
