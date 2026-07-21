# smail 技術規格

> 維護者參考文件。使用者與整合入口請見 [README](./README.md)；發布驗收請見 [生產環境驗收](./docs/production-readiness.md)。

- 套件：`smail`
- 現行 state schema：`0.5`
- template file format：`smail-template` / `formatVersion: 1`
- 執行環境：Svelte 5、瀏覽器端 MJML 編譯；套件根目錄可安全於 SSR import。

## 架構與資料流

`EditorState` 是唯一真實來源。`MjmlEditor` 依 state 與 registry 產生 MJML，非同步編譯為 HTML 後顯示 iframe preview；所有 UI 編輯寫回同一棵 state。宿主透過 `onChange` 保存 state，或以 headless API 保存／載入／輸出。

```text
EditorState → serializeToMjml → compile → HTML preview / exportEmail
     │              │
     └─ TemplateFile JSON ─ parseTemplateFile + migration + validation
```

編譯器以 dynamic import 載入 `mjml-browser`，避免 SSR import 時讀取 `window`；呼叫 `compile()` 或 `exportEmail()` 時則需要 browser-like DOM。相同 MJML 結果會快取，快取上限為 100 筆。

## State 與持久化

```ts
interface EditorState {
  version: '0.5';
  settings: DocumentSettings;
  body: Section[];
}

interface TemplateFile {
  format: 'smail-template';
  formatVersion: 1;
  state: EditorState;
}
```

`DocumentSettings` 包含模板名稱、主旨、preheader、全域字型／色彩／寬度、tracking 與可保存的 `parameters`。tracking 僅含 campaign ID 和選用 UTM defaults；寄件者、收件者、provider 設定與憑證不屬模板資料。

樹狀規則為 `body → section → column → block`。內建 block 為 `text`、`image`、`button`、`divider`、`spacer`、`social`；section 至少一欄，最多四欄。`width` 以 `%` 字串保存，`resolveColumnWidths()` 會將空值、legacy 值與非法值解析為 5% 步進、總和 100%、每欄至少 10% 的配置。serializer 與 Canvas 都使用解析後結果。

### 匯入與 migration

`parseTemplateFile(input, { registry, maxBytes })` 接受版本化 TemplateFile 或 legacy bare `EditorState`。它不 mutate input；成功時回傳新的 `TemplateFile`、`migrated` 和 warnings，失敗時回傳 errors。支援 0.1–0.5 state；未知未來 template 或 schema 版本、重複 id、非法樹、缺少 custom block、壞 JSON 都被拒絕。

migration 會補齊 settings、移除舊 SES metadata、sanitize 內建 Text HTML、正規化欄寬。字串匯入預設上限 `DEFAULT_TEMPLATE_MAX_BYTES`（1 MiB UTF-8）；僅可信資料來源可提高 `maxBytes`。

## 編輯器與擴充契約

`MjmlEditor` 是受控 Svelte component，必要 prop 為 `state`；支援 `bind:state`。重要 props：

| Prop | 行為 |
|---|---|
| `onChange` | 使用者修改後收到 state。 |
| `onExport` | 相容舊版的 `(html, bareStateJson)` callback。 |
| `onTemplateExport` | 收到 `TemplateFile`，宿主可自行持久化。 |
| `onDeliveryExport` | 收到 `exportEmail()` 的 delivery 結果。 |
| `blocks` / `controls` | 註冊 custom block 與 Inspector control。 |
| `textEditor` | 僅取代 Inspector Text content editor。 |
| `parameters` / `paramDelimiters` | 合併欄位宣告與 placeholder delimiters。宿主參數唯讀且優先。 |
| `onImageUpload` | 回傳已代管的 image URL，啟用 Image Upload UI。 |
| `theme` / `readonly` | CSS token 覆寫與不可編輯預覽。 |

`defineBlock()` 接收 `{ type, label, defaultProps, inspector, toMjml, render? }`。`toMjml` 必須純粹且 deterministic，但其內容是宿主可信程式碼；smail 只對內建 block 套用 URL／內容限制，不能替 custom MJML escape 使用者輸入或保證 email client 相容性。

Inspector control 接收 `ControlProps`：`field`、`value`、`setValue`。`TextEditorProps` 另提供 `disabled`、合併後的 `parameters`、`delimiters` 與 `createParameter()`；傳入 HTML 的 `setValue()` 在保存前會 sanitize。

## 文字、參數與安全性

Text 使用受限 WYSIWYG，內建工具列支援段落、h1–h3、粗體、斜體、底線、連結、清單與 parameter picker。允許標籤為 `p`、`br`、`h1`–`h6`、`strong`、`em`、`u`、`a`、`ul`、`ol`、`li`；允許的 a `href` 為 HTTP(S)、`mailto:`、`tel:` 或符合 delimiter 的 placeholder。sanitizer 在編輯、canvas render、migration 與 MJML 輸出前都會執行。

`settings.parameters` 保存終端使用者建立的 `{ key, label?, sample? }`。`parameters` prop 由宿主提供且不可由使用者覆寫；`mergeParams()` 使 prop entries 依 key 優先。Sample preview 只做前端顯示替換，輸出的 HTML 保留 placeholder。寄送端對替換值、URL 與收件者資料負完全責任。

內建 Image、Button、Social 使用 `sanitizeEmailUrl()`：link 只允許 HTTP(S)、`mailto:`、`tel:` 與安全 placeholder URL；image 額外允許 PNG/JPEG/GIF/WebP base64 data URL。`javascript:`、protocol-relative URL、SVG data URL 與未支援 scheme 會被省略。

## 匯出與追蹤

`serializeToMjml(state, registry?)` 是不 mutate state 的 pure serializer。`exportEmail(state, overrides?)` 依 registry 產生 `{ html, mjml, subject, preheader }`；send-time subject 與 tracking override 優先於模板預設。UTM 啟用時，`rewriteLinksForUtm()` 僅在編譯後 HTML 的絕對 HTTP(S) URL 加入缺少的 UTM 值，不改 state、MJML、preview、既有 query 或含 placeholder 的 URL。

套件不寄信、不插入開信像素、不設定 SES 或其他 provider。這些均屬宿主寄送服務與 configuration set 的職責。

## 內建範本與樣式

`createBuiltinTemplate('newsletter' | 'promotion' | 'transactional')` 會建立 fresh state，內含可編輯內容、subject、preheader、sample parameters、品牌預設與 footer。不得快取後共用同一 instance。

所有 editor chrome 使用 `--sme-*` CSS variables。`theme` prop 的 `{ accent: '#...' }` 會映射為 `--sme-accent`；宿主也可用 CSS 覆寫。窄版需驗證 rich-text parameter picker 與 Inspector 不被容器截斷。

## 品質與發布

| 命令 | 用途 |
|---|---|
| `bun run check` | Svelte 與 TypeScript 診斷。 |
| `bun run docs:check` | Markdown 相對連結、文件命令與核心公開 API 契約。 |
| `bun run test` | unit、component、template migration、host integration。 |
| `bun run build` | library build、`svelte-package` 與 publint。 |
| `bun run e2e` | 瀏覽器中的 editor 操作 smoke。 |
| `bun run generate:matrix` | 產生供外部 email rendering vendor 使用的 HTML。 |
| `bun run verify:matrix -- results.json` | 驗證外部矩陣結果契約。 |

CI 執行 check、docs check、test、build 與 E2E。真實 Gmail／Apple Mail／Outlook 結果不由本地自動化產生；發版前必須依 [email rendering matrix](./docs/email-rendering-matrix.md) 使用外部服務的不可變報告結果。
