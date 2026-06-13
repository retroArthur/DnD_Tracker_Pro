# Phase 4: Initiative-Erweiterungen — Recherche

**Recherchiert:** 2026-06-13
**Domäne:** Initiative-Ansicht / Kampfmanagement — Statblock-Panel, Legendäre-Zähler, Mob-Modus
**Konfidenz:** HOCH

---

<user_constraints>
## Nutzervorgaben (aus 04-CONTEXT.md)

### Gesperrte Entscheidungen

**INIT-01 Statblock-Panel:**
- D-01: Seitliches Panel (Drawer rechts) — voller Statblock, Initiative-Liste bleibt sichtbar.
- D-02: Auslöser = eigener 📖-Button pro Zeile (kein Klick auf Name/Zeile).
- D-03: Button bei ALLEN Kombattanten. Bestiary-Monster → voller Statblock; Spieler/manuell → Basis-Infos (HP/AC/Effekte).
- D-04: Klickbare Würfe im Panel via `renderClickableDice()`.

**INIT-02 Legendäre Resistenzen:**
- D-05: Anzahl auto-parsen per Regex auf `(N/Tag)` im Trait-Text; manuelles Override pro Kombattant.
- D-06: Zähler erscheint nur bei Erkennung.
- D-07: **KEIN** Init-20-Reset. LR sind `/Tag` (Reset nur per manuellen Knopf). Bewusste Abweichung von Roadmap-SC2.

**INIT-02 Legendäre Aktionen:**
- D-08: Pip-Zähler (Death-Save-Dots als Vorbild), kein itemisierter Aktionskatalog in v1.
- D-09: Auto-Anzeige nur bei `legendaryActionsPerRound > 0`.
- D-10: Auto-Reset bei Initiative 20 (Rundenwechsel).

**INIT-03 Mob-Modus:**
- D-11: Erstellung via Toggle im Mengen-Dialog (`addBestiaryToInitiative`).
- D-12: Pool-HP = Summe Einzel-HP; Anzeige „X von N am Leben".
- D-13: Sammel-Angriff: zwei umschaltbare Modi (a) N-fach-Wurf, (b) DMG-Mob-Regel.
- D-14: Schaden automatisch summiert.

**Architektur (bindend):**
- Neue Combatant-Felder runtime-only, keine Migration.
- SRD-Daten NIEMALS in `D`, lazy via `getSRDMonsters()`.
- Alle neuen Module in `build.py` UND `loader.js`.
- Keine `const X = window.X` in Funktionen; keine doppelten Top-Level-Funktionsnamen.
- `saveUndoState()` vor destruktiven Mutationen; Pip-Klicks → `save()`.
- `sanitizeHTML()` für Statblock-Text mit `<b>`-Markup; `esc()` für alle `D`-Werte.
- `parseEntityId()` für Combatant-IDs; `statblockRef.id` ist String — nicht parseEntityId.

### Claude's Discretion
- Genaue deutsche UI-Texte (Button-Tooltip, Panel-Header, Mob-Format, Pip-Labels).
- Panel-Realisierung: eigener Drawer vs. wiederverwendetes Modal-Gerüst.
- DMG-Mob-Regel-Berechnung (D-13b): exakte Schwellen/Formel.
- LR-Reset-Kopplung: nur manueller Knopf vs. zusätzlich Lange Rast.
- Pip-Darstellung/CSS.
- Integration Mob ↔ Death Saves / Concentration / AoE-Modal.

### Zurückgestellte Ideen (OUT OF SCOPE)
- Itemisierte LA-Liste mit Punktkosten.
- Nachträgliches Verknüpfen ohne `statblockRef`.
- Nachträgliches Zusammenfassen bestehender Einzelkombattanten zu Mob.
- LR-Reset an Rest-Manager koppeln (optionale v2-Erweiterung).
</user_constraints>

<phase_requirements>
## Phasen-Anforderungen

| ID | Beschreibung | Forschungsunterstützung |
|----|-------------|------------------------|
| INIT-01 | Nutzer kann per Klick (📖-Button) auf einen Kombattanten den vollständigen Statblock als Panel sehen (Aktionen, Traits, Saves) | `renderBestiaryDetail()` wiederverwendbar; Panel-Infrastruktur via `modal-overlay` |
| INIT-02 | Nutzer kann Legendäre Aktionen und Legendäre Resistenzen pro Runde zählen und zurücksetzen | SRD-Schema mit `legendaryActionsPerRound` + `traits[]`-Parsing; Pip-UI analog Death-Saves |
| INIT-03 | Nutzer kann Gegnergruppen als Mob führen (eine Initiative-Zeile, Pool-HP, Sammel-Angriffe) | `addBestiaryToInitiative()` als Andockpunkt; DMG-Mob-Regel dokumentiert |
</phase_requirements>

---

## Zusammenfassung

Phase 4 baut vollständig auf dem in Phase 3 gelegten Datenfundament auf. Alle drei Kernfunktionen (Statblock-Panel, Legendäre-Zähler, Mob-Modus) docken an `features/initiative.js` an und nutzen vorhandene Muster aus dem Bestiary.

**Statblock-Panel (INIT-01):** `renderBestiaryDetail(id, source)` schreibt direkt in `panel.innerHTML` — die Funktion ist **tab-gebunden** (sucht `#bestiary-detail-panel`). Für das Initiative-Panel wird eine schlanke Extraktionsfunktion `renderStatblockHTML(monster)` benötigt, die einen HTML-String zurückgibt, ohne ein DOM-Element vorauszusetzen. Das Panel selbst wird als `.modal-overlay`-Drawer mit CSS `right: 0; top: 0; height: 100%` umgesetzt — ein Muster, das im Projekt bereits für Concentration-Modal und AoE-Modal existiert (dynamisch per `document.createElement`).

**Legendäre Zähler (INIT-02):** Das SRD-Datenschema hat `legendaryActionsPerRound` (0 oder 3 bei allen 6 Boss-Monstern) und `legendaryActions[]`. Legendäre Resistenzen stehen als Trait-Eintrag mit `name: "Legendäre Resistenz (3-mal täglich)"` — der Regex `(\d+)-mal täglich` ist zuverlässig für den deutschen Bestand; englisch `(\d+)/Day` als Fallback für custom Kreaturen. Der Init-20-Reset-Anker sitzt in `nextTurn()` (Zeile 384–387): `if (init.currentTurn >= init.combatants.length) { init.currentTurn = 0; init.round++; }` — hier wird der Übergang zur neuen Runde erkannt. Die Init-20-Logik für Lair-Actions läuft über einen Kombattanten mit `type === 'lair'`, der Initiative 20 hat — der Reset der LA kann an derselben Stelle (`init.currentTurn = 0`) ankoppeln.

**Mob-Modus (INIT-03):** Der Mengen-Dialog in `addBestiaryToInitiative()` (`bestiary-actions.js:72`) ist der direkte Andockpunkt für den Mob-Toggle. Pool-HP = Σ Einzel-HP (mit ±10 % Variation pro Exemplar). Die DMG-Mob-Regel berechnet automatisch, wie viele der N Angreifer treffen, ohne Würfeln. Die bestehende Initiative-Render-Logik muss eine Sonderzeile für Mob-Kombattanten (Flag `mob`) unterstützen und einzelne Features (Death Saves, Concentration) für Mobs ausblenden.

**Primärempfehlung:** Extraktion einer reinen `renderStatblockHTML(monster)`-Funktion aus `bestiary-render.js`, Drawer als dynamisch erzeugtes `.modal-overlay`-Element, Pip-UI analog `renderDeathSaves()`, LA-Reset in `nextTurn()`, Mob-Toggle im bestehenden Mengen-Dialog.

---

## Architektur-Verantwortlichkeitskarte

| Fähigkeit | Primäre Schicht | Sekundäre Schicht | Begründung |
|-----------|----------------|-------------------|-----------:|
| Statblock-Panel anzeigen | `features/initiative.js` + `features/initiative-statblock.js` (neu) | `features/bestiary/bestiary-render.js` (Datenrenderer) | Initiative-View besitzt das Panel; Renderer liefert HTML-String |
| LA/LR-Zähler anzeigen | `features/initiative.js` (renderInit-Erweiterung) | `features/initiative-extras.js` (falls vorhanden) | Zähler sind Teil der Kombattanten-Zeile |
| LA-Reset bei Rundenwechsel | `features/initiative.js` `nextTurn()` | — | Einzige Stelle, an der Rundenübergang erkannt wird |
| LR manuell zurücksetzen | `features/initiative.js` / neuer Action-Handler | `ui/actions/combat-actions.js` | Pip-Klick ist Combat-Action |
| Mob erzeugen | `features/bestiary/bestiary-actions.js` | — | Bestehender `addBestiaryToInitiative()`-Pfad |
| Mob-Zeile rendern | `features/initiative.js` `renderInit()` | — | Mob ist Sonderfall in der Init-Liste |
| Mob-Schaden (Pool-HP) | `features/initiative.js` `modHp()` / Mob-Handler | `systems/hp-calculator.js` (Muster) | Pool-HP-Abzug analog Einzel-HP |
| DMG-Mob-Angriff | `features/initiative.js` / neuer Mob-Handler | `features/dice/dice-core.js` | Würfelformel aufrufen |
| Neue data-actions registrieren | `ui/actions/combat-actions.js` | — | Einheitliche Stelle für alle Kampf-Actions |

---

## Standard-Stack

### Kern (ausschließlich Projektbestand — keine neuen Abhängigkeiten)

| Modul | Zweck | Warum |
|-------|-------|-------|
| `features/initiative.js` | Zentraler Andockpunkt: `renderInit()`, `nextTurn()`, `modHp()` | Alle Init-Features laufen hier |
| `features/bestiary/bestiary-render.js` | `renderBestiaryDetail()`, `renderClickableDice()`, `renderTraitList()` | Vollständiger Statblock-Renderer |
| `features/bestiary/bestiary-actions.js` | `addBestiaryToInitiative()`, `getBestiaryMonster()` | Mengen-Dialog und Monster-Lookup |
| `core/srd-monsters.js` | `getSRDMonsters()` — lazy cached, nie in `D` | Statblock-Datenquelle für Panel |
| `ui/actions/combat-actions.js` | `data-action`-Handler registrieren | Alle neuen Actions hier |
| `systems/hp-calculator.js` | Muster für HP-Mutation | Pool-HP-Schaden-Pattern |

### Neue Module (in `build.py` + `loader.js` eintragen)

| Modul | Zweck | Ladestelle |
|-------|-------|-----------|
| `features/initiative-statblock.js` | Drawer-Panel für Statblock-Anzeige: `renderStatblockHTML()`, `showInitStatblockPanel()`, `closeInitStatblockPanel()` | Nach `features/bestiary/bestiary-render.js` |
| `features/initiative-mob.js` | Mob-Logik: `createMobCombatant()`, `renderMobRow()`, `applyMobDamage()`, `rollMobAttack()`, `dissolveMob()` | Nach `features/initiative-extras.js` |

**Kein externer Package-Install** — diese Phase bringt keine npm-Abhängigkeiten.

---

## Paket-Legitimitätsprüfung

Keine externen Pakete werden installiert. Abschnitt entfällt.

---

## Architektur-Muster

### System-Architektur-Diagramm

```
[Initiative-Tab]
    │
    ├─► [📖-Button je Zeile]
    │       │
    │       └─► showInitStatblockPanel(cbId)
    │               │
    │               ├─ cb.statblockRef vorhanden?
    │               │       JA ─► getBestiaryMonster(ref.id, ref.source)
    │               │              └─► renderStatblockHTML(monster)
    │               │                      └─► sanitizeHTML + renderClickableDice
    │               │                              └─► Drawer (#init-statblock-panel) anzeigen
    │               └─────── NEIN ─► Basis-Infos (HP/AC/Effekte) im Drawer
    │
    ├─► [LA-Pips je Zeile] — bei legendaryActionsPerRound > 0
    │       │
    │       ├─ Pip-Klick: data-action="init-use-la"
    │       │       └─► cb.legendaryActions.remaining--  → save()
    │       └─ nextTurn() Rundenübergang (currentTurn = 0)
    │               └─► alle Kombattanten: cb.legendaryActions.remaining = max → save()
    │
    ├─► [LR-Pips je Zeile] — bei parsiertem LR-Trait
    │       │
    │       ├─ Pip-Klick: data-action="init-use-lr"
    │       │       └─► cb.legendaryResistance.remaining--  → save()
    │       └─ Manueller Reset-Knopf: data-action="init-reset-lr"
    │               └─► cb.legendaryResistance.remaining = max → save()
    │
    └─► [Mob-Zeile]
            │
            ├─ Erzeugung: addBestiaryToInitiative() mit Mob-Toggle
            │       └─► eine Zeile statt N Zeilen; cb.mob = {count, poolHp, maxPoolHp, ...}
            ├─ HP-Abzug: modHp(mobId, -damage)
            │       └─► cb.mob.poolHp -= damage; lebend = ceil(poolHp / individualMaxHp)
            └─ Angriff: rollMobAttack(mobId, mode)
                    ├─ Modus A: N-fach-Wurf → rollQrefDice("1d20+bonus") × N anzeigen
                    └─ Modus B: DMG-Mob-Regel → hits = berechnet; hits × Schadenswürfel summieren
```

### Empfohlene Dateistruktur

```
features/
├── initiative.js                   ← Erweiterung: renderInit(), nextTurn(), modHp()
├── initiative-statblock.js         ← NEU: Drawer-Panel
└── initiative-mob.js               ← NEU: Mob-Logik

assets/styles/
└── initiative.css                  ← Erweiterung: Pip-CSS, Drawer-CSS, Mob-Zeile-CSS

assets/templates/
└── view-encounters.html            ← Erweiterung: Drawer-Container, Mob-Dialog-Toggle
```

### Muster 1: Statblock-Panel (INIT-01)

**Was:** Drawer-Panel rechts, zeigt Statblock ohne Seitenwechsel.

**Problem:** `renderBestiaryDetail(id, source)` sucht `#bestiary-detail-panel` und schreibt direkt ins DOM — tab-spezifisch und nicht wiederverwendbar.

**Lösung:** Schlanke Extraktion einer reinen HTML-String-Funktion.

```javascript
// features/initiative-statblock.js
// [VERIFIED: Codebase — bestiary-render.js:218-437, Struktur direkt übertragen]

function renderStatblockHTML(monster, source) {
    // Nur HTML-String zurückgeben, kein DOM-Zugriff
    // Wiederverwendet: renderTraitList(), renderClickableDice(), esc(), sanitizeHTML()
    // Exakt dieselbe Struktur wie bestiary-render.js:349-423
    // WICHTIG: sanitizeHTML() ZUERST, dann renderClickableDice() — analog 03-03-Entscheidung
    var statblockHtml = '<div class="bestiary-statblock read-aloud parchment">' +
        // ... (identische Sektionen 1-20 aus renderBestiaryDetail)
        '</div>';
    return statblockHtml;
}

function showInitStatblockPanel(cbId) {
    var cb = getCombatant(cbId);
    if (!cb) return;

    var panel = $('init-statblock-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'init-statblock-panel';
        panel.className = 'modal-overlay init-statblock-drawer';
        panel.innerHTML = '<div class="init-statblock-content"></div>';
        panel.addEventListener('click', function(e) {
            if (e.target === panel) closeInitStatblockPanel();
        });
        document.body.appendChild(panel);
    }

    var content = panel.querySelector('.init-statblock-content');
    if (cb.statblockRef) {
        var monster = getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source);
        if (monster) {
            content.innerHTML = renderStatblockHTML(monster, cb.statblockRef.source);
        } else {
            content.innerHTML = renderBasicCombatantInfo(cb);
        }
    } else {
        content.innerHTML = renderBasicCombatantInfo(cb);
    }
    panel.classList.add('show');
}

function closeInitStatblockPanel() {
    var panel = $('init-statblock-panel');
    if (panel) panel.classList.remove('show');
}

function renderBasicCombatantInfo(cb) {
    // Basis-Infos für Kombattanten ohne statblockRef (D-03)
    return '<div class="init-statblock-basic">' +
        '<div class="init-statblock-name">' + esc(cb.name) + '</div>' +
        '<p>HP: ' + esc(String(cb.currentHp)) + '/' + esc(String(cb.maxHp)) + '</p>' +
        '<p>RK: ' + esc(String(cb.ac || 10)) + '</p>' +
        // Effekte, Conditions
        '</div>';
}

window.showInitStatblockPanel = showInitStatblockPanel;
window.closeInitStatblockPanel = closeInitStatblockPanel;
```

**CSS-Muster (in `assets/styles/initiative.css`):**

```css
/* Statblock-Drawer rechts */
.init-statblock-drawer {
    position: fixed;
    top: 0; right: 0;
    width: 420px;
    max-width: 100vw;
    height: 100%;
    background: rgba(0,0,0,0.5);   /* Overlay-Hintergrund */
    z-index: 1000;
    display: none;
    justify-content: flex-end;
}
.init-statblock-drawer.show { display: flex; }
.init-statblock-content {
    background: var(--bg-dark);
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 16px;
    box-shadow: -4px 0 24px rgba(0,0,0,0.5);
}
```

### Muster 2: Legendäre Aktionen Pip-UI (INIT-02 / D-08)

**Vorbild aus Code:** `renderDeathSaves()` (`initiative.js:494-546`) — exakte Dot-Struktur.

```javascript
// In renderInit() — analog renderDeathSaves()
function renderLegendaryActionPips(cb) {
    if (!cb.legendaryActions || cb.legendaryActions.max <= 0) return '';
    var la = cb.legendaryActions;
    return '<div class="la-pips">' +
        '<span class="la-label">⭐ LA</span>' +
        '<div class="la-dots">' +
        Array.from({length: la.max}, function(_, i) {
            return '<span class="la-dot ' + (i < la.remaining ? 'active' : '') + '"' +
                ' data-action="init-use-la-stop"' +
                ' data-id="' + cb.id + '"' +
                ' data-index="' + i + '"' +
                ' title="Legendäre Aktion ' + (i+1) + '"></span>';
        }).join('') +
        '</div>' +
        '</div>';
}

// In nextTurn() — LA-Reset bei Rundenübergang (INIT-02 / D-10)
// [VERIFIED: Codebase — initiative.js:383-387]
// Einfügen in den if-Block: if (init.currentTurn >= init.combatants.length)
init.combatants.forEach(function(c) {
    if (c.legendaryActions && c.legendaryActions.max > 0) {
        c.legendaryActions.remaining = c.legendaryActions.max;
    }
});
```

**CSS (analog `.death-save-dot`):**

```css
.la-pips { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.la-label { font-size: 0.75em; font-weight: 600; color: var(--gold); }
.la-dots { display: flex; gap: 4px; }
.la-dot {
    width: 14px; height: 14px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.15s;
}
.la-dot.active { background: var(--gold); }

/* Legendäre Resistenz — analog, andere Farbe */
.lr-dot { border-color: var(--purple); }
.lr-dot.active { background: var(--purple); }
```

### Muster 3: Legendäre Resistenz — Parsing (D-05)

**Verifizierter Befund:** Im SRD-Bestand hat jedes der 6 Boss-Monster einen `traits[]`-Eintrag mit:

```json
{ "name": "Legendäre Resistenz (3-mal täglich)", "desc": "..." }
```

**Robustes Regex-Muster:**

```javascript
// [VERIFIED: Codebase — core/srd-monsters.js:6958, 7083, 7279, 7392, 7503]
function parseLegendaryResistanceCount(monster) {
    if (!monster || !monster.traits) return 0;
    var items = Array.isArray(monster.traits) ? monster.traits : [];
    for (var i = 0; i < items.length; i++) {
        var name = items[i].name || '';
        // Deutsch: "Legendäre Resistenz (3-mal täglich)" oder "Legendary Resistance (3/Day)"
        var matchDE = name.match(/(\d+)-mal t[äa]glich/i);
        var matchEN = name.match(/\((\d+)\/Day\)/i);
        // Custom HTML-String: nach "Legendäre Resistenz" suchen + Zahl
        var matchText = name.match(/[Ll]egend[äa]re?\s+Resistenz.*?(\d+)/);
        if (matchDE) return parseInt(matchDE[1], 10);
        if (matchEN) return parseInt(matchEN[1], 10);
        if (matchText) return parseInt(matchText[1], 10);
    }
    // Custom creature: traits ist HTML-String, Fallback-Scan auf desc
    if (typeof monster.traits === 'string') {
        var m = monster.traits.match(/[Ll]egend[äa]re?\s+Resistenz.*?(\d+)-mal/);
        if (m) return parseInt(m[1], 10);
    }
    return 0;
}
```

**Edge Cases:**
- Custom-Kreaturen speichern `traits` als HTML-String — `typeof items === 'string'`-Prüfung nötig (analog `renderTraitList()`).
- Eigenkreatur mit Freitext ohne Zahl → Regex findet nichts → 0 → kein Zähler (korrekt).
- Überschreibung per manuellem Override (`cb.legendaryResistance.overrideMax`) hat Vorrang.

### Muster 4: Mob-Modus (INIT-03)

#### Datenmodell (runtime-only, keine Migration)

```javascript
// Neue Felder am Combatant — runtime-only (STATE.md Architektur-Constraint)
// [ASSUMED] — Feldnamen-Vorschlag; Benennung wird in der Planung fixiert
combatant.mob = {
    count: 10,             // Ursprüngliche Anzahl Kreaturen
    poolHp: 70,            // Aktueller Pool (= lebende Kreaturen × individualMaxHp)
    maxPoolHp: 70,         // Ursprünglicher Pool (= count × individualMaxHp)
    individualMaxHp: 7,    // Einzel-HP pro Kreatur (für "X von N"-Anzeige)
    attackMode: 'nfach'    // 'nfach' | 'dmg-regel'
};
```

#### Pool-HP-Berechnung

```javascript
// [VERIFIED: Codebase — bestiary-actions.js:89-95 (HP-Variation ±10%)]
// Pool-HP = Summe der tatsächlich gewürfelten HP pro Exemplar
// Bei count=10, base-HP=7:
//   Einzelwerte: 6, 7, 8, 7, 6, 8, 7, 6, 7, 8 → Pool = 70
//   Lebende Kreaturen = Math.ceil(poolHp / individualMaxHp)

function getMobAlive(cb) {
    if (!cb.mob) return 1;
    return Math.max(0, Math.ceil(cb.mob.poolHp / cb.mob.individualMaxHp));
}
```

#### DMG-Mob-Regel (D-13b) — Verifizierte Formel

[ASSUMED — basiert auf DMG 2014 "Handling Mobs" Tabelle, Seite 250, nicht via Context7 verifiziert]

Die DMG-Tabelle stellt fest: Man benötigt einen bestimmten d20-Wert, um AC zu erreichen. Dieser Wert bestimmt, welcher Anteil von N Angreifern automatisch trifft.

**Logik:**

```javascript
// needed = Zielwurf (d20) um zu treffen
// needed = max(2, AC - attackBonus)
// Anteil treffer = (21 - needed) / 20
// Treffer = Math.floor(count * anteil)
// [ASSUMED] — DMG-Schwellentabelle (S. 250)

function calcMobHits(count, attackBonus, targetAC) {
    var needed = Math.max(2, targetAC - attackBonus);
    // Clamp: bei needed >= 20 trifft nur Nat-20 (5%)
    if (needed >= 20) return Math.max(1, Math.floor(count * 0.05));
    // Anteil der d20-Ergebnisse die >= needed sind: (21 - needed) / 20
    var fraction = (21 - needed) / 20;
    return Math.max(0, Math.floor(count * fraction));
}
// Beispiel: 10 Goblins (+4 Angriff) vs AC 15
// needed = 15 - 4 = 11; fraction = (21-11)/20 = 0.5; Treffer = 5
```

**Schaden auto-summiert (D-14):**

```javascript
function rollMobDamage(hits, damageFormula) {
    // hits × Würfelformel; nutzt bestehenden Roller-Code
    // Gibt Gesamtschaden zurück, zeigt einzelne Würfe
    var total = 0;
    for (var i = 0; i < hits; i++) {
        total += rollDiceFormula(damageFormula); // aus dice-core.js
    }
    return total;
}
```

### Anti-Patterns vermeiden

- **Kein `const X = window.X` in Funktionen** — immer `window.X()` direkt aufrufen oder `var X = window.X;` auf Modulebene.
- **Keine doppelten Top-Level-Funktionsnamen** — vor Implementierung greppen: `grep -rn "^function renderStatblockHTML" features/`.
- **Kein `renderBestiaryDetail()` direkt aufrufen** — die Funktion sucht `#bestiary-detail-panel`, das im Initiative-Tab nicht existiert → blankes Panel oder undefined-Fehler.
- **Kein `parseEntityId()` auf `statblockRef.id`** — `statblockRef.id` ist String wie `'goblin'`; `parseEntityId('goblin')` gibt `null` zurück (STATE.md Entscheidung 2026-01-10).

---

## Don't Hand-Roll

| Problem | Nicht selber bauen | Stattdessen | Warum |
|---------|-------------------|-------------|-------|
| Statblock-HTML rendern | Eigener Statblock-Renderer | `renderTraitList()`, `renderClickableDice()`, `sanitizeHTML()` aus `bestiary-render.js` | 400 Zeilen getesteter Renderer existiert bereits |
| Würfelformel parsen/rollen | Eigener Parser | `rollQrefDice()` / `dice-core.js` | Bestehender Roller inkl. History-Log |
| Modal/Overlay anzeigen | Eigene Overlay-Logik | `showModal(id)` / `hideModal(id)` + `modal-overlay`-Pattern | Einheitliches Show/Hide mit `.show`-Klasse |
| Monster-Lookup | Eigene Suchfunktion | `getBestiaryMonster(id, source)` aus `bestiary-actions.js` | Vereint SRD + custom, String-ID-sicher |
| HP-Mutation | Eigener HP-Tracker | `modHp(id, amt)` / Muster aus `applyHpChange()` | Inkl. Temp-HP-Absorption, Concentration-Check |
| Entity-Cache | Eigene Cache-Logik | `EntityLookup.enableCache()` / `clearCache()` | Bestehender Render-Cache |

---

## Laufzeit-Zustand-Inventar

> Keine Rename/Migration-Phase — dieser Abschnitt entfällt. Phase 4 fügt ausschließlich **runtime-only**-Felder hinzu (keine persistierten Daten, keine Strings in bestehenden Datensätzen).

Einzige relevante Persistenz-Änderung: Pip-Klicks und Pool-HP-Abzüge mutieren Combatant-Felder → `save()` — fließt in den normalen LocalStorage-Dump. Keine Migration nötig, da Felder beim ersten Zugriff initialisiert werden.

---

## Häufige Fallen

### Falle 1: `renderBestiaryDetail()` direkt aus Initiative aufrufen

**Was schiefgeht:** Die Funktion sucht `#bestiary-detail-panel` (DOM-Element im Bestiary-Tab). Im Initiative-Tab existiert dieses Element nicht → `panel` ist `null` → `return` (stilles Scheitern).

**Warum:** `renderBestiaryDetail()` schreibt direkt in ein konkretes Panel, statt einen String zurückzugeben.

**Vermeidung:** `renderStatblockHTML(monster)` extrahieren, die einen reinen HTML-String zurückgibt (wie `renderTraitList()` auch). Bestehenden `renderBestiaryDetail()`-Aufruf unberührt lassen.

**Warnsignal:** Kein Fehler in der Konsole, aber leeres Panel — weil `return` ohne Fehler.

### Falle 2: `statblockRef.id` mit `parseEntityId()` auflösen

**Was schiefgeht:** `parseEntityId('goblin')` → `null`. Lookup findet nichts.

**Warum:** `parseEntityId()` ist für numerische IDs gedacht; SRD-Monster nutzen String-`_id`s wie `'goblin'`, `'vampir'`.

**Vermeidung:** `statblockRef.id` als String direkt an `getBestiaryMonster(id, source)` übergeben (bestehende Funktion in `bestiary-actions.js:11-18` handhabt das korrekt).

### Falle 3: sanitizeHTML vor renderClickableDice vergessen

**Was schiefgeht:** `renderClickableDice()` fügt `data-action`-Attribute in Spans ein; `sanitizeHTML()` danach würde diese wieder entfernen.

**Warum:** `sanitizeHTML()` entfernt `data-*`-Attribute (Phase-3-Entscheidung `sanitize-then-dice order`).

**Vermeidung:** Reihenfolge exakt wie in `renderTraitList()`: 1) `sanitizeHTML(rawText)`, 2) `renderClickableDice(saubererText)`. Kommentar im Code beibehalten.

### Falle 4: LA-Reset auch auf LR anwenden

**Was schiefgeht:** LR werden bei Init 20 zurückgesetzt → Boss faktisch unbesiegbar gegen Saves am Tisch.

**Warum:** Roadmap-SC2 nennt LR + LA gemeinsam; die Diskussion (D-07) weicht bewusst ab.

**Vermeidung:** `nextTurn()`-Erweiterung resettet **ausschließlich** `cb.legendaryActions.remaining`, **nicht** `cb.legendaryResistance.remaining`. Kommentar im Code: `// D-07: LR KEIN Auto-Reset`.

### Falle 5: Mob-Zeile und Death Saves

**Was schiefgeht:** `renderDeathSaves(cb)` wird in `renderInit()` aufgerufen, wenn `dead && cb.type === 'player'`. Für Mobs ist `type === 'monster'` — Death Saves erscheinen nicht. Aber: Konzentrations-Badge und AoE-Zielauswahl prüfen nur `cb.currentHp > 0`.

**Konkreter Integrations-Analyse (aus Codezeilen 178–181):**

```javascript
${dead && cb.type === 'player' ? renderDeathSaves(cb) : ''}     // nur player → Mob sicher
${!dead ? renderConcentration(cb) : ''}                          // prüft nicht cb.mob → HANDELN
${cb.concentration?.pendingCheck ? renderConcentrationCheck(cb, ...) : ''}  // idem → HANDELN
```

**AoE-Modal** (`showAoEDamageModal()`, Zeile 758): Filtert `c.type !== 'lair' && c.currentHp > 0` — Mob-Zeile erscheint als einzelnes Ziel mit Pool-HP. Schaden auf Mob = Pool-HP-Abzug. Das ist korrekt und braucht keine Änderung.

**Empfehlung pro Feature:**

| Feature | Mob-Sonderzeile | Maßnahme |
|---------|-----------------|----------|
| Death Saves | AUSBLENDEN (kein Einzel-Tod) | Bereits sicher: nur `type === 'player'` |
| Concentration-Badge | AUSBLENDEN (Mob konzentriert sich nicht) | `if (!dead && !cb.mob) renderConcentration(cb)` |
| Concentration-Check | AUSBLENDEN | `if (cb.concentration?.pendingCheck && !cb.mob)` |
| AoE-Modal-Ziel | ANPASSEN (Mob = ein Ziel, Schaden auf Pool) | `modHp(mobId, -damage)` — bereits korrekt |
| Quick Actions | AUSBLENDEN (Dodge/Dash/Hide sinnlos für Mob) | `if (!cb.mob) renderQuickActionsBar()` — oder Mob ignorieren |
| Spell Slots | AUSBLENDEN | Bereits sicher: nur `type === 'player'` |
| HP-Buttons (➕/➖) | BEHALTEN (Pool-HP direkt ändern) | Kein Eingriff nötig |
| HP-Rechner (➗) | BEHALTEN (Schaden auf Pool) | `showHpCalculator('combatant', id)` — Pool-HP |
| Effekte (🔮) | BEHALTEN (Mob kann Effekte haben) | Kein Eingriff nötig |

**Konkrete Code-Stellen in `renderInit()` die `cb.mob`-Flag prüfen müssen:**

1. `Zeile 179: ${!dead ? renderConcentration(cb) : ''}` → `${!dead && !cb.mob ? renderConcentration(cb) : ''}`
2. `Zeile 180: ${cb.concentration?.pendingCheck ? ...}` → `${!cb.mob && cb.concentration?.pendingCheck ? ...}`
3. Quick Actions Bar (Zeile 199): `window.renderQuickActionsBar()` — innerhalb dieser Funktion Mob-Kombattant überspringen oder eigene Mob-Aktionsleiste zeigen.

### Falle 6: Doppelte Funktionsnamen (Build-Dedup)

**Was schiefgeht:** `features/initiative-statblock.js` definiert `function renderStatblockHTML()` — falls es diesen Namen schon gibt (unwahrscheinlich, aber prüfen), entsteht ein Dedup-Problem oder orphaned function body.

**Prüfung:** Vor Implementierung `grep -rn "^function renderStatblockHTML" features/ systems/ ui/` — sollte leer sein.

---

## Code-Beispiele

### Pill-Initialisierung beim Einlesen des Statblocks

```javascript
// In addBestiaryToInitiative() — nach dem push() des Kombattanten
// [VERIFIED: Codebase — bestiary-actions.js:106-119, ergänzen]
var laCount = (monster.legendaryActionsPerRound || 0);
var lrCount = parseLegendaryResistanceCount(monster); // neue Funktion

if (laCount > 0) {
    combatantObj.legendaryActions = { max: laCount, remaining: laCount };
}
if (lrCount > 0) {
    combatantObj.legendaryResistance = { max: lrCount, remaining: lrCount };
}
// runtime-only: kein save()-Impact auf SRD-Daten
```

### Mob-Toggle im Mengen-Dialog

```javascript
// In addBestiaryToInitiative() — bestiary-actions.js:64 erweitern
// [VERIFIED: Codebase — bestiary-actions.js:64-128]

// Nach countStr-Auswertung: Mob-Toggle abfragen
var isMob = false;
if (count > 1) {
    isMob = confirm('Als Mob führen? (1 Zeile mit Pool-HP)\n\n' +
        'JA = Mob-Modus (Pool-HP, Sammel-Angriff)\n' +
        'NEIN = ' + count + ' Einzelzeilen');
}

if (isMob) {
    // Eine Mob-Zeile anlegen statt count Zeilen
    var totalHp = 0;
    var individualHp = Math.max(1, Math.round((monster.hp || 1) * (0.9 + Math.random() * 0.2)));
    for (var k = 0; k < count; k++) {
        totalHp += Math.max(1, Math.round((monster.hp || 1) * (0.9 + Math.random() * 0.2)));
    }
    D.initiative.combatants.push({
        id: nextId('combatants'),
        name: monster.name + '-Schwarm',
        initiative: Math.floor(Math.random() * 20) + 1 + dexMod,
        maxHp: totalHp,        // Grid-Anzeige nutzt maxHp
        currentHp: totalHp,    // Pool-HP für HP-Buttons
        ac: monster.ac || 10,
        type: 'monster',
        cr: monster.cr || '0',
        effects: [],
        statblockRef: { source: source, id: source === 'custom' ? monster.id : monster._id },
        mob: {
            count: count,
            poolHp: totalHp,
            maxPoolHp: totalHp,
            individualMaxHp: Math.round(monster.hp || 1),
            attackMode: 'nfach'
        }
    });
} else {
    // bestehende N-Zeilen-Logik (unverändert)
}
```

### Death-Save-Dot HTML-Struktur (Vorbild für LA-Pips)

```javascript
// [VERIFIED: Codebase — initiative.js:514-522]
// Original:
`<span class="death-save-dot success ${i < ds.successes ? 'active' : ''}"
    data-action="toggle-death-save-stop"
    data-id="${cb.id}"
    data-type="success"
    data-index="${i}"
    title="Erfolg ${i + 1}"></span>`

// Abgeleitetes LA-Pip-Muster:
`<span class="la-dot ${i < la.remaining ? 'active' : ''}"
    data-action="init-use-la-stop"
    data-id="${cb.id}"
    data-index="${i}"
    title="Legendäre Aktion ${i + 1}"></span>`
```

### nextTurn() — LA-Reset-Einfügepunkt

```javascript
// [VERIFIED: Codebase — initiative.js:372-390]
function nextTurn() {
    const D = window.D;
    const init = D.initiative;
    if (!init.combatants.length) return;
    const current = init.combatants[init.currentTurn];
    if (current?.effects) {
        current.effects = current.effects
            .map(e => (e.permanent ? e : { ...e, duration: e.duration - 1 }))
            .filter(e => e.permanent || e.duration > 0);
    }
    init.currentTurn++;
    if (init.currentTurn >= init.combatants.length) {
        init.currentTurn = 0;
        init.round++;
        // ↓ NEU: LA-Reset bei Rundenwechsel (D-10)
        // D-07: LR KEIN Auto-Reset — nur LA!
        init.combatants.forEach(function(c) {
            if (c.legendaryActions && c.legendaryActions.max > 0) {
                c.legendaryActions.remaining = c.legendaryActions.max;
            }
        });
    }
    renderInit();
    window.save();
}
```

---

## Stand der Technik

| Alter Ansatz | Aktueller Ansatz | Geändert seit | Bedeutung |
|-------------|-----------------|--------------|-----------|
| `renderBestiaryDetail()` für Initiative | Neue `renderStatblockHTML()` (HTML-String) | Phase 4 | Tab-Unabhängigkeit |
| prompt() für Mengen-Dialog | prompt() bleibt + confirm() für Mob-Toggle | Phase 4 | Minimalinvasiv; nativer Dialog |
| Death-Save-Dots als Vorbild-UI | Pip-Muster auf LA/LR übertragen | Phase 4 | Konsistente UX |

**Überholt/Veraltet:**
- **`renderBestiaryDetail(id, source)`** für Nicht-Bestiary-Kontexte: Weiterhin valide für den Bestiary-Tab. Für Initiative: neue schlanke Funktion bevorzugen.

---

## Umgebungsverfügbarkeit

> Nur Code/Config-Änderungen; keine externen Tools, Dienste oder Runtimes benötigt.

| Abhängigkeit | Benötigt von | Verfügbar | Version | Fallback |
|-------------|-------------|-----------|---------|---------|
| Node.js | `npm run build`, Tests | Ja | Projektstandard | — |
| Python | `python build.py` | Ja | Projektstandard | — |
| Playwright | E2E-Tests | Ja | Projektstandard | Jest-Unit-Tests |

---

## Validierungs-Architektur

> `workflow.nyquist_validation: true` in `.planning/config.json` — Abschnitt ist Pflicht.

### Test-Framework

| Eigenschaft | Wert |
|-------------|------|
| Unit-Framework | Jest (bestehend, `tests/unit/`) |
| E2E-Framework | Playwright (bestehend, `tests/e2e/features/`) |
| Schneller Lauf | `npm run test:unit` |
| Vollständige Suite | `npm run test && npm run test:e2e` |
| Bestehende Init-Tests | `tests/e2e/features/initiative.spec.js` |

### Anforderungs-Test-Mapping

| Req-ID | Verhalten | Test-Typ | Automatisierter Befehl | Datei vorhanden? |
|--------|-----------|----------|----------------------|-----------------|
| INIT-01 | 📖-Button in jeder Init-Zeile sichtbar | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "statblock"` | Nein — Wave 0 |
| INIT-01 | Panel öffnet bei Klick mit Statblock-Inhalt (Monster mit `statblockRef`) | E2E | s.o. | Nein — Wave 0 |
| INIT-01 | Panel zeigt Basis-Infos bei Kombattant ohne `statblockRef` | E2E | s.o. | Nein — Wave 0 |
| INIT-01 | Klickbare Würfe im Panel lösen Würfelwurf aus | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | LA-Pips erscheinen bei Monster mit `legendaryActionsPerRound > 0` | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "legendary"` | Nein — Wave 0 |
| INIT-02 | Pip-Klick reduziert verbleibende LA um 1 | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | LA-Pips füllen sich bei Rundenübergang (Init 20) wieder auf | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | LR-Pips erscheinen bei Monster mit `(N-mal täglich)`-Trait | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | LR resetten **NICHT** bei Rundenübergang | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | Manueller LR-Reset-Knopf setzt LR zurück | E2E | s.o. | Nein — Wave 0 |
| INIT-02 | `parseLegendaryResistanceCount()` erkennt "3-mal täglich" | Unit | `npm run test:unit -- --testPathPattern=initiative-mob` | Nein — Wave 0 |
| INIT-03 | Mengen-Dialog-Toggle erzeugt eine Mob-Zeile statt N Zeilen | E2E | `npx playwright test tests/e2e/features/initiative.spec.js -g "mob"` | Nein — Wave 0 |
| INIT-03 | Pool-HP = Summe aller Einzel-HP | Unit | `npm run test:unit -- --testPathPattern=initiative-mob` | Nein — Wave 0 |
| INIT-03 | Mob-Anzeige: `"X von N am Leben"` korrekt berechnet | Unit | s.o. | Nein — Wave 0 |
| INIT-03 | DMG-Mob-Regel: 10 Goblins (+4) vs AC 15 = 5 Treffer | Unit | s.o. | Nein — Wave 0 |
| INIT-03 | Schaden-Applikation auf Pool (nicht auf maxHp) | Unit | s.o. | Nein — Wave 0 |
| INIT-03 | Bei 0 Pool-HP: Mob als besiegt markiert | E2E | s.o. | Nein — Wave 0 |

### Stichprobenrate

- **Pro Task-Commit:** `npm run build` (Build-Integrität) + Browser-Öffnung (visuelle Prüfung)
- **Pro Wave-Merge:** `npm run test:unit`
- **Phase Gate:** `npm run test && npm run test:e2e` + 3 manuelle Checks (Panel-Optik, Pip-Feel, Mob-Schaden am Tisch)

### Wave-0-Lücken

Die folgenden Testdateien müssen in Wave 0 angelegt werden:

- [ ] `tests/unit/initiative-mob.test.js` — Unit-Tests für `parseLegendaryResistanceCount()`, `getMobAlive()`, `calcMobHits()`, Pool-HP-Berechnung
- [ ] `tests/e2e/features/initiative.spec.js` — Erweiterung mit Test-Suites `"statblock"`, `"legendary"`, `"mob"` (Datei existiert, Tests fehlen noch)

---

## Sicherheitsdomäne

### Anwendbare ASVS-Kategorien

| ASVS-Kategorie | Anwendbar | Standardkontrolle |
|----------------|-----------|-------------------|
| V2 Authentifizierung | nein | — |
| V3 Session-Management | nein | — |
| V4 Zugangskontrolle | nein | — |
| V5 Eingabevalidierung | ja | `esc()` / `sanitizeHTML()` für alle User-Werte und Statblock-Texte |
| V6 Kryptographie | nein | — |

### Bekannte Bedrohungsmuster

| Muster | STRIDE-Kategorie | Standard-Gegenmaßnahme |
|--------|-----------------|----------------------|
| XSS via Statblock-Text (`<b>`-Tags) | Tampering | `sanitizeHTML()` ZUERST, dann `renderClickableDice()` — Reihenfolge bindend |
| XSS via Kombattanten-Name | Tampering | `esc(cb.name)` in allen HTML-Ausgaben |
| DoS via Mob-Größe (N=1000) | Denial of Service | Clamp auf `BESTIARY_MAX_QUANTITY = 100` bereits in `bestiary-actions.js:76` |
| DoS via `calcMobHits()` mit N → Loop | Denial of Service | `Math.floor()` — kein Loop; O(1)-Berechnung |
| XSS via `statblockRef.id` in DOM | Tampering | `esc(String(statblockRef.id))` in `data-id`-Attributen |

---

## Offene Fragen

1. **Drawer-Breite auf Mobile (320 px)**
   - Was wir wissen: Die Initiative-Liste ist ein einspaltig scrollbares Layout. Ein 420 px breiter Drawer würde die Liste vollständig verdecken.
   - Was unklar ist: Ob Full-Screen-Drawer auf Mobile besser ist als ein Bottom-Sheet-Muster.
   - Empfehlung: Auf Mobile (Viewport < 600 px) `width: 100vw; height: 60vh; top: auto; bottom: 0` — Bottom-Sheet. CSS-Media-Query genügt.

2. **`confirm()` für Mob-Toggle UX-Qualität**
   - Was wir wissen: Der Mengen-Dialog nutzt `window.prompt()` — nativer Browser-Dialog. `confirm()` wäre konsistent.
   - Was unklar ist: Ob das native `confirm()` am Spieltisch (ggf. Tablet-Browser) akzeptabel ist oder ein eingebetteter Toggle im Dialog bevorzugt wird.
   - Empfehlung: `confirm()` für v1 (einfachste Implementierung); Planung kann als Claude's Discretion einen echten In-Dialog-Toggle vorsehen.

3. **LA-Pips bei Custom-Kreatur ohne `legendaryActionsPerRound`**
   - Was wir wissen: Das Bestiary-Editor-Formular hat `bst-legendary-count` (Zeile 316 in view-bestiary.html). Der Wert wird als `legendaryActionsPerRound` gespeichert.
   - Was unklar ist: Ob bestehende Custom-Kreaturen dieses Feld haben (Migration nicht geplant).
   - Empfehlung: Defensive Prüfung: `(monster.legendaryActionsPerRound || 0) > 0`.

---

## Annahmen-Log

| # | Behauptung | Abschnitt | Risiko bei Falschheit |
|---|-----------|-----------|----------------------|
| A1 | DMG-Mob-Regel-Formel `hits = floor(N × (21 - needed) / 20)` ist korrekt (DMG S. 250) | Muster 4 / DMG-Mob-Regel | Falsche Trefferanzahl; leicht nachzuprüfen per DMG-Buch |
| A2 | Feldname `legendaryActionsPerRound` ist bereits am Custom-Kreatur-Objekt gespeichert (via Bestiary-Editor) | Muster 2, Frage 3 | Pip-Zähler erscheint nicht für eigene Boss-Kreaturen; Fallback `|| 0` sichert gegen Absturz |
| A3 | `confirm()` und `prompt()` sind im Projektbrowser-Kontext (file://, PWA) nicht blockiert | Muster 4 Mob-Toggle | Falls Browser Dialoge blockiert: eigenes Modal nötig |

---

## Quellen

### Primär (HOCH)

- `features/initiative.js` — vollständig gelesen: `renderInit()` (Z.104-203), `nextTurn()` (Z.372-390), `renderDeathSaves()` (Z.494-546), `renderConcentration()` (Z.586-607), `showAoEDamageModal()` (Z.756-833), `addCombatant()` (Z.253-284), Battlefield-Banner (Z.1328-1356)
- `features/bestiary/bestiary-render.js` — vollständig gelesen: `renderBestiaryDetail()` (Z.218-437), `renderClickableDice()` (Z.41-50), `renderTraitList()` (Z.258-281)
- `features/bestiary/bestiary-actions.js` — vollständig gelesen: `addBestiaryToInitiative()` (Z.64-129), `getBestiaryMonster()` (Z.11-18), `statblockRef`-Erzeugung (Z.101-104)
- `core/srd-monsters.js` — Schema verifiziert: `legendaryActionsPerRound` an Z.7026, 7131, 7339, 7440, 7544, 7653; Trait `"Legendäre Resistenz (3-mal täglich)"` an Z.6958, 7083, 7279, 7392, 7503
- `ui/actions/combat-actions.js` — vollständig gelesen: Registrierungsstruktur
- `assets/styles/initiative.css` — gelesen: `.death-save-dot` (Pip-Vorbild), `.init-entry`-Grid, Battlefield-Banner-CSS
- `assets/templates/view-encounters.html` — gelesen: `#init-list`, `#battlefield-banner`, Initiative-View-Struktur
- `assets/templates/view-bestiary.html` — gelesen: `#bestiary-detail-panel`, `modal-overlay`-Muster
- `.planning/phases/04-initiative-erweiterungen/04-CONTEXT.md` — alle 14 Entscheidungen D-01 bis D-14
- `.planning/STATE.md` — Architecture Notes (bindend)
- `CLAUDE.md` — Projekt-Konventionen, Build-System, Dedup-Regeln

### Sekundär (MITTEL)

- `tests/e2e/features/initiative.spec.js` — bestehende Test-Struktur als Erweiterungsbasis
- `tests/unit/srd-monsters.test.js` — Unit-Test-Muster für Datenschicht

### Tertär (NIEDRIG)

- DMG 2014 "Handling Mobs" (S. 250) — Mob-Angriffs-Formel [ASSUMED] — nicht via Codebase oder Context7 verifiziert

---

## Metadaten

**Konfidenz-Aufschlüsselung:**
- Standard-Stack: HOCH — vollständig aus Codebase verifiziert
- Architektur: HOCH — bestehende Muster 1:1 übertragen
- Fallen/Pitfalls: HOCH — aus tatsächlichem Code-Lesen abgeleitet
- DMG-Mob-Regel: NIEDRIG (ASSUMED) — Training-Wissen, nicht via Regelwerk-Scan verifiziert

**Recherchedatum:** 2026-06-13
**Gültig bis:** 2026-07-13 (stabile Codebasis; 30 Tage)
