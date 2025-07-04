# 📁 Directory Tree Generator

[![GitHub Action](https://img.shields.io/badge/action-generate--directory--md-blue?logo=github)](https://github.com/DenizAltunkapan/directory-tree-generator)

A GitHub Action that automatically generates a Markdown file (`DIRECTORY.md`) representing the folder structure of your project as a clickable tree view.

Perfect for documentation, open source projects, and maintaining clean, readable repositories.

---

## ✨ Features

- 🔍 Recursively scans any specified directory (or multiple, comma-separated directories)
- 🔗 Generates a Markdown-based tree with clickable relative links
- 🔧 Filters files by extension (e.g. `.ts`, `.js`)
- 🎛️ Optionally hides or shows file extensions (`--show-extensions`)
- 📁 Outputs a `DIRECTORY.md` file at the project root

---

## 🚀 Usage as a GitHub Action

### 1. Add a workflow file to your target repository

```yaml
# .github/workflows/generate-directory.yml
name: Generate Directory Markdown

on:
  push:
    branches: [main]
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
          path: frontend,backend
          extensions: .ts,.js
          show-extensions: false
```

## ⚙️ Input Parameters

| Parameter         | Description                                                                                | Default |
| ----------------- | ------------------------------------------------------------------------------------------ | ------- |
| `path`            | Relative path or multiple comma-separated paths of the directories to scan                 | `.`     |
| `extensions`      | Comma-separated list of file extensions (e.g. `.ts,.js`). Use `.` to include **all** files | `.`     |
| `show-extensions` | `true` → keep extensions (e.g. `Main.java`), `false` → hide them (e.g. `Main`)             | `false` |

---

## 📄 Example Output

_With `show-extensions: false`_:

- 📁 **frontend**
  - 📄 [index](frontend/index.ts)
  - 📁 **components**
    - 📄 [App](frontend/components/App.ts)

- 📁 **backend**
  - 📁 **src**
    - 📄 [server](backend/src/server.js)

---

## 🛠 Local Usage (Optional)

You can also use this tool locally in any Node.js environment:

```bash
npm install
npm run build

# Example 1: Show extensions
node dist/index.js --path frontend,backend --extensions .ts,.js --show-extensions true

# Example 2: Hide extensions
node dist/index.js --path src --extensions .ts --show-extensions false
```

The output `DIRECTORY.md` will be created in the project root.

---

## 🙌 Contributing

Pull requests are welcome!
Feel free to open issues for bugs, enhancements, or feature requests.
