---
phase: "13"
slug: "h-rtung-wartbarkeit"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-09-07"
retroactive: true
---

# Phase 13 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> **Retroaktiv erstellt am 2026-09-07.** Die Phase wurde am 2026-09-06 abgeschlossen, ihr
> `verify:post`-Schritt `secure-phase` lief aber nie — der Milestone-Audit v1.2 hat die
> fehlende Datei aufgedeckt. Register aus den `<threat_model>`-Bloecken aller zwoelf
> PLAN-Dateien (T-13-01..T-13-55) plus der in jedem Plan wiederholten Lieferketten-Pruefung
> (T-13-SC, 12x). Gegen den Live-Baum verifiziert, nicht gegen die SUMMARY-Behauptungen.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| `data-action`-Attribut → `UIActions.call` | Ein HTML-Attribut benennt eine aufzurufende globale Funktion — die zentrale Erhoehungsgrenze dieser Phase | Funktionsname als String (`ctx.value`) |
| Nutzertext → `sanitizeHTML()` / `parseWikiLinks()` / `renderMarkdownInContent()` | Wiki- und Markdown-Inhalte werden zu HTML gerendert | Freitext mit potenziellem Markup |
| Zwischenablage → Editor | Eingefuegtes HTML durchlaeuft eine Bereinigungskette | Fremdes, beliebig strukturiertes HTML |
| Quelldatei A → Quelldatei B (Modulaufteilung) | Der eigentliche Arbeitsinhalt der Phase: Code wandert zwischen Dateien; Escaping, `pushUndo()`, `window.`-Exporte und Ladereihenfolge koennen dabei verlorengehen | Verhalten, nicht Daten |
| IndexedDB-Store → Auswertungs-UI | Wuerfelstatistik-Aggregation | Notationen inkl. Charakternamen |
| Externe Registry → `package.json`/`package-lock.json` | Abhaengigkeiten | npm-Pakete (T-13-SC) |

---

## Threat Register

67 Bedrohungen gesamt: T-13-01..T-13-55 plus T-13-SC (12 identische Lieferketten-Eintraege,
je einer pro Plan). **Alle CLOSED.** Vollstaendige Belege im Audit-Anhang unten; die Tabelle
fasst nach Gruppen zusammen, weil die Aufteilungs-Bedrohungen (T-13-34..T-13-55) sich stark
wiederholen.

| Threat ID | Category | Component | Severity | Disposition | Mitigation (verifiziert) | Status |
|-----------|----------|-----------|----------|-------------|--------------------------|--------|
| T-13-01 | Elevation of Privilege | `UIActions.call` | high | mitigate | `ui/actions/ui-actions.js:186` gated jeden `window[ctx.value]`-Aufruf gegen `CALL_ACTION_WHITELIST` (`core/constants.js:563`); `event-delegation.test.js` 8/8 gruen inkl. Abgleich gegen den Live-Quellbaum | closed |
| T-13-02 | Tampering | Guard-Platzierung | high | mitigate | Der Guard sitzt an der Aufrufstelle selbst, nicht nur vorgelagert in `sanitizeHTML()` | closed |
| T-13-03 | Information Disclosure | Fehlerpfad der `call`-Aktion | low | mitigate | **Mechanismus bewusst geaendert** — siehe Abweichungsnotiz unten | closed |
| T-13-04 | Denial of Service | Vollstaendigkeit der Whitelist | medium | mitigate | Testfall „CALL_ACTION_WHITELIST deckt jedes im Quellbaum gefundene call-Ziel ab" gruen | closed |
| T-13-05 | Tampering | `parseWikiLinks()` | high | mitigate | `features/wiki/wiki-crud.js:106-107` — dieselbe `esc(linkText)`-Ausgabe fuer `data-value`-Attribut und sichtbaren Textknoten | closed |
| T-13-06 | Tampering | Reihenfolgeabhaengigkeit `sanitizeHTML()` | high | mitigate | Kommentar korrigiert; das Escaping ist selbsttragend | closed |
| T-13-07 | Tampering | `href` aus `prompt()` | medium | **accept** | `ui/actions/system-actions.js:80,100` — unverandert wie akzeptiert; Bedingung (Einzelnutzer-Offline-App) gilt weiter | closed |
| T-13-08 | Information Disclosure | Doppeltes `data-id` | low | mitigate | `features/wiki/wiki.js:391` — genau ein `data-id` je `wiki-tree-item` | closed |
| T-13-09 | Information Disclosure | Unterstrich-Regeln | low | mitigate | `ui/editors/markdown-converter.js:280-290` — `(?<!\w)`/`(?!\w)`-Lookarounds vorhanden | closed |
| T-13-10 | Tampering | Abschliessendes `sanitizeHTML()` | high | mitigate | `markdown-converter.js:315-317` unveraendert, laeuft weiterhin | closed |
| T-13-11 | Tampering | Entfernen von `hasHtmlTags` | medium | mitigate | `grep -c hasHtmlTags` → 0 | closed |
| T-13-12 | Denial of Service | `initPerformanceMonitoring()` | medium | mitigate | Modulweiter Interval-Handle + `clearInterval`-Guard; `backups.test.js` gruen | closed |
| T-13-13 | Elevation of Privilege | `window[renderFn]()` | medium | mitigate | `grep "window\[.*\]()" systems/tab-registry.js` → 0; nur noch deferred references (MAINT-02) | closed |
| T-13-14 | Tampering | Toter `mindmap`-Seed | low | mitigate | `grep mindmap systems/backups.js tools/debug.js` → 0 | closed |
| T-13-15 | Tampering | `const D`-Ueberschattung | low | mitigate | `grep "const D" features/soundboard/soundboard-player.js` → 0 | closed |
| T-13-16 | Tampering | 21 Widget-Renderer | high | mitigate | `dmscreen-characterization.test.js --ci` → 51 Tests / 50 Snapshots unveraendert | closed |
| T-13-17 | Repudiation | Snapshot-Aktualisierung statt Befund | high | mitigate | `--ci`-Lauf schreibt 0 Snapshots | closed |
| T-13-18 | Denial of Service | Nichtdeterminismus im Snapshot | medium | mitigate | Wiederholungslauf deterministisch gruen | closed |
| T-13-19 | Denial of Service | Fest verdrahteter Dateipfad | medium | mitigate | Sandbox leitet die Dateiliste aus `loader.js` MODULES ab | closed |
| T-13-20 | Tampering | `utf8ByteLength()` als Blob-Ersatz | high | mitigate | `utils/basic.js:266`, verdrahtet in `_measureDataByteLength()` an beiden Save-Aufrufstellen (`persistence.js:37,50,213`) | closed |
| T-13-21 | Denial of Service | Unbegrenzter Undo-Stack | medium | mitigate | `systems/undo.js:12-20` `enforceUndoByteBudget()`; Grenzwerte `core/config.js:32,35` | closed |
| T-13-22 | Repudiation | `_notifyPostSaveHooks()`-Position | high | mitigate | An allen dokumentierten Erfolgspunkten vorhanden (`persistence.js:83,96,123,223,243,253`) | closed |
| T-13-23 | Denial of Service | Dedupe unterdrueckt noetigen Snapshot | medium | mitigate | Zeichengenauer Dedupe-Test in `stability.test.js` gruen | closed |
| T-13-24 | Denial of Service | Unbegrenzter `diceStats`-Store | high | mitigate | `core/config.js:47` `DICE_STATS_MAX_RECORDS: 50000`; `enforceStatsCap()` verdraengt aelteste zuerst | closed |
| T-13-25 | Denial of Service | Vollladen bei jeder Auswertung | high | mitigate | `getStatsAggregate()` cursor-basiert; `getAllStats` nur noch im Migrations-/Exportpfad | closed |
| T-13-26 | Repudiation | Stille Verdraengung von Langzeitdaten | high | mitigate | Rein anzahlbasiert, kein Zeitkriterium in `enforceStatsCap()` | closed |
| T-13-27 | Tampering | Zwei Kopien der d20-Regel | medium | mitigate | `_classifyD20Roll()` geteilt, aufgerufen ueber `window._classifyD20Roll` (`dice-stats-idb.js:172-174`) | closed |
| T-13-28 | Tampering | Charakternamen im Auswertungs-HTML | medium | **accept** | `dice-stats-render.js:343-344` — `esc(name)` weiterhin vorhanden | closed |
| T-13-29 | Information Disclosure | 81 ungefilterte Konsolenaufrufe | medium | mitigate | `console-hygiene.test.js` 5/5 gruen | closed |
| T-13-30 | Repudiation | Irrefuehrende Kopfkommentare | high | mitigate | `file-backup-manager.js:6,675,684-689` beschreiben `registerPostSaveHook()` | closed |
| T-13-31 | Denial of Service | Verlorene Diagnosefaehigkeit | high | mitigate | `debugLogAdd()` als Umleitungsziel vorhanden | closed |
| T-13-32 | Tampering | Selbst-entwertender Pruftest | medium | mitigate | Marker-Ausschlusslogik des Hygiene-Tests gruen | closed |
| T-13-33 | Tampering | Zweite Geltungsbereichsliste | medium | mitigate | Test leitet den Geltungsbereich live aus `loader.js` MODULES ab | closed |
| T-13-34 | Tampering | Verlorene Escaping-Reihenfolge beim Verschieben | high | mitigate | `parseWikiLinks()` in `wiki-crud.js` unveraendert, Aufrufreihenfolge erhalten | closed |
| T-13-35 / T-13-40 / T-13-47 | Denial of Service | Verlorene `window.`-Exporte beim Verschieben | high | mitigate | Exportzahlen vor/nach dem Split gezaehlt: Wiki 2+26=**28**, Initiative 18+8+12=**38**, Rich-Text 6+3+2+15=**26** — je unveraendert | closed |
| T-13-36 / T-13-42 / T-13-54 | Tampering | Funktion bleibt in zwei Dateien stehen | medium | mitigate | `python build.py` Exit 0 — `check_duplicate_functions()` wuerde vor dem Buendeln hart abbrechen | closed |
| T-13-37 | Tampering | Zweite Modulliste in `build.py` | medium | mitigate | `grep -c wiki build.py` → 0 (SSoT aus `loader.js`, ARCH-01) | closed |
| T-13-38 | Repudiation | Behauptetes statt gelaufenes Suiten-Gate | high | mitigate | Eigene Messung deckt sich mit der SUMMARY-Behauptung (Jest 1120, Playwright 321/2 uebersprungen) | closed |
| T-13-39 | Tampering | Verlorener `pushUndo()` in `removeLoot()` | high | mitigate | `features/initiative-loot.js:368` — `window.pushUndo('Beute entfernt')` vorhanden | closed |
| T-13-41 | Denial of Service | Ladezeit-Zeile ohne ihre Abhaengigkeit | medium | mitigate | `debounce(updateAoETargetDisplay, …)` am selben Ort (`initiative-combat-widgets.js:601`), Datei nach `core/constants.js` registriert | closed |
| T-13-43 / T-13-55 | Repudiation | Stehengebliebene, falsche `.d.ts` | medium | mitigate | `npx tsc --noEmit` Exit 0 | closed |
| T-13-44 | Tampering | Zerrissene Bereinigungskette beim Einfuegen | high | mitigate | `handleEditorPaste`, `sanitizeInsertedInlineStyle`, `insertHtmlAtSelection`, `escapeHtml` alle in `rich-text-insert.js`; der Einfuege-Verdopplungs-Fix (`__dndEditorPasteHandled`, `e6cd20d`/`7dab71a`) intakt (Zeile 303-304) | closed |
| T-13-45 | Tampering | Rueckkehr der `execCommand`-API | high | mitigate | `grep -rn "document\.execCommand"` → 0 Treffer im gesamten Quellbaum | closed |
| T-13-46 | Denial of Service | Geteilter Editor-Zustand, falsche Ladereihenfolge | high | mitigate | `rich-text.js` zuerst registriert (`loader.js:159`), Zustandsvariablen dort | closed |
| T-13-48 | Repudiation | Aufgeweichte 800-Zeilen-Grenze | medium | mitigate | `wc -l` ueber alle 14 Aufteilungsdateien: Maximum **673**, alle ≤ 800 | closed |
| T-13-49 | Tampering | Verlorenes Phase-9-Wissen im Kommentar | medium | mitigate | Vollstaendiger Erklaerkommentar in `rich-text-insert.js:106-225` erhalten | closed |
| T-13-50 | Tampering | Verlorener `esc()` in einem Widget-Renderer | high | mitigate | Charakterisierungs-Snapshot (50/50) nach dem Split unveraendert — ein verlorener `esc()` haette die Ausgabe geaendert | closed |
| T-13-51 | Repudiation | Nachgezogener statt untersuchter Snapshot | high | mitigate | `--ci`-Lauf schreibt 0 Snapshots | closed |
| T-13-52 | Denial of Service | Doppelte/verlorene `registerPostSaveHook()` | high | mitigate | Genau eine aktive Registrierung (`dmscreen-render.js:155-156`) | closed |
| T-13-53 | Denial of Service | Unvollstaendige Widget-Registry | high | mitigate | Registry-Schluesselliste im Snapshot unveraendert; `getDMScreenWidgets()` (`dmscreen-render.js:311`) | closed |
| T-13-SC (×12) | Tampering | Lieferkette (npm/pip) | low | accept | `git diff cc75339 HEAD -- package.json`: kein Phase-13-Commit beruehrt Abhaengigkeiten; `package-lock.json` unberuehrt | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Disposition: mitigate (Umsetzung noetig) · accept (dokumentiertes Restrisiko) · transfer (Dritte)*

---

## Abweichungsnotiz: T-13-03 — Mechanismus bewusst umgestellt

Der Plan sah vor, das Verwerfen eines Nicht-Whitelist-Ziels **nur unter `DEBUG_MODE`** zu
protokollieren. Der Live-Code (`ui/actions/ui-actions.js:186-197`) protokolliert
**unbedingt** ueber `ErrorHandler.log()`. Die Umstellung ist kein Versehen, sondern ein
dokumentierter Folgefix: `01da4f1 fix(13-review): WR-02 — restore dispatch-error visibility,
unconditional security logging`, mit Begruendung direkt im Code-Kommentar — ein geblockter
Call ist sicherheitsrelevant und muss auch im Produktions-Build sichtbar sein; der
`DEBUG_MODE`-Guard war zugleich redundant (`ErrorHandler.log()` routet ohnehin unbedingt
nach `console.error`) und strenger als noetig.

**Bewertung: CLOSED, nicht blockierend.** Der offengelegte Wert (`ctx.value`) steht ohnehin
als `data-value`-Attribut im HTML derselben Seite — es ueberquert kein Geheimnis eine
Vertrauensgrenze. Severity `low`, weit unter `block_on: high`. Festgehalten, weil der
Plantext und der Code auseinanderlaufen und das sichtbar bleiben soll.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-13-01 | T-13-07 | `href` aus `prompt()` bleibt unvalidiert — Einzelnutzer-Offline-App ohne fremde Eingabequelle; Bedingung unveraendert gueltig | Plan 13-02 (disposition: accept) | 2026-09-07 |
| R-13-02 | T-13-28 | Charakternamen aus `notation` im Auswertungs-HTML — durch `esc()` abgesichert, seit Phase 7 unveraendert | Plan 13-07 (disposition: accept) | 2026-09-07 |
| R-13-03 | T-13-SC | Keine Abhaengigkeitsaenderung in dieser Phase; Lieferkettenrisiko bleibt auf dem Stand vor der Phase | alle 12 Plaene (disposition: accept) | 2026-09-07 |

*Accepted risks do not resurface in future audit runs.*

---

## Unregistrierte Befunde (bereits geschlossen)

Zwei Punkte kamen im Code-Review (`13-REVIEW.md`) aus **neu geschriebener** (nicht
verschobener) Logik und standen nicht im urspruenglichen Register. Beide sind durch eigene
Folge-Commits behoben und daher keine offenen Luecken:

| Befund | Beschreibung | Geschlossen durch |
|--------|--------------|-------------------|
| WR-01 | `insert-link` erzeugte bei zusammengefallener Auswahl einen leeren Anker | `25a06fd` |
| WR-02 | Entfernter Konsolen-Fallback / `DEBUG_MODE`-gegatetes Sicherheits-Logging | `01da4f1` (zugleich Ursprung der T-13-03-Abweichung oben) |

---

## Abgrenzung: PERF-01 / Erfolgskriterium 2

Der Roadmap-Wortlaut „weder Undo-Snapshot noch Save serialisiert bei jeder Operation die
vollstaendige Kampagne" ist woertlich weiterhin nicht erfuellt — `pushUndo()` ruft bei jedem
Aufruf `JSON.stringify(window.D)`. **Das ist keine STRIDE-Bedrohung dieses Registers** und
gehoert nicht in diese Datei. Es ist als Verifikations-Override behandelt und **formal
freigegeben**: `13-VERIFICATION.md` fuehrt einen `overrides:`-Block mit
`accepted_by: maintainer`, `accepted_at: "2026-09-06"` und ausformulierter Begruendung
(vorab benannte Abweichung D-10, Abnahmebedingung „einstellige Millisekunden", Messung
0,922 ms Median in `13-PERF-MEASUREMENT.md`). Hier nur zur Vollstaendigkeit vermerkt.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 67 (55 nummeriert + 12× T-13-SC) | 67 | 0 | gsd-security-auditor (sonnet), ASVS L1, orchestrator-gegengeprueft |

**Methode:** Register aus den `<threat_model>`-Bloecken aller zwoelf Plaene extrahiert
(55 nummerierte Eintraege + die je Plan wiederholte Lieferkettenpruefung). Der Auditor hat
jede Bedrohung gegen den Live-Baum verifiziert und dabei die zitierten Waechter-Tests
tatsaechlich ausgefuehrt statt nur gelesen (u. a. `dmscreen-characterization.test.js --ci`,
`event-delegation.test.js`, `console-hygiene.test.js`). Der Orchestrator hat anschliessend
die T-13-03-Abweichung und die PERF-01-Override-Frage im Quelltext gegengeprueft.

**Schwerpunkt dieser Phase:** die eigentliche Taetigkeit war das **Verschieben** von Code
zwischen Dateien. Entsprechend zielen 22 der 55 Bedrohungen (T-13-34..T-13-55) auf das, was
beim Verschieben verlorengehen kann — Escaping, `pushUndo()`, `window.`-Exporte,
Ladereihenfolge, Widget-Registry. Alle durch Zaehlvergleiche vor/nach dem Split oder durch
den Charakterisierungs-Snapshot belegt.

**Keine `## Threat Flags` in den zwoelf SUMMARY-Dateien** — kein Executor hat neue
Angriffsflaeche gemeldet.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (0 auf Stufe `high`, 0 auf jeder Stufe)
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-07 (retroaktiv)
