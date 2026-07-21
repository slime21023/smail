/** Lightweight documentation contract check; intentionally has no npm dependency. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const markdownFiles = walk(root).filter((file) => extname(file) === '.md');
const failures = [];

for (const file of markdownFiles) {
	const content = readFileSync(file, 'utf8');
	for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
		const href = match[1].replace(/^<|>$/g, '');
		if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
		const path = href.split('#', 1)[0];
		if (!existsSync(resolve(dirname(file), path))) {
			failures.push(`${relative(file)}: broken relative link ${href}`);
		}
	}
	for (const match of content.matchAll(/\bbun run ([\w:-]+)/g)) {
		if (!(match[1] in packageJson.scripts)) {
			failures.push(`${relative(file)}: no package script named ${match[1]}`);
		}
	}
}

const publicApi = readFileSync(resolve(root, 'src/lib/index.ts'), 'utf8');
for (const name of [
	'MjmlEditor',
	'createBuiltinTemplate',
	'parseTemplateFile',
	'serializeTemplateFile',
	'exportEmail',
	'defineBlock',
	'sanitizeTextHtml',
	'sanitizeEmailUrl',
	'resolveColumnWidths',
	'setColumnWidth'
]) {
	if (!publicApi.includes(name)) failures.push(`src/lib/index.ts: missing documented public export ${name}`);
}

if (failures.length) throw new Error(`Documentation check failed:\n${failures.join('\n')}`);
console.log(`Documentation check passed (${markdownFiles.length} Markdown files).`);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (['node_modules', '.git', '.svelte-kit', 'dist'].includes(entry.name)) return [];
		const full = resolve(directory, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

function relative(file) {
	return file.slice(root.length + 1).split('\\').join('/');
}
