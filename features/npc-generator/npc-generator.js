// [SECTION:NPC_GENERATOR]
// NPC-Generator — Generator-Logik (WELT-02)
// Wave 0: Skelett ohne vollständige Implementierung
// Implementierung: Plan 05-03 (nach Tabellen-Generierung)
// ============================================================
// Verwendete Globals: NPC_DEFAULT_TABLES, window.saveNPC (aus npc-crud.js),
//   pushUndo, esc, sanitizeHTML

/**
 * Generiert einen zufälligen NPC-Namen basierend auf Volk und Geschlecht.
 * Stub: Wave 0 — gibt 'Unbekannt' zurück bis Tabellen befüllt sind (Plan 05-03).
 * @param {string} volk - z.B. 'mensch', 'elf', 'zwerg'
 * @param {string} geschlecht - 'maennlich' | 'weiblich' | 'neutral'
 * @returns {string}
 */
function generiereNPCName(volk, geschlecht) {
    const tables = window.NPC_DEFAULT_TABLES;
    if (!tables || !tables.namen) return 'Unbekannt';
    const pool = (tables.namen[volk] && tables.namen[volk][geschlecht]) || [];
    if (pool.length === 0) return 'Unbekannt';
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generiert einen zufälligen Persönlichkeitszug.
 * @returns {string}
 */
function generiereNPCZug() {
    const tables = window.NPC_DEFAULT_TABLES;
    if (!tables || !tables.persoenlichkeitszuege || tables.persoenlichkeitszuege.length === 0) return '';
    const arr = tables.persoenlichkeitszuege;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generiert eine zufällige Marotte.
 * @returns {string}
 */
function generiereNPCMarotte() {
    const tables = window.NPC_DEFAULT_TABLES;
    if (!tables || !tables.marotten || tables.marotten.length === 0) return '';
    const arr = tables.marotten;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Öffnet das NPC-Generator-Modal.
 * Stub: Wave 0 — Implementierung in Plan 05-03.
 */
function showNPCGeneratorModal() {
    if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
        console.warn('[showNPCGeneratorModal] Stub — Implementierung in Plan 05-03');
    }
}

window.generiereNPCName = generiereNPCName;
window.generiereNPCZug = generiereNPCZug;
window.generiereNPCMarotte = generiereNPCMarotte;
window.showNPCGeneratorModal = showNPCGeneratorModal;
