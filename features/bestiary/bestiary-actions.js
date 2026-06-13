// [SECTION:BESTIARY_ACTIONS]
// ============================================================
// BESTIARY ACTIONS — Uebernahme zu Initiative/Encounter, Favoriten
// Stub: Implementierung wird durch Plan 05 gefuellt.
// ============================================================

function addBestiaryToInitiative() {
    // Stub: Fuegt Monster zur Initiative hinzu mit Mengen-Dialog (Plan 05, D-14/D-15/D-16).
}

function addBestiaryToEncounter() {
    // Stub: Fuegt Monster zum Encounter hinzu (Plan 05).
}

function toggleBestiaryFavorite() {
    // Stub: Schaltet Favoriten-Stern um (Plan 05, D-11).
}

function isBestiaryFavorite() {
    // Stub: Prueft ob Monster ein Favorit ist — gibt false zurueck bis Plan 05.
    return false;
}

function getBestiaryMonster() {
    // Stub: Laedt Monster aus SRD oder D.bestiary[] nach ID/Source — gibt null zurueck bis Plan 05.
    return null;
}

window.addBestiaryToInitiative = addBestiaryToInitiative;
window.addBestiaryToEncounter  = addBestiaryToEncounter;
window.toggleBestiaryFavorite  = toggleBestiaryFavorite;
window.isBestiaryFavorite      = isBestiaryFavorite;
window.getBestiaryMonster      = getBestiaryMonster;
