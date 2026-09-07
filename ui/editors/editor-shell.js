// [SECTION:EDITOR_SHELL]
//
// Kopf- und Statuszeile der Langform-Editoren (Variante 2a, W-18).
//
// Aufbau je Editor:
//   .editor-shell
//     .editor-shell-head   Punkt + Kontexttitel + Speicherstand
//     .editor-toolbar      (vom Generator, unveraendert)
//     .rich-editor         die Schreibflaeche, ID bleibt auf IHR
//     .editor-shell-foot   Woerter, Zeichen, Hinweis
//
// Die ID bleibt bewusst auf dem contenteditable und wandert NICHT auf die
// Schale: clearFormFields() und rund zwanzig Ladepfade adressieren sie direkt.
//
// KEIN "Gespeichert · HH:MM" — anders als der Prototyp. Zwei Messungen am
// gebauten Bundle haben die Idee erledigt:
//   1. save() ist selbst entprellt. Der Post-Save-Hook feuert 1,5-3 s spaeter
//      und ohne jede Zuordnung dazu, WER gespeichert hat: ein beim Oeffnen des
//      Formulars angestossener Schreibvorgang landete mitten im Tippen und
//      haette "Gespeichert" gemeldet, waehrend nichts vom Getippten
//      gespeichert war.
//   2. Beide Formulare schliessen sich beim Speichern (hideWikiForm bzw.
//      cancelSessionEdit laufen VOR save()). Es gibt also gar keinen Moment,
//      in dem ein Nutzer den Zeitstempel saehe.
// Was bleibt, ist die Angabe, die wirklich etwas wert ist: ob in diesem Feld
// ungesicherter Text steht.

// Ruhezeit nach der letzten Eingabe, bevor der Stand von "Wird bearbeitet …"
// auf "Ungespeicherte Änderungen" wechselt. Aus dem Handoff, Abschnitt 8.
const EDITOR_SHELL_IDLE_DELAY = 1200;

const editorShellTimers = {};

/**
 * Woerter in reinem Text. Eine Implementierung fuer die Statuszeile UND die
 * Wiki-Detailansicht — die zaehlte vorher mit einer eigenen Kopie derselben
 * zwei Zeilen.
 *
 * @param {string} plainText Text OHNE Auszeichnung
 * @returns {number}
 */
function countEditorWords(plainText) {
    if (!plainText) return 0;
    return plainText.split(/\s+/).filter(w => w.length > 0).length;
}

function editorShellPart(editorId, attr) {
    return document.querySelector(`[${attr}="${editorId}"]`);
}

function setEditorShellState(editorId, text) {
    const el = editorShellPart(editorId, 'data-editor-state-for');
    if (el) el.textContent = text;
}

function updateEditorShellCounts(editorId) {
    const editor = $(editorId);
    if (!editor) return;
    const plain = editor.innerText || editor.textContent || '';
    const words = editorShellPart(editorId, 'data-editor-words-for');
    const chars = editorShellPart(editorId, 'data-editor-chars-for');
    if (words) words.textContent = `${countEditorWords(plain)} Wörter`;
    if (chars) chars.textContent = `${plain.length} Zeichen`;
}

function handleEditorShellInput(editorId) {
    updateEditorShellCounts(editorId);
    setEditorShellState(editorId, 'Wird bearbeitet …');
    if (editorShellTimers[editorId]) clearTimeout(editorShellTimers[editorId]);
    editorShellTimers[editorId] = setTimeout(() => {
        // BEWUSST nicht "Gespeichert": der Editor speichert nicht von sich aus.
        // Sein Inhalt liegt im Formular und erreicht die Persistenz erst, wenn
        // der Speichern-Knopf des Formulars laeuft. Ein "Gespeichert" nach
        // 1200 ms Ruhe waere schlicht falsch — und genau die Sorte Anzeige, die
        // man am Spieltisch ein einziges Mal glaubt.
        setEditorShellState(editorId, 'Ungespeicherte Änderungen');
        editorShellTimers[editorId] = null;
    }, EDITOR_SHELL_IDLE_DELAY);
}

/**
 * Setzt eine Schale auf den Ausgangszustand zurueck — beim Oeffnen eines
 * Formulars, damit nicht der Stand des vorigen Eintrags stehen bleibt.
 */
function resetEditorShell(editorId) {
    if (editorShellTimers[editorId]) {
        clearTimeout(editorShellTimers[editorId]);
        editorShellTimers[editorId] = null;
    }
    setEditorShellState(editorId, '');
    updateEditorShellCounts(editorId);
}

function initEditorShells() {
    const shells = document.querySelectorAll('[data-editor-shell]');
    if (!shells.length) return;
    shells.forEach(shell => {
        const editorId = shell.dataset.editorShell;
        const editor = editorId ? $(editorId) : null;
        if (!editor || editor.dataset.shellBound === '1') return;
        editor.dataset.shellBound = '1';
        // Eigener input-Listener statt data-action: wiki-content traegt bereits
        // data-action="wiki-content-input", und ein Element kann nur EINE
        // data-action tragen.
        editor.addEventListener('input', () => handleEditorShellInput(editorId));
        updateEditorShellCounts(editorId);
    });
}

window.countEditorWords = countEditorWords;
window.initEditorShells = initEditorShells;
window.updateEditorShellCounts = updateEditorShellCounts;
window.resetEditorShell = resetEditorShell;
