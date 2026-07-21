# smail

> 可嵌入 Svelte 應用的 EDM 模板編輯器：以 JSON 保存，以 MJML 產生 email HTML。

smail 提供視覺化編輯器與可在無 UI 情境使用的 API。編輯狀態 `EditorState` 是唯一資料來源；MJML、HTML、Sample preview 與 UTM 連結皆為衍生結果。套件目前為 alpha，正式發布前請完成[生產驗收](./docs/production-readiness.md)與[真實郵件客戶端矩陣](./docs/email-rendering-matrix.md)。

## 安裝與嵌入

```sh
npm i smail mjml-browser
```

`svelte >= 5` 與 `mjml-browser 4.x` 為 peer dependency。請使用 `mjml-browser` 4.x；5.x 的 browser bundle 會讓 Vite bundling 失敗。

```svelte
<script lang="ts">
	import { MjmlEditor, createBuiltinTemplate } from 'smail';

	let state = $state(createBuiltinTemplate('newsletter'));

	function save(nextState) {
		// 將版本化 JSON 存至你的 API、資料庫或 object storage。
	}
</script>

<div style="height: 100vh">
	<MjmlEditor bind:state onChange={save} />
</div>
```

`state` 是受控且可雙向綁定的值。`onChange` 會在使用者修改後觸發；不要直接把 HTML 當成可編輯來源。

## 範本保存、載入與寄送輸出

使用版本化 `.smail.json` 保存可再次編輯的內容。`parseTemplateFile` 會驗證樹狀結構、遷移 0.1–0.5 state、正規化 Text HTML 與欄寬，並在失敗時回傳結構化錯誤而不修改目前文件。

```ts
import {
	createRegistry,
	parseTemplateFile,
	serializeTemplateFile,
	exportEmail
} from 'smail';

// 寫入資料庫。
const serialized = serializeTemplateFile(state);
await database.templates.save({ id: templateId, document: serialized });

// 讀回並以同一份 custom-block registry 驗證。
const record = await database.templates.find(templateId);
const loaded = parseTemplateFile(record.document, { registry: createRegistry(customBlocks) });
if (!loaded.ok) throw new Error(loaded.errors.map((issue) => issue.message).join('\n'));
state = loaded.value.state;

// 寄送端才決定收件者與 provider；此函式庫不寄送郵件。
const email = await exportEmail(state, {
	subject: '寄送端可覆寫主旨',
	tracking: { utm: { enabled: true, source: 'newsletter', campaign: 'launch' } }
});
await provider.send({ subject: email.subject, html: email.html });
```

未受信任的字串匯入預設上限為 1 MiB UTF-8，可透過 `parseTemplateFile(input, { maxBytes })` 調整。`MjmlEditor` 的 Import template／Export template 按鈕可直接操作檔案；提供 `onTemplateExport(file)` 時，宿主可接管儲存，不會下載檔案。

`exportEmail()` 回傳 `{ html, mjml, subject, preheader }`。啟用 UTM 時只改寫最終 HTML 的絕對 HTTP(S) 連結，保留既有 query、`mailto:`、`tel:`、fragment 與含 merge field 的 URL。SES、追蹤像素與 provider 設定均屬寄送端責任。

## 內建範本、區塊與版面

`createBuiltinTemplate('newsletter' | 'promotion' | 'transactional')` 每次都回傳獨立 state，可直接套用品牌字型、色彩與 custom blocks。

內建 block 為 Text、Image、Button、Divider、Spacer、Social；section 支援 1–4 欄。欄寬固定以 5% 步進保存並解析為總和 100%，每欄至少 10%；調整一欄會依既有比例重新分配其他欄，Canvas 與 MJML 使用同一結果。

```ts
import { createBuiltinTemplate, resolveColumnWidths, setColumnWidth } from 'smail';

const state = createBuiltinTemplate('promotion');
const section = state.body[0];
setColumnWidth(section, section.columns[0].id, 60);
console.log(resolveColumnWidths(section.columns));
```

## 開發者擴充

### Custom blocks

```ts
import { defineBlock } from 'smail';

const escapeXml = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const notice = defineBlock({
	type: 'notice',
	label: 'Notice',
	defaultProps: { message: 'Important update' },
	inspector: [{ key: 'message', label: 'Message', control: 'text' }],
	toMjml: (props) => `<mj-text font-weight="bold">${escapeXml(props.message)}</mj-text>`
});
```

以 `<MjmlEditor bind:state blocks={[notice]} />` 註冊。`toMjml` 是宿主提供的可信程式碼：smail 無法驗證其輸出，整合方必須自行 escape 使用者輸入、驗證 URL，並測試其在真實郵件客戶端的呈現。

### Inspector controls 與文字編輯器

```svelte
<script lang="ts">
	import { MjmlEditor, type TextEditorProps } from 'smail';
	import MyTextEditor from './MyTextEditor.svelte';
	import SwatchControl from './SwatchControl.svelte';

	let textEditor: typeof MyTextEditor = MyTextEditor;
</script>

<MjmlEditor
	bind:state
	{textEditor}
	controls={{ swatch: SwatchControl }}
	structuralFields={{ /* 可覆寫 document、section、column 欄位 */ }}
/>
```

自訂 control 接收 `ControlProps`：`{ field, value, setValue }`。`TextEditorProps` 為 `{ value, setValue, disabled, parameters, delimiters, createParameter }`；自訂 editor 僅取代右側 Inspector 的內容區，smail 仍管理字型、顏色與間距。所有 `setValue(html)` 均會經過相同 sanitizer。

### 參數與圖片上傳

```svelte
<MjmlEditor
	bind:state
	parameters={[{ key: 'firstName', label: '名字', sample: '小明' }]}
	onImageUpload={async (file) => uploadToCdn(file)}
	theme={{ accent: '#7c3aed', 'panel-bg': '#fafafa' }}
/>
```

Text 工具列可搜尋、插入或立即建立 `{{parameter}}`。宿主以 `parameters` 提供的項目為唯讀；使用者新增的項目存入 `state.settings.parameters`。Sample preview 僅替換預覽，匯出 HTML 仍保留 placeholder，寄送端必須驗證並安全替換其值。

`theme` 的 key 會轉為 `--sme-<key>` CSS variable；亦可用宿主 CSS 覆寫。`readonly` 會隱藏編輯面板與匯入操作，保留預覽及匯出。

## 安全性與支援邊界

- Text 僅保留 `p`、`br`、`h1`–`h6`、`strong`、`em`、`u`、`a`、`ul`、`ol`、`li`；style、script、事件屬性、圖片與不支援標籤都會移除。
- 內建 Image、Button、Social 僅接受 HTTP(S)、`mailto:`、`tel:`、安全的 merge-field URL；Image 可接受 PNG/JPEG/GIF/WebP 的 base64 data URL。寄送端替換 merge field 後仍須重新驗證 URL。
- 支援 browser 內 MJML 編譯與 SSR-safe import；只有呼叫 `compile()`／`exportEmail()` 時需要 browser-like DOM。
- 不支援任意 HTML/CSS、複雜 table layout、影片嵌入、AMP Email、寄信、追蹤像素或 email-provider 設定。

## 驗證與開發

```sh
bun install
bun run dev
bun run check
bun run docs:check
bun run test
bun run build
bun run e2e
bun run generate:matrix
bun run verify:matrix -- results.json
```

本地 check、unit/component test、build、publint 與瀏覽器 E2E 只能驗證函式庫行為；它們不等於 Gmail、Apple Mail 或 Outlook 實測。正式發版前必須上傳 `generate:matrix` 產生的 HTML 至 Litmus、Email on Acid 或自建收件匣矩陣，再以外部結果執行 matrix gate。

## 授權

MIT
