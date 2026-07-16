<script lang="ts">
	import type { Component } from 'svelte';
	import type { BlockRegistry } from '../core/registry/registry.js';
	import type { Block, Section } from '../core/schema/types.js';
	import ButtonView from './blocks/ButtonView.svelte';
	import DividerView from './blocks/DividerView.svelte';
	import ImageView from './blocks/ImageView.svelte';
	import SocialView from './blocks/SocialView.svelte';
	import SpacerView from './blocks/SpacerView.svelte';
	import TextView from './blocks/TextView.svelte';

	interface Props {
		body: Section[];
		width: number;
		backgroundColor: string;
		fontFamily: string;
		textColor: string;
		selectedId: string | null;
		readonly: boolean;
		onSelect: (id: string | null) => void;
		onAddSection: () => void;
		registry: BlockRegistry;
	}

	let {
		body,
		width,
		backgroundColor,
		fontFamily,
		textColor,
		selectedId,
		readonly,
		onSelect,
		onAddSection,
		registry
	}: Props = $props();

	// Built-in edit-mode views; custom blocks fall back to their registry `render`.
	const builtinViews: Record<string, Component<{ props: never }>> = {
		text: TextView as Component<{ props: never }>,
		image: ImageView as Component<{ props: never }>,
		button: ButtonView as Component<{ props: never }>,
		divider: DividerView as Component<{ props: never }>,
		spacer: SpacerView as Component<{ props: never }>,
		social: SocialView as Component<{ props: never }>
	};

	function viewFor(block: Block): Component<{ props: never }> | undefined {
		return builtinViews[block.type] ?? (registry.get(block.type)?.render as never);
	}

	function select(event: Event, id: string | null) {
		if (readonly) return;
		event.stopPropagation();
		onSelect(id);
	}

	function selectKeydown(event: KeyboardEvent, id: string) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			select(event, id);
		}
	}
</script>

<div
	class="sme-canvas"
	role="presentation"
	onclick={(e) => select(e, null)}
	style:font-family={fontFamily}
	style:color={textColor}
>
	<div class="sme-email" style:width="{width}px" style:background-color={backgroundColor}>
		{#each body as section (section.id)}
			<div
				class="sme-node sme-section"
				class:sme-selected={selectedId === section.id}
				role="button"
				tabindex={readonly ? undefined : 0}
				aria-label="Section"
				onclick={(e) => select(e, section.id)}
				onkeydown={(e) => selectKeydown(e, section.id)}
				style:padding="{section.props.padding.top}px {section.props.padding.right}px {section.props
					.padding.bottom}px {section.props.padding.left}px"
				style:background-color={section.props.backgroundColor}
				style:background-image={section.props.backgroundUrl
					? `url(${section.props.backgroundUrl})`
					: undefined}
			>
				<div class="sme-columns">
					{#each section.columns as column (column.id)}
						<div
							class="sme-node sme-column"
							class:sme-selected={selectedId === column.id}
							role="button"
							tabindex={readonly ? undefined : 0}
							aria-label="Column"
							onclick={(e) => select(e, column.id)}
							onkeydown={(e) => selectKeydown(e, column.id)}
							style:flex={column.props.width ? `0 0 ${column.props.width}` : '1 1 0'}
							style:align-self={column.props.verticalAlign === 'middle'
								? 'center'
								: column.props.verticalAlign === 'bottom'
									? 'flex-end'
									: 'flex-start'}
							style:background-color={column.props.backgroundColor}
						>
							{#each column.blocks as block (block.id)}
								{@const View = viewFor(block)}
								<div
									class="sme-node sme-block"
									class:sme-selected={selectedId === block.id}
									role="button"
									tabindex={readonly ? undefined : 0}
									aria-label={block.type}
									onclick={(e) => select(e, block.id)}
									onkeydown={(e) => selectKeydown(e, block.id)}
								>
									{#if View}
										<View props={block.props as never} />
									{:else}
										<div class="sme-block-fallback">{block.type}</div>
									{/if}
								</div>
							{/each}
							{#if column.blocks.length === 0}
								<div class="sme-empty-hint">Empty column</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
		{#if body.length === 0}
			<div class="sme-empty">
				<p>No sections yet.</p>
				{#if !readonly}
					<button type="button" class="sme-add-section" onclick={(e) => { e.stopPropagation(); onAddSection(); }}>
						+ Add section
					</button>
				{/if}
			</div>
		{/if}
	</div>
	{#if body.length > 0 && !readonly}
		<button type="button" class="sme-add-section" onclick={(e) => { e.stopPropagation(); onAddSection(); }}>
			+ Add section
		</button>
	{/if}
</div>

<style>
	.sme-canvas {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px;
		min-height: 100%;
		box-sizing: border-box;
	}

	.sme-email {
		max-width: 100%;
		box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
	}

	.sme-node {
		position: relative;
		outline: 1px dashed transparent;
		outline-offset: -1px;
		cursor: pointer;
		transition: outline-color 120ms ease;
	}

	.sme-node:hover {
		outline-color: var(--sme-accent, #2563eb);
	}

	.sme-node.sme-selected {
		outline: 2px solid var(--sme-accent, #2563eb);
		outline-offset: -2px;
	}

	.sme-columns {
		display: flex;
		align-items: stretch;
	}

	.sme-column {
		min-height: 40px;
	}

	.sme-empty-hint {
		padding: 16px 8px;
		text-align: center;
		font-size: 12px;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-empty {
		padding: 48px 16px;
		text-align: center;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-block-fallback {
		padding: 12px;
		font-size: 12px;
		color: var(--sme-text-muted, #64748b);
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-add-section {
		border: 1px dashed var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-accent, #2563eb);
		border-radius: var(--sme-radius, 6px);
		padding: 6px 14px;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}

	.sme-add-section:hover {
		border-color: var(--sme-accent, #2563eb);
	}
</style>
