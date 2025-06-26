# 📁 Directory Tree Generator

[![GitHub Action](https://img.shields.io/badge/action-generate--directory--md-blue?logo=github)](https://github.com/DenizAltunkapan/directory-tree-generator)

A GitHub Action that automatically generates a Markdown file (`DIRECTORY.md`) representing the folder structure of your project as a clickable tree view.

Perfect for documentation, open source projects, and maintaining clean, readable repositories.

---

## ✨ Features

- 🔍 Recursively scans any specified directory
- 🔗 Generates a Markdown-based tree with clickable links
- 🔧 Filters files by extension (e.g. `.ts`, `.js`)
- 🎛️ **Optionally hides or shows file extensions** via `--show-extensions`
- 📁 Outputs a `DIRECTORY.md` file at the root of the project

---

## 🚀 Usage as a GitHub Action

### 1. Add a workflow file to your target repository

```yaml
# .github/workflows/generate-directory.yml
name: Generate Directory Markdown

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  generate-directory:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Directory Tree Generator
        uses: DenizAltunkapan/directory-tree-generator@v1.1.0
        with:
          path: src
          extensions: .ts,.js
          show-extensions: false # hide “.ts” / “.js” in DIRECTORY.md
```

---

## ⚙️ Input Parameters

| Parameter         | Description                                                                                | Default |
| ----------------- | ------------------------------------------------------------------------------------------ | ------- |
| `path`            | Relative path of the directory to scan                                                     | `src`   |
| `extensions`      | Comma-separated list of file extensions (e.g. `.ts,.js`). Use `.` to include **all** files | `.`     |
| `show-extensions` | `true` → keep extensions (e.g. `Main.java`), `false` → hide them (e.g. `Main`)             | `true`  |

---

## 📄 Example Output

_With `show-extensions: false`_:

- 📁 **src**
  - 📄 [index](src/index.ts)
  - 📁 **utils**
    - 📄 [helpers](src/utils/helpers.ts)
      …

---

## 🛠 Local Usage (Optional)

```bash
npm install
npm run build

# Show extensions (default)
node dist/index.js --path src --extensions .ts,.js --show-extensions true

# Hide extensions
node dist/index.js --path src --extensions .ts,.js --show-extensions false
```

---

## 🙌 Contributing

Pull requests are welcome! Feel free to open issues for bugs or feature requests.
