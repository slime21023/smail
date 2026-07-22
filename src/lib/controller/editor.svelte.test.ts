import { describe, expect, it, vi } from 'vitest';
import { defineBlock } from '../core/registry/types.js';
import { createEmptyState } from '../core/schema/defaults.js';
import { createBuiltinTemplate } from '../templates/builtin.js';
import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
import { createEditor } from './editor.svelte.js';

describe('EditorController', () => {
	it('owns isolated state and records metadata-only undo history', () => {
		const input = createEmptyState();
		const editor = createEditor({ state: input });
		input.settings.templateName = 'Host mutation';
		expect(editor.getState().settings.templateName).not.toBe('Host mutation');

		editor.setField(null, 'templateName', 'Campaign A');
		editor.setTracking({ utm: { enabled: true, campaign: 'spring' }, campaignId: 'spring-2026' });
		expect(editor.undo().ok).toBe(true);
		expect(editor.getState().settings.tracking.campaignId).toBeUndefined();
		expect(editor.undo().ok).toBe(true);
		expect(editor.getState().settings.templateName).toBe('Untitled template');
	});

	it('notifies subscribers with cloned snapshots and mutation sources', () => {
		const onChange = vi.fn();
		const editor = createEditor({ state: createEmptyState(), onChange });
		const received: string[] = [];
		const unsubscribe = editor.subscribe((change) => received.push(change.source));
		editor.addSection(2);
		const changed = onChange.mock.calls[0][0];
		changed.state.settings.templateName = 'Mutated listener value';
		expect(editor.getState().settings.templateName).toBe('Untitled template');
		editor.undo();
		editor.redo();
		unsubscribe();
		editor.replaceState(createEmptyState());
		expect(received).toEqual(['command', 'undo', 'redo']);
		expect(onChange.mock.calls.map(([change]) => change.source)).toEqual([
			'command',
			'undo',
			'redo',
			'replace'
		]);
	});

	it('keeps the current document when template import fails', () => {
		const editor = createEditor({ state: createEmptyState() });
		editor.setField(null, 'subject', 'Keep me');
		const before = editor.getState();
		const result = editor.importTemplate('{bad json');
		expect(result.ok).toBe(false);
		expect(editor.getState()).toEqual(before);
	});

	it('routes tree, width, and parameter commands through one registry-backed session', () => {
		const notice = defineBlock({
			type: 'notice',
			label: 'Notice',
			defaultProps: { message: 'Hello' },
			inspector: [{ key: 'message', label: 'Message', control: 'text' }],
			toMjml: (props) => `<mj-text>${props.message}</mj-text>`
		});
		const editor = createEditor({ state: createEmptyState(), blocks: [notice] });
		const section = editor.addSection(2);
		const block = editor.addBlock('notice');
		expect(editor.setColumnWidth(section.columns[0].id, 70).ok).toBe(true);
		expect(editor.setTextContent(block.id, 'Ignored for custom block').ok).toBe(true);
		expect(editor.createParameter('firstName', 'First name')?.key).toBe('firstName');
		expect(editor.addColumn(section.id).ok).toBe(true);
		expect(editor.removeColumn(editor.getState().body[0].columns[2].id).ok).toBe(true);

		const result = editor.importTemplate(JSON.stringify(editor.exportTemplate()));
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.state.body[0].columns[0].blocks[0].type).toBe('notice');
	});

	it('restores a finalized drag update', () => {
		const editor = createEditor({ state: createEmptyState() });
		const section = editor.addSection(1);
		const original = editor.addBlock('text');
		const divider = { id: 'divider-dragged', type: 'divider', props: {} } as never;
		editor.setColumnBlocks(section.columns[0].id, [original, divider]);
		expect(editor.undo().ok).toBe(true);
		expect(editor.getState().body[0].columns[0].blocks).toHaveLength(1);
		expect(editor.redo().ok).toBe(true);
		expect(editor.getState().body[0].columns[0].blocks).toHaveLength(2);
	});

	it('serializes nested Inspector field replacements after controller commits', () => {
		const editor = createEditor({ state: createBuiltinTemplate('newsletter') });
		const social = editor.getState().body.flatMap((section) => section.columns).flatMap((column) => column.blocks).find((block) => block.type === 'social')!;
		const elements = structuredClone((social.props as { elements: { network: string; href: string }[] }).elements);
		elements[0].href = 'https://fb.example/test';
		expect(editor.setField(social.id, 'elements', elements).ok).toBe(true);
		expect(serializeToMjml(editor.getState(), editor.registry)).toContain('https://fb.example/test');
	});
});
