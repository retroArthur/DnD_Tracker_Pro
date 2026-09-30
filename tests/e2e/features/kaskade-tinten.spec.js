/* Kaskadenprobe der drei Tinten aus Pruefung W3-E, Runde 1
   (Design-Handoff v3, Welle 3, Schritt 9)
   ===========================================================================
   WAS SIE PRUEFT UND WARUM ES R-23 NICHT LEISTET. R-23 Teil (8) faengt die
   Fehlerklasse an der Wurzel: kein Inline-Stil darf eine Farbe gegen die Regel
   seiner eigenen Klasse malen. Was es NICHT sieht, ist die Kaskade selbst. Die
   drei Regeln, die den Befund behoben haben, gewinnen ueber Spezifitaet und
   Reihenfolge:

     .init-entry.lair .init-type  0-3-0 gegen .init-type          0-1-0
     .si-tag-v.si-tag-neg         0-2-0 gegen .si-tag-v           0-1-0
     .qref-btn-del                0-1-0 gegen .qref-btn           0-1-0
                                  — hier entscheidet die REIHENFOLGE, und
                                  bewusst NICHT gegen .qref-btn:hover (0-2-0),
                                  damit der Hover wieder gewinnt

   Die dritte ist die empfindliche: wer .qref-btn-del in dashboard.css vor
   .qref-btn schiebt, macht sie lautlos wirkungslos, und keine Textpruefung
   sieht das. Diese Probe liest darum die BERECHNETEN Farben am gebauten
   Dev-Buendel, in allen vier Themes. Ohne die Korrektur ist sie rot (an
   dedff45 nachgestellt: die Lair-Unterzeile las --red statt --red-text, die
   zwei neuen Klassen existierten nicht, und der Zeilenring trug keinen
   Versatz).

   NICHT GEGEN DAS GESCHWISTERELEMENT VERGLEICHEN, und das ist der Fallstrick,
   in den die erste Fassung dieser Probe gelaufen ist: .init-name traegt
   `transition: color 0.15s`, und getComputedStyle liefert waehrend eines
   laufenden Uebergangs den INTERPOLIERTEN Wert — nach einem Themenwechsel also
   noch den alten. Die Probe meldete #f37373 in allen vier Themes und sah wie
   ein Befund aus. Verglichen wird deshalb gegen das aufgeloeste Token am
   Wurzelelement, das keinen Uebergang hat. */
import { test, expect } from '@playwright/test';

const BUNDLE = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** '#bd2121' -> 'rgb(189, 33, 33)'; die Kurzform '#888' kommt vor (--text-dim). */
function zuRgb(hex) {
    const h = hex.trim().replace('#', '');
    const v = h.length === 3 ? h.replace(/./g, c => c + c) : h;
    const n = parseInt(v, 16);
    return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

test('die drei Tinten aus W3-E gewinnen die Kaskade in allen vier Themes', async ({ page }) => {
    await page.goto(BUNDLE);
    const ergebnis = await page.evaluate(() => {
        const out = { themes: {} };
        const halter = document.createElement('div');
        halter.innerHTML = `
            <div class="init-entry init-row lair"><div class="init-info">
                <div class="init-type" id="p-type">Lair Action</div>
            </div></div>
            <div class="si-item expanded"><div class="si-details">
                <span class="si-tag"><span class="si-tag-v" id="p-cyan">C</span>
                <span class="si-tag-v si-tag-neg" id="p-neg">Nachteil</span></span>
            </div></div>
            <div class="qref-panel"><div class="qref-custom-entry">
                <div class="quick-ref-section-title">
                    <button class="qref-btn" id="p-edit">e</button>
                    <button class="qref-btn qref-btn-del" id="p-del">d</button>
                </div>
            </div></div>`;
        document.body.appendChild(halter);
        const cs = id => getComputedStyle(document.getElementById(id));
        for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
            document.documentElement.setAttribute('data-theme', theme);
            const wurzel = getComputedStyle(document.documentElement);
            out.themes[theme] = {
                tokenRedText: wurzel.getPropertyValue('--red-text').trim(),
                tokenTextDim: wurzel.getPropertyValue('--text-dim').trim(),
                tokenCyan: wurzel.getPropertyValue('--cyan').trim(),
                tokenBorder: wurzel.getPropertyValue('--border').trim(),
                lairType: cs('p-type').color,
                tagCyan: cs('p-cyan').color,
                tagNeg: cs('p-neg').color,
                delRand: cs('p-del').borderTopColor,
                editRand: cs('p-edit').borderTopColor
            };
        }
        halter.remove();

        // Der Versatz des Zeilenrings steht an einer :hover-Regel und ist ohne
        // Zeigergeraet nicht zu messen — gelesen wird er darum aus dem CSSOM
        // des gebauten Buendels, also aus demselben Text, den der Browser
        // anwendet.
        out.versatz = null;
        for (const bl of document.styleSheets) {
            let regeln = [];
            try {
                regeln = [...bl.cssRules];
            } catch {
                continue;
            }
            for (const r of regeln) {
                if (r.selectorText === '.backup-entry:hover') {
                    out.versatz = r.style.outlineOffset || '(nicht gesetzt)';
                }
            }
        }
        return out;
    });
    console.log(JSON.stringify(ergebnis, null, 2));

    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        const w = ergebnis.themes[theme];
        const rot = zuRgb(w.tokenRedText);
        // 1. Die Lair-Unterzeile malt --red-text, nicht --text-dim (CSS-Regel)
        //    und nicht --red (Inline-Stil vorher).
        expect(w.lairType, `${theme}: Lair-Unterzeile ist --red-text`).toBe(rot);
        expect(w.lairType, `${theme}: Lair-Unterzeile ist NICHT --text-dim`).not.toBe(
            zuRgb(w.tokenTextDim)
        );
        // 2. Das Nachteil-Etikett malt --red-text und weicht vom cyanfarbenen
        //    Geschwister ab.
        expect(w.tagNeg, `${theme}: Nachteil-Etikett ist --red-text`).toBe(rot);
        expect(w.tagCyan, `${theme}: Geschwister ist --cyan`).toBe(zuRgb(w.tokenCyan));
        // 3. Der Loeschring ist in Ruhe --red-text, der Stiftknopf --border.
        expect(w.delRand, `${theme}: Loeschring ist --red-text`).toBe(rot);
        expect(w.editRand, `${theme}: Stiftknopf ist --border`).toBe(zuRgb(w.tokenBorder));
    }
    // 4. Der Ring der Sicherungsliste liegt innen — aus dem CSSOM gelesen.
    expect(ergebnis.versatz, 'outline-offset an .backup-entry:hover').toBe('-1px');
});
