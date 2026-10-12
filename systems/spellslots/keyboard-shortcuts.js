// [SECTION:KEYBOARD_SHORTCUTS]
// Extrahiert aus spellslots.js
// Keyboard Shortcuts
// Zeilen: 193
// KEYBOARD SHORTCUTS
// ============================================================

// Ein fokussiertes Bedienelement, das die Leertaste fuer sich beansprucht
// (TAST, Schritt 2). INPUT/TEXTAREA/SELECT und contentEditable stehen hier
// NICHT: die deckt `isTyping` unten schon ab, und zwar fuer ALLE
// Einzeltasten-Kuerzel.
const TASTEN_BEDIENELEMENT_SELEKTOR =
    'button, a[href], [role="button"], [tabindex]:not([tabindex="-1"])';

function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // Ignoriere Shortcuts wenn in Input/Textarea
        const activeEl = document.activeElement;
        const isTyping =
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName) ||
            activeEl?.isContentEditable;

        // ============================================================
        // DIE GEKAPERTE LEERTASTE (TAST, Schritt 2)
        // ============================================================
        // Gemessen am gebauten Buendel, gefuellte Kampagne, echte
        // Tabulatorspruenge: der Spielleiter tabuliert in der
        // Initiative-Ansicht 21 Halte weit auf "◀ Zurueck", drueckt die
        // Leertaste — und der Zug geht VORWAERTS. Der Knopf loest nicht aus
        // (nativer Klick am Ziel: 0), stattdessen faengt der
        // Leertasten-Zweig weiter unten die Taste ab, ruft
        // `preventDefault()` und schickt sie an `nextTurn()`. Der Kampf ist
        // eine Runde falsch und niemand sieht warum. Dasselbe bei "Neue
        // Runde" (Halt 22), "+ Party" (23), "Alle wuerfeln" (24) und
        // "Zustaende" (27).
        //
        // Betroffen sind Knoepfe, die schon echte `<button>` SIND — keine
        // Nachruestung von `tabindex`/`role` hilft dagegen, nur diese
        // Schranke.
        //
        // NUR DIE LEERTASTE. Die erste Fassung hat die Ziffern 1-9
        // mitgesperrt (O-7) und damit ein dokumentiertes Kuerzel
        // zerschlagen; Runde 1 hat das zurueckgenommen. Der Unterschied
        // sitzt in der Absicht des Anschlags: die Leertaste auf einem
        // fokussierten Knopf heisst "bediene DAS HIER", eine Ziffer heisst
        // "zeig mir Ansicht 3" — und das ist, was sie tut, laut
        // Kuerzeltabelle UND laut der App-eigenen Hilfe. Gemessen gab es bei
        // Ziffern auch nichts zu schuetzen: auf einem ertabulierten
        // `<button>` erzeugt `3` NULL Klicks (echt und synthetisch), es gibt
        // also kein natives Doppelfeuer. Die Schranke nahm dort nur das
        // Kuerzel weg — und zwar genau auf dem Weg, den der Spielleiter
        // geht: nach einem gewoehnlichen Mausklick behaelt ein Knopf den
        // Fokus, danach war jede Ziffer tot (sechs von sechs geprueften
        // Knoepfen, bei 6 und bei 20 Eintraegen je Typ).
        //
        // Bei r/t/l/k/n/p// bleibt es ebenfalls beim Kuerzel: niemand
        // drueckt `r`, um einen Knopf zu bedienen, und mehrere dieser
        // Kuerzel sind heute der EINZIGE funktionierende Zugang zu ihrer
        // Flaeche — `/` oeffnet die Schnellreferenz, `k` das
        // Kampfprotokoll. Wer sie mitsperrt, nimmt dem Nutzer einen Weg
        // weg, um einen Fehler zu beheben, den sie nicht verursachen.
        //
        // Der gewohnte Griff bleibt: ohne Fokus (activeElement = BODY)
        // greift diese Schranke nicht, die Leertaste wechselt weiter den
        // Zug. Nachgemessen bei 6 und bei 20 Kaempfern.
        //
        // Hier wird NICHTS nachgebildet: die Schranke laesst die Taste
        // einfach durch, und der Browser loest den Knopf selbst aus — genau
        // ein Klick, kein Doppelfeuer, und `scrollY` bleibt 0, weil ein
        // fokussierter `<button>` die Vorgabe der Leertaste selbst
        // unterdrueckt. Beides gemessen, nicht angenommen.
        //
        // UND SEIT T-C EINE AUSNAHME. Die Kehrschleife (`ui/keyboard-reach.js`)
        // hat rund 430 Stellen fokussierbar gemacht, die vorher keinen Fokus
        // annehmen konnten — sie fallen damit alle unter den Selektor oben.
        // Der Satz zwei Absaetze hoeher ("ohne Fokus ... wechselt weiter den
        // Zug") wuerde damit still fuer die halbe Kampfansicht ungueltig: ein
        // Mausklick auf den Initiative-Wert parkt den Fokus dort, und die
        // Leertaste bediente danach dieses `div` statt den Zug zu wechseln.
        // `nurMausfokus()` nimmt genau diese Lage wieder heraus — versorgte
        // Stelle UND Fokus nicht von der Tastatur. Nativen Knoepfen nimmt sie
        // nichts: dort ist die Lage dieselbe, aber `istVersorgt()` ist falsch,
        // und die Leertaste bleibt ihre Bedienung. Begruendung und Messwerte
        // stehen an der Funktion.
        const beanspruchtLeertaste =
            !!activeEl?.matches?.(TASTEN_BEDIENELEMENT_SELEKTOR) &&
            !window.KeyboardReach?.nurMausfokus?.(activeEl);

        // ============================================================
        // SOUNDBOARD QUICK-SLOTS (D-03) — Alt+Shift+0..5
        // MUSS vor dem isTyping-Guard stehen, damit der Shortcut auch
        // beim Tippen in Textfeldern funktioniert (Modifier-Combo).
        // e.code als primaere Pruefrung (layout-unabhaengig, A4); e.key als Fallback.
        // ============================================================
        if (e.altKey && e.shiftKey) {
            const codeMatch = e.code && e.code.match(/^Digit([0-5])$/);
            const keyMatch = !codeMatch && e.key >= '0' && e.key <= '5';
            const digit = codeMatch ? parseInt(codeMatch[1]) : (keyMatch ? parseInt(e.key) : -1);

            if (digit >= 0) {
                e.preventDefault();
                if (digit === 0) {
                    // Alt+Shift+0 — Mute toggle
                    if (typeof window.toggleSoundboardMute === 'function') {
                        window.toggleSoundboardMute();
                    }
                } else {
                    // Alt+Shift+1..5 — Quick-Slot aktivieren (D-03)
                    if (typeof window.activateSceneBySlot === 'function') {
                        window.activateSceneBySlot(digit);
                    }
                }
                return;
            }
        }

        // Escape: Schließe Overlays und Modals (konsolidiert)
        // WR-10: Direktaufrufe via window.X() — KEIN function-scoped
        // `const X = window.X` (CLAUDE.md Dedup-Regel, Incident 2026-01-10)
        if (e.key === 'Escape') {
            // 1. Shortcuts-Overlay schließen
            const shortcutsOverlay = $('shortcuts-overlay');
            if (shortcutsOverlay?.classList.contains('show')) {
                if (typeof window.hideShortcutsOverlay === 'function') window.hideShortcutsOverlay();
                return;
            }
            // 2. Quick-Ref schließen
            const quickRef = $('quick-ref-panel');
            if (quickRef?.classList.contains('open')) {
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
                return;
            }
            // 3. Offenes Modal schließen
            const openModal = document.querySelector('.modal-overlay.show');
            if (openModal) {
                // Die ~19 Modale aus den Templates gehören dauerhaft zum DOM —
                // bei ihnen ist das Abnehmen der Klasse `show` der Weg. Eine
                // per JS eingehängte Schale (Markierung `modal-transient`)
                // muss dagegen ENTFERNT werden: sonst bleibt der Knoten samt
                // seiner Feld-IDs liegen, unsichtbar aber nicht weg (U4).
                if (openModal.classList.contains('modal-transient')) {
                    openModal.remove();
                } else {
                    openModal.classList.remove('show');
                }
                return;
            }
        }
        // Strg+Z: Undo (immer aktiv)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (typeof window.undo === 'function') window.undo();
            return;
        }
        // Strg+Y oder Strg+Shift+Z: Redo (immer aktiv)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (typeof window.redo === 'function') window.redo();
            return;
        }
        // Strg+S: Speichern (immer aktiv)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveImmediate();
            showToast('Gespeichert');
            return;
        }
        // Strg+K oder Strg+F: Globale Suche
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k') && !e.shiftKey) {
            e.preventDefault();
            $('global-search')?.focus();
            return;
        }
        // Strg+Shift+K: Command Palette (TECH-04)
        // WR-01: In Firefox öffnet Strg+Shift+K die Web-Konsole (nicht abfangbar) —
        // Strg+Punkt ist die browserneutrale Alternative.
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
            e.preventDefault();
            if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette();
            return;
        }
        // Strg+Punkt: Command Palette (Firefox-kompatible Alternative, WR-01)
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === '.') {
            e.preventDefault();
            if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette();
            return;
        }
        // Folgende nur wenn nicht am Tippen
        if (isTyping) return;
        // ?: Shortcuts-Overlay
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            if (typeof window.showShortcutsOverlay === 'function') window.showShortcutsOverlay();
            return;
        }
        // /: Quick Reference öffnen und Suche fokussieren
        if (e.key === '/') {
            e.preventDefault();
            const panel = $('quick-ref-panel');
            if (panel && !panel.classList.contains('active')) {
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
            }
            setTimeout(() => $('qref-search-input')?.focus(), 100);
            return;
        }
        // T: Session Timer toggle
        if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof window.toggleSessionTimer === 'function') window.toggleSessionTimer();
            return;
        }
        // Ziffern 1-9: Tab-Wechsel (entspricht der Standard-Tab-Reihenfolge)
        // KEIN `beanspruchtLeertaste` hier (Runde 1, nachgemessen): ein
        // fokussierter Knopf verarbeitet keine Ziffer, es gibt also nichts zu
        // schuetzen — eine Schranke nahm hier nur das dokumentierte Kuerzel
        // weg. Begruendung im Block oben.
        if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const tabs = [
                'dashboard',
                'party',
                'npcs',
                'locations',
                'quests',
                'encounter',
                'initiative',
                'shops',
                'loot'
            ];
            const idx = parseInt(e.key) - 1;
            if (tabs[idx]) {
                e.preventDefault();
                switchView(tabs[idx]);
            }
            return;
        }
        // Alt+Ziffern: Schnellwürfel
        if (e.altKey && e.key >= '1' && e.key <= '9') {
            const dice = { 1: 12, 2: 20, 4: 4, 6: 6, 8: 8 };
            if (dice[e.key]) {
                e.preventDefault();
                quickRoll(dice[e.key]);
            }
            return;
        }
        // Space: Nächster Zug (nur im Initiative-Tab)
        // `beanspruchtLeertaste`: liegt der Fokus auf einem Bedienelement,
        // gehoert die Leertaste diesem Element. Ohne Fokus bleibt es beim
        // gewohnten Griff — Leertaste = naechster Zug.
        if (
            e.key === ' ' &&
            !beanspruchtLeertaste &&
            document.querySelector('#view-initiative.active')
        ) {
            e.preventDefault();
            if (typeof window.nextTurn === 'function') window.nextTurn();
            return;
        }
        // Delete/Backspace: Node löschen (nur im Network-Tab)
        if (
            (e.key === 'Delete' || e.key === 'Backspace') &&
            document.querySelector('#view-network.active')
        ) {
            e.preventDefault();
            if (typeof window.deleteSelectedNode === 'function') window.deleteSelectedNode();
            return;
        }
        // N: Nächster Zug im Initiative
        if (e.key === 'n' && !e.shiftKey && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.nextTurn === 'function') window.nextTurn();
            return;
        }
        // Shift+N: Neue Runde
        if (e.key === 'N' && e.shiftKey && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.nextEncounterRound === 'function') window.nextEncounterRound();
            return;
        }
        // P: Vorheriger Zug
        if (e.key === 'p' && document.querySelector('#view-initiative.active')) {
            e.preventDefault();
            if (typeof window.prevTurn === 'function') window.prevTurn();
            return;
        }
        // R: Quick Roll d20
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            quickRoll(20);
            return;
        }
        // L: Event Log toggle
        if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (typeof window.toggleEventLog === 'function') window.toggleEventLog();
            return;
        }
        // K: Kampfprotokoll-Panel (U5). Bare 'k' war frei — Strg+K ist die globale
        // Suche und Strg+Shift+K die Kommandopalette, beide fangen weiter oben ab.
        if (e.key === 'k' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            if (typeof window.toggleCombatLog === 'function') window.toggleCombatLog();
            return;
        }
        // N: Neues Element (kontextabhängig)
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const activeView = document.querySelector('.view.active')?.id;
            if (activeView === 'view-party') toggleCollapse('char-form');
            else if (activeView === 'view-npcs') showModal('npc-modal');
            else if (activeView === 'view-quests') showModal('quest-modal');
            else if (activeView === 'view-encounter') toggleCollapse('enc-form');
            return;
        }
        // IN-02: Der frühere zweite '?'-Block (showKeyboardHelp) war unerreichbar —
        // '?' wird bereits weiter oben vom Shortcuts-Overlay abgefangen. Entfernt.
    });
}
// ============================================================
