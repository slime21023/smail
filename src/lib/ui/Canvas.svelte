<script lang="ts">
	import type { Component } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dndzone } from 'svelte-dnd-action';
	import type { BlockRegistry } from '../core/registry/registry.js';
	import { newId } from '../core/schema/defaults.js';
	import { resolveColumnWidths } from '../core/schema/tree.js';
	import type { Block, Column, Section } from '../core/schema/types.js';
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
		onAddSection: (columns: number) => void;
		onReorderSections: (sections: Section[]) => void;
		onMoveSection: (id: string, offset: -1 | 1) => void;
		onDuplicate: (id: string) => void;
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
		onReorderSections,
		onMoveSection,
		onDuplicate,
		registry
	}: Props = $props();

	const COLUMN_CHOICES = [1, 2, 3, 4];

	const FLIP_MS = 150;

	// Built-in edit-mode views; custom blocks fall back to their registry `render`.
	type BlockView = Component<{ props: never; editable?: boolean }>;
	const builtinViews: Record<string, BlockView> = {
		text: TextView as BlockView,
		image: ImageView as BlockView,
		button: ButtonView as BlockView,
		divider: DividerView as BlockView,
		spacer: SpacerView as BlockView,
		social: SocialView as BlockView
	};

	function viewFor(block: Block): BlockView | undefined {
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

	// Sections are only draggable from their handle, so grabbing text inside
	// a block never moves the whole section.
	let sectionDragDisabled = $state(true);

	function considerSections(e: CustomEvent<{ items: Section[] }>) {
		onReorderSections(e.detail.items);
	}

	function finalizeSections(e: CustomEvent<{ items: Section[] }>) {
		onReorderSections(e.detail.items);
		sectionDragDisabled = true;
	}

	function considerBlocks(column: Column, e: CustomEvent<{ items: Block[] }>) {
		column.blocks = e.detail.items;
	}

	// Items dragged in from the palette carry a `palette-*` id and a label —
	// turn them into real blocks with fresh ids.
	function finalizeBlocks(column: Column, e: CustomEvent<{ items: Block[] }>) {
		column.blocks = e.detail.items.map((item) => {
			if (!item.id.startsWith('palette-')) return item;
			const { label: _label, ...block } = item as Block & { label?: string };
			const created = { ...block, id: newId() } as Block;
			onSelect(created.id);
			return created;
		});
	}
</script>

{#snippet addSectionRow()}
	<div class="sme-add-section-row" role="group" aria-label="Add section">
		<span>+ Add section</span>
		{#each COLUMN_CHOICES as count (count)}
			<button
				type="button"
				class="sme-add-section"
				title="Add section with {count} column{count === 1 ? '' : 's'}"
				aria-label="Add section with {count} column{count === 1 ? '' : 's'}"
				onclick={(e) => {
					e.stopPropagation();
					onAddSection(count);
				}}
			>
				{count}
			</button>
		{/each}
	</div>
{/snippet}

<div
	class="sme-canvas"
	role="presentation"
	onclick={(e) => select(e, null)}
	style:font-family={fontFamily}
	style:color={textColor}
>
	<div class="sme-email" style:width="{width}px" style:background-color={backgroundColor}>
		<div
			class="sme-sections"
			use:dndzone={{
				items: body,
				type: 'section',
				flipDurationMs: FLIP_MS,
				dragDisabled: readonly || sectionDragDisabled,
				dropTargetStyle: {}
			}}
			onconsider={considerSections}
			onfinalize={finalizeSections}
		>
			{#each body as section (section.id)}
				{@const columnWidths = resolveColumnWidths(section.columns)}
				<div
					class="sme-node sme-section"
					class:sme-selected={selectedId === section.id}
					role="button"
					tabindex={readonly ? undefined : 0}
					aria-label="Section"
					onclick={(e) => select(e, section.id)}
					onkeydown={(e) => selectKeydown(e, section.id)}
					animate:flip={{ duration: FLIP_MS }}
					style:padding="{section.props.padding.top}px {section.props.padding.right}px {section
						.props.padding.bottom}px {section.props.padding.left}px"
					style:background-color={section.props.backgroundColor}
					style:background-image={section.props.backgroundUrl
						? `url(${section.props.backgroundUrl})`
						: undefined}
				>
					{#if !readonly}
						<div class="sme-section-toolbar">
							<div
								class="sme-drag-handle"
								title="Drag to reorder section"
								onmousedown={() => (sectionDragDisabled = false)}
								ontouchstart={() => (sectionDragDisabled = false)}
								role="presentation"
							>
								⠿
							</div>
							<button
								type="button"
								title="Move section up"
								aria-label="Move section up"
								onclick={(e) => {
									e.stopPropagation();
									onMoveSection(section.id, -1);
								}}
							>
								▲
							</button>
							<button
								type="button"
								title="Move section down"
								aria-label="Move section down"
								onclick={(e) => {
									e.stopPropagation();
									onMoveSection(section.id, 1);
								}}
							>
								▼
							</button>
							<button
								type="button"
								title="Duplicate section"
								aria-label="Duplicate section"
								onclick={(e) => {
									e.stopPropagation();
									onDuplicate(section.id);
								}}
							>
								⧉
							</button>
						</div>
					{/if}
					<div class="sme-columns">
						{#each section.columns as column, columnIndex (column.id)}
							<div
								class="sme-node sme-column"
								class:sme-selected={selectedId === column.id}
								role="button"
								tabindex={readonly ? undefined : 0}
								aria-label="Column"
								onclick={(e) => select(e, column.id)}
								onkeydown={(e) => selectKeydown(e, column.id)}
								style:flex={`0 0 ${columnWidths[columnIndex]}%`}
								style:align-self={column.props.verticalAlign === 'middle'
									? 'center'
									: column.props.verticalAlign === 'bottom'
										? 'flex-end'
										: 'flex-start'}
								style:background-color={column.props.backgroundColor}
							>
								<div
									class="sme-blocks"
									use:dndzone={{
										items: column.blocks,
										type: 'block',
										flipDurationMs: FLIP_MS,
										dragDisabled: readonly,
										dropTargetStyle: { outline: '2px dashed var(--sme-accent, #2563eb)' }
									}}
									onconsider={(e) => considerBlocks(column, e)}
									onfinalize={(e) => finalizeBlocks(column, e)}
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
											animate:flip={{ duration: FLIP_MS }}
										>
											{#if View}
												<View
													props={block.props as never}
													editable={!readonly && selectedId === block.id}
												/>
											{:else}
												<div class="sme-block-fallback">{block.type}</div>
											{/if}
											{#if !readonly}
												<button
													type="button"
													class="sme-block-duplicate"
													title="Duplicate block"
													aria-label="Duplicate block"
													onclick={(e) => {
														e.stopPropagation();
														onDuplicate(block.id);
													}}
												>
													⧉
												</button>
											{/if}
										</div>
									{/each}
								</div>
								{#if column.blocks.length === 0}
									<div class="sme-empty-hint">Empty column</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		{#if body.length === 0}
			<div class="sme-empty">
				<p>No sections yet.</p>
				{#if !readonly}
					{@render addSectionRow()}
				{/if}
			</div>
		{/if}
	</div>
	{#if body.length > 0 && !readonly}
		{@render addSectionRow()}
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

	.sme-section-toolbar {
		position: absolute;
		top: 2px;
		left: 2px;
		z-index: 2;
		display: flex;
		gap: 2px;
		opacity: 0;
		transition: opacity 120ms ease;
	}

	.sme-section:hover > .sme-section-toolbar,
	.sme-section.sme-selected > .sme-section-toolbar {
		opacity: 1;
	}

	.sme-drag-handle,
	.sme-section-toolbar button {
		padding: 2px 5px;
		font: inherit;
		font-size: 12px;
		line-height: 1;
		color: var(--sme-text-muted, #64748b);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: 4px;
		cursor: pointer;
	}

	.sme-drag-handle {
		cursor: grab;
	}

	.sme-section-toolbar button:hover {
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-block-duplicate {
		position: absolute;
		top: 2px;
		right: 2px;
		z-index: 2;
		padding: 2px 5px;
		font: inherit;
		font-size: 12px;
		line-height: 1;
		color: var(--sme-text-muted, #64748b);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: 4px;
		cursor: pointer;
		opacity: 0;
		transition: opacity 120ms ease;
	}

	.sme-block:hover > .sme-block-duplicate,
	.sme-block.sme-selected > .sme-block-duplicate {
		opacity: 1;
	}

	.sme-block-duplicate:hover {
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-columns {
		display: flex;
		align-items: stretch;
	}

	.sme-column {
		min-height: 40px;
	}

	.sme-blocks {
		min-height: 24px;
	}

	.sme-empty-hint {
		padding: 0 8px 8px;
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

	.sme-add-section-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-add-section {
		border: 1px dashed var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-accent, #2563eb);
		border-radius: var(--sme-radius, 6px);
		padding: 6px 12px;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}

	.sme-add-section:hover {
		border-color: var(--sme-accent, #2563eb);
	}
</style>
