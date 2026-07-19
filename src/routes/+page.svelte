<script lang="ts">
	import {
		MjmlEditor,
		createBlock,
		createColumn,
		createEmptyState,
		createSection,
		defineBlock,
		newId,
		type EditorState
	} from '$lib/index.js';
	import PriceTagView from './PriceTagView.svelte';
	import SwatchControl from './SwatchControl.svelte';

	// Custom block example (spec §8.4) — registered via the `blocks` prop.
	// Its inspector demos M5b: {label, value} options and a custom 'swatch' control.
	const priceTag = defineBlock({
		type: 'priceTag',
		label: 'Price tag',
		defaultProps: { amount: 4900, currency: 'TWD', accent: '#dc2626' },
		inspector: [
			{ key: 'amount', label: 'Amount', control: 'number', min: 0 },
			{
				key: 'currency',
				label: 'Currency',
				control: 'select',
				options: [
					{ label: '新台幣 TWD', value: 'TWD' },
					{ label: 'US Dollar USD', value: 'USD' },
					{ label: 'Euro EUR', value: 'EUR' }
				]
			},
			{ key: 'accent', label: 'Accent color', control: 'swatch' }
		],
		toMjml: (p) =>
			`<mj-text align="center" font-size="28px" font-weight="bold" color="${p.accent}">${p.currency} ${p.amount.toLocaleString('en-US')}</mj-text>`,
		render: PriceTagView
	});

	function demoState(): EditorState {
		const state = createEmptyState();
		state.settings.preheader = 'This week in smail';

		const hero = createSection(1);
		const heroText = createBlock('text');
		heroText.props.content =
			'<h1 style="margin:0">Hi {{firstName}}, hello from <span style="color:#2563eb">smail</span></h1>';
		heroText.props.align = 'center';
		heroText.props.fontSize = 18;
		hero.columns[0].blocks.push(heroText, createBlock('divider'));

		const feature: ReturnType<typeof createSection> = {
			id: newId(),
			type: 'section',
			props: { padding: { top: 20, right: 0, bottom: 20, left: 0 }, backgroundColor: '#ffffff' },
			columns: [createColumn({ width: '55%' }), createColumn({ width: '45%' })]
		};
		const featureText = createBlock('text');
		featureText.props.content =
			'A visual email template editor for Svelte. JSON in, battle-tested <strong>MJML HTML</strong> out — compiled right here in your browser.';
		const featureButton = createBlock('button');
		featureButton.props.text = 'Read the docs';
		featureButton.props.align = 'left';
		feature.columns[0].blocks.push(featureText, featureButton);
		feature.columns[1].blocks.push(createBlock('image'));

		const footer = createSection(1);
		footer.columns[0].blocks.push(createBlock('social'), createBlock('spacer'));
		state.body = [hero, feature, footer];
		return state;
	}

	let template = $state(demoState());
	let changes = $state(0);
</script>

<svelte:head>
	<title>smail demo</title>
</svelte:head>

<div class="demo">
	<MjmlEditor
		bind:state={template}
		blocks={[priceTag]}
		controls={{ swatch: SwatchControl }}
		parameters={[
			{ key: 'firstName', label: 'First name', sample: 'Alice' },
			{ key: 'couponCode', label: 'Coupon', sample: 'WELCOME10' }
		]}
		onChange={() => changes++}
	/>
	<footer class="demo-footer">
		smail demo playground — {changes} change{changes === 1 ? '' : 's'} this session
	</footer>
</div>

<style>
	:global(html, body) {
		margin: 0;
		height: 100%;
	}

	.demo {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.demo :global(.sme-root) {
		flex: 1;
		min-height: 0;
	}

	.demo-footer {
		padding: 4px 12px;
		font: 12px system-ui, sans-serif;
		color: #64748b;
		background: #ffffff;
		border-top: 1px solid #e2e8f0;
	}
</style>
