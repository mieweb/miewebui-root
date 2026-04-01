# npm Publishing Guide for @mieweb/ychart

This document explains how to publish the `@mieweb/ychart` package to npm.

## Overview

The package is published automatically via GitHub Actions when a new release is created. The workflow uses:
- **Node.js 24+** (as required by the package)
- **npm provenance** for supply chain security
- **Scoped public package** under the `@mieweb` organization

## Setup Requirements

### 1. Create an npm Granular Access Token

To publish packages, you need an npm access token:

1. Go to https://www.npmjs.com and sign in
2. Click your profile picture → **Access Tokens**
3. Click **Generate New Token** → **Granular Access Token**
4. Configure the token:
   - **Token name**: e.g., `ychart-publish`
   - **Expiration**: Choose an appropriate expiration (e.g., 90 days)
   - **Packages and scopes**: Select "Read and write" for `@mieweb` scope
   - **Organizations**: Select `@mieweb` with appropriate permissions
5. Click **Generate Token**
6. **Copy the token immediately** - it won't be shown again!

### 2. Add npm Token to GitHub Secrets

Before publishing, you must add your npm token as a GitHub repository secret:

1. Go to your repository: https://github.com/mieweb/ychart
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Your npm granular access token
6. Click **Add secret**

> ⚠️ **Security Note:** Never commit npm tokens to the repository. Always use GitHub Secrets.

### 3. npm Organization Access

Ensure you're a member of the `@mieweb` organization on npm with publish permissions:
- https://www.npmjs.com/org/mieweb

## Publishing Process

### Automatic (Recommended)

1. Update the version in `package.json`:
   ```bash
   pnpm version patch  # or minor, major
   ```

2. Push the version bump:
   ```bash
   git push origin main --follow-tags
   ```

3. Create a GitHub Release:
   - Go to https://github.com/mieweb/ychart/releases
   - Click **Draft a new release**
   - Choose the version tag (e.g., `v1.0.1`)
   - Add release notes
   - Click **Publish release**

4. The GitHub Action will automatically:
   - Build the package
   - Run verification
   - Publish to npm with provenance

### Manual (First-time or Emergency)

For the first publish or if GitHub Actions isn't set up yet:

```bash
# Login to npm (one-time)
npm login --scope=@mieweb

# Build the package
pnpm run build

# Publish (first time requires --access public for scoped packages)
npm publish --access public
```

Or using the token from `.env` file:
```bash
# Load token from .env file
source .env

# Configure npm to use the token
npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN

# Publish
npm publish --access public
```

> 💡 **Tip:** The `.env` file in the project root contains the npm token. It's gitignored for security.

## Package Configuration

The `package.json` includes:

```json
{
  "name": "@mieweb/ychart",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "engines": {
    "node": ">=24.0.0"
  }
}
```

## Provenance

The package is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements), which:
- Links the published package to its source repository
- Provides a verifiable build attestation
- Increases supply chain security

## Troubleshooting

### "You must be logged in to publish"
Ensure the `NPM_TOKEN` secret is set correctly in GitHub.

### "Package name too similar to existing package"
The package name `@mieweb/ychart` is scoped, which should avoid conflicts.

### "You do not have permission to publish"
Ensure your npm account is a member of the `@mieweb` organization with publish rights.

### Node.js version mismatch
The package requires Node.js 24+. Ensure your local environment matches.

### "Automatic provenance generation not supported for provider: null"
This error occurs when trying to use `--provenance` locally. Provenance only works in CI environments (GitHub Actions, GitLab CI) with OIDC support. For local publishing, omit the `--provenance` flag:
```bash
npm publish --access public
```

## Workflow Files

The GitHub Actions workflow for npm publishing is located at:
- [`.github/workflows/npm-publish.yml`](.github/workflows/npm-publish.yml)

This workflow:
- Triggers on GitHub Release creation
- Uses Node.js 24 and pnpm
- Publishes with provenance attestation
- Requires `NPM_TOKEN` secret to be configured

## Related Links

- **npm package**: https://www.npmjs.com/package/@mieweb/ychart
- **GitHub repository**: https://github.com/mieweb/ychart
- **npm documentation**: https://docs.npmjs.com/
- **npm provenance**: https://docs.npmjs.com/generating-provenance-statements
- **Trusted publishers**: https://docs.npmjs.com/trusted-publishers
