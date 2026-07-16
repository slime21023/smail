/**
 * CSS variable overrides applied to the editor root. Keys map to `--sme-<key>`,
 * e.g. `{ accent: '#7c3aed', 'panel-bg': '#fafafa' }`.
 */
export type ThemeTokens = Record<string, string>;

export function themeStyle(tokens: ThemeTokens): string {
	return Object.entries(tokens)
		.map(([key, value]) => `--sme-${key}: ${value};`)
		.join(' ');
}
