---
title: Publishing
description: Attach the packaged library to a GitHub Release.
sidebarTitle: Publishing
order: 3
---

The release workflow attaches an npm tarball and its SHA-256 checksum to a GitHub Release. The package name remains `smail`.

## Release procedure

1. Update `package.json` with the intended semantic version and update `CHANGELOG.md`.
2. Run the local release checks:

   ```sh
   bun run check
   bun run docs:check
   bun run test
   bun run build
   bun run e2e
   ```

3. Create and push a matching tag, for example `v0.1.0` for package version `0.1.0`.
4. Create a GitHub Release from that tag and publish it.

The workflow verifies that the release tag is exactly `v` followed by the package version, runs the quality suite, builds the package, then uploads `smail-<version>.tgz` and `smail-<version>.tgz.sha256` with the repository `GITHUB_TOKEN`. Uploading an already-existing asset fails, so a published asset is not silently replaced.

## Install from GitHub Release

Install a specific released tarball, along with the required runtime peer dependency:

```sh
npm i https://github.com/slime21023/smail/releases/download/v1.0.0/smail-1.0.0.tgz mjml-browser
```

Replace `1.0.0` with the intended release version. Download the matching `.sha256` asset when an independent integrity check is needed. This distribution method requires an explicit asset URL; it does not support npm registry features such as version ranges, dist-tags, or `npm update`. Public Release assets can be installed without registry credentials. For private packages or semver-based dependency management, use an npm registry instead.
