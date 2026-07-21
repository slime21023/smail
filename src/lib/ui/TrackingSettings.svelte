<script lang="ts">
	import { createDefaultTrackingSettings } from '../core/schema/defaults.js';
	import type { DocumentSettings, UTMTrackingSettings } from '../core/schema/types.js';

	interface Props {
		settings: DocumentSettings;
	}

	let { settings }: Props = $props();
	type UtmKey = Exclude<keyof UTMTrackingSettings, 'enabled'>;
	const utmFields: [UtmKey, string][] = [
		['source', 'Source'],
		['medium', 'Medium'],
		['campaign', 'Campaign'],
		['term', 'Term'],
		['content', 'Content']
	];

	function tracking() {
		return (settings.tracking ??= createDefaultTrackingSettings());
	}

	function setCampaignId(value: string) {
		tracking().campaignId = value || undefined;
	}

	function setUtm(key: UtmKey, value: string) {
		tracking().utm[key] = value || undefined;
	}

</script>

<fieldset class="sme-tracking">
	<legend>Tracking</legend>
	<label>
		<span>Campaign ID</span>
		<input value={tracking().campaignId ?? ''} oninput={(e) => setCampaignId(e.currentTarget.value)} />
	</label>

	<label class="sme-checkbox">
		<input type="checkbox" checked={tracking().utm.enabled} onchange={(e) => (tracking().utm.enabled = e.currentTarget.checked)} />
		Enable UTM parameters on exported HTML
	</label>

	{#if tracking().utm.enabled}
		<div class="sme-tracking-grid">
			{#each utmFields as [key, label] (key)}
				<label>
					<span>UTM {label}</span>
					<input value={tracking().utm[key] ?? ''} oninput={(e) => setUtm(key, e.currentTarget.value)} />
				</label>
			{/each}
		</div>
	{/if}

</fieldset>

<style>
	.sme-tracking { display: flex; flex-direction: column; gap: 8px; margin: 8px 0 0; padding: 10px; border: 1px solid var(--sme-border, #e2e8f0); border-radius: var(--sme-radius, 6px); }
	.sme-tracking legend, .sme-tracking span { font-size: 11px; font-weight: 600; color: var(--sme-text-muted, #64748b); }
	.sme-tracking label { display: flex; flex-direction: column; gap: 4px; }
	.sme-checkbox { flex-direction: row !important; align-items: center; font-size: 12px; color: var(--sme-text, #0f172a); }
	.sme-checkbox input { width: auto; }
	.sme-tracking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
</style>
