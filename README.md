# iGEM Toronto 2026 — Wiki

> Built with **Gatsby** + **Styled Components**.

---

## Prerequisites

Make sure you have these installed before anything else:

- [Node.js](https://nodejs.org/) v18 or higher — check with `node -v`
- [Git](https://git-scm.com/) — check with `git --version`

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/petadex/iGEM_wiki.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run develop
```

Open your browser and go to **http://localhost:8000**

## 📁 Project Structure

```
src/
├── components/
│   └── WikiLayout.js      ← Shared layout (nav slot is marked inside)
├── styles/
│   └── globalStyles.js    ← All design tokens — edit colors/fonts here
└── pages/
    ├── index.js
    ├── description.js
    ├── team.js
    └── ...
```

---

## Changing Colors & Fonts

Everything is in `src/styles/globalStyles.js`. The main ones to know:

| Token            | Default          | What it is      |
| ---------------- | ---------------- | --------------- |
| `--color-bg`     | `##f0ede6`       | Page background |
| `--color-accent` | `#c8f050`        | brand color     |
| `--color-text`   | `#0a0a0a`        | Body text       |
| `--font-display` | DM Serif Display | Headings        |
| `--font-body`    | DM Sans          | Body text       |

---

## Useful Commands

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run develop` | Start local dev server                 |
| `npm run build`   | Build for production                   |
| `npm run serve`   | Preview production build locally       |
| `npm run clean`   | Clear cache (run this if things break) |

---

## 🤝 Contributing

1. **Never push directly to `main`**
2. Create a branch for your work: `git checkout -b feat/your-page-name`
3. Make your changes
4. Push and open a pull request

---

_iGEM Toronto 2026 — University of Toronto_
# test
