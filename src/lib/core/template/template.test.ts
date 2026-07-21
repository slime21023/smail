import { describe, expect, it } from 'vitest';
import { createRegistry } from '../registry/registry.js';
import { createEmptyState, createSection } from '../schema/defaults.js';
import {
	createTemplateFile,
	parseTemplateFile,
	serializeTemplateFile,
	DEFAULT_TEMPLATE_MAX_BYTES,
	TEMPLATE_FORMAT,
	TEMPLATE_FORMAT_VERSION
} from './template.js';

describe('template files', () => {
	it('round-trips the versioned persistence envelope', () => {
		const state = createEmptyState();
		state.settings.templateName = 'July newsletter';
		const parsed = parseTemplateFile(serializeTemplateFile(state));
		expect(parsed).toEqual({ ok: true, migrated: false, warnings: [], value: createTemplateFile(state) });
	});

	it('migrates a legacy bare 0.1 editor state', () => {
		const legacy = createEmptyState();
		legacy.version = '0.1';
		delete (legacy.settings as Partial<typeof legacy.settings>).templateName;
		delete (legacy.settings as Partial<typeof legacy.settings>).subject;
		delete (legacy.settings as Partial<typeof legacy.settings>).tracking;

		const parsed = parseTemplateFile(JSON.stringify(legacy));
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.migrated).toBe(true);
		expect(parsed.value.state.version).toBe('0.5');
		expect(parsed.value.state.settings.templateName).toBe('Untitled template');
		expect(parsed.value.state.settings.tracking.utm.enabled).toBe(false);
	});

	it('removes SES fields while migrating 0.2 templates', () => {
		const previous = createEmptyState();
		previous.version = '0.2';
		(previous.settings.tracking as unknown as Record<string, unknown>).ses = {
			configurationSetName: 'old-set',
			messageTags: { campaign: 'old' }
		};
		const parsed = parseTemplateFile(previous);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.value.state.version).toBe('0.5');
		expect(parsed.value.state.settings.tracking).not.toHaveProperty('ses');
	});

	it('normalizes unsupported text HTML and reports a warning', () => {
		const state = createEmptyState();
		const section = createSection();
		section.columns[0].blocks.push({
			id: 'text',
			type: 'text',
			props: { content: '<p onclick="bad()">Hello<script>bad()</script></p>' }
		} as never);
		state.body = [section];
		const parsed = parseTemplateFile(state);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.migrated).toBe(true);
		expect(parsed.warnings).toHaveLength(2);
		expect((parsed.value.state.body[0].columns[0].blocks[0] as never as { props: { content: string } }).props.content).toBe('<p>Hello</p>');
	});

	it('rejects invalid JSON, unknown format versions, and malformed trees', () => {
		expect(parseTemplateFile('{')).toMatchObject({ ok: false });
		expect(
			parseTemplateFile({ format: TEMPLATE_FORMAT, formatVersion: TEMPLATE_FORMAT_VERSION + 1, state: {} })
		).toMatchObject({ ok: false });
		const malformed = createEmptyState();
		malformed.body = [{ id: 's', type: 'section', props: { padding: { top: 0, right: 0, bottom: 0, left: 0 } }, columns: [] }];
		expect(parseTemplateFile(malformed)).toMatchObject({ ok: false });
		const invalidTracking = createEmptyState();
		invalidTracking.settings.tracking.utm.enabled = 'yes' as never;
		expect(parseTemplateFile(invalidTracking)).toMatchObject({ ok: false });
	});

	it('rejects oversized untrusted files before parsing', () => {
		expect(parseTemplateFile(' '.repeat(DEFAULT_TEMPLATE_MAX_BYTES + 1))).toMatchObject({
			ok: false,
			errors: [{ message: expect.stringContaining('import limit') }]
		});
	});

	it('uses the importing editor registry to reject unknown custom blocks', () => {
		const state = createEmptyState();
		const section = createSection();
		section.columns[0].blocks.push({ id: 'custom', type: 'notice', props: {} } as never);
		state.body = [section];
		const parsed = parseTemplateFile(state, { registry: createRegistry() });
		expect(parsed).toMatchObject({ ok: false });
		if (!parsed.ok) expect(parsed.errors[0].message).toContain('notice');
	});
});
