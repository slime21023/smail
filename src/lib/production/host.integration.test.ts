import { describe, expect, it } from 'vitest';
import {
	createBuiltinTemplate,
	createEditor,
	defineBlock,
	serializeTemplateFile,
	serializeToMjml
} from '../index.js';

describe('host integration fixture', () => {
	it('round-trips a portable template through a controller with a registered host block', async () => {
		const receipt = defineBlock({
			type: 'receipt',
			label: 'Receipt',
			defaultProps: { message: 'Thank you' },
			inspector: [{ key: 'message', label: 'Message', control: 'text' }],
			toMjml: (props) => `<mj-text>${props.message}</mj-text>`
		});
		const state = createBuiltinTemplate('transactional');
		state.body[0].columns[0].blocks.push({ id: 'receipt-1', type: 'receipt', props: { message: 'Saved by host' } } as never);

		const editor = createEditor({ state, blocks: [receipt] });
		const templateJson = serializeTemplateFile(editor.getState());
		const parsed = editor.importTemplate(templateJson);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(serializeToMjml(editor.getState(), editor.registry)).toContain('Saved by host');
	});
});
