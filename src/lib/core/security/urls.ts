/**
 * URLs accepted by built-in email blocks. Custom blocks are trusted host code
 * and must enforce their own URL policy before returning MJML.
 */
export type EmailUrlKind = 'link' | 'image';

const PARAMETER_URL = /\{\{[A-Za-z][A-Za-z0-9_.-]*\}\}/;
const IMAGE_DATA_URL = /^data:image\/(?:png|gif|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i;

/**
 * Return an allowed built-in email URL or undefined. This does not validate
 * values substituted into merge fields later; sending applications must do so.
 */
export function sanitizeEmailUrl(value: string | undefined, kind: EmailUrlKind): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	// Send-time merge values are controlled by the host. Accept placeholders in
	// an otherwise safe URL but never let them conceal a dangerous scheme.
	const withoutParameters = trimmed.replace(PARAMETER_URL, 'value');
	if (/^(?:https?:|mailto:|tel:)/i.test(withoutParameters)) return trimmed;
	if (kind === 'image' && IMAGE_DATA_URL.test(trimmed)) return trimmed;
	return undefined;
}
