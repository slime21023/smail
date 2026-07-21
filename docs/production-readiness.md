# 生產環境驗收

smail 目前為 alpha。以下 Gate 全數通過，且使用的是同一個待發布版本與同一份 custom-block registry 時，才可視為適合投入生產。

## 1. EDM 與收件端覆蓋

- 以 newsletter、promotion、transactional 三個內建範本，加上產品實際模板，驗證 Text、Image、Button、Divider、Spacer、Social、1–4 欄、UTM 與 merge field。
- 以[外部矩陣流程](./email-rendering-matrix.md)驗證 Gmail Web、Apple Mail、iOS Mail、Android Gmail、Outlook Web 與 Windows Outlook。
- 複雜 table、影片、AMP Email、任意 HTML/CSS 不屬第一方支援範圍；若以 custom block 實作，需由宿主自行納入矩陣驗證。

## 2. 宿主整合

- 驗證 Svelte 5 安裝、SSR import、受控 `state`、`onChange`、`readonly`、`onTemplateExport`、`onDeliveryExport`、圖片上傳與錯誤呈現。
- 對實際 custom block、custom control、`textEditor`、`parameters`、`paramDelimiters` 與 `structuralFields` 執行整合測試。
- custom block 的 `toMjml`、寄送端 merge-field substitution 與 provider callback 都是宿主可信程式碼；必須自行 escape、驗證 URL 與記錄錯誤。

## 3. 保存與復原

- 以 `.smail.json`（不是 HTML）作為可編輯來源；保存原始檔與 migration 後版本，讓 schema 升級可回退。
- 讀取時使用目前 registry 呼叫 `parseTemplateFile`，保留 warnings，失敗時不得替換畫面中的文件。
- 未受信任檔案預設限制 1 MiB UTF-8；僅在可信儲存策略已驗證容量與成本時提高 `maxBytes`。

## 4. 視覺與發版治理

- 驗證 `theme` CSS variables、窄版 Inspector、parameter picker、宿主容器尺寸與 starter templates 的品牌覆寫。
- 每次 PR 執行 `check`、`docs:check`、test、build/publint 與 browser E2E；發版前再執行外部 matrix gate。
- 本地自動測試與 `docs/matrix-example.json` 僅用來驗證流程格式，**不是** 真實郵件客戶端結果。發版須使用不可變的外部報告 URL 與實際 screenshot／link verdict。
