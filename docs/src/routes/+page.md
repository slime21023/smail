---
title: smail
description: Embeddable, visual email template editing for Svelte.
tagline: Create visual email templates, keep them editable as JSON, and export responsive MJML and HTML.
sidebar: false
actions:
  - label: Get started
    to: ./guides/getting-started/
    type: primary
  - label: API reference
    to: ./reference/api/
    type: flat
features:
  - title: Visual email editing
    description: Build responsive marketing, transactional, and newsletter email layouts with safe built-in blocks.
  - title: Portable template files
    description: Import, export, validate, and migrate versioned .smail.json files without coupling to a storage service.
  - title: Extensible by design
    description: Add trusted custom blocks, Inspector controls, rich-text editors, parameters, themes, and delivery behavior.
---

## Developer documentation

smail is an embeddable Svelte email-template editor. `EditorState` is the editable source of truth; MJML, HTML, previews, and optional UTM link decoration are derived at export time.

| Area | Start here |
| --- | --- |
| Embed the editor | <Link to="/guides/getting-started/" label="Getting started" /> |
| Control an editing session | <Link to="/guides/editor-controller/" label="Editor controller" /> |
| Import and export templates | <Link to="/guides/persistence-and-delivery/" label="Template files and export" /> |
| Extend the UI and blocks | <Link to="/guides/customization/" label="Customization" /> |
| Review every public export | <Link to="/reference/api/" label="API reference" /> |

The current documentation covers the `0.5` editor-state schema and `smail-template` file format version `1`.

## Advanced operations

For release and real-client email validation, see <Link to="/operations/production-readiness/" label="Production readiness" /> and the <Link to="/operations/email-rendering-matrix/" label="email rendering matrix" />. These guides are optional for embedding and using smail.
