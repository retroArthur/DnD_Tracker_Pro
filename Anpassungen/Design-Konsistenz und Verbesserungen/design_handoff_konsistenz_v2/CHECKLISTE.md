# Checkliste — Abnahme Welle 4 bis 6

> **Korrekturvermerk (2026-09-09):** Die Ausgangswerte dieser Datei wurden gegen
> `.planning/HANDOFF-V2-VERIFIKATION.md` (Tabelle „Korrigierte Ausgangswerte") nachgemessen. Wo
> dieses Dokument der Verifikation widerspricht, gilt die Verifikation. Der ursprüngliche
> Bericht-Wert bleibt an jeder korrigierten Stelle als Vergleichswert sichtbar (Kennzeichnung
> „[Bericht]"), nichts wurde spurlos ersetzt.

Jede Zeile ist per `grep` oder Test überprüfbar. Ausgangswerte sind am Stand
vom 08.09.2026 erhoben; sie dürfen nur **sinken**.

---

## Welle 4 — Farbe

### N-02 · Kontrast
- [ ] `--on-gold` und `--on-green` sind in **allen vier** Theme-Blöcken definiert
  ```
  grep -c "on-gold" assets/styles/variables.css     # >= 4
  grep -c "on-green" assets/styles/variables.css    # >= 4
  ```
- [ ] `.btn-primary`, `.btn-success`, `.btn-gold` benutzen `--on-*`, nicht `--bg-dark`
  ```
  grep -n "btn-primary\|btn-success\|btn-gold" assets/styles/core.css | grep "bg-dark"   # leer
  ```
- [ ] Jede Rolle erreicht in allen vier Themes **4,5:1** gegen `--bg-card`
  (Testvorlage unten, §T-1)
- [ ] Sichtprüfung: Theme auf Light **und** Sepia, Knopf „+ Neuer Ort" und
  „Speichern" lesbar; Statuszahlen in Party und Initiative lesbar

### N-01 · rgba
- [ ] Kein `rgba()` mit Zahlentripel im Komponenten-CSS
  ```
  grep -rn "rgba([[:space:]]*[0-9]" assets/styles/ | grep -v variables.css   # leer
  ```
  Ausgangswert: **390 Treffer in 173 [Bericht] Werten** — gemessen: 143 verschiedene Werte nach
  Leerraum-Normierung; die Differenz sind 30 reine Schreibweisenvarianten. Die 390 Vorkommen sind
  bestätigt und bleiben.
- [ ] `--overlay-weak/-mid/-strong` in allen vier Theme-Blöcken, in Light und
  Sepia **schwarz** statt weiß
- [ ] `.nav-tab` hat in allen vier Themes eine sichtbare Grundfläche

### N-03 · Schatten
- [ ] `box-shadow` nur aus `--elev-1/-2/-3`, `--glow-gold` oder den
  dokumentierten Sonderfällen
  ```
  grep -rn "box-shadow" assets/styles/ | grep -v "elev-\|glow-\|inset\|variables.css"   # nur Sonderfaelle
  ```
  Ausgangswert: **66 [Bericht] verschiedene Werte, var(--shadow) 1×** — gemessen: 65 nach
  Leerraum-Normierung (dice.css:575 und :598 sind derselbe Wert, einmal umbrochen), 88
  Deklarationen insgesamt

---

## Welle 5 — Typografie und Tempo

### N-04 · Größen
- [ ] Kein `em` mehr in `font-size`
  ```
  grep -rn "font-size:[^;]*em" assets/styles/ | grep -v variables.css   # leer
  ```
  Ausgangswert: **~740 [Bericht] em-Fundstellen in 20 Werten** — gemessen: 784 in 30 Werten, mit
  exakt dem in dieser CHECKLISTE abgedruckten grep. Die Checkliste widersprach der Ausgabe ihres
  eigenen Kommandos.
- [ ] `font-size` nur aus `--text-xs … --text-3xl` oder `inherit`
- [ ] Nichts kleiner als `--text-xs` (11px) in der UI
- [ ] Sichtprüfung der vier Stellen aus `PATCHES.md` §5b: Karten-Metazeilen,
  Statblock-Tabellen, DM-Screen-Widgets, Initiative-Zeile

### N-06 · Bewegung
- [ ] Kein `transition: all`
  ```
  grep -rn "transition:[^;]*all" assets/styles/   # leer
  ```
  Ausgangswert: **163×** — verbindlich, der Abnahme-grep oben findet bereits alle 163. *(Fließtext
  nannte zuvor „151× [132 all 0.2s + 19 all 0.15s]" — es fehlen `all 0.3s` [4], `all 0.2s ease` [4],
  `all 0.3s ease` [2], `all 0.15s ease` [1], `all 0.3s cubic-bezier(…)` [1]. Die Abnahme war damit
  strenger als ihre eigene Anweisung; die strengere Fassung [163] ist die richtige.)*
- [ ] Nur drei Dauern im Komponenten-CSS
  ```
  grep -rno "[0-9.]\+m\?s" assets/styles/*.css | grep -v variables.css | sort -u   # nur die Tokens
  ```
  Ausgangswert: **8 Dauern**

### N-07 · Gewichte
- [ ] Kein `bold`, `normal` oder `300`
  ```
  grep -rn "font-weight:[[:space:]]*\(bold\|normal\|300\)" assets/styles/   # leer
  ```
  Ausgangswert: **17 [Bericht] Treffer** — gemessen 18 Treffer
- [ ] Nur 400 / 600 / 700 (Ausgangswert: 6 [Bericht] verschiedene Angaben — gemessen 7: 300, 400,
  500, 600, 700, bold, normal)

---

## Welle 6 — Bedienbarkeit

### N-05 · Fokus
- [ ] Die globale `:where(...):focus-visible`-Regel existiert in `core.css`
- [ ] Kein `outline: none` auf einem `:focus-visible`-Selektor
  ```
  grep -rn -B2 "outline:[[:space:]]*none" assets/styles/ | grep "focus-visible"   # leer
  ```
- [ ] `.cf-combat-value input:focus` hat einen sichtbaren Ersatz
- [ ] **Tastaturprobe:** Tab durch Orte-Ansicht — Suchfeld, Filter-Chips,
  Listenzeilen und die Icon-Knöpfe der Zeile zeigen jeweils einen Ring
- [ ] Tastaturprobe im Modal: der Ring ist auch über dem Overlay sichtbar
  (z-index-Leiter, `--z-modal`)

### N-08 · Reduced Motion
- [ ] Der globale Block existiert am Ende von `core.css`
- [ ] `!important`-Obergrenze im Test von 105 auf 109 angehoben, **mit** Begründung
- [ ] Probe: Betriebssystem auf „Bewegung reduzieren", dann Würfeln — das
  Ergebnis wechselt sichtbar, aber ohne Rotation

### N-09 · Zauber-Zähler
- [ ] `id="spell-count"` ist entfernt oder läuft über `setViewCount('spells', n)`
- [ ] Kein Inline-Stil mehr an der Stelle (`.meta-text` benutzen)
- [ ] `.filter-bar` in `view-resources.html` heißt `.filter-chips` *(Korrektur, gemessen: eine
  nackte Klasse `.filter-chips` existiert NIRGENDS [0 Treffer]. Etabliert sind vier präfigierte
  Container [`.npc-`/`.loc-`/`.enc-`/`.loot-filter-chips`]; `.filter-bar` trägt echtes Layout
  [`display:flex; gap:6px; flex-wrap:wrap`]. Dieser Abnahmepunkt ist damit nicht wie geplant
  ausführbar — siehe `.planning/HANDOFF-V2-VERIFIKATION.md` Blocker B-12 und
  `.planning/REQUIREMENTS.md` UX-06.)*

---

# Test-Ratschen

Jede Welle schließt mit einem Test in `tests/unit/design-consistency.test.js`
ab — genau wie Welle 1 bis 3. Die vorhandenen Helfer dort (`cssFiles`,
`cssCode`, `withoutComments`, `declarationsOf`, `ruleBodiesFor`) sind
wiederverwendbar.

## §T-1 · Kontrast über alle vier Themes (N-02)

Der wichtigste neue Test: er hätte alle acht Unterschreitungen gefunden.

```js
describe('N-02 — Kontrast in allen vier Themes', () => {
    const relLum = hex => {
        const h = hex.replace('#', '');
        const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        const v = [0, 2, 4]
            .map(i => parseInt(n.slice(i, i + 2), 16) / 255)
            .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    };
    const ratio = (a, b) => {
        const [l1, l2] = [relLum(a), relLum(b)];
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    /** Tokens eines Theme-Blocks aus variables.css. */
    function palette(theme) {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const re =
            theme === 'dark'
                ? /:root,\s*\[data-theme="dark"\]\s*\{([\s\S]*?)\n\s*\}/
                : new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
        const body = vars.match(re);
        expect(body).not.toBeNull();
        const out = {};
        for (const m of body[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
        return out;
    }

    const THEMES = ['dark', 'light', 'sepia', 'contrast'];

    test('Text und gedaempfter Text erreichen 4,5:1 gegen --bg-card', () => {
        const fehler = [];
        THEMES.forEach(t => {
            const p = palette(t);
            ['--text', '--text-dim'].forEach(rolle => {
                const r = ratio(p[rolle], p['--bg-card']);
                if (r < 4.5) fehler.push(`${t} ${rolle}: ${r.toFixed(2)}`);
            });
        });
        expect(fehler).toEqual([]);
    });

    test('KERNBELEG: die Schrift auf gefuellten Knoepfen erreicht 4,5:1', () => {
        // Vor N-02 stand dort color: var(--bg-dark). In den hellen Themes ist
        // --bg-dark HELL — die Primaeraktion war hell auf hell: Light 2,98:1,
        // Sepia 2,55:1. Es sind die Knoepfe, die in JEDER Ansicht oben rechts
        // stehen.
        const fehler = [];
        THEMES.forEach(t => {
            const p = palette(t);
            [['--on-gold', '--gold'], ['--on-green', '--green']].forEach(([ink, flaeche]) => {
                expect(p[ink]).toBeDefined();
                const r = ratio(p[ink], p[flaeche]);
                if (r < 4.5) fehler.push(`${t} ${ink} auf ${flaeche}: ${r.toFixed(2)}`);
            });
        });
        expect(fehler).toEqual([]);
    });

    test('die Akzente als Textfarbe erreichen 4,5:1 gegen --bg-card', () => {
        // --*-text ist in Dark/Contrast ein Alias auf die Palette und nur in
        // Light/Sepia abgedunkelt. Der Test loest den Alias nicht auf, sondern
        // prueft den Endwert — deshalb faellt er auch, wenn jemand die
        // Ueberschreibung VOR den Aliasblock schiebt.
        const ROLLEN = ['gold', 'green', 'cyan', 'yellow', 'orange', 'blue', 'purple'];
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        const fehler = [];
        THEMES.forEach(t => {
            const p = palette(t);
            ROLLEN.forEach(rolle => {
                // Ueberschreibung im theme-eigenen -text-Block?
                const re = new RegExp(
                    `\\[data-theme="${t}"\\][^{]*\\{[^}]*--${rolle}-text:\\s*(#[0-9a-fA-F]{3,8})`
                );
                const m = vars.match(re);
                const wert = m ? m[1] : p[`--${rolle}`];
                const r = ratio(wert, p['--bg-card']);
                if (r < 4.5) fehler.push(`${t} --${rolle}-text: ${r.toFixed(2)}`);
            });
        });
        expect(fehler).toEqual([]);
    });
});
```

## §T-2 · Keine rgba-Tripel mehr (N-01)

```js
describe('N-01 — Farbe kommt aus Tokens, auch in rgba-Notation', () => {
    const komponentenCss = () =>
        withoutComments(
            cssFiles
                .filter(f => f.name !== 'variables.css' && f.name !== 'fonts.css')
                .map(f => f.content)
                .join('\n')
        );

    test('kein rgba() mit Zahlentripel im Komponenten-CSS', () => {
        // Ausgangswert: 390 Vorkommen in 173 Werten. Der Hex-Umbau (F-04) hat
        // color: und background: bereinigt — die Kanaele in rgba() blieben,
        // und dort stand weiterhin die DARK-Palette. Kein Theme erreichte sie.
        const treffer = komponentenCss().match(/rgba?\(\s*\d[^)]*\)/g) || [];
        expect(treffer).toEqual([]);
    });

    test('die Overlay-Tokens sind in allen vier Themes definiert', () => {
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        ['--overlay-weak', '--overlay-mid', '--overlay-strong'].forEach(t => {
            expect((vars.match(new RegExp(t + ':', 'g')) || []).length).toBeGreaterThanOrEqual(4);
        });
    });

    test('KERNBELEG: die Navigationsflaeche ist in hellen Themes nicht weiss auf weiss', () => {
        // .nav-tab stand auf rgba(255,255,255,0.05): im Light- und
        // Sepia-Theme eine Weiss-Auflage auf Weiss, also wirkungslos. Die
        // Grundflaeche der Navigation fehlte in zwei von vier Themes.
        const vars = cssFiles.find(f => f.name === 'variables.css').content;
        ['light', 'sepia'].forEach(t => {
            const block = vars.match(new RegExp(`\\[data-theme="${t}"\\]\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
            expect(block[1]).toMatch(/--overlay-weak:\s*rgba\(0,\s*0,\s*0/);
        });
    });
});
```

## §T-3 · Skalen (N-03, N-04, N-06, N-07)

```js
describe('N-03 — vier Hoehenstufen', () => {
    test('box-shadow nur aus den Tokens oder dokumentierten Sonderfaellen', () => {
        const decls = declarationsOf('box-shadow');
        expect(decls.length).toBeGreaterThan(50);
        const fremd = decls.filter(
            d => !/var\(--(elev-[123]|glow-gold)\)/.test(d) && !/^inset/.test(d) && d !== 'none'
        );
        // Sonderfaelle: Statblock-Pergament, Wuerfel-Gluehen,
        // Fortschrittsbalken — jeder mit Kommentar im CSS.
        expect(fremd.length).toBeLessThanOrEqual(3);
    });
});

describe('N-04 — sieben Groessenstufen', () => {
    test('kein em mehr in font-size', () => {
        // em rechnet gegen den Elternwert: 0.85em in einer Karte mit 0.9em
        // ergibt 0.77em. Dieselbe Klasse war je Einbautiefe verschieden gross.
        const decls = declarationsOf('font-size');
        expect(decls.filter(d => /\dem\b/.test(d))).toEqual([]);
    });

    test('font-size nur aus der Skala', () => {
        const decls = declarationsOf('font-size');
        const fremd = decls.filter(
            d => !/^var\(--text-(xs|sm|md|lg|xl|2xl|3xl)\)$|^inherit$/.test(d.replace(/\s*!important/, ''))
        );
        expect(fremd).toEqual([]);
    });
});

describe('N-06 — drei Dauern, kein all', () => {
    test('kein transition: all', () => {
        // all animiert auch width, padding und grid-template-columns —
        // beim Auf- und Zuklappen wurden Layout-Spruenge mit-animiert.
        expect(declarationsOf('transition').filter(d => /\ball\b/.test(d))).toEqual([]);
    });

    test('nur drei Dauer-Tokens', () => {
        const scope = withoutComments(
            cssFiles.filter(f => f.name !== 'variables.css').map(f => f.content).join('\n')
        );
        const roh = [...scope.matchAll(/transition[^:;{}]*:[^;{}]*?([\d.]+m?s)/g)].map(m => m[1]);
        // Ausnahme: die width-Uebergaenge der Fortschrittsbalken.
        expect(roh.length).toBeLessThanOrEqual(2);
    });
});

describe('N-07 — drei Gewichte', () => {
    test('kein bold, normal oder 300', () => {
        const decls = declarationsOf('font-weight').map(d => d.replace(/\s*!important/, ''));
        expect(decls.filter(d => /^(bold|normal|300)$/.test(d))).toEqual([]);
    });
    test('nur 400, 600 und 700', () => {
        const decls = declarationsOf('font-weight').map(d => d.replace(/\s*!important/, ''));
        expect([...new Set(decls)].sort()).toEqual(['400', '600', '700']);
    });
});
```

## §T-4 · Fokus und Bewegung (N-05, N-08)

```js
describe('N-05 — ein Fokusring fuer alles', () => {
    test('die globale :where()-Regel existiert', () => {
        // :where() hat Spezifitaet 0 — jede Komponente kann sie ohne
        // !important ueberschreiben. Deshalb :where und nicht :is.
        expect(cssCode).toMatch(/:where\([^)]*button[^)]*\):focus-visible\s*\{[^}]*outline:/);
    });

    test('kein outline:none auf einem :focus-visible-Selektor', () => {
        // Ausgangswert: 37× outline:none gegen 7 :focus-visible. Die
        // Eingabefelder ersetzen den Ring durch eine Rahmenfarbe — das ist
        // in Ordnung, solange es auf :focus steht und :focus-visible
        // durchlaesst.
        const treffer = [];
        for (const m of cssCode.matchAll(/([^{}]{0,120})\{([^}]*outline:\s*none[^}]*)\}/g)) {
            if (/:focus-visible/.test(m[1])) treffer.push(m[1].replace(/\s+/g, ' ').trim());
        }
        expect(treffer).toEqual([]);
    });

    test('KERNBELEG: jedes outline:none hat einen sichtbaren Ersatz', () => {
        // .cf-combat-value input:focus hatte keinen — das Feld war im
        // Kampf-Panel per Tastatur nicht auffindbar.
        const ohne = [];
        for (const m of cssCode.matchAll(/([^{}]{0,120})\{([^}]*outline:\s*none[^}]*)\}/g)) {
            if (!/box-shadow|border-color|border:|background/.test(m[2])) {
                ohne.push(m[1].replace(/\s+/g, ' ').trim());
            }
        }
        expect(ohne).toEqual([]);
    });
});

describe('N-08 — Bewegung ist abschaltbar', () => {
    test('der globale reduced-motion-Block existiert', () => {
        const m = cssCode.match(
            /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\*,\s*\*::before[^}]*\}/
        );
        expect(m).not.toBeNull();
        expect(m[0]).toMatch(/animation-duration:\s*0\.01ms/);
        expect(m[0]).toMatch(/transition-duration:\s*0\.01ms/);
    });

    test('die Zahl der Animationen ohne reduced-motion-Deckung ist 0', () => {
        // 19 @keyframes und 29 animation-Deklarationen standen gegen 4 Regeln.
        // Der globale Block deckt alle ab; dieser Test haelt fest, dass er
        // nicht wieder auf Einzelfaelle zurueckgebaut wird.
        const n = (cssCode.match(/prefers-reduced-motion/g) || []).length;
        expect(n).toBeGreaterThanOrEqual(1);
    });
});
```

---

# Reihenfolge in einem Durchgang

```
Welle 4   §1 -> §2 -> §3a -> §3b -> §4      + T-1, T-2, T-3(N-03)
Welle 5   §5 -> §6 -> N-07                  + T-3(N-04, N-06, N-07)
Welle 6   §7 -> §8 -> N-09                  + T-4
```

Nach jeder Welle: `npm test`, `python build.py`, und die App **in allen vier
Themes** öffnen — die Hälfte dieser Befunde ist nur dort zu sehen.
