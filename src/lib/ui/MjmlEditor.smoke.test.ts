import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuiltinTemplate } from '../templates/builtin.js';
import type { TemplateFile } from '../core/template/template.js';
import type { ThemeTokens } from './theme.js';
import { createEditor, type EditorController } from '../controller/editor.svelte.js';
import MjmlEditor from './MjmlEditor.svelte';

let target: HTMLElement | undefined;
let instance: Record<string, unknown> | undefined;

interface TestProps {
	editor: EditorController;
	readonly?: boolean;
	theme?: ThemeTokens;
}

function render(props: TestProps) {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(MjmlEditor, { target, props });
	flushSync();
}

afterEach(() => {
	if (instance) unmount(instance);
	instance = undefined;
	target?.remove();
	target = undefined;
});

describe('MjmlEditor host integration', () => {
	it('returns a versioned file through the host-owned template callback', () => {
		let exported: TemplateFile | undefined;
		render({ editor: createEditor({ state: createBuiltinTemplate('newsletter'), onTemplateExport: (file) => (exported = file) }) });
		[...target!.querySelectorAll<HTMLButtonElement>('button')]
			.find((button) => button.textContent?.trim() === 'Export template')
			?.click();
		expect(exported?.format).toBe('smail-template');
		expect(exported?.state.settings.templateName).toBe('Newsletter');
	});

	it('honors readonly mode and host theme tokens', () => {
		render({ editor: createEditor({ state: createBuiltinTemplate('promotion') }), readonly: true, theme: { accent: '#7c3aed' } });
		expect(target?.querySelector('.sme-pane-left')).toBeNull();
		expect(target?.querySelector('.sme-pane-right')).toBeNull();
		expect(target?.textContent).not.toContain('Import template');
		expect(target?.querySelector('.sme-root')?.getAttribute('style')).toContain('--sme-accent: #7c3aed');
	});

	it('recompiles nested controller field updates', async () => {
		const editor = createEditor({ state: createBuiltinTemplate('newsletter') });
		render({ editor });
		const social = editor
			.getState()
			.body.flatMap((section) => section.columns)
			.flatMap((column) => column.blocks)
			.find((block) => block.type === 'social')!;
		const elements = structuredClone((social.props as { elements: { network: string; href: string }[] }).elements);
		elements[0].href = 'https://fb.example/test';
		editor.setField(social.id, 'elements', elements);
		await vi.waitFor(
			() => expect(target?.querySelector('iframe')?.getAttribute('srcdoc')).toContain('https://fb.example/test'),
			{ timeout: 3000 }
		);
	});
});
