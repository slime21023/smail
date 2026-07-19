import { describe, expect, it } from 'vitest';
import { createBlock, createEmptyState, createSection } from '../schema/defaults.js';
import { serializeToMjml } from '../serializer/serializeToMjml.js';
import { DEFAULT_DELIMITERS, extractParams, mergeParams, substituteParams } from './params.js';

describe('extractParams', () => {
	it('returns unique keys in first-occurrence order', () => {
		expect(extractParams('Hi {{first}}, {{last}} — bye {{first}}')).toEqual(['first', 'last']);
	});

	it('tolerates whitespace inside delimiters', () => {
		expect(extractParams('{{ firstName }} and {{lastName}}')).toEqual(['firstName', 'lastName']);
	});

	it('rejects keys with spaces and allows dots/dashes/underscores', () => {
		expect(extractParams('{{not a key}} {{user.name}} {{a-b}} {{a_b}}')).toEqual([
			'user.name',
			'a-b',
			'a_b'
		]);
	});

	it('supports custom and regex-hostile delimiters', () => {
		expect(extractParams('Hello ${name}!', { open: '${', close: '}' })).toEqual(['name']);
		expect(extractParams('Hello [[name]]!', { open: '[[', close: ']]' })).toEqual(['name']);
	});

	it('finds nothing in plain text', () => {
		expect(extractParams('no params here')).toEqual([]);
	});
});

describe('substituteParams', () => {
	it('replaces known keys and leaves unknown placeholders intact', () => {
		expect(substituteParams('Hi {{a}}, {{b}}!', { a: 'X' })).toBe('Hi X, {{b}}!');
	});

	it('is identity for an empty values object', () => {
		const src = 'Hi {{a}}!';
		expect(substituteParams(src, {})).toBe(src);
	});

	it('substitutes whitespace-padded placeholders and empty-string values', () => {
		expect(substituteParams('-{{ a }}-', { a: '' })).toBe('--');
	});

	it('works with custom delimiters', () => {
		expect(substituteParams('Hi ${name}!', { name: 'Ada' }, { open: '${', close: '}' })).toBe(
			'Hi Ada!'
		);
	});
});

describe('mergeParams', () => {
	it('prop entries win by key; doc-only entries appended after', () => {
		const doc = [
			{ key: 'a', sample: 'doc-a' },
			{ key: 'b', sample: 'doc-b' }
		];
		const prop = [{ key: 'a', sample: 'prop-a' }];
		expect(mergeParams(doc, prop)).toEqual([
			{ key: 'a', sample: 'prop-a' },
			{ key: 'b', sample: 'doc-b' }
		]);
	});

	it('handles undefined on either side', () => {
		expect(mergeParams(undefined, undefined)).toEqual([]);
		expect(mergeParams([{ key: 'a' }], undefined)).toEqual([{ key: 'a' }]);
		expect(mergeParams(undefined, [{ key: 'a' }])).toEqual([{ key: 'a' }]);
	});
});

describe('settings.parameters serialization inertness', () => {
	it('does not change MJML output', () => {
		const make = () => {
			const state = createEmptyState();
			const section = createSection(1);
			const text = createBlock('text');
			text.props.content = 'Hi {{firstName}}';
			section.columns[0].blocks.push(text);
			state.body = [section];
			return state;
		};
		const bare = make();
		const declared = make();
		declared.settings.parameters = [{ key: 'firstName', sample: 'Alice' }];
		expect(serializeToMjml(declared)).toBe(serializeToMjml(bare));
		expect(serializeToMjml(declared)).toContain('Hi {{firstName}}');
	});
});

describe('DEFAULT_DELIMITERS', () => {
	it('is the {{ }} pair', () => {
		expect(DEFAULT_DELIMITERS).toEqual({ open: '{{', close: '}}' });
	});
});
