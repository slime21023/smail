/**
 * E2E smoke drive for the smail demo. Requires a Chromium-family browser:
 * uses the Edge channel by default (preinstalled on Windows); set
 * SMAIL_E2E_CHANNEL=chrome or SMAIL_E2E_EXECUTABLE=<path> to override.
 *
 * Usage: bun run e2e   (spawns `bun run dev` itself on port 5173)
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = 'http://localhost:5173';
const SHOT_DIR = new URL('../e2e-artifacts/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(SHOT_DIR, { recursive: true });

async function waitForServer(timeoutMs = 30000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(BASE);
			if (res.ok) return;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error('dev server did not come up on :5173');
}

const dev = spawn('bun', ['run', 'dev'], { stdio: 'ignore', shell: true });
let browser;
try {
	await waitForServer();

	browser = await chromium.launch({
		channel: process.env.SMAIL_E2E_EXECUTABLE ? undefined : (process.env.SMAIL_E2E_CHANNEL ?? 'msedge'),
		executablePath: process.env.SMAIL_E2E_EXECUTABLE,
		headless: true
	});
	const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();

	const errors = [];
	page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
	page.on('pageerror', (err) => errors.push(String(err)));

	page.setDefaultTimeout(15000);

	const previewContains = (needle) =>
		page.waitForFunction(
			(text) => document.querySelector('.sme-preview-frame')?.getAttribute('srcdoc')?.includes(text),
			needle,
			{ timeout: 20000 }
		);

	// 1. Initial render: canvas + compiled preview
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.waitForSelector('.sme-canvas [aria-label="button"]', { timeout: 20000 });
	await previewContains('<!doctype html>');
	await page.screenshot({ path: `${SHOT_DIR}/1-initial.png` });

	// 2. Inspector edit reflects into the preview
	await page.click('.sme-canvas [aria-label="button"]');
	const labelInput = page.locator('.sme-inspector .sme-field', { hasText: 'Label' }).locator('input');
	await labelInput.fill('EDITED LIVE');
	await previewContains('EDITED LIVE');

	// 3. zag number input stepper (font size on the first text block)
	await page.click('.sme-canvas [aria-label="text"]');
	const sizeField = page.locator('.sme-inspector .sme-field', { hasText: 'Font size' });
	await sizeField.locator('button:has-text("▲")').click();
	await previewContains('font-size:19px');

	// 4. Drag the button block above the text block (same column)
	const dragFrom = page.locator('.sme-canvas [aria-label="button"]').first();
	const dropAt = page.locator('.sme-canvas [aria-label="text"]').nth(1);
	const fromBox = await dragFrom.boundingBox();
	const toBox = await dropAt.boundingBox();
	await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
	await page.mouse.down();
	await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + 4, { steps: 12 });
	await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + 2, { steps: 4 });
	await page.waitForTimeout(250); // let dnd settle before releasing
	await page.mouse.up();
	await page.waitForTimeout(250);
	await page.waitForFunction(
		() => {
			const col = document.querySelectorAll('.sme-columns')[1]?.querySelector('.sme-blocks');
			const labels = [...(col?.querySelectorAll('.sme-block') ?? [])].map((n) =>
				n.getAttribute('aria-label')
			);
			return labels[0] === 'button' && labels[1] === 'text';
		},
		{ timeout: 10000 }
	);
	await page.screenshot({ path: `${SHOT_DIR}/2-dragged.png` });

	// 5. Drag a Divider from the palette into the second column
	const paletteDivider = page.locator('.sme-palette-item:has-text("Divider")');
	const targetColumn = page.locator('.sme-columns').nth(1).locator('.sme-blocks').nth(1);
	const pBox = await paletteDivider.boundingBox();
	const cBox = await targetColumn.boundingBox();
	await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
	await page.mouse.down();
	await page.mouse.move(cBox.x + cBox.width / 2, cBox.y + cBox.height / 2, { steps: 15 });
	await page.waitForTimeout(250);
	await page.mouse.up();
	await page.waitForTimeout(250);
	await page.waitForFunction(
		() =>
			document.querySelectorAll('.sme-columns')[1]?.querySelectorAll('[aria-label="divider"]')
				.length >= 1,
		{ timeout: 10000 }
	);
	await page.screenshot({ path: `${SHOT_DIR}/3-palette-drop.png` });

	// 6. Undo removes the dropped divider, redo restores it
	const dividerCount = () =>
		page.evaluate(
			() =>
				document.querySelectorAll('.sme-columns')[1]?.querySelectorAll('[aria-label="divider"]')
					.length ?? 0
		);
	const undoButton = page.locator('.sme-toolbar [aria-label="Undo"]');
	await page.waitForFunction(
		() => !document.querySelector('.sme-toolbar [aria-label="Undo"]')?.disabled,
		{ timeout: 10000 }
	);
	await page.waitForTimeout(400); // let the post-drop history capture settle
	await undoButton.click();
	await page.waitForFunction(
		() =>
			(document.querySelectorAll('.sme-columns')[1]?.querySelectorAll('[aria-label="divider"]')
				.length ?? 0) === 0,
		{ timeout: 10000 }
	);
	await page.click('.sme-toolbar [aria-label="Redo"]');
	await page.waitForFunction(
		() =>
			(document.querySelectorAll('.sme-columns')[1]?.querySelectorAll('[aria-label="divider"]')
				.length ?? 0) === 1,
		{ timeout: 10000 }
	);
	console.log('undo/redo ok, divider count:', await dividerCount());

	// 7. Custom block (priceTag) renders in canvas and compiles into the preview
	await page.click('.sme-canvas [aria-label="divider"]'); // select in column 2
	await page.click('.sme-palette-item:has-text("Price tag")');
	await page.waitForSelector('.sme-canvas [aria-label="priceTag"]', { timeout: 10000 });
	await previewContains('TWD 4,900');
	await page.screenshot({ path: `${SHOT_DIR}/4-custom-block.png` });

	// 8. Mobile preview toggle
	await page.click('.sme-toolbar button:has-text("Mobile")');
	await page.waitForFunction(
		() => document.querySelector('.sme-preview-frame')?.style.width === '375px',
		{ timeout: 5000 }
	);

	// 9. Structure editing (M5c): add a 2-column section
	const columnCounts = () =>
		page.evaluate(() =>
			[...document.querySelectorAll('.sme-canvas .sme-section')].map(
				(s) => s.querySelectorAll('.sme-column').length
			)
		);
	const initialCounts = await columnCounts();
	await page.click('.sme-add-section-row button[aria-label="Add section with 2 columns"]');
	await page.waitForFunction(
		(n) => document.querySelectorAll('.sme-canvas .sme-section').length === n + 1,
		initialCounts.length
	);
	let counts = await columnCounts();
	if (counts[counts.length - 1] !== 2)
		throw new Error(`expected a trailing 2-column section, got [${counts}]`);

	// 10. Add + remove a column via the Inspector (new nodes are auto-selected)
	const lastSectionColumns = () =>
		page.evaluate(
			() =>
				[...document.querySelectorAll('.sme-canvas .sme-section')].pop()?.querySelectorAll(
					'.sme-column'
				).length
		);
	await page.click('.sme-inspector button:has-text("+ Add column")');
	await page.waitForFunction(
		() =>
			[...document.querySelectorAll('.sme-canvas .sme-section')].pop()?.querySelectorAll(
				'.sme-column'
			).length === 3,
		{ timeout: 5000 }
	);
	await page.click('.sme-inspector button:has-text("Remove column")');
	await page.waitForFunction(
		() =>
			[...document.querySelectorAll('.sme-canvas .sme-section')].pop()?.querySelectorAll(
				'.sme-column'
			).length === 2,
		{ timeout: 5000 }
	);
	console.log('column add/remove ok, last section columns:', await lastSectionColumns());

	// 11. Duplicate the first section from its hover toolbar
	const sectionsBeforeDup = (await columnCounts()).length;
	await page.hover('.sme-canvas .sme-section');
	await page.click('.sme-canvas .sme-section [aria-label="Duplicate section"]');
	await page.waitForFunction(
		(n) => document.querySelectorAll('.sme-canvas .sme-section').length === n + 1,
		sectionsBeforeDup
	);

	// 12. Move the trailing 2-column section up one slot
	const beforeMove = await columnCounts();
	const lastIndex = beforeMove.length;
	await page.hover(`.sme-canvas .sme-section:nth-child(${lastIndex})`);
	await page.click(
		`.sme-canvas .sme-section:nth-child(${lastIndex}) [aria-label="Move section up"]`
	);
	const expected = [...beforeMove];
	[expected[lastIndex - 2], expected[lastIndex - 1]] = [
		expected[lastIndex - 1],
		expected[lastIndex - 2]
	];
	await page.waitForFunction(
		(want) => {
			const got = [...document.querySelectorAll('.sme-canvas .sme-section')].map(
				(s) => s.querySelectorAll('.sme-column').length
			);
			return JSON.stringify(got) === JSON.stringify(want);
		},
		expected,
		{ timeout: 5000 }
	);
	console.log('section duplicate/move ok, column layout:', JSON.stringify(expected));

	// 13. Duplicate a block from its hover button
	const blocksBefore = await page.evaluate(
		() => document.querySelectorAll('.sme-canvas .sme-block').length
	);
	const firstText = page.locator('.sme-canvas [aria-label="text"]').first();
	await firstText.hover();
	await firstText.locator('[aria-label="Duplicate block"]').click();
	await page.waitForFunction(
		(n) => document.querySelectorAll('.sme-canvas .sme-block').length === n + 1,
		blocksBefore
	);
	await page.screenshot({ path: `${SHOT_DIR}/5-structure.png` });

	// 14. Inline edit (M5d): dblclick the button label, type, commit, undo
	const inlineButton = page.locator('.sme-canvas [aria-label="button"]').first();
	await inlineButton.click(); // select → arms the editable machine
	await inlineButton.locator('[data-part="preview"]').dblclick();
	const inlineInput = inlineButton.locator('[data-part="input"]');
	await inlineInput.fill('INLINE EDITED');
	await inlineInput.press('Enter');
	await previewContains('INLINE EDITED');
	await page.waitForTimeout(400); // let the history capture settle
	await page.click('.sme-toolbar [aria-label="Undo"]');
	await page.waitForFunction(
		() =>
			!document
				.querySelector('.sme-preview-frame')
				?.getAttribute('srcdoc')
				?.includes('INLINE EDITED'),
		{ timeout: 10000 }
	);
	console.log('inline edit + undo ok');
	await page.screenshot({ path: `${SHOT_DIR}/6-inline-edit.png` });

	// 15. Social links editing (M6a): edit an href, add a github row
	await page.click('.sme-canvas [aria-label="social"]');
	const firstHref = page.locator('.sme-inspector .sme-social-row input[type="text"]').first();
	await firstHref.fill('https://fb.example/test');
	await previewContains('https://fb.example/test');
	await page.click('.sme-inspector .sme-social-add');
	await page
		.locator('.sme-inspector .sme-social-row select')
		.last()
		.selectOption('github');
	// compiled HTML carries the network's icon image, not the mjml name attr
	await previewContains('github.png');
	console.log('social links editing ok');

	// 16. Template parameters (M6b): sample-data toggle + undeclared warning
	await previewContains('Hi {{firstName}}');
	const sampleToggle = page.locator('.sme-toolbar button:has-text("Sample")');
	await sampleToggle.click();
	await previewContains('Hi Alice,');
	await sampleToggle.click();
	await previewContains('Hi {{firstName}}');
	await page.click('.sme-canvas [aria-label="text"]');
	const contentField = page
		.locator('.sme-inspector .sme-field', { hasText: 'Content' })
		.locator('textarea');
	await contentField.fill('Hello {{bogusVar}}!');
	await page.waitForFunction(
		() =>
			document.querySelector('.sme-preview-warnings')?.textContent?.includes('bogusVar') ?? false,
		{ timeout: 10000 }
	);
	console.log('template params ok');

	// 17. Image upload hook (M6c): pick a file, demo hook resolves a data URI
	await page.click('.sme-canvas [aria-label="image"]');
	await page.waitForSelector('.sme-inspector .sme-upload-btn', { timeout: 5000 });
	await page.setInputFiles('.sme-inspector .sme-upload-input', {
		name: 'pixel.gif',
		mimeType: 'image/gif',
		buffer: Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64')
	});
	await previewContains('data:image/gif');
	console.log('image upload hook ok');

	// 18. Rich text (M6d): bold everything, then insert a parameter
	const richBlock = page.locator('.sme-canvas [aria-label="text"]').first();
	await richBlock.click(); // select → arms editing
	await richBlock.dblclick();
	const richedit = page.locator('.sme-text-richedit');
	await richedit.waitFor({ timeout: 5000 });
	await page.keyboard.press('Control+a');
	await page.click('.sme-richtext-toolbar [aria-label="Bold"]');
	await page.mouse.click(20, 400); // canvas background: blur + commit + deselect
	await page.waitForFunction(
		() => {
			const doc = document.querySelector('.sme-preview-frame')?.getAttribute('srcdoc') ?? '';
			return doc.includes('<b>') || doc.includes('<strong>');
		},
		{ timeout: 20000 }
	);

	await richBlock.click();
	await richBlock.dblclick();
	await richedit.waitFor({ timeout: 5000 });
	await page.keyboard.press('Control+End');
	// fire mousedown so the toolbar saves the selection before the select takes focus
	await page.locator('.sme-rt-params').dispatchEvent('mousedown');
	await page.locator('.sme-rt-params').selectOption('firstName');
	await page.mouse.click(20, 400);
	await previewContains('{{firstName}}');
	await page.locator('.sme-toolbar button:has-text("Sample")').click();
	await previewContains('Alice');
	console.log('rich text ok');
	await page.screenshot({ path: `${SHOT_DIR}/7-rich-text.png` });

	console.log('console errors:', errors.length ? errors : 'none');
	if (errors.length) process.exit(1);
	console.log('E2E OK — screenshots in e2e-artifacts/');
} catch (err) {
	const page = browser ? (await browser.contexts())[0]?.pages()[0] : undefined;
	if (page) {
		await page.screenshot({ path: `${SHOT_DIR}/failure.png` }).catch(() => {});
		const blockOrder = await page
			.evaluate(() =>
				[...document.querySelectorAll('.sme-columns')].map((cols) =>
					[...cols.querySelectorAll('.sme-blocks .sme-block')].map((n) =>
						n.getAttribute('aria-label')
					)
				)
			)
			.catch(() => 'n/a');
		console.error('block order at failure:', JSON.stringify(blockOrder));
	}
	throw err;
} finally {
	await browser?.close();
	if (process.platform === 'win32') {
		// bun run dev spawns a child vite process; kill the tree
		spawn('taskkill', ['/pid', String(dev.pid), '/T', '/F'], { stdio: 'ignore', shell: true });
	} else {
		dev.kill('SIGTERM');
	}
}
