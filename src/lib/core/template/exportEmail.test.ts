import { describe, expect, it } from 'vitest';
import { createBlock, createEmptyState, createSection } from '../schema/defaults.js';
import { exportEmail, mergeTracking, rewriteLinksForUtm } from './exportEmail.js';

describe('email exports', () => {
	it('does not alter HTML while UTM tracking is disabled', () => {
		const html = '<a href="https://example.com/a">Go</a>';
		expect(rewriteLinksForUtm(html, { enabled: false, source: 'newsletter' })).toBe(html);
	});

	it('adds only missing UTM values to absolute links', () => {
		const html = [
			'<a href="https://example.com/a?utm_source=existing">One</a>',
			'<a href="mailto:hi@example.com">Two</a>',
			'<a href="{{dynamicUrl}}">Three</a>'
		].join('');
		const output = rewriteLinksForUtm(html, {
			enabled: true,
			source: 'newsletter',
			medium: 'email',
			campaign: 'july'
		});
		expect(output).toContain('utm_source=existing');
		expect(output).toContain('utm_medium=email');
		expect(output).toContain('utm_campaign=july');
		expect(output).toContain('mailto:hi@example.com');
		expect(output).toContain('{{dynamicUrl}}');
	});

	it('merges send-time tracking defaults and exports message metadata', async () => {
		const state = createEmptyState();
		state.settings.subject = 'Template subject';
		state.settings.tracking.campaignId = 'template-campaign';
		const section = createSection();
		section.columns[0].blocks.push(createBlock('button'));
		state.body = [section];

		const merged = mergeTracking(state.settings.tracking, { campaignId: 'send-campaign', utm: { enabled: true, source: 'newsletter' } });
		expect(merged).toMatchObject({
			campaignId: 'send-campaign',
			utm: { enabled: true, source: 'newsletter' }
		});

		const output = await exportEmail(state, { subject: 'Send subject' });
		expect(output.subject).toBe('Send subject');
		expect(output).not.toHaveProperty('ses');
	});
});
