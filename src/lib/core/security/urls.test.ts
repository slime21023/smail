import { describe, expect, it } from 'vitest';
import { sanitizeEmailUrl } from './urls.js';

describe('sanitizeEmailUrl', () => {
	it('keeps safe absolute links and parameterized paths', () => {
		expect(sanitizeEmailUrl('https://example.test/orders/{{orderId}}', 'link')).toBe(
			'https://example.test/orders/{{orderId}}'
		);
		expect(sanitizeEmailUrl('mailto:hello@example.test', 'link')).toBe('mailto:hello@example.test');
		expect(sanitizeEmailUrl('tel:+886212345678', 'link')).toBe('tel:+886212345678');
	});

	it('rejects dangerous and unsupported URL schemes', () => {
		expect(sanitizeEmailUrl('javascript:alert(1)', 'link')).toBeUndefined();
		expect(sanitizeEmailUrl('data:text/html;base64,PHNjcmlwdD4=', 'link')).toBeUndefined();
		expect(sanitizeEmailUrl('//cdn.example.test/a.png', 'image')).toBeUndefined();
	});

	it('allows only raster base64 image data URLs for images', () => {
		expect(sanitizeEmailUrl('data:image/png;base64,aGVsbG8=', 'image')).toBe(
			'data:image/png;base64,aGVsbG8='
		);
		expect(sanitizeEmailUrl('data:image/svg+xml;base64,PHN2Zz4=', 'image')).toBeUndefined();
	});
});
