# Production readiness

smail is currently alpha. Treat a release as production-ready only when every gate below passes for the exact package version and custom-block registry being released.

## 1. Email coverage and clients

- Run the newsletter, promotion, and transactional starters plus product templates through the [external rendering matrix](./email-rendering-matrix.md).
- Cover Text, Image, Button, Divider, Spacer, Social, one-to-four columns, UTM, and merge fields.
- Complex tables, video, AMP Email, and arbitrary HTML/CSS are not first-party features. A custom block that adds them needs its own client-matrix evidence.

## 2. Host integration

- Verify Svelte 5 installation, SSR import, controlled `state`, `onChange`, `readonly`, `onTemplateExport`, `onDeliveryExport`, image upload, and visible import errors.
- Test the application's own blocks, controls, `textEditor`, parameters, delimiters, and structural fields.
- Treat custom `toMjml`, send-time merge values, and provider callbacks as trusted host code. Escape values, validate URLs, and record failures in the host application.

## 3. Persistence and rollback

- Store `.smail.json`, not HTML, as the editable source. Keep original and migrated versions to support rollback.
- Parse with the current registry, retain warnings, and never replace the active document after a failed parse.
- The untrusted import limit is 1 MiB UTF-8. Increase it only with an explicit trusted-storage, capacity, and denial-of-service policy.

## 4. Release governance

- Validate theme tokens, narrow Inspector layouts, parameter pickers, host container size, and branded starter templates.
- Run `check`, `docs:check`, tests, build/publint, and browser E2E for every pull request. Run the external matrix gate before publishing.
- Local automated tests and `docs/matrix-example.json` are synthetic workflow checks, **not** real email-client results. Releases require immutable external reports with real screenshot/link verdicts.
