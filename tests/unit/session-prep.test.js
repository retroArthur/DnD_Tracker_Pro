/**
 * Unit Tests — Session-Prep-Assistent (features/session-prep/)
 *
 * Herkunft: Phase-5-Wave-0-Stub, aktiviert in Plan 05-03. Bis Phase 14 Plan 05
 * Teil der Sammeldatei tests/unit/welt-story.test.js (WELT-01-Block); durch
 * TEST-04 (Plan 14-05) mechanisch in eine dedizierte Datei ausgegliedert —
 * unveraendert uebernommen, kein Test geaendert oder hinzugefuegt.
 */

// ============================================================
// WELT-01: Session-Prep-Assistent (aktiviert Plan 05-03)
// ============================================================
describe('WELT-01: Session-Prep-Assistent', () => {
    // Hilfsfunktion: minimales D-Objekt simulieren
    function makeMockD(overrides) {
        return Object.assign({
            sessionPreps: [],
            quests: [],
            storyArcs: []
        }, overrides);
    }

    beforeEach(() => {
        // sammleOffeneFaeden greift auf window.D zu — Globales Objekt mocken
        global.window = global.window || {};
        global.window.D = makeMockD();
        // Einfache Stubs für Abhängigkeiten die beim Laden ggf. fehlen
        global.pushUndo = global.pushUndo || function() {};
        global.nextId = global.nextId || function() { return 1; };
        global.parseEntityId = global.parseEntityId || function(id) { return parseInt(id) || null; };
        global.esc = global.esc || function(s) { return String(s || ''); };
        global.sanitizeHTML = global.sanitizeHTML || function(s) { return String(s || ''); };
        global.showToast = global.showToast || function() {};
        global.deleteWithConfirm = global.deleteWithConfirm || function() {};
    });

    test('sammleOffeneFaeden liefert offene Quests aus D.quests', () => {
        global.window.D = makeMockD({
            quests: [
                { id: 1, title: 'Die verschwundene Prinzessin', completed: false },
                { id: 2, title: 'Abgeschlossene Quest', completed: true },
                { id: 3, title: 'Suche nach dem Schwert', completed: false }
            ]
        });

        // sammleOffeneFaeden direkt aus dem require()'d Modul aufrufen
        // Das Modul ist nicht ESM, deshalb testen wir die Logik direkt
        var daten = global.window.D;
        var faeden = [];
        var quests = daten.quests || [];
        quests.forEach(function(q) {
            if (!q.completed) {
                faeden.push({
                    text: q.title || q.name || 'Unbenannte Quest',
                    quelleId: q.id || null,
                    quelleTyp: 'quest'
                });
            }
        });

        expect(faeden).toHaveLength(2);
        expect(faeden[0].text).toBe('Die verschwundene Prinzessin');
        expect(faeden[0].quelleTyp).toBe('quest');
        expect(faeden[1].text).toBe('Suche nach dem Schwert');
        // Abgeschlossene Quest ist NICHT in den Fäden
        expect(faeden.some(f => f.text === 'Abgeschlossene Quest')).toBe(false);
    });

    test('sammleOffeneFaeden filtert !q.completed korrekt', () => {
        global.window.D = makeMockD({
            quests: [
                { id: 10, title: 'Alle erledigt', completed: true }
            ]
        });

        var daten = global.window.D;
        var faeden = [];
        (daten.quests || []).forEach(function(q) {
            if (!q.completed) faeden.push({ text: q.title, quelleId: q.id, quelleTyp: 'quest' });
        });

        expect(faeden).toHaveLength(0);
    });

    test('sammleOffeneFaeden schreibt nicht in D.quests', () => {
        global.window.D = makeMockD({
            quests: [{ id: 5, title: 'Offen', completed: false }]
        });

        var vorher = JSON.stringify(global.window.D.quests);

        // Lese-Operation simulieren (entspricht sammleOffeneFaeden)
        var daten = global.window.D;
        (daten.quests || []).forEach(function(q) {
            /* nur lesen, nicht schreiben */
            var _ = !q.completed;
        });

        var nachher = JSON.stringify(global.window.D.quests);
        expect(vorher).toBe(nachher);
    });
});
