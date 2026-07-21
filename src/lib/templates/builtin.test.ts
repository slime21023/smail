import { describe, expect, it } from 'vitest';
import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
import { parseTemplateFile, serializeTemplateFile } from '../core/template/template.js';
import { BUILTIN_TEMPLATE_IDS, createBuiltinTemplate } from './builtin.js';

describe('built-in templates', () => {
	it.each(BUILTIN_TEMPLATE_IDS)('is editable, versioned, and serializable: %s', (id) => {
		const state = createBuiltinTemplate(id);
		const parsed = parseTemplateFile(serializeTemplateFile(state));
		expect(parsed.ok).toBe(true);
		const mjml = serializeToMjml(state);
		expect(mjml).toContain('<mjml>');
		expect(mjml).toContain('<mj-social');
	});

	it('returns fresh state for every embed', () => {
		const first = createBuiltinTemplate('promotion');
		const second = createBuiltinTemplate('promotion');
		first.settings.subject = 'Changed';
		expect(second.settings.subject).toBe('An offer for {{firstName}}');
	});
});
