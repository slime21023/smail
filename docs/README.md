# smail documentation

This documentation describes the current `0.5` editor-state schema and `smail-template` file format version `1`.

| Guide | Use it for |
|---|---|
| [Getting started](./getting-started.md) | Installing smail, embedding the editor, callbacks, SSR, starter templates, themes, and readonly previews. |
| [Persistence and delivery](./persistence-and-delivery.md) | Saving `.smail.json`, migrations, validation errors, database adapters, HTML export, UTM behavior, and send-time ownership. |
| [Customization](./customization.md) | Custom blocks, Inspector controls, text editors, merge fields, image uploads, and structural fields. |
| [API reference](./api-reference.md) | All public exports, signatures, mutation behavior, and runtime requirements. |
| [Architecture](./architecture.md) | State model, rendering pipeline, sanitization, width normalization, security model, and release checks. |
| [Production readiness](./production-readiness.md) | Release gates and host integration checks. |
| [External rendering matrix](./email-rendering-matrix.md) | Real email-client validation and its provider-neutral result format. |

The repository-level [_spec.md](../_spec.md) remains as a compatibility entrypoint and links to the architecture guide.
