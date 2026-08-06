# Phase 10: Security-Härtung - Research

**Researched:** 2026-07-25
**Domain:** Client-side stored-XSS remediation (Import-Pfad, Rich-Text/innerHTML) + Security-Audit-Konsolidierung in einer Non-ESM-Browser-App ohne Backend
**Confidence:** HIGH (alle zentralen Befunde sind direkt am Quellcode verifiziert, nicht aus Dokumentation übernommen)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Import-XSS-Fix (SEC-01)**
- **D-01:** Defense-in-Depth an beiden Grenzen. `renderMarkdownInContent()` (`ui/editors/markdown-converter.js`) sanitisiert am Ende identisch zu `markdownToHtml()`, UND der Import-Pfad (`executeImport()` + `importDataGlobal()` in `systems/spellslots/import-export.js`) schleust HTML-tragende Felder durch `sanitizeHTML()`.
- **D-02:** Feldauswahl per Render-Pfad-Audit. Der Researcher auditiert, welche importierten Felder tatsächlich ungeschützt in `innerHTML` landen, und leitet daraus die Sanitisierungs-Feldliste ab. KEIN rekursives Sanitisieren aller String-Felder.
- **D-03:** Keine Bestandsdaten-Migration. Bereits gespeicherte Daten werden NICHT migriert — die neue Anzeige-Grenzen-Sanitisierung neutralisiert Altdaten automatisch beim Rendern.
- **D-04:** Still säubern. Der Import meldet Sanitisierungs-Eingriffe nicht.

**Beifang-Findings (Scope-Erweiterungen)**
- **D-05:** Broken-Windows #1 (Paste-Tabellen-XSS) wird in Phase 10 gefixt. `handleEditorPaste()`s Tabellen-insertHTML-Zweig strippt künftig auch `on*`-Ereignis-Attribute. Ledger-Eintrag #1 wird auf `fixed` gesetzt.
- **D-06:** `<strike>`-Whitelist-Fix in Phase 10, synchron in `utils/basic.js` UND `utils/testable-utils.js`. Reversibility: costly.
- **D-07:** WR-03 wird gefixt. `importDataGlobal()`s Überschreib-Zweig bekommt `saveUndoState()` + `createAutoBackup()`.
- **D-08:** CSP + class/style-Breite: bewusst akzeptierte Risiken. Keine CSP-Einführung, keine Verengung der `class`/`style`-Erlaubnis. SECURITY.md dokumentiert beide mit Begründung.

**Audit-Zuschnitt (SEC-02)**
- **D-09:** Angriffsflächen-getrieben: `/gsd-secure-phase` läuft über Phase 1 (Import/Export, Storage/IDB), Phase 2 (Datei-Backup), Phase 9 (neue Editor-Implementierung), Phase 10 (Security-Fixes selbst).
- **D-10:** Eine konsolidierte SECURITY.md im Repo-Root, gespeist aus den per-Phase-Audit-Artefakten.
- **D-11:** Fixes zuerst, Audit als Abschluss-Gate.
- **D-12:** `threats_open: 0` heißt „gefixt ODER begründet akzeptiert". Critical/High werden noch in Phase 10 gefixt, Low/Info mit Begründung akzeptiert.

**Regressionstest-Design (SEC-01 Kriterium 2)**
- **D-13:** E2E + Unit kombiniert. E2E beweist die ganze Kette im blockierenden CI-Job; Unit deckt Sanitizer-Pfade feingranular ab.
- **D-14:** Neue Security-Tests laden die ECHTEN Produktions-Sanitizer via `vm.runInContext` (Präzedenz: `tests/unit/storage-conflict.test.js`). Zusätzlich ein Paritäts-Test `testable-utils.js` vs. `utils/basic.js`.
- **D-15:** Kuratierter Payload-Vektor-Katalog: Review-Exploit (`<img src=x onerror=…>`), `javascript:`-URLs, `<script>`-Tags, SVG-Event-Handler, Tabellen-Paste-Payload aus T-09-01.
- **D-16:** Paste-XSS-Test im bestehenden Editor-Netz (`tests/e2e/features/editor-insert.spec.js`, neben T-09-01), mit dokumentiert begründeter Anpassung von T-09-01.

### Claude's Discretion
- Exakte technische Umsetzung der Sanitisierungs-Aufrufe (wo genau im Import-Flow, Helper-Extraktion ja/nein), solange beide Grenzen (D-01) abgedeckt sind
- Zusammensetzung des Vektor-Katalogs (D-15) über die genannten Pflicht-Vektoren hinaus
- Struktur/Gliederung der SECURITY.md (Format, Frontmatter), solange `threats_open: 0` und die vier Angriffsflächen klar auditierbar sind
- Plan-/Wellen-Aufteilung der Fixes (einzeln vs. gebündelt)

### Deferred Ideas (OUT OF SCOPE)
- CSP-Meta-Tag + class-Präfix-Whitelist in `sanitizeHTML` — bewusst NICHT in v1.1 (D-08). Kandidat für einen späteren Milestone.
- Drei verbleibende `document.execCommand`-Call-Sites außerhalb des Editors (`systems/entity-links.js:108`, `features/wiki/wiki.js:819`, `ui/actions/system-actions.js:79`) — kein Security-Fix, Kandidat für Phase 11 (ARCH-04) oder später.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Import-XSS behoben, mit Regressionstest (bösartige Import-Datei wird sanitisiert, kein Script-Execute) | Vollständiger Exploit-Ketten-Audit (siehe Architecture Patterns), exakte Fix-Punkte in `markdown-converter.js`/`import-export.js` identifiziert, Sanitisierungs-Feldliste per Render-Pfad-Audit abgeleitet (siehe Standard Stack → Feldliste), TOC-Anker-Regressionsrisiko dokumentiert (siehe Common Pitfalls #1) |
| SEC-02 | SECURITY.md mit `threats_open: 0` für Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML via `/gsd-secure-phase` | Angriffsflächen-Zuordnung zu Phasen 1/2/9/10 bestätigt (siehe Security Domain), zusätzlicher `saveSpell()`-Rich-Text-Fund (aus Phase 9 vorgemerkt) in Rich-Text/innerHTML-Fläche eingeordnet |
</phase_requirements>

## Summary

Phase 10 ist eine reine Code-Audit-und-Bugfix-Phase ohne neue Abhängigkeiten: Es wird kein neues npm-Paket installiert, keine neue Bibliothek eingeführt. Der gesamte Fix nutzt ausschließlich die bereits vorhandene, DOMParser-basierte Allowlist-Sanitizer-Funktion `sanitizeHTML()` (`utils/basic.js`). Die Arbeit besteht aus (1) drei präzise lokalisierten Codeänderungen (Anzeige-Grenze in `markdown-converter.js`, Import-Grenze in `import-export.js`, Tabellen-Paste-Bereinigung in `rich-text.js`), (2) einem synchronen Zwei-Datei-Fix für die `<strike>`-Whitelist-Lücke, (3) einem kuratierten Unit-/E2E-Testnetz nach dem `vm.runInContext`-Präzedenzmuster aus `storage-conflict.test.js`, und (4) einem abschließenden `/gsd-secure-phase`-Audit über vier Phasen, konsolidiert in einer neuen `SECURITY.md`.

Der wichtigste Befund dieser Recherche stammt aus dem in CONTEXT.md D-02 verlangten Render-Pfad-Audit: **Der von 01-REVIEW.md (CR-01) beschriebene Exploit ist heute ausschließlich über `wiki.js`s Anzeigepfad reproduzierbar.** Ein systematischer Grep über alle Konsumenten von `renderMarkdownInContent()` und über alle `innerHTML`-Zuweisungen mit `description`/`notes`/`content`/`traits`/`actions`/`skills`-Feldern zeigt: **jeder andere Entity-Renderer** (NPCs, Locations, Quests, Encounters, Sessions, Spells, Links, das generische `entity-links.js`-Popup) **wrappt den `renderMarkdownInContent()`-Output bereits defensiv in `sanitizeHTML()` am Aufrufort** — nur `wiki.js:425-427` tut das nicht. Das bedeutet: Die Import-seitige Sanitisierung (zweite Grenze aus D-01) ist heute **prophylaktische Verteidigung in der Tiefe** (schützt Rohdaten-at-Rest, künftige Render-Pfade, Copy/Export-Flüsse), nicht die Schließung eines zweiten, unabhängig ausnutzbaren Lecks — der EINE tatsächlich ausnutzbare Pfad ist die Anzeige-Grenze in `wiki.js`. Diese Erkenntnis ist für die Testarchitektur (D-13) entscheidend: Der E2E-Beweis MUSS über den Wiki-Pfad laufen (dort ist der Exploit heute live reproduzierbar); die übrigen Felder brauchen Unit-Abdeckung der Sanitisierungs-Anwendung am Import, aber keinen eigenen E2E-Execution-Beweis.

Ein zweiter, nicht in CONTEXT.md explizit benannter Befund: Das Hinzufügen von `sanitizeHTML()` ans Ende von `renderMarkdownInContent()` (der von D-01/01-REVIEW.md vorgeschlagene Minimal-Fix) **bricht die Wiki-Inhaltsverzeichnis-Sprungmarken-Funktion**, weil `sanitizeHTML()`s Attribut-Allowlist kein `id`-Attribut kennt und `addTOCAnchors()` in `wiki.js:423` VOR `renderMarkdownInContent()` aufgerufen wird — die `id="toc-N"`-Anker würden beim Sanitisieren stillschweigend entfernt. Siehe Common Pitfalls #1 für den empfohlenen Fix (Aufrufreihenfolge umkehren).

Ein dritter Befund: `saveSpell()` (`ui/editors/rich-text.js:1626-1697`) speichert das `description`-Feld eines Zaubers **ungewrapped** (`descHtml = descEl.innerHTML`, kein `sanitizeHTML()`), während das benachbarte `note`-Feld in derselben Funktion korrekt sanitisiert wird. Dieser Fund wurde bereits in Phase 9 (`09-01-PLAN.md`) für Phase 10 SEC-01/SEC-02 vorgemerkt. Da der Render-Pfad (`ui/editors/rich-text.js:212`, `features/render-spells.js:54`) bereits sanitisiert, ist dies aktuell kein live ausnutzbarer Pfad — aber eine Inkonsistenz innerhalb der „Rich-Text/innerHTML"-Angriffsfläche, die der Success-Criterion-3-Audit (`threats_open: 0` für u.a. Rich-Text/innerHTML) explizit abdecken muss (Fix ODER dokumentiert akzeptiertes Risiko, D-12).

**Primäre Empfehlung:** Beide Grenzen aus D-01 exakt wie in 01-REVIEW.md vorgeschlagen umsetzen, aber (a) die Aufrufreihenfolge in `wiki.js` anpassen, um die TOC-Regression zu vermeiden, (b) die Sanitisierungs-Feldliste am Import auf die neun in diesem Dokument identifizierten HTML-tragenden Felder beschränken (nicht mehr), (c) den `saveSpell()`-Fund im selben Aufwasch fixen (ein Einzeiler, konsistent zum `note`-Feld direkt daneben), und (d) den kompletten Vektor-Katalog gegen den ECHTEN `utils/basic.js`-Quellcode via `vm.runInContext` testen, nicht gegen `utils/testable-utils.js` allein (CONCERNS.md dokumentiert bereits Drift zwischen beiden).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTML-Sanitisierung (Allowlist) | Browser/Client (`utils/basic.js`) | — | Einzige Laufzeitumgebung der App; kein Server, keine Edge-Instanz. `sanitizeHTML()` ist bereits die kanonische, einzige Sanitizer-Implementierung — Phase 10 baut keine neue |
| Import-Validierung (Schema + Sanitisierung) | Browser/Client (`systems/spellslots/import-export.js`) | — | `executeImport()`/`importDataGlobal()` sind die einzigen Eintrittspunkte für Fremd-Daten; kein Server-seitiger Upload-Handler existiert |
| Anzeige-Sanitisierung (Render-on-Display) | Browser/Client (`ui/editors/markdown-converter.js`, elf Entity-Renderer) | — | Alle Renderer laufen im selben globalen Scope; „Render-Pfad" bedeutet hier: welche `features/*-render.js`-Funktion baut den `innerHTML`-String |
| Persistenz (LocalStorage + IndexedDB) | Browser/Client (`systems/spellslots/persistence.js`) | — | Kein Backend — Speicherung ist rein clientseitig; Sanitisierung MUSS vor dem Schreiben in `D` erfolgen, nicht als Backend-Gate |
| Security-Audit-Dokumentation | Repo-Root (`SECURITY.md`) | `.planning/` (Per-Phase-Artefakte) | D-10: konsolidierte, öffentlich sichtbare Datei im Root (GitHub-Konvention), gespeist aus planungsinternen Audit-Rohdaten |
| CI-Gate (Regressionsschutz) | Build/CI (`.github/workflows/ci.yml`, Job `e2e`) | Test (`tests/e2e/`, `tests/unit/`) | Neue Sicherheits-Tests laufen automatisch im bereits blockierenden `e2e`-Job (kein Config-Change nötig, Playwright hat kein Dateifilter) |

## Standard Stack

### Core

Keine neuen Bibliotheken. Diese Phase verwendet ausschließlich bereits vorhandenen Code:

| Funktion/Datei | Zweck | Warum Standard (für dieses Projekt) |
|-----------------|-------|--------------------------------------|
| `sanitizeHTML()` (`utils/basic.js:58-226`) | DOMParser-basierter Allowlist-Sanitizer (Tags + Attribute), bereits in >10 Entity-Renderern und beim Speichern in Wiki/NPC/Party/Spell/Link genutzt | Einzige projektweite Sanitizer-Implementierung; CLAUDE.md verbietet implizit Neubau eigener Lösungen (vgl. „Don't Hand-Roll" unten) |
| `esc()` (`utils/basic.js:19-28`) | HTML-Entity-Escaping für Plain-Text-Kontexte | Bereits Standard für alle nicht-HTML-Textfelder (Namen, Tags, Titel) |
| `vm.runInContext`-Testmuster (`tests/unit/storage-conflict.test.js`) | Lädt echten Produktionsquelltext in einen isolierten Node-`vm`-Context statt eine Kopie zu pflegen | Einzige im Projekt etablierte Methode, die NICHT auf `utils/testable-utils.js`-Drift anfällig ist (CONCERNS.md „High Priority"-Gap) |

### Supporting

| Datei | Zweck | Wann verwendet |
|-------|-------|-----------------|
| `gsd-tools windows fixed 1` | Setzt Broken-Windows-Ledger-Eintrag #1 auf `fixed` | Nach Umsetzung von D-05 (Paste-Tabellen-XSS-Fix), sonst bleibt `/gsd-ship` blockiert |
| `/gsd-secure-phase` | Erzeugt Per-Phase-Threat-Audit-Artefakte | Für D-09/D-11 als letzter Schritt der Phase, über Phasen 1, 2, 9, 10 |

### Alternativen Considered

| Statt | Könnte man nutzen | Tradeoff |
|-------|--------------------|----------|
| Eigener `sanitizeHTML()`-Sanitizer (Allowlist, DOMParser-basiert) | DOMPurify (npm) | DOMPurify ist der Industriestandard [CITED: OWASP-Empfehlung für clientseitiges JS], aber: (a) neue Runtime-Dependency in einer bewusst dependency-freien Non-ESM-App (CLAUDE.md: „Zero runtime dependencies"), (b) würde `build.py`s Modul-Konkatenation um ein Fremd-Bundle erweitern, (c) außerhalb des D-01-Scopes (User hat den bestehenden Sanitizer explizit als Wiederverwendungs-Grundlage benannt, keine Alternative angefragt). NICHT empfohlen für diese Phase — nur als spätere Grundsatzentscheidung dokumentierbar in SECURITY.md (D-08-Nachbarschaft) |
| Sanitisierung am Import via `executeImport()`/`importDataGlobal()` | Serverseitige Validierung / Content-Security-Policy als alleinige Verteidigungslinie | Kein Server vorhanden (Single-Page-App, `file://`/PWA); CSP ist D-08 bewusst deferred. Clientseitige Sanitisierung an beiden Grenzen ist die einzig mögliche Verteidigungslinie in dieser Architektur |

**Installation:** Keine — keine `npm install`-Schritte in diesem Plan.

**Version verification:** Entfällt (keine externen Pakete).

## Package Legitimacy Audit

**Nicht anwendbar.** Diese Phase installiert keine externen Pakete (`npm install` wird nicht ausgeführt). Alle Fixes verwenden ausschließlich bereits im Repository vorhandenen Code (`utils/basic.js`, `ui/editors/markdown-converter.js`, `systems/spellslots/import-export.js`, `ui/editors/rich-text.js`). Der Package-Legitimacy-Gate-Schritt entfällt.

## Architecture Patterns

### Exploit-Ketten-Diagramm (verifiziert, Stand dieses Audits)

```
[Bösartige Kampagnen-JSON-Datei]
        │  wiki[0].content = '<img src=x onerror=alert(document.cookie)>'
        ▼
┌─────────────────────────────────────────────────────────────┐
│ EINTRITTSPUNKTE (zwei unabhängige Import-Pfade)               │
│                                                                 │
│ A) executeImport() — Typ-spezifisch, MIT Schema-Validierung   │
│    import-export.js:339-376                                    │
│    → IO_SCHEMA[type] validiert Feld-Existenz/Defaults          │
│    → sanitisiert NICHTS (nur Typ-Checks)                       │
│    → D[type] = items  ODER  D[type] = [...alt, ...merged]      │
│                                                                  │
│ B) importDataGlobal() — Global, OHNE Schema-Validierung        │
│    import-export.js:464-588                                     │
│    → Zweig "neue Kampagne": StorageAPI.setJSON(key, {...imp})  │
│      (Zeile 530-568) — KEINE Sanitisierung, KEIN Backup nötig  │
│      (neue Kampagne, nichts überschrieben)                      │
│    → Zweig "überschreiben": Object.assign(D, imp) (Zeile 573)  │
│      — KEINE Sanitisierung, KEIN saveUndoState()/Backup (WR-03)│
│    ⚠ BEIDE Zweige persistieren rohe Felder — D-01 verlangt     │
│      Sanitisierung in BEIDEN, nicht nur im "überschreiben"-Zweig│
│      (der einzige, den WR-03/D-07 für Undo/Backup nennt)        │
└─────────────────────────────────────────────────────────────┘
        │  D.wiki[0].content = '<img src=x onerror=...>'  (unverändert gespeichert)
        ▼
┌─────────────────────────────────────────────────────────────┐
│ PERSISTENZ — systems/spellslots/persistence.js                 │
│ save() / saveImmediate() → LocalStorage + optional IndexedDB   │
│ (keine Sanitisierung auf diesem Layer, by design — reine       │
│  Serialisierung)                                                │
└─────────────────────────────────────────────────────────────┘
        │  Nutzer öffnet Wiki-Eintrag
        ▼
┌─────────────────────────────────────────────────────────────┐
│ ANZEIGE-PFAD — features/wiki/wiki.js:renderWikiDetail()        │
│                                                                  │
│ entry.content                                                   │
│   → addTOCAnchors(entry.content)          [wiki.js:423]        │
│      fügt id="toc-N" zu <h2-4>-Tags hinzu (CODE-generiert)     │
│   → renderMarkdownInContent(contentWithAnchors) [wiki.js:427]  │
│      HEUTE: sanitisiert NICHT (Bug, CR-01)                     │
│      NACH FIX: sanitisiert am Ende — ABER: würde die gerade    │
│      hinzugefügten id-Attribute wieder entfernen, weil          │
│      sanitizeHTML()s allowedAttributes kein "id" enthält        │
│      → TOC-Sprungmarken brechen (siehe Common Pitfalls #1)      │
│   → parseWikiLinks(contentWithMarkdown)   [wiki.js:429]        │
│      Regex /\[\[([^\]]+)\]\]/g, injiziert linkText UNESCAPED   │
│      in <span>...${linkText}</span> — SICHER NUR WEIL Schritt   │
│      davor (sanitizeHTML) bereits alle <script>/on*/javascript: │
│      global aus dem GESAMTEN String entfernt hat, auch          │
│      innerhalb von [[...]]-Klammern (verifiziert: sanitizeHTML  │
│      arbeitet auf dem kompletten String, nicht scope-begrenzt)  │
│      ⚠ Reihenfolge ist sicherheitskritisch: sanitizeHTML MUSS   │
│      vor parseWikiLinks laufen — aktuelle Aufrufreihenfolge     │
│      erfüllt das bereits (Zeile 427 vor 429), NICHT verändern   │
│   → detail.innerHTML = `...${parsedContent}...`  [wiki.js:460] │
│      ⚡ EXECUTION POINT — onerror feuert hier, wenn Schritt      │
│      427 nicht sanitisiert                                      │
└─────────────────────────────────────────────────────────────┘

VERGLEICH — alle ANDEREN renderMarkdownInContent-Konsumenten (bereits sicher):
  encounters-render.js:446,457,468,479  → sanitizeHTML(renderMarkdownInContent(enc.X))
  quests-render.js:89                    → sanitizeHTML(renderMarkdownInContent(q.description))
  locations-render.js:293                → sanitizeHTML(renderMarkdownInContent(loc.description))
  sessions.js:314                        → sanitizeHTML(renderMarkdownInContent(n.content))
  npc-popup.js:85                        → sanitizeHTML(renderMarkdownInContent(npc.description))
  render-spells.js:53-54                 → sanitizeHTML(renderMd(spell.description))
  → NUR wiki.js:427 lässt den sanitizeHTML()-Wrapper am Aufrufort weg.
```

### Render-Pfad-Audit — Sanitisierungs-Feldliste (D-02, verifiziert per Grep+Read)

| Entity-Typ | Feld (`IO_SCHEMA`-Key) | Aktuell live ausnutzbar via Anzeige? | Render-Ort | Empfehlung Import-Sanitisierung |
|------------|------------------------|----------------------------------------|------------|-----------------------------------|
| `wiki` | `content` | **JA — einziger bestätigter Live-Exploit-Pfad** | `wiki.js:460` (kein Wrapper) | Sanitisieren (Pflicht, D-01) |
| `characters` | `notes` | Nein (Render sanitisiert bereits: `party-details.js:366`, `party-crud.js:407`) | — | Sanitisieren (Defense-in-Depth) |
| `npcs` | `description` | Nein (`npc-render.js:297`, `npc-popup.js:85`, `npc-crud.js:142` sanitisieren bereits) | — | Sanitisieren (Defense-in-Depth) |
| `locations` | `description` | Nein (`locations-render.js:293` sanitisiert bereits) | — | Sanitisieren (Defense-in-Depth) |
| `quests` | `description` | Nein (`quests-render.js:89` sanitisiert bereits) | — | Sanitisieren (Defense-in-Depth) |
| `encounters` | `traits`, `actions`, `skills` | Nein (`encounters-render.js:446/457/468` sanitisieren bereits) | — | Sanitisieren (Defense-in-Depth) |
| `spells` | `description` | Nein (`rich-text.js:212`, `render-spells.js:54` sanitisieren bereits) — ABER `saveSpell()` speichert dieses Feld selbst ungewrapped (siehe Common Pitfalls #3) | — | Sanitisieren (Defense-in-Depth) |
| `sessionNotes` | `content` | Nein (`sessions.js:314` sanitisiert bereits) | — | Sanitisieren (Defense-in-Depth) |
| `links` | `description` | Nein (`links.js:53` zeigt via `esc()` nur Plain-Text; `links.js:119` sanitisiert beim Editor-Populate bereits) | — | Optional (niedrige Priorität — wird nirgends als HTML gerendert) |
| `loot` | `description` | N/A — wird nirgends via `innerHTML` gerendert (nur `toLowerCase()`-Suche in `render-loot.js:47`) | — | Nicht nötig (kein HTML-Sink identifiziert) |
| `encounters` | `equipment` | N/A | `encounters-render.js:479` rendert es, ABER `equipment` ist **kein Feld in `IO_SCHEMA.encounters`** — Import kann dieses Feld nicht setzen (validierte Items übernehmen nur Schema-Keys) | Kein Fix nötig — struktureller Ausschluss bereits vorhanden |

**Explizit NICHT sanitisieren (D-02-Leitplanke):** `name`, `title`, `race`, `class`, `playerName`, `background`, `faction`, `giver`, `reward`, `school`, `castingTime`, `range`, `components`, `duration`, `spellClass`, `creatureType`, `cr`, `assignedTo`, `type`, `rarity`, `category`, `url`, `tags[]` — alle rein textuellen/kategorialen Felder. `sanitizeHTML()` auf diese Felder anzuwenden würde bei Inhalten mit `<`/`>` (z. B. Würfelformeln, Vergleichsoperatoren in Freitext-Namen) legitime Zeichen als HTML-Tags fehlinterpretieren und stillschweigend entfernen — genau das von CONTEXT.md D-02 benannte Risiko.

### Empfohlene Implementierungsstruktur

```
systems/spellslots/import-export.js
├── IO_SCHEMA (unverändert)
├── HTML_FIELDS_BY_TYPE  ← NEU: { wiki: ['content'], npcs: ['description'], ... }
│     (Konstante, keine Logik — macht die Feldliste an einer Stelle sichtbar/wartbar)
├── sanitizeImportedItem(type, item)  ← NEU, modul-intern (kein window-Export nötig,
│     CLAUDE.md „Export Audit Rule"): wendet sanitizeHTML() auf die in
│     HTML_FIELDS_BY_TYPE[type] gelisteten Felder an, gibt item unverändert
│     zurück falls type nicht in der Map ist
├── executeImport()  ← ändern: validatedItems-Map ruft sanitizeImportedItem() auf
└── importDataGlobal()  ← ändern: BEIDE Zweige (neue Kampagne UND überschreiben)
      iterieren HTML_FIELDS_BY_TYPE-Keys über imp[key] und rufen
      sanitizeImportedItem() je Item auf, bevor imp in D/StorageAPI landet
```

### Anti-Patterns to Avoid
- **Rekursives Sanitisieren aller String-Felder:** explizit von D-02 verboten — zerstört legitime `<`/`>`-Zeichen in Nicht-HTML-Feldern (Namen, Würfelformeln).
- **Neuen Sanitizer bauen statt `sanitizeHTML()` wiederzuverwenden:** Es existiert bereits eine geprüfte, projektweit genutzte Implementierung — ein zweiter Sanitizer würde Verhaltensabweichungen riskieren (genau das Problem, das D-14s Paritätstest für die bestehenden zwei Kopien schon adressiert).
- **`addTOCAnchors()` nach `renderMarkdownInContent()` NICHT verschieben, ohne die Sanitizer-Attribut-Allowlist zu prüfen:** siehe Common Pitfalls #1 — sonst bricht die TOC-Funktion lautlos.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| HTML-Sanitisierung am Import | Eigener Regex-basierter Stripper, eigener zweiter DOMParser-Sanitizer | `sanitizeHTML()` (`utils/basic.js`) wiederverwenden | Bereits die einzige geprüfte Implementierung; ein zweiter Sanitizer würde exakt das Drift-Problem reproduzieren, das D-14 für `testable-utils.js` bereits als Bug behandelt |
| `<strike>`-Whitelist-Fix | Neue Attribut-/Tag-Filterlogik | Einzeiler: `'strike'` neben `'s'` in `allowedTags`-Array einfügen (beide Dateien) | Die Whitelist-Struktur existiert bereits identisch in zwei Dateien; der Fix ist Datenänderung, keine Logikänderung |
| On*-Attribut-Stripping im Tabellen-Paste | Neue Attribut-Erkennungs-Regex von Grund auf | Die in `sanitizeHTML()` bereits vorhandenen zwei Regex-Muster (`on\w+\s*=\s*["'][^"']*["']` und `on\w+\s*=\s*[^\s>]*`) in die bestehende Attribut-Strip-Kette von `handleEditorPaste()` (Zeile 963) einfügen | Konsistentes Verhalten mit dem Haupt-Sanitizer; vermeidet eine dritte, leicht abweichende on*-Erkennungslogik im Projekt |

**Key insight:** Diese Phase braucht **keine** neue Sicherheitsinfrastruktur — alle drei Fixes sind Anwendungen/Erweiterungen der bereits vorhandenen `sanitizeHTML()`-Bausteine an zusätzlichen Stellen. Das Risiko liegt nicht im Fehlen von Werkzeug, sondern darin, dass drei bestehende Code-Pfade (Import, Display, Paste) das vorhandene Werkzeug nicht konsequent anwenden.

## Common Pitfalls

### Pitfall 1: `sanitizeHTML()` in `renderMarkdownInContent()` bricht die Wiki-TOC-Sprungmarken (NEUER, nicht in CONTEXT.md benannter Fund)
**What goes wrong:** Der von 01-REVIEW.md vorgeschlagene Minimal-Fix (`sanitizeHTML()` ans Ende von `renderMarkdownInContent()` anhängen) entfernt stillschweigend die `id="toc-N"`-Attribute, die `addTOCAnchors()` (`wiki.js:1011-1017`) vorher in die `<h2>`-`<h4>`-Tags eingefügt hat — `sanitizeHTML()`s `allowedAttributes` (`utils/basic.js:102-126`) enthält kein `id`.
**Why it happens:** `wiki.js:renderWikiDetail()` ruft `addTOCAnchors(entry.content)` (Zeile 423) VOR `renderMarkdownInContent(contentWithAnchors)` (Zeile 427) auf. Nach dem D-01-Fix läuft die Sanitisierung also NACH der Anker-Injektion und entfernt sie wieder.
**How to avoid:** Aufrufreihenfolge in `renderWikiDetail()` umkehren: `renderMarkdownInContent()` zuerst (inkl. Sanitisierung), `addTOCAnchors()` danach auf das bereits sanitisierte Ergebnis anwenden. `addTOCAnchors()` generiert seine `id`-Werte rein codebasiert (`toc-${index++}`, keine Nutzereingabe) — das Anwenden NACH der Sanitisierung ist sicher, weil es kein erneutes HTML-Parsing der Nutzerdaten auslöst, nur einen String-Replace auf bereits bereinigtem Markup.
**Warning signs:** E2E/manueller Test: Wiki-Eintrag mit ≥3 Überschriften anlegen, TOC-Eintrag anklicken — springt der Anker nicht mehr, ist die Reihenfolge falsch. Ein Regressionstest hierfür sollte Teil des Verifikations-Plans sein (bestehendes Feature, nicht in den vier eingefrorenen Editor-Netz-Dateien aus Phase 9 enthalten — unabhängig testbar).

### Pitfall 2: `importDataGlobal()` hat ZWEI Zweige, die beide Sanitisierung brauchen — nicht nur der von WR-03 benannte
**What goes wrong:** WR-03 (01-REVIEW.md) und D-07 beschreiben nur den „Aktuelle Kampagne überschreiben"-Zweig (`Object.assign(D, imp)`, Zeile 573) als Ziel für `saveUndoState()`/Backup. D-01s Sanitisierungs-Pflicht gilt aber für BEIDE Zweige — auch „Als neue Kampagne importieren" (Zeile 530-568, `StorageAPI.setJSON(key, {...imp})`) persistiert dieselben rohen Felder direkt in einen neuen LocalStorage-Key, der nach `location.reload()` normal geladen und gerendert wird.
**Why it happens:** Der Blick fällt naturgemäß auf den Zweig, der in 01-REVIEW.md explizit als WR-03 benannt ist; der zweite Zweig hat kein Undo/Backup-Problem (neue Kampagne, nichts überschrieben), wirkt dadurch „unauffällig", ist aber genauso ungeschützt gegenüber unsanitisierten Daten.
**How to avoid:** Beim Implementieren von D-01s Import-Grenze in `importDataGlobal()` EXPLIZIT beide Zweige abdecken — am saubersten über eine gemeinsame Hilfsfunktion, die auf `imp` angewendet wird, BEVOR die Verzweigung (`if (choice) {...} else {...}`) beginnt (Zeile 530).
**Warning signs:** Ein Test, der nur den Überschreib-Zweig prüft, würde diese Lücke nicht fangen — der Vektor-Katalog (D-15) sollte für den globalen Import beide Modi (`choice: true` / `choice: false`) gegen mindestens einen Payload testen.

### Pitfall 3: `saveSpell()` speichert `description` ungewrapped — In-App-Save-Lücke in der „Rich-Text/innerHTML"-Angriffsfläche
**What goes wrong:** `ui/editors/rich-text.js:1663-1679` liest `descHtml = descEl ? descEl.innerHTML : ''` und speichert es UNVERÄNDERT in `s.description`, während das Feld `note` zwei Zeilen darunter korrekt `sanitizeHTML(noteEl.innerHTML.trim())` durchläuft. Kein Live-Exploit heute (Render-Pfad sanitisiert bereits, siehe Feldliste oben), aber eine Inkonsistenz innerhalb genau der Angriffsfläche, die Success-Criterion 3 (`SECURITY.md` deckt „Rich-Text/innerHTML" ab) benennt.
**Why it happens:** Vorbestehender Bug, in Phase 9 (`09-01-PLAN.md`, Zeile 251) als „AUSSERHALB SCOPE — für Phase 10 SEC-01/SEC-02 vormerken" dokumentiert, nicht in Phase 9 gefixt.
**How to avoid:** Beim Umsetzen der Fixes den Einzeiler mitziehen: `description: descHtml` → `description: sanitizeHTML(descHtml)`, analog zum bestehenden `note`-Feld direkt daneben. Kein neues Testmuster nötig — folgt demselben Muster wie der Wiki-Save-Pfad (`wiki.js:696`).
**Warning signs:** Der `/gsd-secure-phase`-Abschluss-Audit (D-11) wird diesen Fund, falls nicht vorher behoben, als offenes Finding gegen die Rich-Text/innerHTML-Fläche listen — dann müsste er dort ohnehin (Critical/High-Regel D-12) noch in Phase 10 gefixt werden. Direktes Mitfixen spart eine Iteration.

### Pitfall 4: `markdown-converter.test.js` ist vollständig inert — täuscht Testabdeckung vor
**What goes wrong:** Die bestehende Datei `tests/unit/markdown-converter.test.js` (12 `describe`-Blöcke, inkl. eines Blocks „XSS Prevention in Conversion") ruft NIRGENDS die echten Funktionen `markdownToHtml`/`renderMarkdownInContent`/`htmlToMarkdown` auf — alle Assertions prüfen nur den literalen Input-String selbst (z. B. `expect(markdown).toContain('javascript:')` statt eine Funktion aufzurufen und das Ergebnis zu prüfen). Diese Datei liefert **keine reale Regressionsabdeckung** für den D-01-Fix.
**Why it happens:** Vermutlich als Platzhalter/Gerüst angelegt, nie mit echten Aufrufen gefüllt (alle relevanten Zeilen sind auskommentiert, z. B. Zeile 154 `// const html = markdownToHtml(markdown);`).
**How to avoid:** Für D-13/D-14 NICHT diese Datei erweitern in der Annahme, sie biete bereits eine Grundlage. Neue Sicherheitstests müssen nach dem `vm.runInContext`-Muster (D-14, Präzedenz `storage-conflict.test.js`) den echten Quelltext von `markdown-converter.js` und `utils/basic.js` laden — unabhängig von dieser Datei. Diese Datei kann optional parallel repariert werden (out of scope für SEC-01/SEC-02, aber ein guter Kandidat für spätere TEST-Härtung), sollte aber nicht als Nachweis für D-13s Unit-Abdeckung herangezogen werden.
**Warning signs:** `grep -c "markdownToHtml(" tests/unit/markdown-converter.test.js` → 0 Treffer außerhalb von Kommentaren bestätigt die Lücke.

### Pitfall 5: `testable-utils.js`s `sanitizeHTML()` ist aktuell NICHT gedriftet — nur `esc()` ist es
**What goes wrong:** CONCERNS.md warnt allgemein vor Drift zwischen `utils/basic.js` und `utils/testable-utils.js`. Ein direkter Zeile-für-Zeile-Vergleich (dieser Recherche) zeigt: `sanitizeHTML()` ist in beiden Dateien aktuell **identisch** (gleiche `allowedTags`, gleiche `allowedAttributes`, gleiche `cleanNode()`-Logik, gleiche Regex-Vorbereinigung) — die dokumentierte Drift betrifft nachweislich nur `esc()` (`s === 0`-Sonderfall existiert nur in `testable-utils.js`).
**Why it matters for this phase:** D-14s Paritätstest ist trotzdem korrekt und notwendig — er MUSS geschrieben werden, BEVOR D-06 (`<strike>`-Fix) beide Dateien anfasst, damit er als „Zaun" wirkt, der künftige Drift (inkl. eines versehentlich nur in einer Datei angewendeten `<strike>`-Fixes) strukturell verhindert. Aktuell (vor D-06) gibt es zwar noch keine `sanitizeHTML()`-Drift zu entdecken — der Test beweist stattdessen die Absenz von Drift zum jetzigen Zeitpunkt und verhindert sie ab jetzt.
**How to avoid:** Reihenfolge in der Planung beachten: Paritätstest zuerst grün gegen den Ist-Zustand (0 Drift) bringen, DANACH `<strike>` in beiden Dateien synchron ergänzen, Test bleibt grün.

### Pitfall 6: `handleEditorPaste()`s Tabellen-Bereinigung läuft auf einem extrahierten String-Ausschnitt, nicht auf geparsten DOM-Nodes
**What goes wrong:** Die Attribut-Strip-Regex in `handleEditorPaste()` (`rich-text.js:961-989`) arbeitet mit Regex-Ersetzungen auf einem String (`tableMatch[0].replace(...)`), nicht mit `sanitizeHTML()`s DOMParser-Ansatz. Ein einfaches Hinzufügen von on*-Stripping-Regex (D-05) ist die vom User gewählte, minimal-invasive Lösung — sie repariert NICHT die grundsätzliche Fragilität regex-basierter HTML-Bereinigung (z. B. verschachtelte Anführungszeichen könnten die Attribut-Regex umgehen).
**Why it happens:** Der Paste-Handler wurde in Phase 9 bewusst NICHT auf `sanitizeHTML()` umgestellt (Plan-Kriterium „kein Produktionscode geändert" für den Baseline-Fund; D-05 in Phase 10 ist die erste Korrektur).
**How to avoid:** Für D-05 exakt den in CONTEXT.md beschriebenen Scope einhalten (on*-Attribute zusätzlich strippen, keine grundsätzliche Neuarchitektur des Paste-Handlers — das wäre Scope Creep über SEC-01 hinaus). Die vom Editor-Netz (D-16) erwartete Test-Payload sollte konsistent mit dem bestehenden T-09-01-Muster sein: `<table><tr><td><img src=x onerror="...">...</td></tr></table>`, eingefügt via `pasteInto()`-Helper aus `editor-insert.spec.js`.
**Warning signs:** Sollte künftig ein Angreifer eine Attribut-Regex-Umgehung finden (z. B. via HTML-Entities in Attributwerten), wäre das ein Fund für eine spätere, größere Refaktorierung — nicht Teil dieses Phasen-Scopes, aber als „akzeptiertes Restrisiko" in SECURITY.md dokumentierbar (D-08-Nachbarschaft, analog zur `class`/`style`-Breite).

## Code Examples

### Fix D-01a — Anzeige-Grenze (`ui/editors/markdown-converter.js`)

```javascript
// Quelle: 01-REVIEW.md CR-01-Fixvorschlag, verifiziert gegen aktuellen Code (Zeile 258-300)
function renderMarkdownInContent(html) {
    if (!html || typeof html !== 'string') return html;
    let result = html;
    // ... bestehende Markdown-Konvertierungen (Bold/Italic/Strikethrough/Code/Headings/Links) unveraendert ...

    // Defense-in-Depth: identisch zu markdownToHtml() am Ende sanitisieren
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML === 'function') {
        result = sanitizeHTML(result);
    }
    return result;
}
```

### Fix D-01a-Begleitfix — Aufrufreihenfolge in `wiki.js` (Pitfall 1)

```javascript
// VORHER (wiki.js:423-429) — bricht nach obigem Fix die TOC-Anker:
const contentWithAnchors = addTOCAnchors(entry.content || '');
const contentWithMarkdown = renderMarkdownInContent
    ? renderMarkdownInContent(contentWithAnchors)
    : contentWithAnchors;
const parsedContent = parseWikiLinks(contentWithMarkdown);

// NACHHER — Sanitisierung zuerst, Anker-Injektion auf bereits sauberem Markup:
const markdownRendered = renderMarkdownInContent
    ? renderMarkdownInContent(entry.content || '')
    : (entry.content || '');
const contentWithAnchors = addTOCAnchors(markdownRendered);
const parsedContent = parseWikiLinks(contentWithAnchors);
// renderWikiTOC(entry.content) (separate TOC-Liste, Zeile 433) bleibt UNVERAENDERT —
// sie nutzt ihre eigene, unabhaengige extractWikiTOC()-Regex auf dem Rohinhalt und
// generiert dieselben toc-N-IDs deterministisch in derselben Reihenfolge, solange
// addTOCAnchors() weiterhin denselben Regex-Match /<h([2-4])[^>]*>([^<]+)<\/h[2-4]>/gi
// in derselben Dokumentreihenfolge anwendet wie extractWikiTOC() — KEINE Aenderung
// an extractWikiTOC()/renderWikiTOC() noetig.
```

### Fix D-01b — Import-Grenze (`systems/spellslots/import-export.js`)

```javascript
// NEU: zentrale Feldliste (D-02-Audit-Ergebnis, siehe Tabelle oben)
const HTML_FIELDS_BY_TYPE = {
    characters: ['notes'],
    npcs: ['description'],
    locations: ['description'],
    quests: ['description'],
    encounters: ['traits', 'actions', 'skills'],
    spells: ['description'],
    sessionNotes: ['content'],
    wiki: ['content'],
    links: ['description']
};

// NEU: modul-interne Hilfsfunktion (kein window-Export, CLAUDE.md Export Audit Rule)
function sanitizeImportedItem(type, item) {
    const fields = HTML_FIELDS_BY_TYPE[type];
    if (!fields) return item;
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML !== 'function') return item;
    const result = { ...item };
    fields.forEach(field => {
        if (typeof result[field] === 'string') {
            result[field] = sanitizeHTML(result[field]);
        }
    });
    return result;
}

// executeImport() — validatedItems-Map erweitern (Zeile ~292-301):
const validatedItems = importData.data.map((item, idx) => {
    const validated = {};
    for (const [key, field] of Object.entries(schema)) {
        if (field.required && item[key] === undefined) {
            throw new Error(`Eintrag ${idx + 1}: Pflichtfeld "${key}" fehlt`);
        }
        validated[key] = item[key] !== undefined ? item[key] : field.default;
    }
    return sanitizeImportedItem(dataType, validated); // NEU
});

// importDataGlobal() — VOR der choice-Verzweigung (Pitfall 2: beide Zweige!):
Object.entries(HTML_FIELDS_BY_TYPE).forEach(([type, fields]) => {
    if (Array.isArray(imp[type])) {
        imp[type] = imp[type].map(item => sanitizeImportedItem(type, item));
    }
});
// ... danach unveraendert: if (choice) { ... } else { ... }
```

### Fix D-05 — On*-Attribut-Stripping im Tabellen-Paste (`ui/editors/rich-text.js:963`)

```javascript
// VORHER (Zeile 963):
.replace(
    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
    ''
)

// NACHHER — zusaetzliche on*-Attribut-Regex (identisch zu sanitizeHTML()s Vorbereinigung,
// utils/basic.js:63-64) VOR die bestehende Attribut-Liste gesetzt:
.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
.replace(
    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
    ''
)
```

### Fix D-06 — `<strike>`-Whitelist (beide Dateien synchron)

```javascript
// utils/basic.js:72-101 UND utils/testable-utils.js:48-77 — identische Aenderung:
const allowedTags = [
    'b', 'i', 'u', 's',
    'strike', // NEU (D-06) — strikeThrough-Ausgabe der Editor-Migration ueberlebt
              // damit den Speichern/Reload-Zyklus (09-BASELINE.md A4)
    'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'a', 'font'
];
```

### Fix Pitfall 3 — `saveSpell()`-Konsistenzfix (Mitfix empfohlen)

```javascript
// ui/editors/rich-text.js:1678 — VORHER:
description: descHtml,
// NACHHER (analog zu note zwei Zeilen darunter):
description: sanitizeHTML(descHtml),
```

### D-14 — vm.runInContext-Testmuster für neue Security-Tests

```javascript
// Muster aus tests/unit/storage-conflict.test.js, angewendet auf utils/basic.js:
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let sanitizeHTML;
beforeAll(() => {
    // JSDOM-Globals (document, DOMParser, Node) muessen im vm-Context verfuegbar sein —
    // Jest-Testumgebung ist bereits jsdom (jest.config.cjs), diese Globals aus dem
    // Test-eigenen globalThis in den vm-Context durchreichen:
    const context = {
        window: {},
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
        console
    };
    vm.createContext(context);
    const src = fs.readFileSync(path.join(__dirname, '../../utils/basic.js'), 'utf8');
    vm.runInContext(src, context);
    sanitizeHTML = context.sanitizeHTML; // Funktion ist im globalen Scope der Datei deklariert
});

test('entfernt onerror aus img-Tag (Review-Exploit-Vektor, CR-01)', () => {
    const dirty = '<img src=x onerror=alert(document.cookie)>';
    expect(sanitizeHTML(dirty)).not.toMatch(/onerror/i);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Sanitisierung nur beim In-App-Speichern (z. B. `wiki.js:696`), nicht am Import | Sanitisierung an beiden Grenzen (Speichern UND Import UND Anzeige) | Diese Phase (D-01) | Import wird zur gleichrangigen Vertrauensgrenze wie manuelle Eingabe |
| `<strike>` fehlt in der Sanitizer-Whitelist trotz `execCommand('strikeThrough')`-Support | `<strike>` erlaubt, Strikethrough überlebt Speichern/Reload | Diese Phase (D-06), Bug identifiziert in Phase 9 (09-BASELINE.md A4) | Datenintegrität — bisher gingen Nutzer-Formatierungen kommentarlos verloren |
| Tabellen-Paste entfernt nur eine feste Liste harmloser Attribute | Tabellen-Paste entfernt zusätzlich `on*`-Event-Attribute | Diese Phase (D-05), Bug identifiziert in Phase 9 (WINDOWS.md #1) | Schließt einen empirisch bestätigten Ausführungspfad |

**Hinweis zur Architektur-Philosophie (ASVS-Kontext):** Die OWASP ASVS-Leitlinie (V5, Validation/Sanitization/Encoding) empfiehlt idealerweise **kontextsensitives Output-Encoding am Rendering-Zeitpunkt**, während Rohdaten unverändert gespeichert bleiben (Vermeidung von Doppel-Encoding-Problemen) [CITED: OWASP ASVS 5.3, github.com/OWASP/ASVS]. Dieses Projekt weicht davon bewusst und bereits VOR Phase 10 (etabliertes Muster in `wiki.js:696`, `party-crud.js`, `npc-crud.js`) ab: Es sanitisiert BEIM SPEICHERN und speichert bereits bereinigtes HTML. D-01 setzt dieses etablierte Projekt-Muster konsistent auf die Import-Grenze fort (nicht die ASVS-Idealform „nur am Output"). Das ist kein neuer Kompromiss dieser Phase, sondern Fortführung einer bereits vor Phase 10 getroffenen Architekturentscheidung — hier nur zur Einordnung dokumentiert, keine Änderung am Locked Decision D-01 vorgeschlagen.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | DOMPurify wäre der „Industriestandard" für clientseitige Sanitisierung | Standard Stack → Alternativen | Gering — nur als Kontext für SECURITY.md-Begründung genannt, keine Handlungsempfehlung; basiert auf einer WebSearch-Quelle (OWASP-nahe Cheat-Sheet-Seiten), nicht auf offizieller OWASP-ASVS-Seite direkt |
| A2 | `addTOCAnchors()`/`renderWikiTOC()`-Reihenfolgeänderung ist der korrekte, minimal-invasive Fix für Pitfall 1 (statt `id` in `sanitizeHTML()`s Allowlist aufzunehmen) | Common Pitfalls #1, Code Examples | Falls falsch: `id`-Attribute müssten stattdessen in die Sanitizer-Allowlist aufgenommen werden — riskanter, da `id` global (nicht nur bei TOC-Ankern) freigegeben würde und potenziell DOM-Clobbering-Angriffsfläche öffnet, falls künftig ein anderer Konsument `id` aus Nutzerdaten übernimmt. Reihenfolge-Fix ist konservativer und wird empfohlen |

**Alle übrigen Kernaussagen dieses Dokuments (Exploit-Kette, Render-Pfad-Audit, betroffene Zeilennummern, `<strike>`-Lücke, `saveSpell()`-Fund, Testable-Utils-Drift-Status) sind `[VERIFIED: codebase read/grep]` — direkt gegen den aktuellen Quellcode dieses Repositories geprüft, nicht aus Dokumentation übernommen.**

## Open Questions

1. **Soll der `saveSpell()`-Fund (Pitfall 3) als eigener Fix-Task oder als Teil des D-01-Wave gebündelt werden?**
   - What we know: Der Fund ist ein Einzeiler, in Phase 9 explizit für Phase 10 SEC-01/SEC-02 vorgemerkt, betrifft dieselbe Angriffsfläche wie D-01.
   - What's unclear: CONTEXT.md nennt ihn nicht explizit in den Decisions — nur implizit über „Rich-Text/innerHTML"-Audit-Scope (Success Criterion 3).
   - Recommendation: Im selben Plan/Task wie D-01b mitziehen (kein eigener Wave nötig) — sonst würde ihn der Abschluss-Audit (D-11/D-12) ohnehin als Finding melden und einen weiteren Fix-Zyklus erzwingen.

2. **Braucht `renderWikiTOC()`/`extractWikiTOC()` einen eigenen Regressionstest für die Reihenfolge-Änderung (Pitfall 1)?**
   - What we know: Kein bestehender Test deckt die TOC-Sprungmarken-Funktion ab (nicht Teil des eingefrorenen Phase-9-Editor-Netzes, nicht in `tests/e2e/features/wiki.spec.js` erkennbar ohne weitere Prüfung).
   - What's unclear: Ob ein manueller Check ausreicht oder ein automatisierter E2E-Test für dieses bestehende (nicht neue) Feature ergänzt werden sollte.
   - Recommendation: Mindestens ein manueller Verifikationsschritt im Plan (Wiki-Eintrag mit 3 Überschriften, TOC-Klick funktioniert); ein automatisierter Test ist optional (Claude's Discretion, „Plan-/Wellen-Aufteilung der Fixes").

## Environment Availability

Keine externen Laufzeit-Abhängigkeiten für diese Phase — alle benötigten Werkzeuge sind bereits im Projekt etabliert und wurden verifiziert:

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Jest-Unit-Tests, Build | ✓ | v24.14.0 | — |
| Python | `build.py` (Bundle für E2E) | ✓ | 3.14.6 | — |
| Playwright | E2E-Regressionstest (D-13) | ✓ | 1.57.0 | — |

**Missing dependencies:** Keine.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (Unit) | Jest (`jest.config.cjs`) |
| Framework (E2E) | Playwright (`playwright.config.js`, Chromium-only-Projekt) |
| Config file | `jest.config.cjs`, `playwright.config.js` |
| Quick run command | `npx jest tests/unit/security.test.js` bzw. `npx playwright test tests/e2e/features/editor-insert.spec.js` |
| Full suite command | `npm test` (Jest) + `python build.py && npx playwright test` (Playwright, gebautes Bundle erforderlich) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| SEC-01 | `sanitizeHTML()` entfernt Review-Exploit-Vektor (`<img onerror>`) | unit (vm.runInContext gegen `utils/basic.js`) | `npx jest tests/unit/security.test.js` (erweitern) | ⚠ Datei existiert, testet aber `testable-utils.js` — neuer vm-basierter Test-Block nötig, Wave 0 |
| SEC-01 | Import einer bösartigen Kampagnen-JSON → Wiki-Eintrag öffnen → kein Skript-Execute | e2e | `npx playwright test tests/e2e/features/import-security.spec.js` | ❌ Wave 0 — neue Datei |
| SEC-01 | `importDataGlobal()` sanitisiert in BEIDEN Zweigen (Pitfall 2) | unit (vm.runInContext gegen `import-export.js`) | `npx jest tests/unit/import-sanitization.test.js` | ❌ Wave 0 — neue Datei |
| SEC-01 | Paste eines Tabellen-Payloads mit `onerror` wird bereinigt (D-05/D-16) | e2e | `npx playwright test tests/e2e/features/editor-insert.spec.js` | ✅ existiert (T-09-01 wird erweitert, D-16) |
| SEC-01 | `<strike>` überlebt Speichern/Reload-Roundtrip (D-06) | e2e | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ⚠ existiert, aber Teil des eingefrorenen Phase-9-Netzes — Änderung braucht dokumentierte Begründung (Netz-Freeze-Protokoll, `09-BASELINE.md`) |
| SEC-01 | `testable-utils.js` vs. `utils/basic.js` Paritäts-Vektor-Set (D-14) | unit | `npx jest tests/unit/sanitizer-parity.test.js` | ❌ Wave 0 — neue Datei |
| SEC-02 | `/gsd-secure-phase` über Phasen 1, 2, 9, 10 → `SECURITY.md` mit `threats_open: 0` | manual/agent-driven | `/gsd-secure-phase` (kein Jest/Playwright-Befehl — eigenes GSD-Kommando) | N/A — Abschluss-Gate, kein klassischer Testlauf |

### Sampling Rate
- **Per task commit:** `npx jest tests/unit/` (schnell, kein Build nötig) + betroffene Playwright-Spec-Datei gezielt
- **Per wave merge:** `python build.py && npx playwright test` (volle Suite, wie in `09-BASELINE.md`s Doppel-Grün-Muster)
- **Phase gate:** Volle Suite grün (Jest + Playwright) VOR `/gsd-secure-phase`-Abschluss-Audit (D-11: Fixes zuerst, Audit als letzter Schritt)

### Wave 0 Gaps
- [ ] `tests/e2e/features/import-security.spec.js` — deckt den vollständigen Exploit-Ketten-Beweis (Datei-Import → Wiki öffnen → kein Skript-Execute) ab, D-13/D-15
- [ ] `tests/unit/import-sanitization.test.js` — deckt `sanitizeImportedItem()`/`HTML_FIELDS_BY_TYPE` inkl. beider `importDataGlobal()`-Zweige ab (Pitfall 2), D-14
- [ ] `tests/unit/sanitizer-parity.test.js` — Paritätstest `utils/basic.js` vs. `utils/testable-utils.js` über gemeinsames Vektor-Set, D-14
- [ ] Erweiterung von `tests/unit/security.test.js` um vm.runInContext-Block gegen den ECHTEN `utils/basic.js`-Quelltext (bisherige Tests laufen ausschließlich gegen `testable-utils.js`)

*(Bereits vorhanden und wiederverwendbar: `tests/e2e/features/editor-insert.spec.js` mit T-09-01 als Referenzmuster für den Paste-Sicherheitstest, D-16; `tests/unit/storage-conflict.test.js` als vm.runInContext-Vorlage, D-14)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V5 Validation, Sanitization, Encoding | Ja | `sanitizeHTML()` (Allowlist-basierter DOMParser-Sanitizer) für alle HTML-tragenden Felder; `esc()` für reine Textfelder — projekteigen implementiert, kein externes Encoding-Framework (siehe „State of the Art"-Hinweis zur Save-Time- vs. Render-Time-Sanitisierung) |
| V1/V11 Business Logic / Data Protection (Import-Vertrauensgrenze) | Ja | Import-Datei wird als untrusted Input behandelt (10MB-Limit bereits vorhanden, `import-export.js:262`); Schema-Validierung (`IO_SCHEMA`) plus neue Feld-Sanitisierung als zweite Kontrollschicht |
| V4 Access Control | Nein | Keine Authentifizierung/Autorisierung in dieser Single-User-Offline-App (kein Backend, kein Multi-User-Modell) |
| V2 Authentication | Nein | Kein Login-System |
| V3 Session Management | Nein | Kein Server-Session-Konzept; LocalStorage/IndexedDB sind reine Client-Persistenz |
| V6 Cryptography | Nein | Keine Verschlüsselung im Scope dieser Phase; Kampagnendaten sind unverschlüsselt lokal gespeichert (bestehendes, unverändertes Modell) |
| V14 Configuration (CSP) | Ja, aber bewusst deferred | D-08: keine CSP-Einführung in v1.1, dokumentiert als akzeptiertes Risiko in SECURITY.md mit Begründung (Single-User-Offline, `'unsafe-inline'` architekturbedingt nötig) |

### Known Threat Patterns for diesen Stack (Non-ESM Client-Only SPA)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Stored XSS über Import-Datei (CR-01) | Tampering / Elevation of Privilege (Skript-Ausführung im Nutzer-Kontext) | `sanitizeHTML()` an Import- UND Anzeige-Grenze (D-01) |
| Stored XSS über Rich-Text-Paste (Broken-Windows #1) | Tampering | `on*`-Attribut-Stripping in `handleEditorPaste()` (D-05) |
| Reflected/Stored XSS über generische `innerHTML`-Zuweisungen ohne `esc()`/`sanitizeHTML()` (CONCERNS.md „dominant risk class") | Tampering | Bereits etabliertes Muster (esc/sanitizeHTML an ~64 Stellen) — kein neuer Fund in dieser Recherche außerhalb der oben gelisteten drei Lücken |
| Datenintegritätsverlust durch übermäßig strenge Sanitisierung (`<strike>`-Whitelist-Lücke) | (kein STRIDE-Sicherheitsthema, aber angrenzend behandelt) | D-06: Whitelist-Erweiterung synchron in beiden Sanitizer-Kopien |
| Silent Data Loss durch fehlendes Undo/Backup bei destruktivem Import (WR-03) | (Verfügbarkeit/Data-Loss, nicht klassisch STRIDE) | `saveUndoState()` + `createAutoBackup()` vor `Object.assign(D, imp)` (D-07) |

### Angriffsflächen-Zuordnung für SEC-02 (D-09, bestätigt)

| Angriffsfläche | Phase | Verifizierter Bezug |
|------------------|-------|------------------------|
| Import/Export | Phase 1 (Stabilisierung) | `systems/spellslots/import-export.js` als Feature in Phase 1 eingeführt/gehärtet (CR-01 aus `01-REVIEW.md`) |
| Storage/IDB | Phase 1 | `systems/spellslots/persistence.js`, `quick-roll.js` (CR-01-Rekursions-Fix, Stale-Shadow-Dokumentation) |
| Datei-Backup | Phase 2 (PWA/Backup) | `systems/backups.js`, File System Access API-Integration |
| Rich-Text/innerHTML | Phase 9 (Editor-Migration) + Phase 10 (diese Fixes) | `ui/editors/rich-text.js` (execCommand-Ablösung), `saveSpell()`-Fund aus Phase 9 vorgemerkt |

## Sources

### Primary (HIGH confidence — direkt am Quellcode verifiziert)
- `ui/editors/markdown-converter.js` — vollständig gelesen, Zeilen 1-308
- `utils/basic.js` — vollständig gelesen, Zeilen 1-357 (`sanitizeHTML()`, `esc()`)
- `utils/testable-utils.js` — vollständig gelesen, Zeilen 1-471 — Zeile-für-Zeile-Vergleich mit `utils/basic.js`s `sanitizeHTML()` durchgeführt
- `systems/spellslots/import-export.js` — vollständig gelesen, Zeilen 1-648 (`IO_SCHEMA`, `executeImport()`, `importDataGlobal()`)
- `features/wiki/wiki.js` — Render-Kette (`renderWikiDetail`, `addTOCAnchors`, `parseWikiLinks`, `extractWikiTOC`, `renderWikiTOC`, `saveWikiEntry`) gelesen
- `ui/editors/rich-text.js` — `handleEditorPaste()`, `insertHtmlAtSelection()`, `saveSpell()`, Font/Größen-Migrationslogik gelesen
- Grep über alle `renderMarkdownInContent`-Konsumenten (`encounters-render.js`, `quests-render.js`, `locations-render.js`, `sessions.js`, `npc-popup.js`, `render-spells.js`) sowie über `.description`/`.notes`-Render-Sites in `npcs/`, `party/`, `shops/`, `entity-links.js`
- `.planning/phases/01-stabilisierung/01-REVIEW.md` (CR-01, WR-03)
- `.planning/WINDOWS.md` (Ledger-Eintrag #1)
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` (A4, empirische Messwerte)
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-01-PLAN.md` (`saveSpell()`-Fund-Vermerk)
- `.planning/codebase/CONCERNS.md` (Security Considerations, Test Coverage Gaps)
- `tests/unit/storage-conflict.test.js`, `tests/unit/security.test.js`, `tests/unit/markdown-converter.test.js` — vollständig/teilweise gelesen
- `.github/workflows/ci.yml` — vollständig gelesen (e2e-Job-Struktur, Blockier-Kette)
- `.planning/config.json` — `workflow.nyquist_validation: true` bestätigt

### Secondary (MEDIUM confidence)
- [OWASP ASVS V5 — Validation, Sanitization, Encoding](https://github.com/OWASP/ASVS/blob/master/4.0/en/0x13-V5-Validation-Sanitization-Encoding.md) — Kontext für „State of the Art"-Einordnung (Save-Time- vs. Render-Time-Sanitisierung)
- [OWASP Annotated ASVS 5.3 — Output Encoding and Injection Prevention](https://owasp-aasvs4.readthedocs.io/en/latest/V5.3.html) — Kontext-abhängiges Encoding als Ideal-Empfehlung

### Tertiary (LOW confidence)
- Keine — alle sicherheitsrelevanten Aussagen dieses Dokuments basieren auf direkter Codeverifikation oder offiziellen OWASP-Quellen.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — keine neuen Abhängigkeiten, ausschließlich Wiederverwendung verifizierten Bestandscodes
- Architecture (Exploit-Kette, Render-Pfad-Audit): HIGH — jede Zeile der Kette wurde am Quellcode gelesen, nicht aus 01-REVIEW.md übernommen (01-REVIEW.md wurde als Ausgangspunkt genutzt, aber jede Behauptung gegen den AKTUELLEN Code re-verifiziert, inkl. der über CONTEXT.md hinausgehenden Zusatzfunde TOC-Regression und `saveSpell()`)
- Pitfalls: HIGH — alle sechs Pitfalls sind empirisch aus dem Code abgeleitet (keine Spekulation), zwei davon (#1, #3) sind neue, in CONTEXT.md nicht explizit benannte Funde dieser Recherche

**Research date:** 2026-07-25
**Valid until:** Bis zur nächsten Änderung an `ui/editors/markdown-converter.js`, `systems/spellslots/import-export.js`, `utils/basic.js` oder `ui/editors/rich-text.js` (Code-lastige Recherche, kein Ablaufdatum im klassischen Sinn — bei Codeänderung an diesen Dateien vor Planung erneut gegenprüfen)
