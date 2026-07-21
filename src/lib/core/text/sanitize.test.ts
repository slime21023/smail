import { describe, expect, it } from 'vitest';
import { sanitizeTextHtml } from './sanitize.js';

describe('sanitizeTextHtml', () => {
	it('keeps the supported email-rich-text subset', () => {
		const html = '<h1>Title</h1><p><b>Bold</b> <i>italic</i> <u>underlined</u></p><ul><li>One</li></ul><a href="https://example.com">Read</a>';
		expect(sanitizeTextHtml(html)).toBe('<h1>Title</h1><p><strong>Bold</strong> <em>italic</em> <u>underlined</u></p><ul><li>One</li></ul><a href="https://example.com">Read</a>');
	});

	it('removes unsafe tags, attributes, and URLs', () => {
		const html = '<p onclick="alert(1)" style="color:red">Safe<script>alert(1)</script></p><img src=x><a href="javascript:alert(1)">Bad</a>';
		const output = sanitizeTextHtml(html);
		expect(output).toBe('<p>Safe</p><a>Bad</a>');
	});

	it('keeps merge-field links and email-safe protocols', () => {
		const output = sanitizeTextHtml('<a href="{{profileUrl}}">Profile</a><a href="mailto:hi@example.com">Email</a><a href="tel:+886123">Call</a>');
		expect(output).toContain('href="{{profileUrl}}"');
		expect(output).toContain('href="mailto:hi@example.com"');
		expect(output).toContain('href="tel:+886123"');
	});
});
