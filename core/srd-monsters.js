// [SECTION:SRD_MONSTERS]
// ============================================================
// SRD 5.1 DE Monster-Datenbank — CC-BY-4.0
// Quelle: Wizards of the Coast / openrpg.de/srd/5e/de/
// Attribution: "Dungeons & Dragons, SRD 5.1 DE" — CC BY 4.0
// Originalquelle: media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf
// Die Daten werden erst beim ersten Zugriff initialisiert (lazy-cache).
// NIEMALS D.* = getSRDMonsters() — SRD-Daten leben ausschliesslich im
// Closure-Cache, nie in D (Architektur-Constraint, Phase 3).
// ============================================================

let _srdMonstersCache = null;

function getSRDMonsters() {
    if (_srdMonstersCache) return _srdMonstersCache;
    // Stub: Datenaggregat wird durch Plan 02 gefuellt.
    _srdMonstersCache = [];
    return _srdMonstersCache;
}

window.getSRDMonsters = getSRDMonsters;
