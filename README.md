# miewebui-root

Monorepo root for the **@mieweb/ui** ecosystem — a pnpm workspace that coordinates the MIE React component library and feature module packages. Developers can add new packages under `packages/` to integrate with Storybook, shared tooling, and unified CI/CD.

## Structure

```
miewebui-root/
├── package.json              ← private root (not published)
├── pnpm-workspace.yaml       ← workspace: packages/*
├── turbo.json                ← build orchestration
├── packages/
│   ├── ui/                   ← @mieweb/ui (submodule → mieweb/ui)
│   └── ychart/               ← @mieweb/ychart (submodule → mieweb/ychart)
```

Each folder under `packages/` is a **git submodule** pointing to its own repository. Clicking them on GitHub navigates to the original repo.

## Getting Started

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/mieweb/miewebui-root.git
cd miewebui-root

# Install all dependencies
pnpm install

# Build everything (ui first, then ychart — handled by Turborepo)
turbo run build

# Start Storybook (includes Feature Module stories from all packages)
pnpm storybook
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Developer Workflow

### Working on a package

Changes happen **inside** the submodule directory and are committed/pushed to the package's own repo:

```bash
cd packages/ui
git checkout -b my-feature
# make changes...
git add . && git commit -m "feat: my change"
git push -u origin my-feature
```

Then update the root to track the new submodule commit:

```bash
cd ../..
git add packages/ui
git commit -m "chore: update ui submodule"
git push
```

### Pulling latest changes

```bash
# Update all submodules to latest from their remotes
git submodule update --remote --merge

# Or update a specific package
cd packages/ui && git pull origin main
```

### Adding a new package

1. Create a new repo (e.g., `mieweb/my-package`)
2. Add it as a submodule:
   ```bash
   git submodule add https://github.com/mieweb/my-package.git packages/my-package
   ```
3. The pnpm workspace (`packages/*` glob) picks it up automatically
4. Use `workspace:*` in `package.json` to reference sibling packages
5. Add Feature Module stories in `packages/ui/src/components/` to showcase it in Storybook

## Workspace Dependencies

| Package | Depends On | Type |
|---------|-----------|------|
| `@mieweb/ychart` | `@mieweb/ui` | `dependency` (workspace:*) |
| `@mieweb/ui` | `@mieweb/ychart` | `devDependency` (workspace:*, Storybook only) |

The devDependency is **stripped during npm publish** — no circular dependency reaches consumers.

```
npm consumers:          monorepo dev:
ychart → ui             ychart ⇄ ui (devDep)
                        ↑ stripped on publish
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `turbo run build` | Build all packages (dependency-aware) |
| `pnpm storybook` | Launch ui Storybook with all Feature Modules |
| `pnpm --filter @mieweb/ui build` | Build only ui |
| `pnpm --filter @mieweb/ychart build` | Build only ychart |

## Requirements

- **Node.js** >= 24.0.0
- **pnpm** >= 10.29.1
