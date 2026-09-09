---
phase: 15-befundlage-vorlauf
reviewed: 2026-09-09T16:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md
  - Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md
  - Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md
  - Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/README.md
  - CLAUDE.md
  - assets/styles/bestiary.css
  - assets/styles/command-palette.css
  - assets/styles/core.css
  - assets/styles/dashboard.css
  - assets/styles/dice.css
  - assets/styles/dmscreen.css
  - assets/styles/editors.css
  - assets/styles/encounters.css
  - assets/styles/initiative.css
  - assets/styles/loot.css
  - assets/styles/migration.css
  - assets/styles/npcs.css
  - assets/styles/party.css
  - assets/styles/pwa.css
  - assets/styles/spells.css
  - assets/styles/tools.css
  - assets/styles/variables.css
  - assets/styles/welt.css
  - assets/templates/modals-editors.html
  - core/constants.js
  - features/dice/dice-core.js
  - features/party/party-render.js
  - package.json
  - tests/e2e/features/computed-style-diff.spec.js
  - tests/e2e/features/design-fixes.spec.js
  - tests/unit/css-usage-report.test.js
  - tests/unit/design-consistency.test.js
  - tests/unit/docs-consistency.test.js
  - tools/css-usage-report.js
findings:
  critical: 4
  warning: 7
  info: 6
  total: 17
status: issues_found
---

# Phase 15: Code-Review-Bericht (Nachprüfung nach `--gaps-only`)

**Geprüft:** 2026-09-09
**Tiefe:** standard
**Geprüfte Dateien:** 34
**Status:** issues_found

## Zusammenfassung

Diese Nachprüfung folgt auf die beiden Lückenschluss-Pläne 15-09 (Erkennungs-Erweiterung in
`tools/css-usage-report.js`, Wiederherstellung von `.npc-grid`/`.list-view-container`) und
15-10 (CSS-Dateizahl in `CLAUDE.md`, neuer Wächter `tests/unit/docs-consistency.test.js`).

**15-10 ist sauber.** Die Zahl ist an allen drei Stellen 20, der Struktur-Codeblock listet
20 Einträge in exakt der `@import`-Reihenfolge des Hubs, und der Wächter kann nicht leer
durchlaufen: DOC-02 verlangt `claims.length >= 3`, DOC-03/04 verlangen genau EINEN
Struktur-Block, und DOC-04 vergleicht per `toEqual` auf Zeichenketten-Arrays, also
vollständige Namensgleichheit statt Teilstring. Alle vier Fälle laufen grün gegen den
echten Baum. Ein Rest bleibt (WR-03).

**15-09 ist nur zur Hälfte geschlossen.** Die vier neuen Testfälle sind grün, aber sie
prüfen ausschließlich die *einzeiligen* Formen. Der neue gemeinsame Leser
`scanBalancedSegment()` bricht bei jedem Zeilenumbruch ab (Z. 304), und die drei neu
erkannten Kontexte decken nur einen Teil der im Baum tatsächlich verwendeten Formen ab.
Ich habe die Erkennung gegen den kompletten Baum und gegen den Löschstand nachgemessen
(`collectCssClasses()` auf `44a604f^` gegen `HEAD`): **547 Klassen haben in dieser Phase
ihre CSS-Regel verloren; sechs Klassenfamilien davon werden nachweislich zur Laufzeit
gesetzt, vier davon in erreichbaren Codepfaden.** Das sind echte, ausgelieferte
Darstellungs- und Funktionsregressionen (CR-01), keine hypothetischen.

Der Grund, warum sie nicht auffielen, ist selbst ein Befund: der als „dritte
Nachweissäule" eingeführte `computed-style-diff.spec.js` kann Entfernungen strukturell
nicht sehen und überschreibt seine eigene Vergleichsdatei bei jedem Lauf (CR-04).

## Übernommene, weiterhin offene Befunde aus dem vorigen Bericht

Der vorige `15-REVIEW.md` (4 Befunde) wird von dieser Datei ersetzt. Stand seiner Befunde:

| ID (alt) | Titel (gekürzt) | Stand heute |
| --- | --- | --- |
| CR-01 | `collectLiveTokens()` übersieht `.className = <Ternary>` und `containerClass:`/`className:` | **teilweise geschlossen** — einzeilige Form erkannt, `.npc-grid`/`.list-view-container` wiederhergestellt; mehrzeilige Form, Variablen-Zuweisung und `${…}`-Interpolation weiterhin blind, und die bereits gelöschten Regeln wurden nicht nachträglich gegen die neue Erkennung gehalten → fortgeführt als **CR-01/CR-02/CR-03** unten |
| WR-01 | `CLASS_LIST_CALL_RE` schneidet an der ersten `)` ab | **geschlossen** — `scanBalancedCallArgs()` liest jetzt klammertief; Regressionstest vorhanden. Einschränkung: bricht ebenfalls am Zeilenumbruch ab (siehe CR-02) |
| WR-02 | `renderCompactSpellSlots()` dupliziert `renderSpellSlotPips()` | **unverändert offen** → fortgeführt als **WR-02** |
| IN-01 | `npm run css-usage:check` nicht grün, nicht in CI | **unverändert offen** → fortgeführt als **IN-01** |

---

## Critical

### CR-01: Lückenschluss unvollständig — sechs Klassenfamilien bleiben fälschlich gelöscht, vier davon mit Laufzeitwirkung

**Dateien:** `assets/styles/loot.css`, `assets/styles/welt.css`, `assets/styles/initiative.css`,
`assets/styles/npcs.css`, `assets/styles/dashboard.css` (Löschungen in den Commits `4ed26ad`,
`c83b8cc`, `2fc147e`, `e743f8d`, `a37e17e`)

**Problem:**

Plan 15-09 hat die Erkennung erweitert, aber die bereits in Plan 15-07 gelöschten Regeln nur
für die ZWEI im vorigen Bericht namentlich genannten Klassen nachgeprüft. Eine Gegenprobe des
gesamten Löschstands gegen die neue Erkennung wurde nicht gefahren. Ich habe sie nachgeholt
(`collectCssClasses()` auf `44a604f0…^` vs. `HEAD`, danach `collectLiveTokens()` über
`features/ systems/ ui/ core/ render/ utils/ assets/templates/`):

**Mit Laufzeitwirkung (echte Regressionen):**

1. **`.shop-meta-tag`, `.shop-meta-tag:hover`, `.shop-meta-tag.npc`, `.shop-meta-tag.location`**
   (`loot.css`, gelöscht in `4ed26ad`) — gesetzt in `features/shops/shops-core.js:410-411` über
   `renderEntityLink(..., { className: 'shop-meta-tag npc' })` aus **`renderShops()`**, dem
   Haupt-Renderer der Shops-Ansicht. Die NPC-/Ort-Chips im Shop-Kopf verlieren Pillenform,
   Innenabstand, Schriftgröße, Hintergrund und die Farbcodierung (lila/cyan); es bleibt nur die
   generische `.entity-link`-Unterstreichung aus `core.css:719`. Diese Form (`className:`-Schlüssel)
   erkennt das Werkzeug **seit 15-09 selbst als lebendig** — die Regel ist trotzdem noch gelöscht.
2. **`.si-unavailable { opacity: 0.5; }`** (`loot.css`, gelöscht in `4ed26ad`) — gesetzt in
   `features/shops/shops-core.js:596` als
   `class="si-item … ${isAvailable ? '' : 'si-unavailable'} …"`. Nicht verfügbare Shop-Artikel
   werden nicht mehr abgedunkelt. Die verbliebene Regel `loot.css:476` (`.si-unavailable .si-name`)
   ist ein Nachfahrenselektor und ersetzt die Deckkraft nicht.
3. **`.fr-hist-plus { color: var(--green); }` / `.fr-hist-minus { color: var(--red); }`**
   (`welt.css`, gelöscht in `c83b8cc`) — gesetzt in
   `features/fraktionen/fraktionen-render.js:215` (`var deltaClass = delta >= 0 ? 'fr-hist-plus'
   : 'fr-hist-minus';`) und ausgegeben in Z. 218. Die Ruf-Historie einer Fraktion zeigt Zu- und
   Abnahmen jetzt einfarbig; die Grün-/Rot-Unterscheidung ist weg.
4. **`.init-mob-dmg-inputs`, `.init-mob-dmg-inputs.hidden`, `.init-mob-dmg-inputs input`**
   (`initiative.css`, gelöscht in `2fc147e`) — gesetzt in `features/initiative-mob.js:165`
   (`var dmgInputsClass = isDmgRegel ? 'init-mob-dmg-inputs' : 'init-mob-dmg-inputs hidden';`),
   ausgegeben in Z. 189. **Das ist keine reine Kosmetik:** die gelöschte Regel
   `.init-mob-dmg-inputs.hidden { display: none; }` war der einzige Ausblendmechanismus, und im
   ganzen `assets/styles/`-Baum existiert **keine** generische `.hidden`-Regel mehr (nur
   `.loot-tag-chip.hidden`, `.npc-trigger-reveal.hidden`, `.ld-tab-content.hidden`). Die
   Sammel-Angriff-Eingabefelder eines Mobs sind damit **immer sichtbar**, unabhängig vom
   gewählten Modus, und verlieren zusätzlich `display:flex`/`gap` sowie die Feldbreite.

**Ohne Laufzeitwirkung (derselbe Fehler, Codepfad zurzeit unerreichbar):**

5. **`.npc-header`** (`npcs.css`, `e743f8d`) — `ui/dom-builder.js:295` (`{ className: 'npc-header' }`
   in `renderNPCCard()`); `renderNPCCard` hat baumweit keinen Aufrufer. Exakt dieselbe Kategorie
   wie `.npc-grid`, das 15-09 wiederhergestellt hat — hier unterblieb es.
6. **`.dice-crit`, `.dice-fail`** (`dashboard.css`, `a37e17e`) — `features/dice/dice-core.js:380-381`;
   der Fallback-Zweig setzt sie, `#dice-result` existiert in keiner Vorlage, der Zweig ist tot.

**Fix:**

1. Die vier Regressionen (1–4) wörtlich aus `44a604f0…^` zurückholen, an der ursprünglichen
   Kaskadenposition, wie es `925d4ec` für `.npc-grid`/`.list-view-container` vorgemacht hat.
2. Für 5 und 6 eine bewusste Entscheidung treffen und im SUMMARY festhalten: entweder ebenfalls
   wiederherstellen (konsistent mit `.npc-grid`) oder den toten JS-Pfad in derselben, geprüften
   Änderung mitlöschen — nicht als stille Nebenwirkung eines Werkzeuglaufs stehen lassen.
3. **Pflichtschritt vor dem Abschluss der Phase:** die Gegenprobe automatisieren statt einmal
   von Hand zu fahren — Klassenmenge vor der Welle gegen Klassenmenge nach der Welle, Differenz
   gegen `collectLiveTokens()` des heutigen Baums halten, jeder Treffer ist ein Fehlalarm-Fund.
   Ohne diesen Schritt wiederholt sich der Fehler in jeder Folgewelle.

### CR-02: `scanBalancedSegment()` bricht am Zeilenumbruch ab — die 15-09-Korrektur greift bei umbrochenem Code nicht

**Datei:** `tools/css-usage-report.js:304` (`if (ch === '\n') break;`), wirksam für alle drei
neuen Kontexte (Z. 366, 372) und für `scanBalancedCallArgs()` (Z. 329-331)

**Problem:**

`scanBalancedSegment()` beendet den Scan bei jedem Zeilenumbruch außerhalb einer Zeichenkette.
Steht das Gleichheitszeichen am Zeilenende — die von Prettier erzeugte Normalform, sobald die
Zeile zu lang wird —, ist das gelesene Segment **leer** und es wird kein einziges Token
eingesammelt. Der Schnellpfad `CLASS_NAME_ASSIGN_OPEN_RE` (Z. 198) rettet nur das *erste*
Literal, weil sein `\s*` den Umbruch überspringt; alle Ternary-/Konkatenationszweige gehen
verloren.

Reale Fundstelle im selben Baum, in einer Datei, die diese Phase angefasst hat:

```js
// features/dice/dice-core.js:380-381
main.className =
    'dice-result-main' + (isCrit ? ' dice-crit' : '') + (isFail ? ' dice-fail' : '');
```

Nachgemessen mit `collectLiveTokens()` auf genau dieser Datei:
`dice-result-main: true`, `dice-crit: false`, `dice-fail: false` — und genau diese beiden
Regeln wurden in `a37e17e` gelöscht (CR-01 Punkt 6).

Synthetisch reproduzierbar für alle drei neuen Kontexte:

```js
"el.className =\n    'alpha' + (x ? ' beta' : '');"          // alpha: true,  beta: FALSCH
"{\n  containerClass:\n    cond ? 'gamma' : 'delta',\n}"     // gamma: FALSCH, delta: FALSCH
```

Beim `containerClass:`-Schlüssel geht bei Umbruch **beides** verloren, weil es dort keinen
Schnellpfad gibt. `ui/safe-render.js:360` steht heute nur zufällig einzeilig; eine
Prettier-Neuformatierung oder ein längerer Bedingungsausdruck macht die Zeile still blind.

**Fix:**

Den Zeilenumbruch nicht als Abbruchbedingung führen, sondern nur die echten Terminatoren
(`;` bzw. `,`/`}`) bei Klammertiefe 0, mit einer harten Obergrenze an gelesenen Zeichen
(z. B. 2000) gegen Weglaufen bei unbeendeten Konstrukten. Anschließend den bestehenden
Testfall CR-01a/CR-01b um je eine umbrochene Variante ergänzen — die vorhandenen vier Fälle
sind alle einzeilig und können diesen Fehler nicht finden.

### CR-03: Die häufigste Klassen-Kontext-Form im Baum bleibt unerkannt — `${…}`-Interpolation und Zuweisung an eine Zwischenvariable

**Datei:** `tools/css-usage-report.js:255` (`out += ' '` für die ganze Interpolation),
`tools/css-usage-report.js:338` (`replace(/\$\{[^}]*\}/g, ' ')`)

**Problem:**

Beide Stellen werfen den Inhalt einer `${…}`-Interpolation als Ganzes weg. Der im Projekt
dominierende Idiom für bedingte Klassen ist aber genau das:

```js
`<span class="slot-pip ${filled ? 'filled' : ''}">`                       // party-render.js:348
`<div class="char-attr-box clickable ${saves[attr] ? 'proficient' : ''}"` // party-details.js:119
`<div class="si-item … ${isAvailable ? '' : 'si-unavailable'} …"`         // shops-core.js:596
```

und die Variante über eine Zwischenvariable, die 15-09 gar nicht adressiert:

```js
var deltaClass = delta >= 0 ? 'fr-hist-plus' : 'fr-hist-minus';   // fraktionen-render.js:215
html += '<span class="fr-hist-delta ' + deltaClass + '">…';       //                    :218
```

Wirkung, gemessen: von den 199 als tot gemeldeten Klassen sind **44** im JS als reines
Klassenliteral in einer Ternary/Zuweisung belegt, darunter `filled`, `proficient`,
`expertise`, `bloodied`, `healthy`, `critical`, `defeated`, `expired`, `has-children`,
`pinned` — alle nachweislich lebendig. Zwei dieser Fälle sind in dieser Phase bereits in
eine Löschung umgeschlagen (CR-01 Punkte 2 und 3). Die übrigen leben heute nur deshalb, weil
die Ankerregel sie über einen Verbundselektor mit einer lebenden Klasse schützt — ein
alleinstehender Regelblock derselben Klasse würde in der nächsten Welle gelöscht.

**Fix:**

1. In `scanClassContextValue()` und `addTokensFromValue()` die Interpolation nicht verwerfen,
   sondern ihre **Zeichenketten-Literale** herausziehen und als Token führen (die
   `QUOTED_STRING_RE`-Maschinerie aus Z. 367/373 gibt es bereits) — der übrige Ausdruckstext
   wird weiterhin verworfen, damit kein Fantasie-Token wie `isAvailable` entsteht.
2. Für die Zwischenvariablen-Form entweder eine vierte Kontextregel (`var|let|const <name> =
   <Ternary aus Stringliteralen>` einsammeln, wenn `<name>` an anderer Stelle in einem
   `class="… ' + <name> + '"`-Kontext steht) oder — sauberer und im PLAN als Entscheidung
   festzuhalten — die Kategorie ausdrücklich als nicht entscheidbar behandeln und solche
   Klassen wie `notJudgeable` NIE als tot melden.
3. Solange weder 1 noch 2 vorliegt: `--check` darf nicht als Löschfreigabe verwendet werden
   (siehe WR-05).

### CR-04: `computed-style-diff.spec.js` kann Entfernungen strukturell nicht sehen und überschreibt seine eigene Vergleichsdatei

**Datei:** `tests/e2e/features/computed-style-diff.spec.js:88-89, 105-110, 208-226, 229-271`

**Problem:** Vier Mängel, die zusammen dazu führen, dass die als „dritte Nachweissäule" (D-24)
eingeführte Prüfung genau den Schaden nicht findet, für den sie gebaut wurde. Alle vier
Regressionen aus CR-01 sind an ihr vorbeigelaufen.

1. **Die Vergleichsdatei ist versioniert ausgeschlossen.** `SNAPSHOT_PATH` liegt unter
   `tests/e2e/test-results/` (Z. 88-89), und `.gitignore:25` schließt genau dieses Verzeichnis
   aus. In CI und in jedem frischen Klon ist `previousSnapshot === null`, `diffPass()` gibt
   sofort `[]` zurück (Z. 209) und alle drei Tests laufen **grün ohne zu vergleichen**. Der
   Wächter existiert außerhalb des Arbeitsverzeichnisses des Autors nicht.
2. **Selbstheilende Baseline.** `saveSnapshot()` wird in jedem Testfall VOR der Zusicherung
   ausgeführt (z. B. Z. 236-239). Ein Lauf, der eine Abweichung meldet, schreibt sie gleichzeitig
   als neuen Sollstand fest — der zweite Lauf nach einer Regression ist wieder grün.
3. **Entfernte Elemente sind unsichtbar.** `diffPass()` iteriert ausschließlich über
   `currView.elements` (Z. 213) und überspringt Schlüssel, die im Vorlauf fehlen (Z. 216). Ein
   Element, das durch eine gelöschte Regel unsichtbar wird, fällt schon in
   `captureViewInBrowser()` aus der Erfassung (Sichtbarkeitsfilter Z. 127-133) und verschwindet
   damit lautlos aus dem Diff. `.init-mob-dmg-inputs.hidden` ist genau dieser Fall — in
   umgekehrter Richtung (Element wird sichtbar statt unsichtbar) hätte ein Vergleich der
   Schlüsselmengen es sofort gezeigt.
4. **Leere Kampagne als Vergleichsmenge.** Alle drei Durchgänge starten mit
   `seedCleanSession(page)` (`tests/e2e/helpers/test-utils.js:59ff`), einem Datensatz ohne
   Charaktere, NPCs, Shops, Encounter oder Initiative-Einträge. Genau die Entitäts-Markups, auf
   die 5.367 gelöschte CSS-Zeilen wirken, werden nie gerendert. `runPass()` prüft nur
   `elementCount > 0` (Z. 193), was schon die Leerzustands-Markups erfüllen.

**Fix:**

```js
// 1) Baseline versionieren (eigener Pfad, NICHT unter test-results/):
const SNAPSHOT_PATH = path.join(process.cwd(), 'tests/e2e/baselines/computed-style-snapshot.json');

// 2) Nur schreiben, wenn keine Baseline existiert oder --update-snapshots gesetzt ist:
if (!previousSnapshot || process.env.UPDATE_STYLE_BASELINE === '1') saveSnapshot(currentSnapshot);

// 3) Verschwundene Schlüssel als Befund führen:
for (const key of Object.keys(prevView.elements)) {
    if (!currView.elements[key] && !isExpectedDeviation(key)) {
        unexpected.push(`${viewId}/${key}: Element im Vorlauf vorhanden, jetzt nicht mehr erfasst`);
    }
}
```

4. Statt `seedCleanSession()` einen befüllten Seed verwenden (mindestens je ein Charakter mit
   Zauberplätzen, NPC, Shop mit nicht verfügbarem Artikel, Fraktion mit Ruf-Historie, Mob in der
   Initiative) — sonst misst der Lauf weiterhin fast ausschließlich Leerzustände.

---

## Warnings

### WR-01: `scanBalancedSegment()` kennt weder Kommentare noch Regex-Literale

**Datei:** `tools/css-usage-report.js:284-315`

**Problem:** Der Scanner behandelt jedes `'`, `"` und `` ` `` als Zeichenketten-Beginn, auch
innerhalb eines Kommentars oder eines Regex-Literals. Beide Richtungen sind belegt (jeweils mit
`collectLiveTokens()` nachgemessen):

```js
"el.className = /* don't touch */ 'alpha';"   // alpha: FALSCH (tot!)
                                              // eingesammelt stattdessen: 't', 'touch', '*/'
"el.className = /['\"]/.test(v) ? 'alpha' : 'beta';"  // alpha: FALSCH, beta: FALSCH
"obj.className = 'alpha"                      // unbeendet -> liest bis Dateiende, sammelt
                                              // beliebige spätere Literale als „lebendig" ein
```

Der Apostroph in einem deutschen oder englischen Kommentar auf derselben Zeile genügt, um ein
Klassenliteral aus der Erfassung zu kippen — in einem Werkzeug, dessen Ausgabe Löschungen
freigibt, ist das die gefährliche Richtung. Zurzeit trifft kein Aufrufpunkt im Baum diese Fälle,
deshalb WARNING statt Critical.

**Fix:** Vor dem Scan `//`-Zeilenkommentare und `/* … */`-Blockkommentare mit `blankComments()`
(existiert bereits, Z. 64) neutralisieren; für das Regex-Literal genügt die einfache Heuristik
„`/` nach `(`, `,`, `=`, `?`, `:`, `&&`, `||`, `return` beginnt ein Regex-Literal", andernfalls
Division. Zusätzlich eine Obergrenze an gelesenen Zeichen gegen den unbeendeten Fall.

### WR-02: `renderCompactSpellSlots()` dupliziert `renderSpellSlotPips()` weiterhin fast wörtlich

**Datei:** `features/party/party-render.js:308-354` gegen
`systems/spellslots/spellslots-ui.js:59-92`

**Problem:** Unverändert seit dem vorigen Bericht. Der Zaubertrick-Block, die Grad-Schleife, die
Pip-Erzeugung und der komplette `data-action="toggle-spell-slot-stop"`/`data-id`/`data-value`-
Vertrag stehen jetzt zweimal im Baum; die Kommentare nennen die zweite Stelle selbst „Zielmuster".
Jede künftige Änderung am Pip-Vertrag muss an zwei Stellen nachgezogen werden, und nichts erzwingt
das.

**Fix:** Die Pip-Erzeugung in eine Funktion `renderSpellSlotPipsFrom(charId, slots)` ziehen, die
beide Aufrufer benutzen. Der einzige echte Unterschied — `getSpellSlots()` initialisiert und
mutiert den Datensatz, `renderCompactSpellSlots()` darf das bewusst nicht (T-15-11) — wird zum
Parameter, statt die ganze Funktion zu verdoppeln.

### WR-03: Der neue DOC-Wächter deckt die HTML-Vorlagenzahl nicht ab — `CLAUDE.md:145` nennt 10 statt 12

**Dateien:** `CLAUDE.md:145`, `tests/unit/docs-consistency.test.js:93-99`

**Problem:** `CLAUDE.md:145` behauptet „10 modulare HTML-Templates". Gemessen:
`ls assets/templates/*.html | wc -l` = **12**, und `loader.js`s `TEMPLATES`-Array führt ebenfalls
12 Einträge. Die falsche Zahl steht **eine Zeile unter** der Zeile, die 15-10 korrigiert hat, und
der Kommentar in DOC-02 nennt sie ausdrücklich als etwas, das *herausgefiltert* werden muss —
statt sie mitzuprüfen. Damit bleibt exakt die Fehlerklasse offen, zu deren Beseitigung 15-10
angetreten ist („eine Zahlbehauptung im selben Dokument blieb unentdeckt falsch").

**Fix:** `CLAUDE.md:145` auf 12 korrigieren und DOC-02 um einen zweiten, gleich gebauten
Kandidatenfilter erweitern:

```js
const tplLines = claudeMdContent.split('\n')
    .filter(l => l.includes('assets/templates') || /HTML-Template/i.test(l));
const tplClaims = [];
tplLines.forEach(l => { for (const m of l.matchAll(/(\d+)\s+modular\w*/gi)) tplClaims.push(+m[1]); });
expect(tplClaims.length).toBeGreaterThanOrEqual(1);
tplClaims.forEach(c => expect(c).toBe(fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).length));
```

### WR-04: `renderCompactSpellSlots()` ohne Rückfall für die alte numerische `spellSlots`-Form

**Datei:** `features/party/party-render.js:315-322`

**Problem:** Die alte Fassung las `slots[i] > 0` (Zahl) plus `ch.spellSlotsUsed`; die neue liest
ausschließlich `slots[level].max` (`{ max, current }`). Für einen Charakter, dessen gespeichertes
`spellSlots` noch die numerische Form trägt, ist `slots[level].max === undefined`, `hasSlots`
bleibt `false` und die Funktion gibt **stillschweigend eine leere Zeichenkette** zurück — die
Zauberplätze verschwinden ohne Fehlermeldung. Weder `systems/spellslots/version-migration.js`
(das nur `spellSlotsMax`/`spellSlotsUsed` anlegt) noch `getSpellSlots()`
(`spellslots-ui.js:9-34`, füllt nur *fehlende* Schlüssel auf) normalisiert diese Form.

**Fix:** Beim Lesen normalisieren statt anzunehmen:

```js
const raw = slots[level];
const slot = typeof raw === 'number'
    ? { max: raw, current: raw - ((ch.spellSlotsUsed && ch.spellSlotsUsed[level]) || 0) }
    : raw;
```

— oder eine echte Datenmigration in `version-migration.js` ergänzen und im SUMMARY belegen, dass
die numerische Form im Bestand nicht mehr vorkommt.

### WR-05: `--check` ist als Löschfreigabe unbrauchbar — rund 40 der 199 gemeldeten toten Klassen leben nachweislich

**Datei:** `tools/css-usage-report.js:628, 719-727`

**Problem:** `checkFailures` ist die Liste, an der sich die Folgewellen orientieren sollen. Sie
enthält heute 199 Namen; 44 davon sind im JS als reines Klassenliteral in einer
Ternary/Zuweisung belegt (Messung siehe CR-03), darunter `filled`, `proficient`, `bloodied`,
`healthy`, `critical`, `has-children`, `pinned`. Die `DEAD_EXCEPTIONS`-Liste (Z. 88-115) hat
dafür kein Konzept: sie trägt fünf handverlesene Read-Aloud-Farbvarianten und wächst nicht
automatisch mit. Ein Bearbeiter der nächsten Welle, der die Liste als Löschvorlage nimmt,
wiederholt CR-01 in größerem Maßstab.

**Fix:** `--check` bis zur Behebung von CR-02/CR-03 ausdrücklich als *Bericht* kennzeichnen
(z. B. Ausgabe `WARNUNG: Liste enthält bekannte Fehlalarme, nicht als Löschvorlage verwenden`)
und in `PLAN.md`/`SUMMARY.md` festhalten, dass keine Löschung allein auf ihrer Grundlage erfolgen
darf. Nach der Behebung die Zahl neu erheben und als Ausgangswert dokumentieren.

### WR-06: Keine Gegenprobe für `DEAD_EXCEPTIONS` — Ausnahmen veralten unbemerkt

**Datei:** `tools/css-usage-report.js:88-115`, `tests/unit/css-usage-report.test.js:31-45`

**Problem:** Der einzige Test über `DEAD_EXCEPTIONS` prüft die **Form** je Eintrag (Klasse, Datum,
Begründung), nicht die **Notwendigkeit**. Wird eine der fünf Read-Aloud-Klassen später gelöscht
oder erkennt das Werkzeug sie irgendwann selbst, bleibt der Eintrag stehen und deckt ab da still
einen echten Befund ab — genau das Verhalten, das in CR-01 dazu geführt hat, dass ein Fehler „für
das Werkzeug, das ihn gemacht hat, nicht mehr sichtbar" war.

**Fix:** Einen Testfall ergänzen, der jeden `DEAD_EXCEPTIONS`-Eintrag gegen den echten Baum hält:
die Klasse muss (a) mindestens einen Selektor im CSS haben und (b) ohne die Ausnahmeliste
tatsächlich als tot gemeldet werden. Ist eine der beiden Bedingungen verletzt, ist der Eintrag
überflüssig und der Test rot.

### WR-07: F-20 friert `['core.css']` fest und ist damit keine Ratsche

**Datei:** `tests/unit/design-consistency.test.js` (F-20, zweiter Testfall)

**Problem:** Der erste Fall ist eine echte Ratsche (`<= 1`), der zweite verlangt
`expect(names).toEqual(['core.css'])` — also **genau einen** Block, genau dort. Eine spätere,
legitime Senkung auf null (etwa weil die Unterdrückung in eine Vorlage oder ein
`@media`-Sammelmodul wandert) macht den zweiten Fall rot, obwohl die Ratsche in die gewollte
Richtung gelaufen ist. Der Kommentar über der Konstante beschreibt eine Ratsche, der Code eine
Festschreibung.

**Fix:** Den zweiten Fall auf „falls ein Block existiert, steht er in `core.css`" umstellen:
`expect(names.every(n => n === 'core.css')).toBe(true);`

---

## Info

### IN-01: `npm run css-usage:check` ist nicht grün und in keiner Pipeline verdrahtet

**Datei:** `package.json:27-28`
**Problem:** Unverändert seit dem vorigen Bericht: Exit-Code 1 bei 199 toten Klassen, und weder
`npm run check` noch `npm test` noch `.github/workflows/ci.yml` rufen die beiden neuen Skripte
auf. Für diese Vorlaufphase in Ordnung; nur damit der Zustand später nicht als Regression
missdeutet wird.
**Fix:** Bei der späteren CI-Verdrahtung gegen den dann gemessenen Ausgangswert prüfen, nicht
gegen null — und erst nach CR-02/CR-03, sonst zementiert das Gate die Fehlalarme.

### IN-02: Exportierte Regexe tragen das `g`-Flag

**Datei:** `tools/css-usage-report.js:695-697`
**Problem:** `CLASS_NAME_ASSIGN_STMT_RE` und `CLASS_KEY_ASSIGN_RE` werden mit `/g` exportiert. Im
Modul selbst werden sie nur über `matchAll()` benutzt (zustandsfrei), ein externer Aufrufer mit
`.test()` bekommt aber das bekannte `lastIndex`-Verhalten (jeder zweite Aufruf `false`).
**Fix:** Entweder nur die Quellzeichenkette exportieren und beim Aufrufer neu bauen, oder in der
JSDoc ausdrücklich auf `matchAll()`-Nutzung festlegen.

### IN-03: `renderCompactSpellSlots()` lässt den Wiederherstellen-Knopf des Zielmusters weg

**Datei:** `features/party/party-render.js:353`
**Problem:** `renderSpellSlotPips()` hängt am Ende einen `restore-spell-slots-stop`-Knopf (🔄) an;
die neue kompakte Fassung nicht. Vermutlich Absicht (Platz in der Charakterkarte), aber nirgends
festgehalten — beim nächsten Angleich der beiden Funktionen (WR-02) ist unklar, ob das Weglassen
gewollt war.
**Fix:** Einen Satz Kommentar an die Stelle, an der der Knopf fehlt.

### IN-04: Inline-Stile sind aus der Vorlage in den JS-Renderer gewandert — für die F-19-Ratsche unsichtbar

**Datei:** `features/party/party-render.js:329-345`, `tests/unit/design-consistency.test.js` (F-19)
**Problem:** Die neue Pip-Ausgabe erzeugt sechs `style="…"`-Attribute im JS. F-19 zählt
ausschließlich über `tplFiles` (`assets/templates`), also sinkt der Zählerstand (257 → 256), obwohl
die Zahl der Inline-Stile im ausgelieferten DOM insgesamt steigt. Die Ratsche misst nicht, was ihr
Kommentar behauptet zu messen.
**Fix:** Entweder den Zählbereich von F-19 auf die JS-Renderer ausweiten (mit neu erhobenem
Ausgangswert) oder im Kommentar der Ratsche ausdrücklich festhalten, dass sie nur das
Vorlagen-Markup abdeckt.

### IN-05: `assets/styles/encounters.css` beginnt mit zwei leeren Zeilen

**Datei:** `assets/styles/encounters.css:1-2`
**Problem:** Rückstand der Löschwelle: Zeile 1 ist leer, Zeile 2 enthält nur Leerzeichen, dann
folgt unvermittelt `.encounter-card.expanded …` ohne Abschnittskopf. Die Datei hat als einzige der
20 keinen einleitenden Kommentar mehr. Struktur ist intakt (Klammerbilanz aller 20 Dateien geprüft:
ausgeglichen, kein hängender Komma-Selektor, keine verwaisten Blöcke).
**Fix:** Führende Leerzeilen entfernen und den Abschnittskopf im Stil der übrigen Dateien
nachtragen.

### IN-06: `assets/body.html` nennt weiterhin 10 Vorlagen

**Datei:** `assets/body.html:5-14`
**Problem:** Der Hinweiskommentar listet 10 Vorlagendateien; es sind 12 (`view-bestiary.html`,
`view-welt.html` fehlen). Vermutlich die Quelle der falschen Zahl in `CLAUDE.md:145` (WR-03).
**Fix:** Zusammen mit WR-03 nachziehen.

---

_Geprüft: 2026-09-09_
_Prüfer: Claude (gsd-code-reviewer)_
_Tiefe: standard_
