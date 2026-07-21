/** Generate production email HTML for an external rendering-matrix vendor. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Window } from 'happy-dom';

const output = resolve(process.argv[2] ?? 'email-matrix-artifacts');
const window = new Window();
Object.assign(globalThis, {
	window,
	document: window.document,
	navigator: window.navigator,
	DOMParser: window.DOMParser,
	XMLSerializer: window.XMLSerializer
});

const { BUILTIN_TEMPLATE_IDS, createBuiltinTemplate, exportEmail, serializeTemplateFile } = await import('../src/lib/index.ts');
mkdirSync(output, { recursive: true });

const manifest = { version: 1, templates: [] };
for (const id of BUILTIN_TEMPLATE_IDS) {
	const state = createBuiltinTemplate(id);
	const email = await exportEmail(state);
	writeFileSync(resolve(output, `${id}.html`), email.html);
	writeFileSync(resolve(output, `${id}.smail.json`), serializeTemplateFile(state));
	manifest.templates.push({ id, subject: email.subject, html: `${id}.html` });
}
writeFileSync(resolve(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.templates.length} rendering fixtures in ${output}`);
