# smail — 開發規格文件

> 一個以 **zag.js + Svelte** 打造、以 **MJML** 為輸出引擎的開源 EDM 模板編輯函式庫。
> 目標：簡單易用、可嵌入、輸出跨 email client 相容的 HTML。

- **文件版本**：v0.1 (Draft)
- **狀態**：規格草案，待社群審閱
- **授權**：MIT
- **套件名稱（暫定）**：`smail`

---

## 1. 專案概述

### 1.1 目標

提供一個可嵌入任意 Svelte 應用的視覺化 EDM（電子報 / email）模板編輯器。使用者透過拖拽與屬性面板組合區塊，函式庫在瀏覽器端即時將編輯狀態編譯為跨 email client 相容的 HTML，無需後端。

### 1.2 設計原則

1. **JSON 為唯一真實來源**（single source of truth）：所有編輯狀態以 JSON schema 表示，MJML 與 HTML 皆為衍生產物，使用者不直接編輯 MJML。
2. **純前端優先**：預設以 `mjml-browser` 在 client 端編譯，零後端依賴。
3. **Headless 心態**：UI 行為交給 zag.js 狀態機，樣式可被使用者覆寫，不強加設計語言。
4. **受限佈局**：採「先選佈局、再填元件」模式，主動遵循 MJML 巢狀規則，換取可靠輸出與較低實作複雜度。
5. **漸進增強**：核心 MVP 可獨立運作，進階功能（自訂區塊、主題、i18n）以外掛方式擴充。

### 1.3 非目標（Out of Scope）

- 不做完全自由的畫布式拖拽（free-form canvas）。
- 不內建寄信功能（SMTP / ESP 整合由使用者自理）。
- 不提供後端持久化；儲存交由宿主應用處理。
- MVP 不支援 AMP for Email。

---

## 2. 技術棧

| 層級 | 技術 | 說明 |
|------|------|------|
| 框架 | Svelte 5（Runes） | 以 `$state` / `$derived` 管理響應式編輯狀態 |
| UI 元件 | zag.js（@zag-js/* 狀態機 + @zag-js/svelte adapter） | Headless NumberInput、Slider、Select、ColorPicker、RadioGroup、Editable 等 |
| 拖拽 | `svelte-dnd-action` | 同欄內區塊排序、佈局格填入 |
| 編譯引擎 | `mjml-browser` | 瀏覽器端 MJML → HTML |
| 打包 | Vite + SvelteKit（`svelte-package`） | 產出函式庫 dist |
| 樣式 | CSS 變數 + 可選 Tailwind preset | 預設無樣式類，開放主題覆寫 |
| 語言 | TypeScript | 完整型別定義 |

### 2.1 相依性策略

- `mjml-browser` 列為 **peerDependency**，避免版本鎖死並讓使用者控管 bundle。
- `@zag-js/*` 套件（統一版本，`~` 範圍鎖定 minor）列為 dependency。
- `svelte` 列為 peerDependency。

---

## 3. 系統架構

### 3.1 資料流

```
使用者操作 (zag.js / svelte-dnd-action)
        │
        ▼
編輯狀態 EditorState (JSON schema, $state)
        │
        ├──► serializeToMjml(state)  →  MJML 字串
        │           │
        │           ▼
        │     mjml2html() (mjml-browser)
        │           │
        │           ▼
        │     相容 Email HTML
        │           │
        │           ▼
        │     iframe srcdoc  →  即時預覽
        │
        └──► onChange(state)  →  宿主應用持久化
```

### 3.2 模組劃分

| 模組 | 職責 |
|------|------|
| `core/schema` | JSON schema 型別定義、驗證、預設值 |
| `core/serializer` | JSON → MJML 字串轉譯 |
| `core/compiler` | 封裝 `mjml-browser`，含錯誤處理與快取 |
| `core/registry` | 區塊型別註冊表（內建 + 自訂區塊） |
| `ui/canvas` | 編輯畫布，渲染區塊樹與拖拽目標 |
| `ui/inspector` | 屬性面板，依區塊型別動態渲染控制項 |
| `ui/toolbar` | 頂部工具列（匯出、預覽切換、復原 / 重做） |
| `ui/blocks` | 各區塊的編輯態渲染元件 |
| `store/history` | 復原 / 重做（undo/redo）狀態管理 |

---

## 4. 資料模型（JSON Schema）

### 4.1 頂層結構

```typescript
interface EditorState {
  version: string;            // schema 版本，用於未來遷移
  settings: DocumentSettings; // 全域樣式與 email 屬性
  body: Section[];            // 頂層只能是 Section 陣列（對應 mj-section）
}

interface DocumentSettings {
  width: number;              // email 寬度，預設 600
  backgroundColor: string;    // mj-body background-color
  fontFamily: string;         // 全域預設字體
  textColor: string;
  linkColor: string;
  preheader?: string;         // 預覽文字
}
```

### 4.2 區塊層級（對應 MJML 巢狀規則）

MJML 的合法巢狀為 `mj-body > mj-section > mj-column > 元件`。schema 嚴格對應此階層：

```typescript
interface Section {
  id: string;
  type: 'section';
  props: SectionProps;        // padding、backgroundColor、backgroundUrl…
  columns: Column[];
}

interface Column {
  id: string;
  type: 'column';
  props: ColumnProps;         // width、verticalAlign、backgroundColor…
  blocks: Block[];            // 只能放葉節點元件
}

type Block =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock;
```

### 4.3 葉節點區塊範例

```typescript
interface TextBlock {
  id: string;
  type: 'text';
  props: {
    content: string;          // 允許有限 inline HTML
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    align: 'left' | 'center' | 'right';
    color: string;
    lineHeight: number;
    padding: Padding;
  };
}

interface ButtonBlock {
  id: string;
  type: 'button';
  props: {
    text: string;
    href: string;
    backgroundColor: string;
    color: string;
    borderRadius: number;
    align: 'left' | 'center' | 'right';
    padding: Padding;
    innerPadding: Padding;
  };
}

type Padding = { top: number; right: number; bottom: number; left: number };
```

### 4.4 區塊 ↔ MJML 標籤對應表

| Schema type | MJML 標籤 | 巢狀位置 |
|------|------|------|
| `section` | `<mj-section>` | `mj-body` 內 |
| `column` | `<mj-column>` | `mj-section` 內 |
| `text` | `<mj-text>` | `mj-column` 內 |
| `image` | `<mj-image>` | `mj-column` 內 |
| `button` | `<mj-button>` | `mj-column` 內 |
| `divider` | `<mj-divider>` | `mj-column` 內 |
| `spacer` | `<mj-spacer>` | `mj-column` 內 |
| `social` | `<mj-social>` + `<mj-social-element>` | `mj-column` 內 |

---

## 5. 序列化：JSON → MJML

### 5.1 契約

```typescript
function serializeToMjml(state: EditorState): string;
```

- 純函式，無副作用，輸出可重現（deterministic）。
- 每個區塊型別由其 registry 項目提供 `toMjml(props)` 方法，序列化器遞迴組合。
- 全域 `settings` 對應 `<mj-attributes>` 與 `<mj-body>` 屬性，避免逐區塊重複樣式。

### 5.2 範例輸出

輸入一個「雙欄、左文字右圖片」的狀態，序列化結果概念如下：

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text color="#333333" line-height="1.5" />
    </mj-attributes>
    <mj-preview>本週電子報</mj-preview>
  </mj-head>
  <mj-body background-color="#f4f4f4" width="600px">
    <mj-section padding="20px 0">
      <mj-column width="50%">
        <mj-text font-size="16px">左欄文字</mj-text>
      </mj-column>
      <mj-column width="50%">
        <mj-image src="https://…" alt="示意圖" />
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

---

## 6. 編譯：MJML → HTML

### 6.1 契約

```typescript
interface CompileResult {
  html: string;
  errors: MjmlError[];        // MJML 驗證錯誤（非致命）
}

function compile(mjml: string): CompileResult;
```

### 6.2 實作要點

- 封裝 `mjml-browser` 的 `mjml2html`，設定 `validationLevel: 'soft'`，讓錯誤以警告回傳而非中斷。
- 加入 **debounce + 快取**：對相同 MJML 字串不重複編譯（以字串 hash 為 key）。
- 編譯在 `$derived` 或 `$effect` 中觸發，輸入變動 → 重新編譯 → 更新預覽 iframe 的 `srcdoc`。

### 6.3 ⚠️ 關鍵風險：mjml-browser 在 Vite 的打包

這是全專案**最高不確定性**項目，須在開發第一週以 spike 驗證：

- `mjml-browser` 體積較大，需確認可正常 tree-shake / bundle。
- 可能需在 Vite `optimizeDeps` 或 `ssr.noExternal` 做設定調整。
- 若在 SvelteKit SSR 環境，須確保編譯僅在 client 執行（`browser` guard 或動態 import）。
- **驗收標準**：最小範例能在瀏覽器成功呼叫 `mjml2html` 並得到 HTML，bundle 建置無錯誤。

---

## 7. UI 元件規格

### 7.1 佈局

三欄式標準編輯器佈局：

```
┌─────────────────────────────────────────────┐
│  Toolbar（匯出 / 預覽切換 / undo / redo）      │
├──────────┬────────────────────┬──────────────┤
│ 區塊面板  │   Canvas 編輯畫布    │  Inspector   │
│（可拖入） │  （區塊樹 + 拖拽目標）│（屬性面板）   │
└──────────┴────────────────────┴──────────────┘
```

### 7.2 Canvas（編輯畫布）

- 渲染 `body` 的 section → column → block 樹。
- 每個 column 是一個 `svelte-dnd-action` 的可放置區（dropzone）。
- 拖拽規則由 registry 的巢狀約束強制：葉節點只能落入 column，section 只能落入 body。
- 點選區塊 → 高亮並將該區塊 props 載入 Inspector。

### 7.3 Inspector（屬性面板）

- 依當前選中區塊的 `type`，從 registry 讀取其欄位定義，動態渲染控制項（zag.js 狀態機驅動）。
- 控制項對應：
  - 數值（padding、fontSize）→ slider / number（@zag-js/slider、@zag-js/number-input）
  - 顏色 → color（@zag-js/color-picker）
  - 列舉（align、fontWeight）→ select / segment（@zag-js/select、@zag-js/radio-group）
  - 文字 → textarea（text block 允許有限 inline HTML）
- 控制系統開放：`InspectorField.component` 或編輯器 `controls` prop 可註冊自訂控制項；
  `options` 支援 `{label, value}`；`format`/`parse` 對應儲存值與控制值的轉換。
- 每次變更即時寫回 `EditorState`，觸發重新序列化與編譯。

### 7.4 Toolbar

- 匯出 HTML（下載或觸發 `onExport` callback）。
- 匯出 JSON（供宿主保存）。
- 桌機 / 行動裝置預覽切換（切換 iframe 寬度）。
- Undo / Redo。

### 7.5 主題與樣式

- 所有元件樣式以 CSS 變數暴露（如 `--sme-color-accent`、`--sme-panel-bg`），使用者可覆寫。
- 提供一組預設淺色主題；深色主題為 v1.1 目標。

---

## 8. 公開 API

### 8.1 主要元件

```svelte
<script>
  import { MjmlEditor } from 'svelte-mjml-editor';

  let state = $state(initialState);
</script>

<MjmlEditor
  bind:state
  onChange={(s) => save(s)}
  onExport={(html, json) => download(html)}
  blocks={customBlocks}
  theme={myTheme}
/>
```

### 8.2 Props

| Prop | 型別 | 必填 | 說明 |
|------|------|:---:|------|
| `state` | `EditorState` | 是 | 可雙向綁定的編輯狀態 |
| `onChange` | `(state) => void` | 否 | 狀態變更回呼 |
| `onExport` | `(html, json) => void` | 否 | 匯出時回呼 |
| `blocks` | `BlockDefinition[]` | 否 | 自訂區塊註冊 |
| `theme` | `ThemeTokens` | 否 | 覆寫 CSS 變數 |
| `readonly` | `boolean` | 否 | 唯讀預覽模式 |

### 8.3 具名匯出

```typescript
export { MjmlEditor };
export { serializeToMjml, compile };       // 供無 UI 場景使用
export { defineBlock, createEmptyState };   // 工具函式
export type { EditorState, Block, BlockDefinition, ThemeTokens };
```

### 8.4 自訂區塊 API

```typescript
const priceTag = defineBlock({
  type: 'priceTag',
  label: '價格標籤',
  defaultProps: { amount: 0, currency: 'TWD' },
  inspector: [
    { key: 'amount', control: 'number', label: '金額' },
    { key: 'currency', control: 'select', options: ['TWD', 'USD'] },
  ],
  toMjml: (props) => `<mj-text>${props.currency} ${props.amount}</mj-text>`,
  render: PriceTagPreview,   // 編輯態預覽 Svelte 元件
});
```

---

## 9. 開發里程碑

| 階段 | 內容 | 驗收標準 |
|------|------|------|
| **M0 Spike** | `mjml-browser` + Vite/SvelteKit 打包驗證 | 瀏覽器成功編譯出 HTML，建置無誤 |
| **M1 Core** | schema、serializer、compiler、registry | 給定 JSON 可產出正確 MJML 與 HTML（單元測試） |
| **M2 UI 骨架** | 三欄佈局、canvas 渲染、iframe 預覽 | 靜態 JSON 可視覺化呈現並即時預覽 |
| **M3 互動** | Inspector 屬性編輯、svelte-dnd-action 拖拽 | 六種內建區塊可拖入、排序、編輯屬性 |
| **M4 完善** | undo/redo、匯出、主題、TypeScript 型別 | 完整 API、發布 npm alpha |
| **M5 zag 重構 + 彈性** | 移除 Ark UI 改用 @zag-js/* 直接開發；開放控制系統；結構編輯（多欄、增刪欄、複製/移動）；slider/連動 padding/inline 編輯 | 零 @ark-ui 依賴；tree 操作單元測試；e2e 覆蓋結構編輯與 inline 編輯 |
| **M6 開源** | 文件、範例、CI、貢獻指南 | README、demo 站、測試覆蓋率門檻 |

---

## 10. 測試策略

- **單元測試**：`serializeToMjml` 對各區塊型別的輸出快照（snapshot）；`compile` 的錯誤處理。
- **相容性測試**：對代表性模板輸出，人工於 Litmus / Email on Acid 或 client 抽樣檢查（列入 CI 之外的發布前檢查清單）。
- **元件測試**：控制項淺層 smoke（Vitest + happy-dom；zag 互動深度交給 e2e）；tree 結構操作純函式測試。
- **視覺回歸**：demo 模板的預覽截圖比對（可選）。

---

## 11. 風險登記表

| 風險 | 等級 | 緩解措施 |
|------|:---:|------|
| `mjml-browser` 在 Vite/SvelteKit 打包失敗或體積過大 | **高** | M0 優先 spike；必要時提供後端編譯 fallback 作為第二方案 |
| 拖拽自由度與 MJML 巢狀規則衝突 | 中 | 受限佈局模式，registry 強制巢狀約束 |
| 屬性面板隨區塊增加而膨脹 | 中 | 屬性定義資料驅動，控制暴露欄位範圍 |
| zag.js minor 版本有 breaking change | 中 | 全部 @zag-js/* 鎖同一版本（`~` 範圍），升級時整批同步 |
| Email client 相容仍有 MJML 未覆蓋的邊界 | 低 | 依賴 MJML 社群成熟度，記錄已知限制 |

---

## 12. 未決事項（Open Questions）

1. 是否在 v1 就提供後端編譯 fallback，或純前端為唯一路徑？
2. Text block 允許的 inline HTML 範圍與消毒（sanitize）策略？
3. 是否支援模板變數 / 合併欄位（如 `{{firstName}}`）？建議列為 v1.1。
4. 國際化（i18n）UI 文案的注入機制。
5. 狀態 schema 版本遷移策略（未來破壞性變更如何處理）。

---

*本文件為草案，歡迎於 issue 討論後修訂。*
