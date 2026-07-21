/**
 * CSS variable overrides applied to the editor root. Keys map to `--sme-<key>`,
 * e.g. `{ accent: '#7c3aed', 'panel-bg': '#fafafa' }`.
 */
/** Editor-only CSS token overrides; `{ accent: '#...' }` becomes `--sme-accent`. */
export type ThemeTokens = Record<string, string>;

/** Convert token values into the inline custom-property declaration used by MjmlEditor. */
export function themeStyle(tokens: ThemeTokens): string {
	return Object.entries(tokens)
		.map(([key, value]) => `--sme-${key}: ${value};`)
		.join(' ');
}
