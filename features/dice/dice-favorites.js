// [SECTION:DICE_FAVORITES]
// Extrahiert aus dice.js
// Würfel-Favoriten
// Zeilen: 70
// ============================================================
// DICE FAVORITES
// ============================================================
var APP_CONFIG = window.APP_CONFIG;
var StorageAPI = window.StorageAPI;
var rollCustomDice = window.rollCustomDice;
var DICE_FAV_KEY = APP_CONFIG.DICE_FAV_KEY;
function getDiceFavorites() {
    return StorageAPI.getJSON(DICE_FAV_KEY, []);
}
function saveDiceFavorites(favs) {
    StorageAPI.setJSON(DICE_FAV_KEY, favs);
}
function renderDiceFavorites() {
    const favs = getDiceFavorites();
    const container = $('dice-favorites-list');
    if (!container)
        return;
    if (!favs.length) {
        container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.75em;">Keine Favoriten</span>';
        return;
    }
    container.innerHTML = favs.map((f, i) => `
        <div class="dice-fav-item" data-action="roll-favorite" data-id="${i}" title="${esc(f.notation)}">
            <span class="fav-name">${esc(f.name)}</span>
            <span class="fav-del" data-action="delete-favorite-stop" data-id="${i}">✕</span>
        </div>
    `).join('');
}
function addDiceFavorite() {
    const nameInput = $('dice-fav-name');
    const notationInput = $('dice-fav-notation');
    if (!nameInput || !notationInput)
        return;
    const name = nameInput.value.trim();
    const notation = notationInput.value.trim();
    if (!name || !notation) {
        showToast('⚠️ Name und Notation erforderlich', 'error');
        return;
    }
    const favs = getDiceFavorites();
    favs.push({ name, notation });
    saveDiceFavorites(favs);
    nameInput.value = '';
    notationInput.value = '';
    hideModal('dice-fav-modal');
    renderDiceFavorites();
    showToast('Favorit hinzugefügt');
}
function deleteDiceFavorite(index) {
    const favs = getDiceFavorites();
    favs.splice(index, 1);
    saveDiceFavorites(favs);
    renderDiceFavorites();
}
function rollFavoriteDice(index) {
    const favs = getDiceFavorites();
    if (favs[index]) {
        const input = $('dice-notation');
        if (input) {
            input.value = favs[index].notation;
            rollCustomDice();
        }
    }
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.getDiceFavorites = getDiceFavorites;
window.renderDiceFavorites = renderDiceFavorites;
window.addDiceFavorite = addDiceFavorite;
window.deleteDiceFavorite = deleteDiceFavorite;
