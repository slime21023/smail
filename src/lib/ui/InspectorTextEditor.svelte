<script lang="ts">
	import { sanitizeTextHtml } from '../core/text/sanitize.js';
	import type { TextEditorProps } from '../core/registry/types.js';
	import RichTextToolbar from './blocks/RichTextToolbar.svelte';

	let { value, setValue, disabled, parameters, delimiters }: TextEditorProps = $props();
	let surface = $state<HTMLElement | null>(null);
	let savedRange: Range | null = null;

	$effect(() => {
		if (surface && document.activeElement !== surface) surface.innerHTML = sanitizeTextHtml(value);
	});

	function sync() {
		if (surface) setValue(sanitizeTextHtml(surface.innerHTML));
	}

	function saveRange() {
		const selection = document.getSelection();
		savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
	}

	function restoreRange() {
		if (!savedRange) return;
		const selection = document.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(savedRange);
	}

	function command(cmd: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'unlink') {
		surface?.focus();
		restoreRange();
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

<div class="sme-inspector-richtext">
	<RichTextToolbar
		oncmd={command}
		onblock={formatBlock}
		onlink={applyLink}
		oninsertparam={insertParam}
		onsaverange={saveRange}
	/>
	<div
		class="sme-inspector-richtext-surface"
		contenteditable={!disabled}
		bind:this={surface}
		oninput={sync}
		onkeyup={saveRange}
		onmouseup={saveRange}
		role="textbox"
		aria-multiline="true"
		aria-label="Text content"
		tabindex="0"
	></div>
</div>

<style>
	.sme-inspector-richtext { position: relative; padding-top: 38px; }
	.sme-inspector-richtext :global(.sme-richtext-toolbar) { top: 0; }
	.sme-inspector-richtext-surface { min-height: 100px; padding: 7px; border: 1px solid var(--sme-border, #e2e8f0); border-radius: var(--sme-radius, 6px); background: var(--sme-panel-bg, #fff); font-size: 13px; line-height: 1.5; outline: none; }
	.sme-inspector-richtext-surface:focus-visible { border-color: var(--sme-accent, #2563eb); box-shadow: 0 0 0 2px var(--sme-accent-soft, #dbeafe); }
</style>
