import sanitizeHtml from 'sanitize-html';

/**
 * The deliberately small HTML subset emitted by the built-in text editor.
 * It is safe to call in browsers and headless/server environments.
 */
export function sanitizeTextHtml(value: string): string {
	return sanitizeHtml(value, {
		allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
		allowedAttributes: { a: ['href'] },
		allowedSchemes: ['http', 'https', 'mailto', 'tel'],
		allowProtocolRelative: false,
		disallowedTagsMode: 'discard',
		transformTags: {
			b: 'strong',
			i: 'em',
			div: 'p'
		}
	});
}
