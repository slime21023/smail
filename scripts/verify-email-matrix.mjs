/**
 * Provider-neutral release gate for Litmus, Email on Acid, or a self-hosted
 * inbox matrix. Pass the JSON result path as argv[2] or SMAIL_EMAIL_MATRIX_RESULTS.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? process.env.SMAIL_EMAIL_MATRIX_RESULTS;
if (!file) throw new Error('Provide an email matrix result JSON file.');
const result = JSON.parse(readFileSync(file, 'utf8'));
const templates = ['newsletter', 'promotion', 'transactional'];
const clients = ['gmail-web', 'apple-mail', 'ios-mail', 'android-gmail', 'outlook-web', 'outlook-windows'];
if (result.version !== 1 || !Array.isArray(result.results)) {
	throw new Error('Expected { version: 1, results: [...] }. See docs/email-rendering-matrix.md.');
}

const index = new Map(result.results.map((entry) => [`${entry.template}:${entry.client}`, entry]));
const failures = [];
for (const template of templates) {
	for (const client of clients) {
		const entry = index.get(`${template}:${client}`);
		if (!entry) failures.push(`${template} / ${client}: missing result`);
		else if (entry.status !== 'passed') failures.push(`${template} / ${client}: ${entry.status ?? 'unknown status'}`);
	}
}
if (failures.length) throw new Error(`Email rendering matrix failed:\n${failures.join('\n')}`);
console.log(`Email rendering matrix passed (${templates.length} templates × ${clients.length} clients).`);
