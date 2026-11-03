/**
 * Unit — "Als NPC speichern" verbraucht die Vorschau bei JEDEM Ausgang (GENERATOR-DOPPELT)
 *
 * DER BEFUND (gemessen am gebauten Buendel, siehe
 * tests/e2e/features/npc-generator-doppelt.spec.js): wirft das Neuzeichnen
 * der NPC-Liste nach dem Speichern, legt jede weitere Bedienung von "Als NPC
 * speichern" denselben NPC noch einmal an — saveGeneratedNPC() speichert
 * (pushUndo, push, save), zeichnet, und schliesst das Fenster und verbraucht
 * die Vorschau (`_npcgAktuell = null`) erst DANACH. Der Wurf bricht dazwischen
 * ab; Fenster und Vorschau bleiben, und der naechste Klick speichert sie
 * erneut. Der Nutzer sieht keine Meldung.
 *
 * WARUM AUCH EIN UNIT-TEST. Die E2E-Spec erreicht nur einen Wurf beim
 * Zeichnen (ueber getNPCIcon()). R1 des Vertrags verlangt die Invariante aber
 * fuer JEDEN Ausgang nach dem Anlegen — "auch wenn save(), renderNPCList()
 * oder showToast() werfen". save() ist im Buendel eine Konstante (siehe
 * CLAUDE.md, Live-Sync), ein Wurf darin laesst sich am Buendel nicht
 * erzeugen; hier schon. Dazu der Unterschied dev/prod: safeRender()
 * (render/helpers.js) wirft bei DEBUG_MODE erneut, was nach dem Aufruf steht,
 * liefe also nur im prod-Buendel. Der e2e-Job der CI baut kein prod-Buendel;
 * dieser Test prueft BEIDE Stellungen.
 *
 * DIE REGELN (Vertrag GENERATOR-DOPPELT, docs/bugfixes.md), die hier gelten:
 *   R1  Nach dem push endet jeder Ausgang mit verbrauchter Vorschau und ohne
 *       #npc-generator-modal im DOM — auch bei einem Wurf in save(),
 *       renderNPCList() oder showToast().
 *   R2  Wirft renderNPCList(): der NPC bleibt (kein Zurueckrollen), genau
 *       eine Erfolgsmeldung UND mindestens eine Meldung vom Typ error, der
 *       Wurf steht im Fehlerlog (ErrorHandler).
 *   R1  dazu die Reihenfolge: save() → Vorschau verbrauchen, Fenster weg →
 *       Erfolgsmeldung → ZULETZT das Zeichnen.
 *   R2  ... und die Fehlermeldung kommt auch, wenn kurz zuvor eine andere
 *       ueber ErrorHandler.showError lief (dessen Entprellung, 2 s, global,
 *       schluckte sie — darum schliesst R3 showError aus).
 *   R3  Im prod-Buendel (DEBUG_MODE aus) erreicht der Wurf des Zeichnens
 *       den Aufrufer nicht — abgefangen IN saveGeneratedNPC. Im dev-Buendel
 *       laesst R3 das erneute Werfen zu, das safeRender als LETZTE Anweisung
 *       ausloest; darum nur prod.
 *   R4  pushUndo, push und save() VOR dem Zeichnen.
 *   R5  Heil: 1 NPC, 1 Undo, 1 Erfolgsmeldung, Fenster weg.
 * Den ORT des Abfangens (saveGeneratedNPC, nicht renderNPCList) prueft dieser
 * Test nicht: seine Doppel ersetzen renderNPCList. Zum Stand dort siehe den
 * Kopf der E2E-Spec (GEGENPROBE).
 *
 * WIE GEMESSEN WIRD. Geladen werden das ECHTE Modul
 * (features/npc-generator/npc-generator.js) und die echten Fehler-Helfer
 * (render/helpers.js: ErrorHandler, safeRender) per vm.runInContext in einen
 * gemeinsamen Kontext — wie im Buendel teilen sie sich den globalen Bereich;
 * ein Fix darf also safeRender (als letzte Anweisung, mit showToastOnError)
 * oder einen eigenen catch nehmen — nicht ErrorHandler.showError (R2,
 * Entprellung). DOM ist das jsdom-Dokument der Testumgebung; der Generator
 * wird ueber showNPCGeneratorModal() geoeffnet. Doppel, die protokollieren
 * und auf Wunsch werfen: save, pushUndo, nextId, showToast, renderNPCList,
 * sanitizeHTML, esc, $. Ein "Klick" laeuft wie in der App durch den catch von
 * EventDelegation (ui/event-delegation.js: ErrorHandler.log, kein
 * showError) — klick() bildet genau das nach. Ein zweiter Klick ist ein
 * zweiter Aufruf; geprueft wird, dass er nichts mehr anlegt.
 *
 * AM BASISSTAND (b1fc7da6) gemessen: rot an der ersten gebrochenen Zusage,
 * keiner an einer Vorbedingung — "Zeichnen wirft" dev und prod: 0
 * Erfolgsmeldungen statt 1; "save() wirft": das Fenster steht noch im DOM.
 * Gruen (Kontrollen): heil (R5), Reihenfolge (R4), showToast() wirft. Die
 * sechs Faelle der Nachpruefung dort ebenfalls rot (9 von 12 rot): die
 * Erfolgsmeldung kam heil NACH dem Zeichnen und fehlte beim Wurf, der Wurf
 * erreichte den Aufrufer, und eine Fehlermeldung gab es nicht.
 *
 * GEGENPROBE (beim Schreiben, an Kopien des Moduls, nicht Teil der Datei):
 * der Fix des Vertrags — Verbrauchen und Schliessen im finally um save(),
 * Erfolgsmeldung, Zeichnen zuletzt, gefangen mit eigenem catch oder per
 * safeRender als letzter Anweisung — 6 von 6. Die Reihenfolge von R1
 * woertlich, aber ohne finally um save(): nur "save() wirft" rot. Zeitflag
 * wie createCampaign, nur die Vorschau frueh verbrauchen, Zurueckrollen,
 * Knopf sperren: die drei Fehlerfaelle rot. safeRender mit Standard-
 * rethrowInDebug und Schliessen DANACH: dev rot, prod gruen. Reihenfolge von
 * saveNPC (save() nach dem Zeichnen): R4 und beide Zeichnen-Faelle rot.
 *
 * NACHPRUEFUNG (an Kopien des Kopfes 39fc6cd5, beide Buendel gebaut, nicht
 * Teil der Datei): drei Vertragsteile sah bis dahin KEIN Test — jede dieser
 * Mutanten war in allen elf E2E- und allen sechs bisherigen Unit-Faellen
 * gruen: die Erfolgsmeldung nach dem abgefangenen Zeichnen (m23), der catch
 * meldet und wirft dann weiter (m21), ErrorHandler.showError statt showToast
 * (m12). Mit den drei neuen Faellen rot, je NUR an seinem: m23 die drei
 * Reihenfolge-Faelle, m21 "R3 prod", m12 beide Entprellungs-Faelle. Die
 * vertragsgemaesse Fassung mit safeRender als letzter Anweisung und
 * showToastOnError bleibt 12 von 12 — die Faelle verlangen nicht mehr als
 * der Vertrag.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..', '..');
const GENERATOR = path.join(REPO, 'features', 'npc-generator', 'npc-generator.js');
const HELFER = path.join(REPO, 'render', 'helpers.js');

/** Der Text, mit dem ein Doppel wirft. */
const PRUEFWURF = 'Pruefwurf GENERATOR-DOPPELT (Unit)';

/** Die NPCs vor dem ersten Klick. */
const VORHER = [
    { id: 1, name: 'Zed', role: 'Wirt' },
    { id: 2, name: 'Mara', role: 'Bettler' }
];

/**
 * Laedt Helfer und Generator in einen frischen Kontext.
 * @param {object} optionen
 * @param {boolean} optionen.debug - APP_CONFIG.DEBUG_MODE (dev: true, prod: false)
 * @param {'save'|'renderNPCList'|'showToast'|null} [optionen.wirft] - welches Doppel wirft
 */
function lade({ debug, wirft = null }) {
    document.body.innerHTML = '<div id="npc-list"></div>';
    const protokoll = {
        /** @type {string[]} Reihenfolge der Aufrufe, je mit der Laenge von D.npcs */
        schritte: [],
        /** @type {{ text: string, typ: string }[]} */
        meldungen: []
    };
    let id = 3;
    const ctx = {
        document,
        console: { error() {}, warn() {}, log() {}, info() {}, debug() {} },
        APP_CONFIG: { DEBUG_MODE: debug },
        NPC_DEFAULT_TABLES: {
            namen: { mensch: { maennlich: ['Aldric'] } },
            persoenlichkeitszuege: ['Mutig'],
            marotten: ['Summt'],
            berufe: ['Schmied'],
            aussehen: ['Narbe']
        },
        D: { npcs: VORHER.map(n => ({ ...n })), randomTables: [] },
        esc: s => String(s ?? ''),
        sanitizeHTML: s => String(s ?? ''),
        $: elementId => document.getElementById(elementId),
        nextId: () => id++,
        pushUndo: () => protokoll.schritte.push('pushUndo:' + ctx.D.npcs.length),
        save: () => {
            protokoll.schritte.push('save:' + ctx.D.npcs.length);
            if (wirft === 'save') throw new Error(PRUEFWURF);
        },
        renderNPCList: () => {
            protokoll.schritte.push('renderNPCList:' + ctx.D.npcs.length);
            if (wirft === 'renderNPCList') throw new Error(PRUEFWURF);
        },
        showToast: (text, typ) => {
            // Auch in die Schritte: R1 legt die Erfolgsmeldung VOR das Zeichnen.
            protokoll.schritte.push('showToast:' + typ);
            protokoll.meldungen.push({ text: String(text), typ: String(typ) });
            if (wirft === 'showToast') throw new Error(PRUEFWURF);
        }
    };
    ctx.window = ctx;
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(HELFER, 'utf8'), ctx, { filename: HELFER });
    vm.runInContext(fs.readFileSync(GENERATOR, 'utf8'), ctx, { filename: GENERATOR });
    return { ctx, protokoll };
}

/**
 * Ein Klick auf "Als NPC speichern", wie EventDelegation ihn ausfuehrt: ein
 * Wurf des Handlers wird gefangen und nur protokolliert.
 * @param {any} ctx
 */
function klick(ctx) {
    try {
        ctx.saveGeneratedNPC();
    } catch (fehler) {
        ctx.ErrorHandler.log('EventDelegation', fehler, 'Action: save-generated-npc');
    }
}

/** @param {any} ctx */
function fensterImDom(ctx) {
    return ctx.document.getElementById('npc-generator-modal') !== null;
}

/** @param {any} ctx */
function wurfImFehlerlog(ctx) {
    return ctx.ErrorHandler.getRecentErrors(50).filter(e =>
        String(e.message || '').includes(PRUEFWURF)
    ).length;
}

/**
 * Oeffnet den Generator, klickt einmal und gibt Name und Protokoll zurueck.
 * @param {Parameters<typeof lade>[0]} optionen
 */
function einKlick(optionen) {
    const geladen = lade(optionen);
    geladen.ctx.showNPCGeneratorModal();
    expect(fensterImDom(geladen.ctx)).toBe(true);
    const name = geladen.ctx.document.querySelector('.npcg-preview-name').textContent;
    klick(geladen.ctx);
    return { ...geladen, name };
}

/**
 * R1: nach dem ersten Klick ist das Fenster weg und die Vorschau verbraucht —
 * ein zweiter Klick legt nichts mehr an.
 * @param {any} ctx
 */
function verbraucht(ctx) {
    expect(fensterImDom(ctx)).toBe(false);
    expect(ctx.D.npcs).toHaveLength(VORHER.length + 1);
    klick(ctx);
    expect(ctx.D.npcs).toHaveLength(VORHER.length + 1);
}

describe('GENERATOR-DOPPELT: saveGeneratedNPC() verbraucht die Vorschau bei jedem Ausgang', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('R5 heil (Kontrolle): ein NPC, ein Undo, ein save(), eine Erfolgsmeldung, Fenster weg; der zweite Klick legt nichts an', () => {
        const { ctx, protokoll, name } = einKlick({ debug: true });
        expect(ctx.D.npcs.map(n => n.name)).toEqual(['Zed', 'Mara', name]);
        expect(protokoll.schritte.filter(s => s.startsWith('pushUndo'))).toHaveLength(1);
        expect(protokoll.schritte.filter(s => s.startsWith('save'))).toHaveLength(1);
        expect(protokoll.meldungen).toEqual([
            { text: `${name} als NPC gespeichert`, typ: 'success' }
        ]);
        verbraucht(ctx);
        expect(protokoll.schritte.filter(s => s.startsWith('pushUndo'))).toHaveLength(1);
        expect(wurfImFehlerlog(ctx)).toBe(0);
    });

    test('R4 (Kontrolle): pushUndo vor dem push, save() mit dem neuen NPC, beides vor dem Zeichnen', () => {
        const { protokoll } = einKlick({ debug: true });
        const n = VORHER.length;
        const stelle = s => protokoll.schritte.indexOf(s);
        expect(stelle(`pushUndo:${n}`)).toBeGreaterThanOrEqual(0);
        expect(stelle(`save:${n + 1}`)).toBeGreaterThan(stelle(`pushUndo:${n}`));
        expect(stelle(`renderNPCList:${n + 1}`)).toBeGreaterThan(stelle(`save:${n + 1}`));
    });

    for (const [buendel, debug] of [
        ['dev', true],
        ['prod', false]
    ]) {
        test(`R1/R2 renderNPCList() wirft (${buendel}, DEBUG_MODE ${debug}): NPC gespeichert, Fenster weg, Erfolgs- UND Fehlermeldung, der zweite Klick legt nichts an`, () => {
            const { ctx, protokoll, name } = einKlick({ debug, wirft: 'renderNPCList' });
            // Vorbedingung: das Zeichnen lief und warf — sonst prueft der Fall nichts.
            expect(protokoll.schritte.filter(s => s.startsWith('renderNPCList'))).toHaveLength(1);
            expect(wurfImFehlerlog(ctx)).toBeGreaterThanOrEqual(1);
            // R2: kein Zurueckrollen — der NPC steht in D und wurde gespeichert.
            expect(ctx.D.npcs.map(n => n.name)).toEqual(['Zed', 'Mara', name]);
            expect(protokoll.schritte).toContain(`save:${VORHER.length + 1}`);
            expect(
                protokoll.meldungen.filter(
                    m => m.typ === 'success' && m.text === `${name} als NPC gespeichert`
                )
            ).toHaveLength(1);
            expect(
                protokoll.meldungen.filter(m => m.typ === 'error').length
            ).toBeGreaterThanOrEqual(1);
            // R1
            verbraucht(ctx);
            expect(protokoll.schritte.filter(s => s.startsWith('pushUndo'))).toHaveLength(1);
        });
    }

    test('R1 save() wirft: Fenster weg, Vorschau verbraucht — der zweite Klick legt nichts an', () => {
        const { ctx, protokoll } = einKlick({ debug: true, wirft: 'save' });
        // Vorbedingung: save() lief mit dem neuen NPC und warf.
        expect(protokoll.schritte).toContain(`save:${VORHER.length + 1}`);
        expect(wurfImFehlerlog(ctx)).toBeGreaterThanOrEqual(1);
        verbraucht(ctx);
        expect(protokoll.schritte.filter(s => s.startsWith('pushUndo'))).toHaveLength(1);
    });

    test('R1 showToast() wirft (Kontrolle): Fenster weg, Vorschau verbraucht — der zweite Klick legt nichts an', () => {
        const { ctx, protokoll } = einKlick({ debug: true, wirft: 'showToast' });
        // Vorbedingung: eine Meldung wurde versucht und warf.
        expect(protokoll.meldungen.length).toBeGreaterThanOrEqual(1);
        expect(wurfImFehlerlog(ctx)).toBeGreaterThanOrEqual(1);
        verbraucht(ctx);
        expect(protokoll.schritte.filter(s => s.startsWith('pushUndo'))).toHaveLength(1);
    });

    // ── Nachpruefung: drei Vertragsteile, die bis dahin kein Test sah ──────
    // (gemessen an Kopien des Kopfes 39fc6cd5, dev- und prod-Buendel gebaut:
    // jede der drei Mutanten war in allen elf E2E- und allen sechs bisherigen
    // Unit-Faellen gruen; siehe NACHPRUEFUNG im Kopf)

    for (const [fall, wirft, debug] of /** @type {const} */ ([
        ['heil', null, true],
        ['Zeichnen wirft, dev', 'renderNPCList', true],
        ['Zeichnen wirft, prod', 'renderNPCList', false]
    ])) {
        test(`R1 Reihenfolge (${fall}): die Erfolgsmeldung kommt nach save() und VOR dem Zeichnen`, () => {
            const { protokoll } = einKlick({ debug, wirft });
            const n = VORHER.length + 1;
            const stelle = s => protokoll.schritte.indexOf(s);
            // Vorbedingung: gespeichert und gezeichnet wurde je einmal.
            expect(stelle(`save:${n}`)).toBeGreaterThanOrEqual(0);
            expect(protokoll.schritte.filter(s => s.startsWith('renderNPCList'))).toHaveLength(1);
            expect(stelle('showToast:success')).toBeGreaterThan(stelle(`save:${n}`));
            expect(stelle(`renderNPCList:${n}`)).toBeGreaterThan(stelle('showToast:success'));
        });
    }

    test('R3 prod (DEBUG_MODE false): der Wurf des Zeichnens wird IN saveGeneratedNPC abgefangen — der Aufruf wirft nicht weiter', () => {
        // Nur prod: im dev-Buendel laesst R3 das erneute Werfen zu, das
        // safeRender als LETZTE Anweisung wegen DEBUG_MODE ausloest.
        const { ctx, protokoll } = lade({ debug: false, wirft: 'renderNPCList' });
        ctx.showNPCGeneratorModal();
        expect(fensterImDom(ctx)).toBe(true);
        expect(() => ctx.saveGeneratedNPC()).not.toThrow();
        // Vorbedingung: das Zeichnen lief und warf, der Wurf steht im Fehlerlog (R2).
        expect(protokoll.schritte.filter(s => s.startsWith('renderNPCList'))).toHaveLength(1);
        expect(wurfImFehlerlog(ctx)).toBeGreaterThanOrEqual(1);
    });

    for (const [buendel, debug] of [
        ['dev', true],
        ['prod', false]
    ]) {
        test(`R2 (${buendel}): die Fehlermeldung kommt auch, wenn kurz zuvor eine andere ueber ErrorHandler.showError lief (2 s Entprellung, global)`, () => {
            const { ctx, protokoll } = lade({ debug, wirft: 'renderNPCList' });
            ctx.showNPCGeneratorModal();
            // Eine andere Fehlermeldung unmittelbar davor, ueber den ECHTEN
            // ErrorHandler.showError — so meldet die App z. B. "Daten konnten
            // nicht serialisiert werden" (systems/spellslots/persistence.js).
            ctx.ErrorHandler.showError('Daten konnten nicht serialisiert werden');
            // Vorbedingung: sie kam an — die Entprellung ist damit gespannt.
            expect(protokoll.meldungen.filter(m => m.typ === 'error')).toHaveLength(1);
            const vorher = protokoll.meldungen.length;
            klick(ctx);
            // Vorbedingung: das Zeichnen warf.
            expect(wurfImFehlerlog(ctx)).toBeGreaterThanOrEqual(1);
            expect(
                protokoll.meldungen.slice(vorher).filter(m => m.typ === 'error').length
            ).toBeGreaterThanOrEqual(1);
        });
    }
});
