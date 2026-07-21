import { describe, expect, it } from 'vitest';
import {
	createBuiltinTemplate,
	createRegistry,
	defineBlock,
	parseTemplateFile,
	serializeTemplateFile,
	serializeToMjml
} from '../index.js';

describe('host integration fixture', () => {
	it('round-trips a database record with a registered host block', async () => {
		const receipt = defineBlock({
			type: 'receipt',
			label: 'Receipt',
			defaultProps: { message: 'Thank you' },
			inspector: [{ key: 'message', label: 'Message', control: 'text' }],
			toMjml: (props) => `<mj-text>${props.message}</mj-text>`
		});
		const registry = createRegistry([receipt]);
		const state = createBuiltinTemplate('transactional');
		state.body[0].columns[0].blocks.push({ id: 'receipt-1', type: 'receipt', props: { message: 'Saved by host' } } as never);

		// This Promise represents an async database adapter boundary.
		const database = new Map<string, string>();
		await Promise.resolve(database.set('template-42', serializeTemplateFile(state)));
		const parsed = parseTemplateFile(database.get('template-42')!, { registry });
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(serializeToMjml(parsed.value.state, registry)).toContain('Saved by host');
	});
});
