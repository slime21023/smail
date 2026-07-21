import { compile } from '../compiler/compile.js';
import { defaultRegistry, type BlockRegistry } from '../registry/registry.js';
import type { EditorState, TrackingSettings, UTMTrackingSettings } from '../schema/types.js';
import { serializeToMjml } from '../serializer/serializeToMjml.js';

/** Provider-neutral output ready for a sending application. No recipients or provider credentials are included. */
export interface EmailExport {
	html: string;
	mjml: string;
	subject: string;
	preheader?: string;
}

/** Per-send values that take precedence over reusable template defaults. */
export interface EmailExportOverrides {
	subject?: string;
	tracking?: Partial<TrackingSettings> & {
		utm?: Partial<UTMTrackingSettings>;
	};
	registry?: BlockRegistry;
}

/**
 * Compile a deliverable email with provider-neutral subject and tracking defaults.
 * Does not mutate state, send mail, insert pixels, or configure a provider.
 */
export async function exportEmail(state: EditorState, overrides: EmailExportOverrides = {}): Promise<EmailExport> {
	const mjml = serializeToMjml(state, overrides.registry ?? defaultRegistry);
	const result = await compile(mjml);
	const tracking = mergeTracking(state.settings.tracking, overrides.tracking);
	return {
		html: rewriteLinksForUtm(result.html, tracking.utm),
		mjml,
		subject: overrides.subject ?? state.settings.subject,
		preheader: state.settings.preheader
	};
}

/** Merge template defaults with send-time values without mutating either input. */
export function mergeTracking(defaults: TrackingSettings, overrides?: EmailExportOverrides['tracking']): TrackingSettings {
	return {
		...defaults,
		...overrides,
		utm: { ...defaults.utm, ...overrides?.utm }
	};
}

/**
 * Add only missing UTM values to absolute HTTP(S) links in compiled HTML.
 * Placeholder, relative, fragment, mailto, and tel URLs are intentionally untouched.
 */
export function rewriteLinksForUtm(html: string, utm: UTMTrackingSettings): string {
	if (!utm.enabled || typeof DOMParser === 'undefined') return html;
	const values: Record<string, string | undefined> = {
		utm_source: utm.source,
		utm_medium: utm.medium,
		utm_campaign: utm.campaign,
		utm_term: utm.term,
		utm_content: utm.content
	};
	if (!Object.values(values).some((value) => value)) return html;

	const document = new DOMParser().parseFromString(html, 'text/html');
	for (const anchor of document.querySelectorAll('a[href]')) {
		const href = anchor.getAttribute('href');
		if (!href || /{{|}}/.test(href)) continue;
		try {
			const url = new URL(href);
			if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
			for (const [key, value] of Object.entries(values)) {
				if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
			}
			anchor.setAttribute('href', url.toString());
		} catch {
			// Relative and non-URL links are intentionally left untouched.
		}
	}
	return `<!doctype html>\n${document.documentElement.outerHTML}`;
}
