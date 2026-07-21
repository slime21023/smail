import { createDefaultSettings, createDefaultTrackingSettings, SCHEMA_VERSION } from '../schema/defaults.js';
import type { Block, EditorState, TrackingSettings } from '../schema/types.js';
import type { BlockRegistry } from '../registry/registry.js';
import { normalizeColumnWidths } from '../schema/tree.js';
import { sanitizeTextHtml } from '../text/sanitize.js';

/** Magic value identifying a versioned, editable smail template file. */
export const TEMPLATE_FORMAT = 'smail-template' as const;
/** File-envelope version. Unknown future values are rejected without migration. */
export const TEMPLATE_FORMAT_VERSION = 1 as const;
/** Default import ceiling for untrusted JSON files (1 MiB UTF-8). */
export const DEFAULT_TEMPLATE_MAX_BYTES = 1024 * 1024;

/** Stable, file-oriented envelope for persisted editor documents. */
export interface TemplateFile {
	format: typeof TEMPLATE_FORMAT;
	formatVersion: typeof TEMPLATE_FORMAT_VERSION;
	state: EditorState;
}

/** A non-throwing import error or normalization warning, addressed by JSON path. */
export interface TemplateValidationIssue {
	path: string;
	message: string;
}

/** Result of parsing untrusted persistence data; callers must branch on `ok`. */
export type TemplateParseResult =
	| { ok: true; value: TemplateFile; migrated: boolean; warnings: TemplateValidationIssue[] }
	| { ok: false; errors: TemplateValidationIssue[] };

export interface ParseTemplateOptions {
	/** When supplied, imported blocks must be registered by this editor instance. */
	registry?: BlockRegistry;
	/** Reject string input larger than this UTF-8 byte count. Set a higher value only for trusted storage. */
	maxBytes?: number;
}

/** Clone state into the current persistence envelope without validating or migrating it. */
export function createTemplateFile(state: EditorState): TemplateFile {
	return {
		format: TEMPLATE_FORMAT,
		formatVersion: TEMPLATE_FORMAT_VERSION,
		state: structuredClone(state)
	};
}

/** Serialize a cloned current TemplateFile as formatted JSON for storage or download. */
export function serializeTemplateFile(state: EditorState): string {
	return JSON.stringify(createTemplateFile(state), null, 2);
}

/**
 * Upgrade a known legacy state without mutating it. Text content and column
 * widths are normalized. Throws for unsupported schema versions; use
 * `parseTemplateFile` for untrusted data and structured errors instead.
 */
export function migrateEditorState(state: EditorState): EditorState {
	return migrateState(state).state;
}

function migrateState(state: EditorState): { state: EditorState; warnings: TemplateValidationIssue[] } {
	if (state.version !== '0.1' && state.version !== '0.2' && state.version !== '0.3' && state.version !== '0.4' && state.version !== SCHEMA_VERSION) {
		throw new Error(`Unsupported editor schema version: ${state.version}`);
	}

	const copy = structuredClone(state) as EditorState;
	const sourceSettings = copy.settings as unknown as Record<string, unknown>;
	const defaults = createDefaultSettings();
	const migrated = {
		...copy,
		version: SCHEMA_VERSION,
		settings: {
			...defaults,
			...sourceSettings,
			tracking: migrateTracking(sourceSettings.tracking)
		} as EditorState['settings']
	};
	return { state: migrated, warnings: [...normalizeTextBlocks(migrated), ...normalizeColumnLayout(migrated)] };
}

/**
 * Parse, validate, and migrate a TemplateFile or legacy bare EditorState.
 * The input object is never changed. `registry` rejects unavailable custom
 * blocks, and malformed input is returned as errors rather than thrown.
 */
export function parseTemplateFile(input: string | unknown, options: ParseTemplateOptions = {}): TemplateParseResult {
	let value: unknown = input;
	if (typeof input === 'string') {
		const maxBytes = options.maxBytes ?? DEFAULT_TEMPLATE_MAX_BYTES;
		if (!Number.isFinite(maxBytes) || maxBytes < 1) return failure('$', 'maxBytes must be a positive number.');
		if (new TextEncoder().encode(input).byteLength > maxBytes) {
			return failure('$', `Template exceeds the ${maxBytes} byte import limit.`);
		}
		try {
			value = JSON.parse(input);
		} catch {
			return failure('$', 'Invalid JSON.');
		}
	}
	if (!isRecord(value)) return failure('$', 'Template must be a JSON object.');

	let rawState: unknown;
	let migrated = false;
	if ('format' in value || 'formatVersion' in value) {
		if (value.format !== TEMPLATE_FORMAT) {
			return failure('$.format', `Expected format "${TEMPLATE_FORMAT}".`);
		}
		if (value.formatVersion !== TEMPLATE_FORMAT_VERSION) {
			return failure('$.formatVersion', `Unsupported template format version: ${String(value.formatVersion)}.`);
		}
		rawState = value.state;
	} else {
		rawState = value;
		migrated = true;
	}

	const issues = validateRawState(rawState, options.registry);
	if (issues.length > 0) return { ok: false, errors: issues };
	const raw = rawState as EditorState;
	if (raw.version !== SCHEMA_VERSION) migrated = true;

	try {
		const result = migrateState(raw);
		return {
			ok: true,
			value: createTemplateFile(result.state),
			migrated: migrated || result.warnings.length > 0,
			warnings: result.warnings
		};
	} catch (error) {
		return failure('$.state.version', error instanceof Error ? error.message : 'Unsupported schema version.');
	}
}

function migrateTracking(value: unknown): TrackingSettings {
	const defaults = createDefaultTrackingSettings();
	if (!isRecord(value)) return defaults;
	const utm = isRecord(value.utm) ? value.utm : {};
	return {
		campaignId: typeof value.campaignId === 'string' ? value.campaignId : undefined,
		utm: {
			enabled: typeof utm.enabled === 'boolean' ? utm.enabled : defaults.utm.enabled,
			...stringFields(utm, ['source', 'medium', 'campaign', 'term', 'content'])
		}
	};
}

function validateRawState(value: unknown, registry?: BlockRegistry): TemplateValidationIssue[] {
	const issues: TemplateValidationIssue[] = [];
	if (!isRecord(value)) return [{ path: '$.state', message: 'Editor state must be an object.' }];
	if (value.version !== '0.1' && value.version !== '0.2' && value.version !== '0.3' && value.version !== '0.4' && value.version !== SCHEMA_VERSION) {
		issues.push({ path: '$.state.version', message: `Unsupported editor schema version: ${String(value.version)}.` });
	}
	if (!isRecord(value.settings)) issues.push({ path: '$.state.settings', message: 'Settings must be an object.' });
	else validateSettings(value.settings, issues);
	if (!Array.isArray(value.body)) {
		issues.push({ path: '$.state.body', message: 'Body must be an array of sections.' });
		return issues;
	}

	const ids = new Set<string>();
	value.body.forEach((section, index) => validateSection(section, `$.state.body[${index}]`, ids, registry, issues));
	return issues;
}

function validateSettings(settings: Record<string, unknown>, issues: TemplateValidationIssue[]) {
	for (const [key, expected] of [
		['width', 'number'],
		['backgroundColor', 'string'],
		['fontFamily', 'string'],
		['textColor', 'string'],
		['linkColor', 'string']
	] as const) {
		if (typeof settings[key] !== expected) issues.push({ path: `$.state.settings.${key}`, message: `Expected ${expected}.` });
	}
	if (settings.preheader !== undefined && typeof settings.preheader !== 'string') {
		issues.push({ path: '$.state.settings.preheader', message: 'Expected string.' });
	}
	if (settings.parameters !== undefined && !Array.isArray(settings.parameters)) {
		issues.push({ path: '$.state.settings.parameters', message: 'Expected an array.' });
	}
	for (const key of ['templateName', 'subject'] as const) {
		if (settings[key] !== undefined && typeof settings[key] !== 'string') {
			issues.push({ path: `$.state.settings.${key}`, message: 'Expected string.' });
		}
	}
	if (settings.tracking !== undefined) validateTracking(settings.tracking, issues);
}

function validateTracking(value: unknown, issues: TemplateValidationIssue[]) {
	if (!isRecord(value)) {
		issues.push({ path: '$.state.settings.tracking', message: 'Expected an object.' });
		return;
	}
	if (value.campaignId !== undefined && typeof value.campaignId !== 'string') {
		issues.push({ path: '$.state.settings.tracking.campaignId', message: 'Expected string.' });
	}
	if (!isRecord(value.utm) || typeof value.utm.enabled !== 'boolean') {
		issues.push({ path: '$.state.settings.tracking.utm', message: 'Expected UTM settings with boolean enabled.' });
	} else {
		for (const key of ['source', 'medium', 'campaign', 'term', 'content']) {
			if (value.utm[key] !== undefined && typeof value.utm[key] !== 'string') {
				issues.push({ path: `$.state.settings.tracking.utm.${key}`, message: 'Expected string.' });
			}
		}
	}
}

function validateSection(value: unknown, path: string, ids: Set<string>, registry: BlockRegistry | undefined, issues: TemplateValidationIssue[]) {
	if (!isRecord(value) || value.type !== 'section' || !isRecord(value.props) || !Array.isArray(value.columns) || value.columns.length === 0) {
		issues.push({ path, message: 'Expected a section with props and at least one column.' });
		return;
	}
	validateId(value.id, `${path}.id`, ids, issues);
	value.columns.forEach((column, index) => validateColumn(column, `${path}.columns[${index}]`, ids, registry, issues));
}

function validateColumn(value: unknown, path: string, ids: Set<string>, registry: BlockRegistry | undefined, issues: TemplateValidationIssue[]) {
	if (!isRecord(value) || value.type !== 'column' || !isRecord(value.props) || !Array.isArray(value.blocks)) {
		issues.push({ path, message: 'Expected a column with props and blocks.' });
		return;
	}
	validateId(value.id, `${path}.id`, ids, issues);
	value.blocks.forEach((block, index) => validateBlock(block, `${path}.blocks[${index}]`, ids, registry, issues));
}

function validateBlock(value: unknown, path: string, ids: Set<string>, registry: BlockRegistry | undefined, issues: TemplateValidationIssue[]) {
	if (!isRecord(value) || typeof value.type !== 'string' || !isRecord(value.props)) {
		issues.push({ path, message: 'Expected a block with type and props.' });
		return;
	}
	validateId(value.id, `${path}.id`, ids, issues);
	if (registry && !registry.has(value.type)) {
		issues.push({ path: `${path}.type`, message: `No registered block definition for "${value.type}".` });
	}
}

function validateId(value: unknown, path: string, ids: Set<string>, issues: TemplateValidationIssue[]) {
	if (typeof value !== 'string' || value.length === 0) issues.push({ path, message: 'Expected a non-empty id.' });
	else if (ids.has(value)) issues.push({ path, message: 'IDs must be unique.' });
	else ids.add(value);
}

function stringFields(value: Record<string, unknown>, keys: string[]): Record<string, string> {
	return Object.fromEntries(keys.filter((key) => typeof value[key] === 'string').map((key) => [key, value[key] as string]));
}

function normalizeTextBlocks(state: EditorState): TemplateValidationIssue[] {
	const warnings: TemplateValidationIssue[] = [];
	state.body.forEach((section, sectionIndex) => {
		section.columns.forEach((column, columnIndex) => {
			column.blocks.forEach((block, blockIndex) => {
				if (block.type !== 'text') return;
				const content = block.props.content;
				const sanitized = sanitizeTextHtml(content);
				if (content !== sanitized) {
					block.props.content = sanitized;
					warnings.push({
						path: `$.state.body[${sectionIndex}].columns[${columnIndex}].blocks[${blockIndex}].props.content`,
						message: 'Unsupported rich-text markup was removed.'
					});
				}
			});
		});
	});
	return warnings;
}

function normalizeColumnLayout(state: EditorState): TemplateValidationIssue[] {
	const warnings: TemplateValidationIssue[] = [];
	state.body.forEach((section, index) => {
		if (normalizeColumnWidths(section)) {
			warnings.push({ path: `$.state.body[${index}].columns`, message: 'Column widths were normalized to a 100% layout.' });
		}
	});
	return warnings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function failure(path: string, message: string): TemplateParseResult {
	return { ok: false, errors: [{ path, message }] };
}

// Keeps the block type import live in declaration output for consumers that
// build registry-aware import adapters around this module.
export type ImportedBlock = Block;
