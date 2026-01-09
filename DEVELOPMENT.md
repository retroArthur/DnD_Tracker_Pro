# Development Setup - Bug-Fixes & Features

## Aktuelles Setup (nach TypeScript-Migration)

### Verzeichnisstruktur:

```
dnd-tracker-modular/
├── src/                    ← TypeScript-Dateien (für Type-Checking)
│   ├── features/
│   ├── systems/
│   ├── utils/
│   └── types/
├── features/               ← Laufende JavaScript-Dateien (HIER arbeiten!)
├── systems/                ← Laufende JavaScript-Dateien
├── utils/                  ← Laufende JavaScript-Dateien
└── loader.js               ← Lädt alle JS-Module
```

### Workflow für Bug-Fixes:

1. **Änderungen machen:**
   - Arbeite direkt in `features/*.js`, `systems/*.js`, `utils/*.js`
   - Die App lädt diese Dateien (siehe `loader.js`)

2. **Type-Checking (optional):**
   ```bash
   npm run typecheck    # Prüft src/**/*.ts (parallel-Dokumentation)
   ```

3. **Testen:**
   ```bash
   npm run test         # Unit Tests
   npm run test:e2e     # E2E Tests
   ```

4. **Committen:**
   ```bash
   git add features/xyz.js
   git commit -m "fix: beschreibung"
   ```

### Wichtig:

- **Laufende App:** Lädt JavaScript aus `features/`, `systems/`, `utils/`
- **TypeScript in `src/`:** Nur für Type-Checking, nicht für Runtime
- **Keine Build-Schritte:** Änderungen direkt wirksam (Browser-Reload)

### Backups:

- **Lokales Backup:** `D:\AI_CLI\Claude\Backup\DnD_Tracker_Modular_Backup_2026-01-07_14-34-48`
- **Git main Branch:** Pre-Migration Version
- **Git typescript-migration Branch:** Aktueller Stand (gepusht)

### Nächste Schritte:

- Bug-Fixes direkt in JavaScript-Dateien
- Später: Optional zu vollständigem TypeScript-Build wechseln
