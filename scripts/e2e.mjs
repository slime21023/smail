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

	// 2. Ark UI inspector edit reflects into the preview
	await page.click('.sme-canvas [aria-label="button"]');
	const labelInput = page.locator('.sme-inspector .sme-field', { hasText: 'Label' }).locator('input');
	await labelInput.fill('EDITED LIVE');
	await previewContains('EDITED LIVE');

	// 3. Ark UI number input stepper (font size on the first text block)
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
			const labels = [...(col?.querySelectorAll('[aria-label]') ?? [])].map((n) =>
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

	// 6. Mobile preview toggle
	await page.click('.sme-toolbar button:has-text("Mobile")');
	await page.waitForFunction(
		() => document.querySelector('.sme-preview-frame')?.style.width === '375px',
		{ timeout: 5000 }
	);

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
					[...cols.querySelectorAll('.sme-blocks [aria-label]')].map((n) =>
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
