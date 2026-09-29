/**
 * Selbstauskunft des WCAG-Kontrastrechners
 * (Design-Handoff v3, Welle 1, Schritt 1)
 *
 * WARUM DIESER TEST EIGENSTAENDIG IST: die Ratsche R-02 in
 * design-consistency.test.js urteilt ueber BERECHNETE Kontrastwerte. Ihre
 * Aussagekraft haengt vollstaendig daran, dass der Rechner stimmt — eine
 * falsche Gamma-Schwelle oder vertauschte Kanalgewichte liefern plausible
 * Zahlen, die um 2-8 % daneben liegen, also genau in der Groessenordnung, in
 * der die Entscheidung "4,48 oder 4,52" faellt. Ein Werkzeug, dem ein anderer
 * Test glaubt, braucht selbst einen Test.
 *
 * DIE GEMESSENEN ZAHLEN STEHEN IN DEN TESTNAMEN, nicht nur in den
 * Zusicherungen. jest laeuft mit verbose: true, also druckt jeder Lauf
 * "ratio('#777777','#ffffff') = 4.48" wortwoertlich. Wer die Belegkette
 * nachvollziehen will, braucht kein Skript aufzurufen — die Suite sagt es.
 *
 * Die drei Gegenproben am Ende sind der zweite, unabhaengige Beleg: sie
 * pruefen nicht gegen Literatur, sondern gegen Zahlen, die in der
 * Befundlage zu Handoff v3 mit einer ANDEREN Implementierung gemessen wurden
 * (weisse Schrift auf Dark --green = 1,74 als schwerster Fall aus §1;
 * #6266bd auf weiss = 5,05 als Grundlage von Entscheidung D-1;
 * #6b6b6b gegen Dark --bg-elevated = 2,88 als Grundlage von D-8). Zwei
 * unabhaengige Implementierungen, die auf zwei Dezimalen dasselbe sagen,
 * sind keine gemeinsame Annahme mehr.
 */

const W = require('./helpers/wcag-contrast.js');

describe('WCAG-Kontrastrechner — kanonische Referenzwerte', () => {
    // #777777 verfehlt 4,5 knapp, #767676 haelt es knapp. Genau dieses Graupaar
    // trennt eine richtige von einer fast richtigen Formel.
    W.SELFTEST_CASES.forEach(c => {
        const ist = W.ratio(c.a, c.b).toFixed(2);
        test(`ratio('${c.a}', '${c.b}') = ${ist}  (soll ${c.soll})`, () => {
            expect(ist).toBe(c.soll);
        });
    });

    test('der Selbsttest laeuft bereits beim Laden des Helfers und wirft bei Abweichung', () => {
        expect(() => W.selfTest()).not.toThrow();
        // Ein Rechner, der sich selbst nicht prueft, ist eine Meinung.
        expect(W.SELFTEST_CASES.length).toBe(2);
    });

    test('Randwerte: gleiche Farbe = 1, Weiss auf Schwarz = 21', () => {
        expect(W.ratio2('#808080', '#808080')).toBe(1);
        expect(W.ratio2('#ffffff', '#000000')).toBe(21);
    });

    test('Kurzschreibweise und Grossschreibung ergeben denselben Wert', () => {
        expect(W.ratio('#333', '#FFFFFF')).toBeCloseTo(W.ratio('#333333', '#ffffff'), 10);
    });
});

describe('WCAG-Kontrastrechner — Theme-Block-Parser', () => {
    const pals = W.palettes();

    W.THEMES.forEach(theme => {
        const n = Object.keys(pals[theme]).length;
        test(`Block "${theme}" liefert ${n} Tokens, darunter alle ${W.BASELINE_TOKENS.length} Basis-Tokens`, () => {
            const fehlend = W.BASELINE_TOKENS.filter(t => !(t in pals[theme]));
            expect(fehlend).toEqual([]);
        });
    });

    test('die Deklarations-Regex ist dieselbe wie in F-01 Test 1 (Zeilenanfang)', () => {
        // Wuerden die beiden Tests verschiedene Parser benutzen, waere die
        // Differenzmenge genau der Bereich, in dem ein Fehler unbemerkt bleibt.
        expect(W.DECL_RE.source).toBe('^\\s*(--[\\w-]+)\\s*:\\s*([^;]+);');
        expect(W.DECL_RE.flags).toContain('m');
    });

    test('ein umformatierter Theme-Block scheitert HART, statt halb zu urteilen', () => {
        // Der Fall, gegen den die Probe steht: jemand formatiert variables.css
        // um, die Block-Regex greift die schliessende Klammer zu frueh, und
        // R-02 urteilt ab dann ueber eine halbe Palette — lautlos.
        const kaputt = '[data-theme="light"] {\n            --bg-dark: #f5f5f5;\n        }\n';
        expect(() => W.palette('light', kaputt)).toThrow(/Basis-Tokens fehlen/);
        expect(() => W.palette('light', '/* Block weg */')).toThrow(/nicht gefunden/);
    });
});

describe('WCAG-Kontrastrechner — var()- und Mischungsaufloesung', () => {
    const pals = W.palettes();

    test('var(--x) wird INNERHALB desselben Blocks aufgeloest (--attr-str: var(--red))', () => {
        // Genau dieser Fall steht heute in variables.css:289 und ist der Grund,
        // warum eine reine Hex-Lesung nicht reicht.
        expect(W.resolve('var(--red)', pals.dark)).toBe('#ef4444');
        expect(W.resolve('var(--red)', pals.light)).toBe('#dc2626');
        expect(W.resolve('var(--gold)', pals.contrast)).toBe('#ffd700');
    });

    test('var(--fehlt, ersatz) nimmt den Ersatz, var(--fehlt) ergibt null statt zu raten', () => {
        expect(W.resolve('var(--gibtsnicht, #123456)', pals.dark)).toBe('#123456');
        expect(W.resolve('var(--gibtsnicht, var(--gold))', pals.dark)).toBe('#d4af37');
        expect(W.resolve('var(--gibtsnicht)', pals.dark)).toBeNull();
    });

    test('white/black und volldeckendes rgb() werden gelesen', () => {
        expect(W.resolve('white', pals.dark)).toBe('#ffffff');
        expect(W.resolve('rgb(212, 175, 55)', pals.dark)).toBe('#d4af37');
    });

    test('halbdurchsichtige Werte ergeben OHNE Flaeche null — Raten ist verboten', () => {
        // Wer hier einen Wert liefert, setzt eine Tinte auf eine Flaeche, die es
        // nicht gibt. Das ist der Fehler, der in Welle 1 nicht passieren darf.
        expect(W.resolve('rgba(212, 175, 55, 0.2)', pals.dark)).toBeNull();
        expect(W.resolve('color-mix(in srgb, var(--gold) 20%, transparent)', pals.dark)).toBeNull();
    });

    test('color-mix(in srgb, X p%, transparent) ueber einer Flaeche — handgerechnet', () => {
        // --gold #d4af37 = (212,175,55) ueber --bg-card #1a1a1a = (26,26,26):
        //   0,2*212 + 0,8*26 = 63,2 -> 63 = 0x3f
        //   0,2*175 + 0,8*26 = 55,8 -> 56 = 0x38
        //   0,2* 55 + 0,8*26 = 31,8 -> 32 = 0x20
        expect(
            W.resolveOver('color-mix(in srgb, var(--gold) 20%, transparent)', pals.dark, '#1a1a1a')
        ).toBe('#3f3820');
        expect(W.mixOver('#d4af37', 0.2, '#1a1a1a')).toBe('#3f3820');
    });

    test('rgba() mit Alpha ueber einer Flaeche rechnet nach derselben Formel', () => {
        // Die 108 Toenungsstellen von Welle 2 sind so geschrieben, nicht als
        // color-mix. Beide Formen muessen dieselbe Zahl ergeben.
        expect(W.resolveOver('rgba(212, 175, 55, 0.2)', pals.dark, '#1a1a1a')).toBe('#3f3820');
    });

    test('0 % und 100 % sind die Grenzfaelle der Mischung', () => {
        expect(W.mixOver('#d4af37', 1, '#1a1a1a')).toBe('#d4af37');
        expect(W.mixOver('#d4af37', 0, '#1a1a1a')).toBe('#1a1a1a');
    });

    /* DER GEDECKELTE ANTEIL — Welle 2 Schritt 8, Entscheidung E2.
       Seit der Toenungsregel steht der Prozentsatz nicht mehr als Literal in
       der Regel, sondern als `min(<eigene Staerke>, var(--tint-max))`: die
       Regel nennt ihren Wunsch, der Theme-Block deckelt ihn. Ein Rechner, der
       das nicht liest, gibt null zurueck — und null heisst in R-04 "nicht
       aufloesbar", also ein Fehlalarm an 113 Stellen gleichzeitig statt eines
       Urteils.

       Dass Chromium diese Form wirklich so rechnet, ist gemessen und nicht
       angenommen (Chromium 143.0.7499.4, Playwright-Probe vom 2026-09-29):
       `min(20%, var(--tint-max))` ergibt mit --tint-max: 13% die Deckkraft
       0,13 und mit 7% die Deckkraft 0,07; `min(10%, var(--tint-max))` ergibt
       0,1 bzw. 0,07. Genau diese vier Zahlen stehen unten. */
    /* Diese beiden Proben laufen bewusst gegen eine KUENSTLICHE Palette und
       nicht gegen variables.css: sie pruefen den Parser, nicht die Deckelwerte.
       Ueber die tatsaechlichen 13/7/7/20 urteilt R-14 in
       design-consistency.test.js — dort, wo auch die Begruendung steht. Sonst
       stuenden dieselben vier Zahlen an zwei Orten und liefen auseinander. */
    const DECKEL_PROBE = { '--tint-max': '13%', '--eng': '7%', '--gold': '#d4af37' };

    test('min(<staerke>, var(--tint-max)) ist der gedeckelte Anteil, nicht null', () => {
        expect(W.mischAnteil('min(20%, var(--tint-max))', DECKEL_PROBE)).toBe(13);
        expect(W.mischAnteil('min(20%, var(--eng))', DECKEL_PROBE)).toBe(7);
        expect(W.mischAnteil('min(10%, var(--tint-max))', DECKEL_PROBE)).toBe(10);
        expect(W.mischAnteil('min(10%, var(--eng))', DECKEL_PROBE)).toBe(7);
        expect(W.mischAnteil('20%', DECKEL_PROBE)).toBe(20);
        expect(W.mischAnteil('var(--tint-max)', DECKEL_PROBE)).toBe(13);
        expect(W.mischAnteil('max(5%, var(--eng))', DECKEL_PROBE)).toBe(7);
        // Was der Rechner NICHT kennt, wird nicht geraten.
        expect(W.mischAnteil('var(--gibt-es-nicht)', DECKEL_PROBE)).toBeNull();
        expect(W.mischAnteil('20', DECKEL_PROBE)).toBeNull();
    });

    test('resolveOver rechnet die gedeckelte Toenung wie das Literal', () => {
        // Die beiden Schreibweisen muessen denselben Hexwert ergeben, sonst
        // urteilt die Ratsche ueber etwas anderes als der Browser malt.
        expect(
            W.resolveOver(
                'color-mix(in srgb, var(--gold) min(20%, var(--tint-max)), transparent)',
                DECKEL_PROBE,
                '#1a1a1a'
            )
        ).toBe(W.mixOver('#d4af37', 0.13, '#1a1a1a'));
        // Und unter dem Deckel bleibt die eigene Staerke stehen.
        expect(
            W.resolveOver(
                'color-mix(in srgb, var(--gold) min(10%, var(--tint-max)), transparent)',
                DECKEL_PROBE,
                '#1a1a1a'
            )
        ).toBe(W.mixOver('#d4af37', 0.1, '#1a1a1a'));
    });

    test('zerlegeMix trennt Basis, Anteil und Gegenfarbe an der obersten Klammerebene', () => {
        // Das Komma in min(...) gehoert NICHT dem color-mix. Wer an jedem Komma
        // trennt, bekommt drei Teile und gibt auf.
        expect(
            W.zerlegeMix('color-mix(in srgb, var(--red) min(20%, var(--tint-max)), transparent)')
        ).toEqual({
            basis: 'var(--red)',
            anteil: 'min(20%, var(--tint-max))',
            gegen: 'transparent'
        });
        expect(W.zerlegeMix('color-mix(in srgb, var(--gold) 85%, #fff)')).toEqual({
            basis: 'var(--gold)',
            anteil: '85%',
            gegen: '#fff'
        });
        expect(W.zerlegeMix('var(--gold)')).toBeNull();
    });

    /* DECKENDES color-mix — die Luecke, die R-03 ueberhaupt erst moeglich macht.
       Bis zum 2026-09-28 kannte der Rechner nur die Form mit `transparent` und
       gab fuer jede andere Mischung null zurueck. Genau die sechs ABGELEITETEN
       Flaechen des Aliasblocks sind aber deckend gemischt (--gold-hover,
       --green-hover, --red-dim, --green-dim, --red-dark, --orange-dim), und auf
       ihnen sitzen die Zustandsregeln, ueber die R-03 urteilt. Ein Rechner, der
       sie nicht aufloesen kann, haette dort gar nichts gemeldet — die
       gefaehrlichste Art von gruen.

       Der Unterschied zur transparent-Form ist, dass hier KEINE Traegerflaeche
       noetig ist: die Mischung ist selbst eine volle Farbe. Deshalb gehoert sie
       in resolve() und nicht in resolveOver(). */
    test('deckendes color-mix ist eine volle Farbe und braucht keine Flaeche', () => {
        // --green-dim: color-mix(in srgb, var(--green) 62%, #000)
        // Dark --green #4ade80 = (74,222,128):
        //   0,62*74  =  45,88 ->  46 = 0x2e
        //   0,62*222 = 137,64 -> 138 = 0x8a
        //   0,62*128 =  79,36 ->  79 = 0x4f
        expect(W.resolve('color-mix(in srgb, var(--green) 62%, #000)', pals.dark)).toBe('#2e8a4f');
        // --gold-hover mischt gegen WEISS, nicht gegen Schwarz — die Gegenprobe,
        // dass die zweite Farbe wirklich gelesen wird und nicht "Schwarz" heisst,
        // weil das haeufiger vorkommt.
        // Dark --gold #d4af37 = (212,175,55), 85 % ueber #fff:
        //   0,85*212 + 0,15*255 = 218,45 -> 218 = 0xda
        //   0,85*175 + 0,15*255 = 187,00 -> 187 = 0xbb
        //   0,85* 55 + 0,15*255 =  85,00 ->  85 = 0x55
        expect(W.resolve('color-mix(in srgb, var(--gold) 85%, #fff)', pals.dark)).toBe('#dabb55');
        // Die transparent-Form bleibt ohne Flaeche null — sonst waere die
        // Erweiterung genau das Raten, das eine Zeile weiter oben verboten ist.
        expect(W.resolve('color-mix(in srgb, var(--gold) 20%, transparent)', pals.dark)).toBeNull();
    });

    test('die sechs abgeleiteten Flaechen des Aliasblocks loesen in JEDEM Theme auf', () => {
        // Die Mischungen stehen im Aliasblock von variables.css, ihre Basisfarbe
        // im jeweiligen Theme-Block. Aufgeloest wird also die Kaskade, die der
        // Browser auch faehrt — und das Ergebnis muss eine volle Farbe sein,
        // sonst kann keine Ratsche darauf urteilen.
        const quelle = require('fs').readFileSync(W.VARIABLES_CSS, 'utf8');
        const mischung = name => {
            const m = quelle.match(new RegExp(`^\\s*${name}\\s*:\\s*(color-mix\\([^;]+)\\;`, 'm'));
            expect(m).not.toBeNull();
            return m[1].trim();
        };
        const abgeleitet = [
            '--gold-hover',
            '--green-hover',
            '--red-dim',
            '--green-dim',
            '--red-dark',
            '--orange-dim'
        ];
        const offen = [];
        W.THEMES.forEach(theme => {
            abgeleitet.forEach(token => {
                const wert = W.resolve(mischung(token), pals[theme]);
                if (!/^#[0-9a-f]{6}$/.test(wert || '')) offen.push(`${theme} ${token}: ${wert}`);
            });
        });
        expect(offen).toEqual([]);
    });
});

describe('WCAG-Kontrastrechner — Minimum ueber mehreren Traegerflaechen (D-2)', () => {
    const pals = W.palettes();

    test('die vier neutralen Flaechen sind bg-card, bg-dark, bg-elevated, bg-hover', () => {
        // Entscheidung D-2: massgeblich ist das Minimum ueber ALLE vier, nicht
        // --bg-card allein. --bg-hover ist in jedem Theme die schlechteste.
        expect(W.NEUTRAL_SURFACES).toEqual([
            '--bg-card',
            '--bg-dark',
            '--bg-elevated',
            '--bg-hover'
        ]);
    });

    test('minRatioOverSurfaces nennt die schlechteste Flaeche, nicht nur die Zahl', () => {
        const r = W.minRatioOverSurfaces('--red', W.NEUTRAL_SURFACES, pals.dark);
        expect(r.min).toBeLessThan(4.5); // heute 3,36 — genau der Befund hinter D-3
        expect(r.worst).toBe('--bg-hover');
        expect(Object.keys(r.values).sort()).toEqual([...W.NEUTRAL_SURFACES].sort());
    });

    test('ein fehlendes Token wird als missing gemeldet, nicht als Zahl erfunden', () => {
        const r = W.minRatioOverSurfaces('--gibtsnicht', W.NEUTRAL_SURFACES, pals.dark);
        expect(r.min).toBeNull();
        expect(r.missing).toEqual(['--gibtsnicht']);
    });
});

describe('WCAG-Kontrastrechner — Gegenproben gegen unabhaengig gemessene Zahlen', () => {
    const pals = W.palettes();
    const proben = [
        {
            was: 'weisse Schrift auf Dark --green (schwerster Fall aus Handoff v3 §1)',
            ist: W.ratio2('#ffffff', W.resolve(pals.dark['--green'], pals.dark)),
            soll: 1.74
        },
        {
            was: 'Sepia-Ersatz --purple #6266bd auf weiss (Grundlage von D-1)',
            ist: W.ratio2('#6266bd', '#ffffff'),
            soll: 5.05
        },
        {
            was: '--border-input #6b6b6b gegen Dark --bg-elevated (Grundlage von D-8)',
            ist: W.ratio2('#6b6b6b', W.resolve(pals.dark['--bg-elevated'], pals.dark)),
            soll: 2.88
        }
    ];

    proben.forEach(p => {
        test(`${p.ist} (soll ${p.soll}) — ${p.was}`, () => {
            expect(p.ist).toBe(p.soll);
        });
    });
});
