// [SECTION:NPC_DEFAULT_TABLES]
// NPC-Generator — Default-Tabellen (WELT-02)
// ACHTUNG: Diese Datei wird in Plan 05-03 von tools/generate_npc_tables.py
// mit echten deutschen Tabellendaten (Namen, Züge, Marotten etc.) befüllt.
// Nicht manuell bearbeiten — Wave 0 Platzhalter.
// ============================================================

const NPC_DEFAULT_TABLES = {
    // Wave 0: Leere Tabellen — Plan 05-03 befüllt via generate_npc_tables.py
    namen: {
        mensch:   { maennlich: [], weiblich: [], neutral: [] },
        elf:      { maennlich: [], weiblich: [] },
        zwerg:    { maennlich: [], weiblich: [] },
        halbling: { maennlich: [], weiblich: [] },
        halbork:  { maennlich: [], weiblich: [] },
        tiefling: { maennlich: [], weiblich: [] },
        gnom:     { maennlich: [], weiblich: [] }
    },
    persoenlichkeitszuege: [],
    marotten: [],
    berufe: [],
    aussehen: []
};

window.NPC_DEFAULT_TABLES = NPC_DEFAULT_TABLES;
