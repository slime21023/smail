<script lang="ts">
	import { tick } from 'svelte';
	import { paddingValue } from '../../core/serializer/format.js';
	import { sanitizeTextHtml } from '../../core/text/sanitize.js';
	import type { TextBlockProps } from '../../core/schema/types.js';
	import { getEditorContext } from '../context.js';
	import RichTextToolbar from './RichTextToolbar.svelte';

	let {
		props,
		editable = false,
		onContentChange
	}: { props: TextBlockProps; editable?: boolean; onContentChange?: (html: string) => void } = $props();

	const { delimiters } = getEditorContext();

	// Inline WYSIWYG editing: double-click starts, Escape restores the sanitized
	// initial draft, and blur/Ctrl+Enter commits. Every update is routed through
	// the controller callback so it participates in history and host events.
	// execCommand is deprecated but remains broadly available; keeping calls here
	// and in RichTextToolbar makes a future Range-based replacement localized.
	let editing = $state(false);
	let draftBefore = '';
	let surface = $state<HTMLElement | null>(null);
	let wrap = $state<HTMLElement | null>(null);
	let savedRange: Range | null = null;

	async function startEdit() {
		if (!editable || editing) return;
		draftBefore = sanitizeTextHtml(props.content);
		editing = true;
		await tick();
		if (!surface) return;
		// Imperative seed — a reactive innerHTML binding would reset the caret
		// on every keystroke.
		surface.innerHTML = draftBefore;
		surface.focus();
		document.execCommand('styleWithCSS', false, 'false');
	}

	function sync() {
		if (surface) onContentChange?.(sanitizeTextHtml(surface.innerHTML));
	}

	function commit() {
		sync();
		editing = false;
	}

	function revert() {
		onContentChange?.(sanitizeTextHtml(draftBefore));
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

	function runCommand(cmd: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'unlink') {
		surface?.focus();
		document.execCommand(cmd);
		sync();
	}

	function formatBlock(tag: 'p' | 'h1' | 'h2' | 'h3') {
		surface?.focus();
		restoreRange();
		document.execCommand('formatBlock', false, tag);
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
				onblock={formatBlock}
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
		{@html sanitizeTextHtml(props.content)}
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
