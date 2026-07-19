<script lang="ts">
	import { tick } from 'svelte';
	import { paddingValue } from '../../core/serializer/format.js';
	import type { TextBlockProps } from '../../core/schema/types.js';
	import { getEditorContext } from '../context.js';
	import RichTextToolbar from './RichTextToolbar.svelte';

	let { props, editable = false }: { props: TextBlockProps; editable?: boolean } = $props();

	const { delimiters } = getEditorContext();

	// Inline WYSIWYG editing on a contenteditable surface. dblclick to edit,
	// Escape reverts, blur/Ctrl+Enter commits. Live sync keeps the preview pane
	// current; the 300ms history debounce coalesces a typing burst into one
	// undo entry. Content is NOT sanitized (spec open question #2): it stays
	// trusted user-authored HTML, same trust model as the Inspector textarea.
	// execCommand is deprecated but universal; all calls live in this file and
	// RichTextToolbar so a Range-based swap stays a two-file change.
	let editing = $state(false);
	let draftBefore = '';
	let surface = $state<HTMLElement | null>(null);
	let wrap = $state<HTMLElement | null>(null);
	let savedRange: Range | null = null;

	async function startEdit() {
		if (!editable || editing) return;
		draftBefore = props.content;
		editing = true;
		await tick();
		if (!surface) return;
		// Imperative seed — a reactive innerHTML binding would reset the caret
		// on every keystroke.
		surface.innerHTML = props.content;
		surface.focus();
		document.execCommand('styleWithCSS', false, 'false');
	}

	function sync() {
		if (surface) props.content = surface.innerHTML;
	}

	function commit() {
		editing = false;
	}

	function revert() {
		props.content = draftBefore;
		editing = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			revert();
		} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			commit();
		}
		e.stopPropagation();
	}

	function onBlur(e: FocusEvent) {
		const to = e.relatedTarget as Node | null;
		if (to && wrap?.contains(to)) return; // focus moved into the toolbar
		commit();
	}

	function saveRange() {
		const sel = document.getSelection();
		savedRange = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
	}

	function restoreRange() {
		if (!savedRange) return;
		const sel = document.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(savedRange);
	}

	function runCommand(cmd: 'bold' | 'italic') {
		surface?.focus();
		document.execCommand(cmd);
		sync();
	}

	function applyLink(url: string) {
		surface?.focus();
		restoreRange();
		document.execCommand('createLink', false, url);
		sync();
	}

	function insertParam(key: string) {
		surface?.focus();
		restoreRange();
		document.execCommand('insertText', false, `${delimiters.open}${key}${delimiters.close}`);
		sync();
	}
</script>

<div
	style:font-size="{props.fontSize}px"
	style:font-weight={props.fontWeight}
	style:text-align={props.align}
	style:color={props.color ?? 'inherit'}
	style:line-height={String(props.lineHeight)}
	style:padding={paddingValue(props.padding)}
	ondblclick={startEdit}
	role="presentation"
>
	{#if editing}
		<div class="sme-richtext-wrap" bind:this={wrap}>
			<RichTextToolbar
				oncmd={runCommand}
				onlink={applyLink}
				oninsertparam={insertParam}
				onsaverange={saveRange}
			/>
			<div
				bind:this={surface}
				class="sme-text-richedit"
				contenteditable="true"
				oninput={sync}
				onblur={onBlur}
				onkeydown={onKeydown}
				onclick={(e) => e.stopPropagation()}
				role="textbox"
				aria-multiline="true"
				aria-label="Edit text"
				tabindex="0"
			></div>
		</div>
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- user-authored inline HTML, see spec open question #2 -->
		{@html props.content}
	{/if}
</div>

<style>
	.sme-richtext-wrap {
		position: relative;
	}

	.sme-text-richedit {
		outline: 1px dashed var(--sme-accent, #2563eb);
		outline-offset: 2px;
		border-radius: 4px;
		min-height: 1em;
	}

	.sme-text-richedit:focus-visible {
		outline-style: solid;
	}
</style>
