# cote-reader-lnreader

LNReader source extension for [cote-reader.me](https://cote-reader.me/).

Supports full catalog browsing, search, chapter pagination (`PagePlugin`), and text extraction with illustrations for Classroom of the Elite and 1,040+ series.

## Installation

### In LNReader App

1. In LNReader, open **Settings** > **Repos** (or **Browse** > repository icon).
2. Add the following repository URL:
   ```text
   https://raw.githubusercontent.com/RevDev909/cote-reader-lnreader/main/dist/plugins.min.json
   ```
3. Open **Browse** > **Plugins**, find **COTE Reader**, and tap **Install**.

---

## Local Development

### Testing

Run the test suite against live endpoints:

```bash
npm test
```

### Local Dev Server

Start local server to test the extension over LAN:

```bash
npm run serve
```

Add `http://<LAN_IP>:8080/plugins.min.json` in LNReader.

---

## Project Structure

```text
├── src/
│   └── plugins/
│       └── english/
│           └── CoteReader.ts       # Upstream plugin source (LNReader PluginBase / PagePlugin)
├── dist/
│   ├── plugins/
│   │   └── cote-reader.js     # Standalone runtime bundle
│   ├── plugins.json           # Repo manifest
│   ├── plugins.min.json       # Minified manifest
│   └── icon.png               # Plugin icon
├── test/
│   └── test-plugin.js         # Integration tests
└── serve.js                   # Development HTTP server
```

## Upstream Integration

To integrate into [LNReader/lnreader-plugins](https://github.com/LNReader/lnreader-plugins):

- Source: `src/plugins/english/CoteReader.ts` -> `plugins/english/CoteReader.ts`
- Icon: `dist/icon.png` -> `public/static/src/en/cotereader/icon.png`

## License

MIT
