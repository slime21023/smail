# Changelog

## Unreleased

- Add production readiness gates, external email rendering-matrix fixtures, and three editable starter templates.
- Add built-in URL scheme filtering for image, button, and social links.
- Add a default 1 MiB untrusted template-import limit (`ParseTemplateOptions.maxBytes`).

## Versioning policy

- Public APIs follow semantic versioning after the first stable release.
- Template file migrations are backward compatible within a major release; unknown future schema or file versions are rejected without mutating the active document.
- Hosts should preserve the original `.smail.json` alongside migrated output to enable rollback.
