# Lessons Learned

Hard-won integration lessons from real-world projects that consumed `@mieweb/ui`.

These documents capture pitfalls, workarounds, and recommended changes discovered during multi-week migrations. They serve two purposes:

1. **For consumers** — avoid the same traps when integrating `@mieweb/ui` into a Tailwind 4 project.
2. **For maintainers** — track improvements that should be made to the library itself so consumers don't have to work around these issues.

## Documents

| File | Audience | Summary |
|------|----------|---------|
| [tailwind4-integration.md](tailwind4-integration.md) | Consumers + Maintainers | Tailwind CSS 4 setup, dark mode, brand switching, `@source`, CSS variable fallbacks |
| [migration-meteor-blaze-to-react.md](migration-meteor-blaze-to-react.md) | Consumers | Full migration playbook: Meteor 2 Blaze → Meteor 3 React + TypeScript + Tailwind 4 + @mieweb/ui |
| [recommended-changes.md](recommended-changes.md) | Maintainers | Proposed library changes to eliminate consumer-side workarounds |
