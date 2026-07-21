# 外部郵件呈現矩陣

`bun run generate:matrix` 會在 `email-matrix-artifacts/` 產生 newsletter、promotion、transactional 的 HTML、`.smail.json` 與 manifest。將 HTML 上傳至 Litmus、Email on Acid 或自建收件匣／截圖服務。

## 結果契約

外部流程完成後，將其 verdict 轉為下列 provider-neutral JSON，並執行 `bun run verify:matrix -- results.json`：

```json
{
  "version": 1,
  "results": [
    {
      "template": "newsletter",
      "client": "gmail-web",
      "status": "passed",
      "reportUrl": "https://vendor.example/report/immutable-id"
    }
  ]
}
```

每個 `newsletter`、`promotion`、`transactional` 都必須具備 `gmail-web`、`apple-mail`、`ios-mail`、`android-gmail`、`outlook-web`、`outlook-windows` 六筆 `passed` 結果。缺少結果、視覺回歸、壞連結或非 `passed` status 都會使驗證失敗。

`docs/matrix-example.json` 只是 verifier 的合成範例，不能當成發布證明。GitHub Actions workflow 接收 pre-signed results URL；vendor token、報告 URL 與收件匣憑證必須存於 CI secrets，不可寫入模板 JSON。
