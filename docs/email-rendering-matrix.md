# External email rendering matrix

`bun run generate:matrix` writes HTML, `.smail.json`, and a manifest for the newsletter, promotion, and transactional starters into `email-matrix-artifacts/`. Upload the HTML files to Litmus, Email on Acid, or a self-hosted inbox/screenshot service.

## Result contract

Convert the external verdicts to the provider-neutral shape below, then run `bun run verify:matrix -- results.json`:

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

Every `newsletter`, `promotion`, and `transactional` result requires `passed` entries for `gmail-web`, `apple-mail`, `ios-mail`, `android-gmail`, `outlook-web`, and `outlook-windows`. A missing result, visual regression, broken link, or non-`passed` status fails verification.

`docs/matrix-example.json` is a synthetic verifier example and must not be used as release evidence. The GitHub Actions workflow accepts a pre-signed results URL. Keep vendor tokens, report URLs, and inbox credentials in CI secrets; never store them in template JSON.
