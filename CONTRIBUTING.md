# Contributing to @peerads/web

Thank you for your interest in contributing! This document covers everything you need to get started.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

## Reporting Bugs

Before opening an issue, search [existing issues](https://github.com/peerads/peerads-web/issues) to avoid duplicates. When filing a bug report please include:

- SDK version (`npm list @peerads/web`)
- Browser / environment (Chrome 120, Node 20, etc.)
- Minimal reproduction steps
- Expected vs actual behaviour
- Any relevant console errors

## Suggesting Features

Open a [GitHub Discussion](https://github.com/peerads/peerads-web/discussions) before filing a feature request. Describe the problem you're solving, not just the solution.

## Development Setup

```bash
git clone https://github.com/peerads/peerads-web.git
cd peerads-web
npm install
npm run dev   # watch mode
npm run build # production build
npm test      # run tests
```

## Pull Request Guidelines

1. **Branch** — create a feature branch from `main`: `git checkout -b feat/your-feature`
2. **Small PRs** — one logical change per PR
3. **Tests** — add or update tests for any changed behaviour
4. **TypeScript** — all new code must be fully typed; no `any` without a comment explaining why
5. **Lint** — `npm run lint` must pass before opening a PR
6. **Commit style** — follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change that is neither a fix nor a feature
   - `test:` adding or updating tests
   - `chore:` maintenance (deps, build, CI)
7. **Changelog** — add an entry to `CHANGELOG.md` under `[Unreleased]`

## Security

Do **not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
