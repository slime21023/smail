---
title: Publishing
description: Release the scoped package through GitHub Packages.
sidebarTitle: Publishing
order: 3
---

The release workflow publishes a GitHub Packages npm package when a GitHub Release is published. The repository's regular package name remains `smail`; the package uploaded to GitHub Packages is scoped as `@slime21023/smail`, because the GitHub npm registry requires scoped names.

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

The workflow verifies that the release tag is exactly `v` followed by the package version, runs the quality suite, builds the package, then publishes with the repository `GITHUB_TOKEN` and `packages: write` permission. GitHub Packages rejects an existing package version, so releases are immutable by default.

## Install from GitHub Packages

Add a scope mapping in the consuming project's `.npmrc`:

```ini
@slime21023:registry=https://npm.pkg.github.com
```

For private packages, authenticate npm with a personal access token (classic) that has `read:packages`:

```ini
//npm.pkg.github.com/:_authToken=TOKEN
```

Then install the scoped package:

```sh
npm i @slime21023/smail mjml-browser
```

Package visibility and access rules are managed in GitHub Packages. The workflow needs no long-lived publish token because `GITHUB_TOKEN` can publish a package associated with its workflow repository. See the [GitHub Packages npm registry guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for access-control details.
