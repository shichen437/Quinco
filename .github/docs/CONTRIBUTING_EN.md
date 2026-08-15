## Contributing

First off, thanks for taking the time to contribute!

## Quick Development

### 1. Environment Preparation

- [mise](https://mise.jdx.dev/getting-started.html)
- [Tauri2](https://tauri.app/)
- [Node.js](https://nodejs.org/) (version >= 24)

### 2. Clone the Project

```bash
git clone https://github.com/shichen437/Quinco.git
cd Quinco
```

### 3. Project Startup

```bash

# Unify development environment (requires mise, optional)
mise trust
mise install

# Install Node.js dependencies
npm install

# Project startup (automatically installs Rust dependencies on first run)
mise run dev

```

## PR Policy

- Commit Convention: Follow [Conventional Commits_↗](https://www.conventionalcommits.org/zh-hans/v1.0.0/).
- Commit Count: Keep a PR to no more than 2 commits; squash if it exceeds.
- Scope of Changes: Keep the PR focused on a single topic; avoid mixed, omnibus changes.
- Required Notes: List key changes, compatibility impacts, and migration steps.
- Performance & Security: Ensure no noticeable performance regressions or security risks.
