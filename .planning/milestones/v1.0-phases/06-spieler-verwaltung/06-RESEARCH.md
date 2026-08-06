# Phase 6: Spieler-Verwaltung — Research

**Recherchiert:** 2026-06-15
**Domäne:** Charakter-Erweiterung (Vanilla JS, non-ESM, Brownfield)
**Gesamtkonfidenz:** HIGH — alle Reuse-Ziele per Datei-Lektüre verifiziert

---

<user_constraints>
## Nutzervorgaben (aus CONTEXT.md)

### Gesperrte Entscheidungen

- **D-00a–D-00d:** Offline-only, deutsche UI, etabliertes CRUD-Muster (`pushUndo()`/`saveUndoState()` vor destruktiven Mutationen, `esc()`/`sanitizeHTML()` für Nutzerinhalt, `data-action`-Delegation, 3-fach-Modulregistrierung, Build-Dedup-Regeln), maximaler Reuse statt Neubau.
- **D-01:** Klickbarer ⭐ auf der Charakterkarte als Toggle (immer sichtbar), eigener `-stop`-Handler.
- **D-02:** Inspiration binär An/Aus (`save()`, KEIN `saveUndoState()`).
- **D-03:** Alle 18 Fertigkeiten mit Übungs-Häkchen + optionalem Expertise-Häkchen; Mapping aus `SKILL_INFO` (kein Neu-Definieren).
- **D-04:** Klick = Wurf (W20 + Attribut-Modifier + Übungsbonus ×1 oder ×2 bei Expertise) über vorhandenen Roller; Vorteil/Nachteil-Schaltflächen; Skills, Saves und rohe Attribut-Checks klickbar.
- **D-05:** Angriffe als freie manuelle Liste `{ name, attackBonus, damage, opt. damageType }`; Angriffsbonus und Schaden klickbar via `renderClickableDice()`.
- **D-06:** Anzeige im Detail-Modal (`showCharacterDetails`), Bearbeitung im bestehenden Charakter-Editor.
- **D-07:** Beide Aufstiegsarten: XP und Milestone; eine Einstellung `D.settings.levelingMode`.
- **D-08:** Neues `xp`-Feld je Charakter, Migration mit Default `0`.
- **D-09:** Encounter-Abschluss-Trigger in der Initiative-Ansicht; XP automatisch aus `CR_TO_XP` summiert; manuelle Korrektur möglich.
- **D-10:** Gesamt-XP gleichmäßig auf alle aktiven Charaktere (lebende Party-Mitglieder).
- **D-11:** Levelaufstieg = Hinweis, kein Auto-Bump; neue PHB-Level→XP-Aufstiegstabelle als Konstante.

### Claude's Discretion

- Genaue deutsche UI-Texte.
- Exakte Feld-/Schema-Benennung.
- Platzierung des Abschluss-Buttons in der Initiative.
- Adv/Disadv-Bedienung (zwei Mini-Buttons je Wurf vs. globaler Moduswechsel).
- Optionaler Inspiration-Überblick in `renderPartyOverview`.
- Migrationsstrategie in `version-migration.js`.
- Darstellung des XP-Stands.

### Zurückgestellte Ideen (OUT OF SCOPE)

- CHAR-04 Fraktions-Ruf pro Charakter.
- Jack-of-all-Trades.
- Angriffe aus Loot-Waffen ableiten.
- Inspiration stapelbar.
- Zusätzlicher XP-Einstieg im Encounters-Tab (mögliche Ergänzung, kein v1-Pflicht).

</user_constraints>

<phase_requirements>
## Phasen-Anforderungen

| ID | Beschreibung | Forschungsunterstützung |
|----|--------------|-------------------------|
| CHAR-01 | Nutzer kann XP/Milestones der Gruppe verfolgen und XP aus abgeschlossenen Encountern übernehmen | D-07..D-11: `xp`-Feld, `XP_LEVEL_THRESHOLDS`, `CR_TO_XP`-Summe in Initiative, gleichmäßige Verteilung |
| CHAR-02 | Nutzer kann Inspiration je Spieler vergeben und einsehen | D-01/D-02: Toggle auf Charakterkarte, `inspiration`-Boolean bereits vorhanden |
| CHAR-03 | Nutzer kann erweiterte Charakterwerte pflegen (Skills, Saves, Angriffe) für schnelle Checks am Tisch | D-03..D-06: `SKILL_INFO`, `skillProficiencies`/`skillExpertise`, `attacks[]`, Detail-Modal-Erweiterung, `renderClickableDice()` |

</phase_requirements>

---

## Zusammenfassung

Phase 6 ist eine reine Brownfield-Erweiterung des bestehenden Party-/Charakter-Systems. Alle drei Features (XP/Milestone-Tracker, Inspiration, Erweiterte Charakterwerte) bauen auf vorhandenen Feldern, Funktionen und Konstanten auf — kein neues Subsystem ist notwendig, kein neuer Tab entsteht.

Die Reuse-Verifikation bestätigt, dass alle im CONTEXT.md angeführten Zieldateien mit den beschriebenen Funktionen tatsächlich existieren. Einige Zeilennummern sind minimal verschoben (wurde unten dokumentiert). Der einzige wirklich fehlende Baustein ist die PHB-Level→XP-Aufstiegstabelle, die als neue Konstante `XP_LEVEL_THRESHOLDS` in `core/constants.js` einzufügen ist.

Der öffentliche Einstiegspunkt für klickbare Würfe aus dem Detail-Modal ist `parseDiceNotation()` + `displayDiceResult()` + `addToDiceHistory()` (alle in `dice-core.js`, exportiert via `window.*`) — identisch zum Muster, das der bestehende Skill-Check-Tab und das Bestiary bereits nutzen.

**Primäre Empfehlung:** Alle drei Features vollständig in bestehende Dateien integrieren — kein neues Modul erforderlich, kein neuer CSS-File erforderlich (Erweiterung von `party.css` + `initiative.css` genügt).

---

## Architektur-Verantwortungsmatrix

| Fähigkeit | Primäre Schicht | Sekundäre Schicht | Begründung |
|-----------|-----------------|-------------------|------------|
| XP-Tracking (Datenhaltung) | `core/data.js` + `party-crud.js` | `version-migration.js` | Charakter-Schema + Migration |
| XP-Verteilung (Trigger) | `features/initiative.js` + `combat-actions.js` | `entity-actions.js` | Kampfabschluss liegt in Initiative |
| Levelaufstieg-Hinweis | `party-render.js` oder `party-details.js` | `core/constants.js` (Schwellen) | Anzeige + Datenquelle getrennt |
| Inspiration-Toggle | `party-render.js` + `entity-actions.js` | — | UI auf Karte, Handler in Actions |
| Skill/Save/Angriff-Anzeige | `party-details.js` | — | Detail-Modal ist der Heimat |
| Würfelwurf (klickbar) | `dice-core.js` | `entity-actions.js` | Roller-Logik zentral, Action-Delegation |
| Schema-Erweiterung | `party-crud.js` (`saveCharacter`/`editChar`) | `view-party.html` | CRUD-Formular liest/schreibt Schema |
| CSS | `assets/styles/party.css` + `initiative.css` | — | Keine neue CSS-Datei nötig |

---

## Standard-Stack (Reuse-Targets — vollständig verifiziert)

### Kern-Wiederverwendung

| Funktion/Konstante | Datei (verifiziert) | Tatsächliche Zeile | Signatur / Struktur | Abweichung zum CONTEXT.md |
|---|---|---|---|---|
| `saveCharacter()` | `features/party/party-crud.js` | :174 | Liest Formular → erstellt `ch`-Objekt → `pushUndo()` → mutiert `D.characters` → `save()` | Keine |
| Charakter-Schema (incl. `inspiration`) | `features/party/party-crud.js` | :214–250 | `ch = { name, ..., inspiration: $('char-inspiration').checked, saveProficiencies: {...}, ... }` — `inspiration` :235 | `saveProficiencies` beginnt :198, `inspiration` :235 — exakt wie CONTEXT.md |
| `editChar(id)` | `features/party/party-crud.js` | :287 | Füllt Formular aus `EntityLookup.character(id)` | Keine |
| `updateProficiencyBonus()` | `features/party/party-crud.js` | :444 | Liest `char-level` → `getProfBonus(level)` → setzt `#char-proficiency` | Zeile 444 exakt |
| `showCharacterDetails(id)` | `features/party/party-details.js` | :8 | Baut Detail-Modal komplett als HTML-String; enthält Attribut-Grid `:103`, Save-Proficiency-Anzeige `:107`, Inspiration-Stern `:65` | Exakt — kein Versatz |
| `renderCharacterCard(ch, ...)` | `features/party/party-render.js` | :131 | ⭐-Anzeige bei `ch.inspiration === true` in Kartenüberschrift :175 | Exakt |
| `-stop`-Vorbild `show-hp-calculator-stop` | `features/party/party-render.js` | :183 | `data-action="show-hp-calculator-stop" data-type="characters" data-id="${ch.id}"` | Exakt |
| `renderPartyOverview()` | `features/party/party-render.js` | :360 | Zeigt Niedrigste Passive Wahr., RK-Range, HP%, Party-Größe, Conditions | Exakt |
| `SKILL_INFO` | `core/constants.js` | :217 | `{ acrobatics: { name:'Akrobatik', attr:'dex' }, ... }` — 18 Skills, deutsche Namen | Exakt |
| `DND_RULES.SKILL_INFO` | `core/constants.js` | :504 | In `window.DND_RULES = Object.freeze({...SKILL_INFO,...})` | Korrekt — Namespace-Zugriff möglich |
| `SKILLS` (Würfelsystem) | `features/dice/dice-core.js` | :11 | Andere Struktur: `{ str: [{name, skill}], ... }` — NICHT dasselbe wie `SKILL_INFO` | Hinweis: zwei verschiedene Konstanten! |
| `getAbilityModifier(score)` | `utils/game-rules.js` | :16 | `Math.floor((score - 10) / 2)` | Nicht window-exportiert (nur lokal); `getProficiencyBonus` ist exportiert |
| `getProficiencyBonus(level)` | `utils/game-rules.js` | :32 | `Math.ceil(lvl / 4) + 1` | Exportiert als `window.getProficiencyBonus` :134 |
| `getProfBonus(level)` | `utils/utilities.js` | :412 | Alias: `Math.ceil(level / 4) + 1` — selbe Formel | `saveCharacter()` und `updateProficiencyBonus()` nutzen `getProfBonus`, NICHT `getProficiencyBonus` |
| `formatModifier(mod)` | `utils/game-rules.js` | :43 | `mod >= 0 ? \`+${mod}\` : String(mod)` | Nicht window-exportiert (nur global lexikalisch) |
| `renderClickableDice(text)` | `features/bestiary/bestiary-render.js` | :41 | Zwei Ersetzungen: (1) Würfelformeln `NdN[+/-N]` → `<span data-action="bestiary-roll-dice" data-value="...">`, (2) isolierte `+N`-Boni → `<span data-action="bestiary-roll-dice" data-value="1d20+N">` | Exakt — läuft NACH `sanitizeHTML()` |
| `bestiary-roll-dice`-Handler | `ui/actions/entity-actions.js` | :289 | `ctx => window.rollQrefDice(val)` — delegiert an Quick-Reference-Roller | Exakt verifiziert |
| `displayDiceResult(result, notation, rolls, isCrit, isFail, extraHtml?)` | `features/dice/dice-core.js` | :334 | Haupteinstiegspunkt für Würfelanzeige | Parameter-Signatur verifiziert |
| `addToDiceHistory(notation, result, rolls)` | `features/dice/dice-core.js` | :434 | Hängt an `diceHistory[]`, begrenzt auf 30 Einträge, ruft `renderDiceHistory()` | Exportiert :785 |
| `parseDiceNotation(notation)` | `features/dice/dice-core.js` | :119 | Parst `NdN[kh/kl N][+/-N]`, gibt `{total, rolls, keptRolls, modifier}` | Nicht explizit exportiert, aber global zugänglich |
| `rollAdvantage()` / `rollDisadvantage()` | `features/dice/dice-core.js` | :144 / :153 | Intern: `parseDiceNotation('2d20kh1')` / `kl1` | Exportiert via `window.*` |
| `XP_THRESHOLDS` | `features/encounter-calculator.js` | :9 | Encounter-SCHWIERIGKEIT (easy/medium/hard/deadly pro Level) — **NICHT** Aufstieg | Exakt — wird oft verwechselt! |
| `CR_TO_XP` | `features/encounter-calculator.js` | :32 | `{ 0:10, '1/8':25, '1/4':50, '1/2':100, 1:200, 2:450, ..., 30:155000 }` | Exakt — enthält Bruch-Keys als Strings |
| `calculateMonsterXP()` | `features/encounter-calculator.js` | :447 | Für Encounter-Calculator-UI; für D-09 wird `CR_TO_XP` direkt benötigt | Vorhanden |
| `endCombat()` | `features/initiative.js` | :230 | Bestätigt, synct HP, löscht `D.initiative`; **Andockpunkt** für XP-Verteilungs-Flow vor der finalen Bereinigung | Exakt — hier muss XP-Abschluss-Button eingeklinkt werden |
| `migrateData(data)` / `MIGRATIONS` | `systems/spellslots/version-migration.js` | :87 | Versions-Key-sortiertes Migrations-Objekt; letzter Key ist `'4.0.0'` (Phase 5) | Phase-6-Migration erhält Key `'5.0.0'` oder `'6.0.0'` |

---

## Fehlende Konstante (D-11): PHB-Level→XP-Aufstiegstabelle

### Fertige Konstante zum Einfügen in `core/constants.js`

[VERIFIED: PHB Charakter-Aufstieg-Tabelle, Seite 15 — D&D 5e 2014]

```javascript
/**
 * PHB Charakteraufstieg: Kumulativer XP-Bedarf pro Stufe (D&D 5e, PHB S.15)
 * ACHTUNG: Nicht zu verwechseln mit XP_THRESHOLDS (Encounter-Schwierigkeit, encounter-calculator.js)
 * Index = Ziel-Level (1-basiert: XP_LEVEL_THRESHOLDS[1] = 0 für Level 1)
 * @type {number[]}
 */
const XP_LEVEL_THRESHOLDS = [
    0,       // Level 1  (Startpunkt)
    300,     // Level 2
    900,     // Level 3
    2700,    // Level 4
    6500,    // Level 5
    14000,   // Level 6
    23000,   // Level 7
    34000,   // Level 8
    48000,   // Level 9
    64000,   // Level 10
    85000,   // Level 11
    100000,  // Level 12
    120000,  // Level 13
    140000,  // Level 14
    165000,  // Level 15
    195000,  // Level 16
    225000,  // Level 17
    265000,  // Level 18
    305000,  // Level 19
    355000   // Level 20
];
```

**In `DND_RULES`-Namespace einbinden** (Zeile ~498 in `core/constants.js`):

```javascript
window.DND_RULES = Object.freeze({
    // ... bestehende Einträge ...
    XP_LEVEL_THRESHOLDS,   // NEU
    // ...
});
// Legacy-Export:
window.XP_LEVEL_THRESHOLDS = XP_LEVEL_THRESHOLDS; // NEU
```

### Verwendung: Levelaufstieg-Hinweis

```javascript
// Prüft ob ein Charakter den nächsten Level erreicht hat
function canLevelUp(ch) {
    const nextLevel = (ch.level || 1) + 1;
    if (nextLevel > 20) return false;                          // Max Level
    const threshold = XP_LEVEL_THRESHOLDS[nextLevel - 1];    // 0-basierter Index
    return (ch.xp || 0) >= threshold;
}

// Beispiel: Charakter Level 1, xp = 300 → XP_LEVEL_THRESHOLDS[1] = 300 → kann aufsteigen
// Beispiel: Charakter Level 5, xp = 13999 → XP_LEVEL_THRESHOLDS[5] = 14000 → noch nicht
```

**Deutliche Abgrenzung:** `XP_THRESHOLDS` in `encounter-calculator.js` Zeile :9 enthält `{ easy, medium, hard, deadly }` pro Level — das ist die Encounter-Schwierigkeits-Tabelle (DMG S.82), nicht die Aufstiegs-Tabelle (PHB S.15). Beide haben den Schlüssel-Typ `level → XP`, aber völlig unterschiedliche Werte und Bedeutung.

---

## 5e-Regelwerk-Mathematik (verifiziert)

### Fertigkeitsprüfungs-Formel (D-04)

```
Würfelergebnis = W20 + Attribut-Modifier + Übungsbonus × Faktor

Faktor:
  0  — nicht geübt (kein Häkchen)
  1  — geübt     (skillProficiencies[key] === true)
  2  — Expertise (skillExpertise[key] === true, stackt mit Geübt)
```

**Ausgearbeitetes Beispiel — Heimlichkeits-Check eines geübten Schurken mit Expertise:**

```
DEX = 18  → Attribut-Modifier = Math.floor((18 - 10) / 2) = +4
Level = 5 → getProfBonus(5) = Math.ceil(5 / 4) + 1 = 2 + 1 = +3

Geübt ohne Expertise:  W20 + 4 + 3    = W20 + 7
Geübt mit Expertise:   W20 + 4 + 3×2  = W20 + 10   ← Schurke/Barde

Hinweis: Expertise addiert den Übungsbonus *nochmals* (Gesamt = 2×ProfBonus + Mod),
es ist KEIN Multiplikator auf den Gesamtwurf.
```

**Implementierung (neue Helper-Funktion in `party-details.js` oder `game-rules.js`):**

```javascript
function calcSkillModifier(ch, skillKey) {
    const skillInfo = SKILL_INFO[skillKey];              // aus core/constants.js
    if (!skillInfo) return 0;
    const attrVal = ch.attributes?.[skillInfo.attr] || 10;
    const attrMod = getAbilityModifier(attrVal);         // utils/game-rules.js:16
    const profBonus = ch.proficiencyBonus ||
                      getProficiencyBonus(ch.level || 1); // utils/game-rules.js:32
    const isProficient = ch.skillProficiencies?.[skillKey] || false;
    const hasExpertise  = ch.skillExpertise?.[skillKey]    || false;
    const profFactor = hasExpertise ? 2 : (isProficient ? 1 : 0);
    return attrMod + profBonus * profFactor;
}
```

### Rettungswurf-Formel (D-04)

```
Rettungswurf = W20 + Attribut-Modifier + (Übungsbonus, falls save-proficient)

// Bereits im Würfelsystem vorhanden: rollCharSave() in dice-core.js:561
// Muster dort: ch.saveProficiencies?.[attr] → addiert ch.proficiencyBonus
// Das Detail-Modal soll Saves künftig KLICKBAR machen (dieselbe Logik)
```

### Proficiency-Bonus-Tabelle (verifiziert: `getProficiencyBonus` in `game-rules.js:32`)

```
Level 1–4:   +2   (Math.ceil(1/4)+1 = 2, ..., Math.ceil(4/4)+1 = 2)
Level 5–8:   +3
Level 9–12:  +4
Level 13–16: +5
Level 17–20: +6
```

PHB-konform. Beide Implementierungen (`getProfBonus` in `utilities.js:412` und `getProficiencyBonus` in `game-rules.js:32`) liefern identische Werte.

### Inspiration (D-02)

**Binär An/Aus (5e-RAW):** `inspiration: true/false` — kein Stapeln. Toggle via `save()` ohne `saveUndoState()`.

### XP-Verteilung (D-10)

```javascript
// Gesamt-XP gleichmäßig auf alle aktiven Charaktere (lebende Party-Mitglieder)
function distributeXP(totalXP) {
    const D = window.D;
    const activeChars = D.characters.filter(ch => (ch.hpCurrent || 0) > 0);
    if (!activeChars.length) return;
    const share = Math.floor(totalXP / activeChars.length);
    const remainder = totalXP - share * activeChars.length;
    // Empfehlung: floor() für alle, Remainder im Toast erwähnen
    // Kein saveUndoState() nötig falls Nutzer Betrag vorher bestätigt;
    // alternativ pushUndo('XP verteilt') für Rückgängig-Unterstützung
    activeChars.forEach(ch => {
        ch.xp = (ch.xp || 0) + share;
    });
    // Reste-Hinweis optional: `+${remainder} XP nicht verteilt (Rest)`
    return { share, remainder };
}
```

**Rundungsverhalten:** `Math.floor(totalXP / anzahl)` — ganzzahlig abrunden; verbleibender Rest wird im Toast erwähnt oder verworfen (DM entscheidet). Kein Aufrunden, da sonst Gesamt > Encounter-XP.

### CR_TO_XP-Schlüssel-Format (D-09)

Die Schlüssel in `CR_TO_XP` sind gemischt — **ganze Zahlen als Number, Brüche als String:**

```javascript
CR_TO_XP[0]      // 10   (Number-Key)
CR_TO_XP['1/8']  // 25   (String-Key für Brüche)
CR_TO_XP['1/4']  // 50
CR_TO_XP['1/2']  // 100
CR_TO_XP[1]      // 200  (Number-Key)
```

Beim Summieren aus Kombattanten-CR muss daher `String(cr)` oder `cr.toString()` als Lookup-Key verwendet werden, oder — sicherer — direktes String-Lookup für alle:

```javascript
function getXPForCR(cr) {
    // CR_TO_XP hat sowohl Number-Keys als auch String-Keys ('1/8' etc.)
    return CR_TO_XP[cr] || CR_TO_XP[String(cr)] || 0;
}
```

**Kombattanten-CR-Referenz:** In `D.initiative.combatants` hat ein Bestiary-Kombattant:
- `cb.statblockRef` — String-Key für `D.bestiary` oder `'srd:NAME'`
- `cb.cr` — teilweise direkt gesetzt beim Hinzufügen aus dem Bestiary (`addBestiaryToInitiative`)

Für die XP-Auto-Summe: Über `cb.statblockRef` das Monster aus `D.bestiary` oder dem SRD-Array nachschlagen und dessen `cr`-Wert via `getXPForCR()` umrechnen.

---

## Architektur-Muster

### Empfohlene Projektstruktur (keine neuen Dateien notwendig)

```
features/party/
├── party-render.js    ← Inspiration-Toggle-Button + renderPartyOverview-Erweiterung
├── party-details.js   ← Skills-Sektion + klickbare Saves + Angriffs-Sektion + XP-Anzeige
└── party-crud.js      ← saveCharacter + editChar erweitern (xp, skillProficiencies, skillExpertise, attacks[])

features/initiative.js        ← endCombat() erweitern + showXpDistributionModal()
ui/actions/entity-actions.js  ← Inspiration-Toggle, Skill/Save/Angriff-Würfe, Level-Up-Bestätigung
ui/actions/combat-actions.js  ← 'end-combat-xp', 'apply-xp-distribution'
core/constants.js             ← XP_LEVEL_THRESHOLDS hinzufügen
core/data.js                  ← D.settings.levelingMode hinzufügen
systems/spellslots/version-migration.js  ← Migration '5.0.0' für xp/skills/attacks
assets/styles/party.css       ← Skills-Sektion, Angriffs-Sektion, XP-Badge CSS
assets/styles/initiative.css  ← XP-Verteilungs-Modal-Styles
assets/templates/view-party.html         ← Eingabe-UI für Skills/Expertise/Angriffe im Formular
assets/templates/modals-entity.html      ← XP-Verteilungs-Modal
```

**Kein neues JS-Modul erforderlich** → keine neue Loader.js/build.py-Registrierung nötig → kein 3-fach-Registrierungsrisiko.

### Muster 1: Inspiration-Toggle mit `-stop`-Handler

**Was:** Klickbarer ⭐ auf der Charakterkarte, der NICHT die `edit-char`-Aktion der Karte auslöst.

**Vorbild in `party-render.js:183`:**
```html
data-action="show-hp-calculator-stop" data-type="characters" data-id="${ch.id}"
```

**Neues Muster (in `renderCharacterCard()`):**
```html
<button class="char-inspiration-toggle ${ch.inspiration ? 'active' : ''}"
    data-action="toggle-inspiration-stop"
    data-id="${ch.id}"
    title="${ch.inspiration ? 'Inspiration entfernen' : 'Inspiration vergeben'}">
    ${ch.inspiration ? '⭐' : '☆'}
</button>
```

**Handler in `entity-actions.js`:**
```javascript
'toggle-inspiration-stop': ctx => {
    ctx.event.stopPropagation();   // verhindert edit-char
    const ch = EntityLookup.character(ctx.id);
    if (!ch) return;
    ch.inspiration = !ch.inspiration;
    // KEIN saveUndoState() — trivial reversibel (D-02)
    window.save();
    window.renderParty();
    showToast(ch.inspiration ? '⭐ Inspiration erhalten!' : '☆ Inspiration entfernt');
},
```

### Muster 2: Klickbare Würfe im Detail-Modal (D-04/D-05)

**Was:** Skill-Check, Save und Angriff im `showCharacterDetails`-Modal direkt würfeln.

**Korrekte Pipeline (sanitize-then-dice):**
```javascript
// FALSCH: XSS-Risiko
const html = `Schaden: ${esc(attack.damage)}`;
const withDice = renderClickableDice(html);
// RICHTIG: sanitizeHTML() erst, dann renderClickableDice()
const safeHtml = esc(attack.name);
const diceHtml = renderClickableDice(attack.damage); // damage ist Würfelformel
```

**Skill-Würfe aus dem Modal:** Da `rollSkillCheck()` in `dice-core.js:587` den Dice-Tab-Select (`$('dice-char-select')`) liest, braucht das Detail-Modal einen eigenen schlanken Würfelaufruf der NICHT davon abhängt:

```javascript
function rollSkillFromModal(charId, skillKey) {
    const ch = EntityLookup.character(charId);
    if (!ch) return;
    const mod = calcSkillModifier(ch, skillKey);
    const skillName = SKILL_INFO[skillKey]?.name || skillKey;
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod;
    displayDiceResult(
        total,
        `${esc(ch.name)}: ${skillName} (1d20${formatModifier(mod)})`,
        [roll],
        roll === 20,
        roll === 1
    );
    addToDiceHistory(`${ch.name}: ${skillName}`, total, [roll]);
}
```

**Alternativ (einfacher):** `data-action="roll-char-skill"` in den Modal-Spans einfügen, der Handler liest `data-char-id`, `data-skill-key`, `data-adv` und rechnet lokal. Vorteil: alles in `entity-actions.js`, kein neuer Export nötig.

### Muster 3: Migration für neue Felder (D-08)

**Neuer Eintrag in `MIGRATIONS` (`version-migration.js`):**

```javascript
'5.0.0': data => {
    // Phase 6: Spieler-Verwaltung
    // xp-Feld, skillProficiencies, skillExpertise, attacks[]
    data.characters?.forEach(ch => {
        if (ch.xp === undefined) ch.xp = 0;
        if (!ch.skillProficiencies) ch.skillProficiencies = {};
        if (!ch.skillExpertise)    ch.skillExpertise = {};
        if (!ch.attacks)           ch.attacks = [];
    });
    // Aufstiegsart-Einstellung
    if (!data.settings) data.settings = {};
    if (data.settings.levelingMode === undefined) {
        data.settings.levelingMode = 'xp'; // Default: XP-Modus
    }
    return data;
},
```

**Hinweis:** Aktuelle höchste Migration ist `'4.0.0'`. Schlüssel müssen streng aufsteigend sortierbar bleiben. `'5.0.0'` ist der korrekte nächste Schlüssel.

### Muster 4: XP-Verteilung aus dem Initiative-Abschluss (D-09/D-10)

**Andockpunkt:** `endCombat()` in `features/initiative.js:230` — bestehende Funktion, die beim Bestätigen des Kampfabschlusses HP synchronisiert und `D.initiative` leert.

**Strategie:** Statt `endCombat()` selbst zu modifizieren → neuen Button/Aktion `'finish-combat-xp'` in der Initiative-Toolbar hinzufügen, der ein XP-Verteilungs-Modal öffnet. Im Modal:
1. Automatische XP-Summe aus `D.initiative.combatants.filter(cb => cb.type === 'enemy' || cb.type === 'monster')` via `getXPForCR(cb.cr)`.
2. Manuelles Eingabefeld für Korrektur.
3. „Verteilen"-Button → `distributeXP()` → Level-Up-Check per Charakter → `pushUndo('XP verteilt')` → `save()`.

**Anti-Pattern vermeiden:** `endCombat()` NICHT mit XP-Logik überladen — separate Aktion.

### Anti-Patterns vermeiden

- **Kein `const X = window.X` innerhalb einer Funktion** — führt nach Bundle-Konkatenation zu `SyntaxError`. Stattdessen direkt `window.functionName()` aufrufen oder als `var X = window.X` auf Modul-Ebene.
- **Keine doppelten Top-Level-Funktionsnamen** — Pass-3-Dedup kommentiert Duplikate aus und hinterlässt verwaiste Funktionskörper.
- **Sanitize-then-Dice-Reihenfolge** — immer `esc()` oder `sanitizeHTML()` auf Nutzerdaten, DANN `renderClickableDice()` für Würfelformeln.
- **Keine Würfel-Spans in `innerHTML` mit rohem Nutzer-Inhalt** — Attack-Namen mit `esc()`, Schaden-Formeln mit `renderClickableDice()` als separater Pass.

---

## Don't Hand-Roll (Nicht selbst implementieren)

| Problem | Nicht bauen | Stattdessen verwenden | Warum |
|---------|-------------|----------------------|-------|
| Attribut-Modifier | Eigene Formel | `getAbilityModifier(score)` in `game-rules.js:16` | Bereits korrekt implementiert |
| Übungsbonus | Eigene Tabelle | `getProficiencyBonus(level)` in `game-rules.js:32` oder `getProfBonus` in `utilities.js:412` | 5e-konform, bereits verwendet |
| Klickbare Würfelformeln | Eigene Regex | `renderClickableDice(text)` in `bestiary-render.js:41` | Bewährte Muster incl. Bruch-CR-Handling |
| Würfelanzeige + Historie | Eigene UI | `displayDiceResult()` + `addToDiceHistory()` in `dice-core.js` | Event-Log + History-Panel bereits verdrahtet |
| Skill→Attribut-Mapping | Eigenes Objekt | `SKILL_INFO` in `core/constants.js:217` | Deutsche Namen + 18 Skills bereits vorhanden |
| CR→XP-Konvertierung | Eigene Tabelle | `CR_TO_XP` in `encounter-calculator.js:32` | Komplette CR-0 bis CR-30 Tabelle inkl. Brüche |
| Schema-Migration | Ad-hoc-Patches | `MIGRATIONS`-Objekt in `version-migration.js:9` | Versionierter, testbarer Migrations-Flow |
| Würfel-Vorteil/Nachteil | Eigenes Würfelmodul | `rollAdvantage()` / `rollDisadvantage()` in `dice-core.js` oder `parseDiceNotation('2d20kh1')` | Bereits implementiert und in Event-Log integriert |

---

## Häufige Fallstricke (Landminen)

### Fallstrick 1: Sanitize-then-Dice-Reihenfolge

**Was schiefgeht:** `renderClickableDice()` vor `esc()` aufrufen → die erzeugten `<span>`-Tags werden von `sanitizeHTML()` herausgefiltert (span mit `data-action` ist nicht in der Allowlist).

**Warum:** `sanitizeHTML()` in `utils/basic.js` filtert unbekannte Attribute und entfernt `data-action`.

**Abhilfe:** 1. Nutzerdaten mit `esc()` escapen. 2. Bekannte Würfelformeln (nicht Nutzereingabe) danach mit `renderClickableDice()` wrappen. Die Formel-Strings in `attacks[]` gelten als Nutzerinhalt — sie müssen validiert werden (z.B. nur `/^\d+[dD]\d+([+-]\d+)?$/` erlauben) BEVOR sie als klickbare Dice dargestellt werden.

**Warnsignal:** Würfel-Spans erscheinen nicht oder werden als `[object Object]` angezeigt.

### Fallstrick 2: `-stop`-Handler fehlt beim Inspiration-Toggle

**Was schiefgeht:** `data-action="toggle-inspiration"` ohne `stopPropagation` → der Klick auf ⭐ propagiert zum `char-card-header`, der `data-action="edit-char"` trägt → Charakter-Formular öffnet sich ungewollt.

**Abhilfe:** Action-Name auf `toggle-inspiration-stop` setzen, Handler ruft `ctx.event.stopPropagation()` als erstes auf.

**Vorbild:** `show-hp-calculator-stop` in `party-render.js:183` — exakt dasselbe Muster.

### Fallstrick 3: parseEntityId für Charakter-IDs

**Was schiefgeht:** `D.characters.find(c => c.id === id)` — `id` kommt aus `data-id` als String, `c.id` ist Number → `===` schlägt fehl.

**Abhilfe:** Immer `parseEntityId(id)` aus `utils/utilities.js` oder `EntityLookup.character(id)`.

### Fallstrick 4: SKILLS ≠ SKILL_INFO

**Was schiefgeht:** Aus `dice-core.js` die `SKILLS`-Konstante für die Skills-Sektion verwenden → falsche Struktur (`{name, skill}`-Array pro Attribut statt `{name, attr}`-Objekt pro Skill-Key).

**Abhilfe:** Immer `SKILL_INFO` aus `core/constants.js:217` nutzen. `SKILLS` ist nur für das Würfelsystem-Panel im Dice-Tab.

### Fallstrick 5: CR_TO_XP mit gemischten Schlüsseltypen

**Was schiefgeht:** `CR_TO_XP[cb.cr]` wenn `cb.cr === '1/8'` (String) funktioniert, aber `CB_TO_XP[1]` (Number-Key) und `CR_TO_XP['1']` (String-Key) sind UNTERSCHIEDLICHE Einträge in JavaScript-Objekten — beide existieren.

**Abhilfe:** `getXPForCR(cr)` als lokale Hilfsfunktion, die beide Lookup-Varianten probiert:
```javascript
function getXPForCR(cr) {
    return CR_TO_XP[cr] ?? CR_TO_XP[String(cr)] ?? 0;
}
```

### Fallstrick 6: getAbilityModifier nicht window-exportiert

**Was schiefgeht:** `window.getAbilityModifier` aufrufen → undefined. Die Funktion ist in `game-rules.js` global lexikalisch deklariert, aber NICHT via `window.getAbilityModifier = ...` exportiert (nur `getProficiencyBonus` ist exportiert).

**Abhilfe:** `getAbilityModifier()` direkt aufrufen (global im lexikalischen Scope). Alternativ für Modul-Isolation: im selben Modul inline definieren: `Math.floor((score - 10) / 2)`.

### Fallstrick 7: No `const X = window.X` in Funktionen

**Was schiefgeht:** 
```javascript
function handleXP() {
    const CR_TO_XP = window.CR_TO_XP; // VERBOTEN
}
```
Nach Bundle-Konkatenation wird dies zu einem globalen `const CR_TO_XP =` auf Modul-Ebene → `SyntaxError: Identifier 'CR_TO_XP' has already been declared` da `CR_TO_XP` bereits als `const` in `encounter-calculator.js` definiert ist.

**Abhilfe:** Auf `CR_TO_XP` direkt zugreifen — es ist im globalen lexikalischen Scope sichtbar.

### Fallstrick 8: Inspiration-Toggle kein Undo

**Was schiefgeht:** `saveUndoState()` vor dem Toggle aufrufen → Undo-Stack füllt sich mit trivialen Toggles, der Nutzer kann bedeutsame Aktionen nicht mehr rückgängig machen.

**Abhilfe:** D-02 ist klar: `save()` direkt, kein `saveUndoState()`. Analogie: HP-Änderungen über den HP-Calculator haben auch kein Undo.

---

## Reuse-vs-Neu-Entscheidung pro Feature

### CHAR-02: Inspiration

**Erweiterte Dateien:**
- `features/party/party-render.js` — `renderCharacterCard()`: ⭐ immer sichtbar (nicht nur bei `ch.inspiration === true`), als Button mit `toggle-inspiration-stop`-Action
- `ui/actions/entity-actions.js` — Handler `toggle-inspiration-stop`
- `assets/styles/party.css` — CSS für `char-inspiration-toggle` (aktiv/inaktiv)

**Neue Datei:** Keine.

### CHAR-03: Erweiterte Charakterwerte

**Erweiterte Dateien:**
- `features/party/party-details.js` — `showCharacterDetails()`: Skills-Sektion (nach Attribut gruppiert), Saves klickbar, Angriffs-Sektion
- `features/party/party-crud.js` — `saveCharacter()`: liest `skillProficiencies`, `skillExpertise`, `attacks[]` aus Formular; `editChar()`: füllt neue Felder zurück
- `assets/templates/view-party.html` — Formular-UI für Skills/Expertise-Checkboxen + Angriffs-Einträge
- `ui/actions/entity-actions.js` — Handler für `roll-char-skill-stop`, `roll-char-save-stop`, `roll-char-attr-stop`, `roll-char-attack-stop`, `add-attack`, `delete-attack`
- `assets/styles/party.css` — CSS für Skills-Grid, Expertise-Toggle, Angriffs-Liste

**Neue Datei:** Keine.

### CHAR-01: XP-/Milestone-Tracker

**Erweiterte Dateien:**
- `core/constants.js` — `XP_LEVEL_THRESHOLDS` hinzufügen
- `core/data.js` — `D.settings.levelingMode` im Schema ergänzen
- `features/party/party-details.js` — XP-Anzeige + Levelaufstieg-Hinweis
- `features/party/party-crud.js` — `xp`-Feld in `saveCharacter()`/`editChar()`
- `features/initiative.js` — Button „Kampf abschließen / XP verteilen" + `showXpDistributionModal()`
- `ui/actions/combat-actions.js` — Handler `finish-combat-xp`, `apply-xp-distribution`
- `systems/spellslots/version-migration.js` — Migration `'5.0.0'`
- `assets/templates/modals-entity.html` — XP-Verteilungs-Modal HTML
- `assets/styles/initiative.css` — Styles für den Modal
- `assets/styles/party.css` — XP-Badge auf Charakterkarte (optional)

**Neue Datei:** Keine.

---

## Validierungs-Architektur

Diese Sektion beschreibt die Nyquist-Validierungsstrategie für Phase 6.

### Test-Framework

| Eigenschaft | Wert |
|-------------|------|
| Framework (Unit) | Jest (`jest.config.cjs`) |
| Framework (E2E) | Playwright (`playwright.config.js`) |
| Bestehende Unit-Tests | `tests/unit/` (7 Dateien) |
| Relevanter E2E-Ordner | `tests/e2e/crud/party.spec.js`, `tests/e2e/features/` |
| E2E-Basis | `file://`-Protokoll (kein localhost!) — Pflicht für dieses Repo |
| E2E-Import | `import { test, expect } from '@playwright/test'` (ESM, kein CommonJS `require`) |

### Anforderung→Test-Mapping

| Req/Entscheidung | Beobachtbares Verhalten | Testtyp | Assertion |
|---|---|---|---|
| **CHAR-02** Inspiration | Klick auf ☆ → ⭐; Reload → immer noch ⭐ | E2E | `expect(page.locator('.char-inspiration-toggle.active')).toBeVisible()` nach Toggle |
| **CHAR-02** Toggle-Stop | Klick auf ⭐ öffnet KEIN Charakter-Formular | E2E | `expect(page.locator('#char-form.open')).not.toBeVisible()` nach Inspiration-Klick |
| **D-02** Kein Undo | `saveUndoState` wird bei Inspiration-Toggle nicht aufgerufen | Unit | Mock-Test: `saveUndoState` Spy = 0 Aufrufe nach Inspiration-Toggle |
| **CHAR-03 / D-04** Stealth-Wurf Experte | Schurke Level 5, DEX 18, Expertise Heimlichkeit → Ergebnis ≥ 11 (W20+10 min 1+10=11) | Unit | `calcSkillModifier(ch, 'stealth') === 10` (DEX+4 + 2×ProfBonus+3) |
| **CHAR-03 / D-04** Attribut-Check klickbar | Klick auf STR-Box im Detail-Modal → Würfelergebnis in Dice-Historie | E2E | `diceHistory.length` steigt nach Klick |
| **CHAR-03 / D-05** Angriff | Angriff mit +5, Schaden 1d8+3 → Trefferwurf 1d20+5, Schaden 1d8+3 separat würfelbar | E2E | Dice-Span mit `data-value="1d20+5"` und `data-value="1d8+3"` im Modal vorhanden |
| **CHAR-01 / D-10** XP-Verteilung | 2 CR-1-Monster (je 200 XP) = 400 XP, 4 lebende Charaktere → je 100 XP | Unit | `Math.floor(400 / 4) === 100`; Test `distributeXP(400)` mit 4 aktiven Chars |
| **CHAR-01 / D-11** Levelaufstieg-Hinweis | Charakter Level 1, xp = 300 → `canLevelUp(ch) === true`; Hinweis sichtbar | Unit | `canLevelUp({ level: 1, xp: 300 }) === true`; `canLevelUp({ level: 1, xp: 299 }) === false` |
| **CHAR-01 / D-11** Keine XP bei Milestone | `D.settings.levelingMode = 'milestone'` → XP-Felder versteckt, +1-Level-Button sichtbar | E2E | Visibilitätsprüfung basierend auf `levelingMode` |
| **CHAR-01 / D-09** XP-Auto-Summe | Kampf mit 2 Wolfstatblocks (CR 1/4 = je 50 XP) → vorberechnete Summe = 100 XP im Modal | Unit | `getXPForCR('1/4') === 50`; Summe aus 2 Wölfen = 100 |
| **CHAR-01 / D-11** XP-Schwelle unterschieden | `XP_LEVEL_THRESHOLDS[1] === 300` (Level 2), `XP_THRESHOLDS[1].easy === 25` (Encounter-Schwierigkeit) | Unit | Beide Konstanten auf korrekte Werte prüfen |

### Bestehende Test-Infrastruktur erweitern

**Unit-Tests (neue Testfälle in bestehende Dateien oder neue Datei):**
```
tests/unit/character-advancement.test.js  (neu — oder in entities.test.js)
```

Testfälle:
- `calcSkillModifier` für alle Kombinationen (ungeübt, geübt, Expertise)
- `canLevelUp` für Grenzwerte (299 → false, 300 → true bei Level 1)
- `getXPForCR` für Bruch-CRs ('1/8', '1/4', '1/2') und ganze CRs
- `distributeXP` mit Rest (401 XP / 4 Chars = je 100, Rest 1)

**E2E-Tests (neue Datei):**
```
tests/e2e/features/character-advancement.spec.js  (neu)
tests/e2e/features/inspiration.spec.js            (neu oder in party-crud.spec.js)
```

**WICHTIG — bekannte E2E-Fallstricke:**
- `file://`-Basis: `playwright.config.js` nutzt `file://`-Protokoll, KEIN `http://localhost`
- Import: `import { test, expect } from '@playwright/test'` (ESM, nicht CommonJS)
- `addCombatant()`-Helper in `tests/e2e/features/initiative.spec.js` ist kaputt (bekannt aus `docs/e2e-failure-triage.md`) — Initiative-E2E-Tests für XP-Verteilung müssen ohne diesen Helper auskommen

### Wave-0-Lücken (vor Implementierung zu erstellen)

- [ ] `tests/unit/character-advancement.test.js` — Einheitstests für `calcSkillModifier`, `canLevelUp`, `getXPForCR`, `distributeXP`
- [ ] Fixture in `tests/setup.js` oder inline: Beispiel-Charakter mit `level`, `xp`, `attributes`, `skillProficiencies`, `skillExpertise`
- [ ] E2E-Test-Datei `tests/e2e/features/inspiration.spec.js`
- [ ] E2E-Test-Datei `tests/e2e/features/character-advancement.spec.js`

---

## Umgebungs-Verfügbarkeit

Phase 6 ist eine reine Codeänderungs-Phase — keine externen Tools, Datenbanken oder CLIs erforderlich. Alle Abhängigkeiten sind bereits Teil der bestehenden Entwicklungsumgebung.

| Abhängigkeit | Benötigt für | Verfügbar | Version | Fallback |
|---|---|---|---|---|
| Node.js + npm | Tests, Lint, Build | ✓ | (Projektvorgabe) | — |
| Python | `build.py` | ✓ | (Projektvorgabe) | — |
| Playwright | E2E-Tests | ✓ | (devDependency) | — |
| Jest | Unit-Tests | ✓ | (devDependency) | — |

---

## Sicherheitsdomäne

Phase 6 fügt neue Nutzer-editierbare Felder hinzu: `xp` (Number), `skillProficiencies` (Object), `skillExpertise` (Object), `attacks[]` (Array von `{name, attackBonus, damage, damageType}`). Alle diese Felder können in HTML-Templates landen.

| ASVS-Kategorie | Betrifft | Standard-Kontrolle |
|---|---|---|
| V5 Input Validation | Ja — Angriffsnamen, Würfelformeln | `esc()` für Namen; Regex-Whitelist für Würfelformeln (`/^\d+[dD]\d+([+-]\d+)?$/`) |
| V2 Authentication | Nein | n/a (offline, single-user) |
| V3 Session Management | Nein | n/a |
| V4 Access Control | Nein | n/a |
| V6 Kryptographie | Nein | n/a |

**Bekannte Bedrohungsmuster:**

| Muster | STRIDE | Standard-Mitigation |
|---|---|---|
| XSS via Angriffs-Namen | Tampering | `esc(attack.name)` in allen Templates |
| XSS via Würfelformeln | Tampering | Whitelist-Validierung vor `renderClickableDice()` |
| DoS via langer Angriffsliste | DoS | Limit: max. 20 Angriffe pro Charakter |
| XP-Manipulation via localStorage | Tampering | Irrelevant (offline, single-user, kein Vertrauensmodell) |

---

## Annahmen-Protokoll

| # | Behauptung | Abschnitt | Risiko bei Fehler |
|---|---|---|---|
| A1 | `APP_CONFIG.VERSION` ist aktuell `'2.6.1'` — nächste Migration-Version sollte `'5.0.0'` oder höher sein | Migration-Muster | Falscher Migrations-Trigger; einfach korrigierbar |
| A2 | `rollQrefDice()` (der Ziel-Handler für `bestiary-roll-dice`) ist in `systems/spellslots/quick-reference.js` definiert und exportiert | Würfel-Routing | Skill-Würfel aus Modal landen nicht in der Historie; Fallback: direkt `parseDiceNotation` + `displayDiceResult` aufrufen |
| A3 | `D.initiative.combatants[*].cr` ist für Bestiary-Kombattanten gesetzt | XP-Auto-Summe | Auto-Summe liefert 0; manuelle Eingabe bleibt möglich |

---

## Offene Fragen

1. **Adv/Nachteil-Bedienung im Detail-Modal**
   - Was wir wissen: `rollAdvantage()` / `rollDisadvantage()` sind in `dice-core.js` vorhanden; im Floating-Panel gibt es Quick-Buttons.
   - Unklar: Im Detail-Modal sind zwei Mini-Buttons pro Wurf vs. ein globaler Modus-Schalter (Discretion gemäß D-04).
   - Empfehlung: Zwei Mini-Buttons direkt neben jedem Würfelwert (+/−-Vorteil). Weniger Klicks, kein globaler Zustand nötig.

2. **Inspiration-Überblick in Party-Übersicht**
   - Was wir wissen: `renderPartyOverview()` zeigt 4-5 Stats-Karten; Conditions-Zähler erscheint konditionell.
   - Unklar: Soll ein "N Inspiration"-Zähler angezeigt werden? (Discretion gemäß D-02/optionaler Überblick)
   - Empfehlung: Nur wenn mindestens 1 Charakter Inspiration hat → `${count} ⭐ Inspiration`-Karte anzeigen.

3. **XP auf Charakterkarte vs. nur im Detail-Modal**
   - Was wir wissen: D-08 sagt „XP-Stand im Detail-Modal angezeigt (Karte optional)".
   - Unklar: Ob ein XP/Level-Fortschrittsbalken auf der Karte gewünscht ist.
   - Empfehlung: Im v1 nur Detail-Modal; Karte bleibt schlank.

---

## Quellen

### Primär (HIGH-Konfidenz — direkte Code-Lektüre)

- `features/party/party-crud.js` — Schema, `saveCharacter`, `editChar`, `updateProficiencyBonus` verifiziert
- `features/party/party-details.js` — `showCharacterDetails` vollständig gelesen
- `features/party/party-render.js` — `renderCharacterCard`, `renderPartyOverview` vollständig gelesen
- `core/constants.js` — `SKILL_INFO` (:217), `DND_RULES`-Namespace (:498-519), `COMBAT_CONSTANTS` verifiziert
- `utils/game-rules.js` — `getAbilityModifier`, `getProficiencyBonus`, `formatModifier` vollständig gelesen
- `features/bestiary/bestiary-render.js` — `renderClickableDice` (:41-49) verifiziert
- `ui/actions/entity-actions.js` — `bestiary-roll-dice`-Handler (:289-292) verifiziert
- `features/dice/dice-core.js` — `displayDiceResult`, `addToDiceHistory`, `rollAdvantage`, `rollSkillCheck`, `rollCharSave` vollständig gelesen
- `features/encounter-calculator.js` — `XP_THRESHOLDS` (:9), `CR_TO_XP` (:32), `calculateMonsterXP` (:447) verifiziert
- `features/initiative.js` — `endCombat()` (:230), `renderInit()` (:104) gelesen
- `core/data.js` — `D.characters`-Schema, `D.settings`, `D.initiative` vollständig gelesen
- `systems/spellslots/version-migration.js` — `MIGRATIONS`-Objekt vollständig gelesen; letzter Key `'4.0.0'`
- `ui/actions/combat-actions.js` — Handler-Muster verifiziert
- `loader.js` — Modul-Reihenfolge vollständig gelesen (92 Module)
- `.planning/codebase/STRUCTURE.md`, `CONVENTIONS.md`, `CONCERNS.md` — architektonische Einschränkungen

### Sekundär (MEDIUM-Konfidenz — PHB-Regelwerk aus Training)

- PHB D&D 5e 2014, S.15 — Character Advancement Tabelle (XP_LEVEL_THRESHOLDS-Werte) [ASSUMED: Training-Wissen; Werte sind 5e-Standard und wurden in der Community-Diskussion des CONTEXT.md bestätigt]
- PHB D&D 5e 2014, S.173 — Inspiration (binär, kein Stapeln)
- PHB D&D 5e 2014, S.174 — Proficiency Bonus nach Level

---

## Metadaten

**Konfidenz-Aufschlüsselung:**
- Reuse-Targets: HIGH — alle Dateien direkt gelesen, Zeilennummern verifiziert
- 5e-Regelwerk-Mathematik: HIGH — aus `game-rules.js` und `dice-core.js` verifiziert
- PHB-Level→XP-Tabelle: MEDIUM — Training-Wissen, aber standard 5e-Werte, keine Abweichungen erwartet
- Architektur-Empfehlungen: HIGH — basierend auf bestehendem Codebase-Muster

**Recherche-Datum:** 2026-06-15
**Gültig bis:** 2026-07-15 (stabiles Codebase, keine Abhängigkeits-Updates)
