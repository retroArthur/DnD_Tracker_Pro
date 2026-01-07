// [SECTION:DICE_FAVORITES]
// Extrahiert aus dice.js
// Würfel-Favoriten
// Zeilen: 70

import { $, esc } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { hideModal } from '@systems/spellslots/navigation';

// ============================================================
// TYPES
// ============================================================

interface DiceFavorite {
    name: string;
    notation: string;
}

// ============================================================
// DICE FAVORITES
// ============================================================

const APP_CONFIG = (window as any).APP_CONFIG;
const StorageAPI = (window as any).StorageAPI;
const rollCustomDice = (window as any).rollCustomDice;

const DICE_FAV_KEY: string = APP_CONFIG.DICE_FAV_KEY;

export function getDiceFavorites(): DiceFavorite[] {
    return StorageAPI.getJSON(DICE_FAV_KEY, []);
}

function saveDiceFavorites(favs: DiceFavorite[]): void {
    StorageAPI.setJSON(DICE_FAV_KEY, favs);
}

export function renderDiceFavorites(): void {
    const favs = getDiceFavorites();
    const container = $('dice-favorites-list');
    if (!container) return;

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

export function addDiceFavorite(): void {
    const nameInput = $('dice-fav-name') as HTMLInputElement | null;
    const notationInput = $('dice-fav-notation') as HTMLInputElement | null;

    if (!nameInput || !notationInput) return;

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

export function deleteDiceFavorite(index: number): void {
    const favs = getDiceFavorites();
    favs.splice(index, 1);
    saveDiceFavorites(favs);
    renderDiceFavorites();
}

export function rollFavoriteDice(index: number): void {
    const favs = getDiceFavorites();
    if (favs[index]) {
        const input = $('dice-notation') as HTMLInputElement | null;
        if (input) {
            input.value = favs[index].notation;
            rollCustomDice();
        }
    }
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

(window as any).getDiceFavorites = getDiceFavorites;
(window as any).renderDiceFavorites = renderDiceFavorites;
(window as any).addDiceFavorite = addDiceFavorite;
(window as any).deleteDiceFavorite = deleteDiceFavorite;
(window as any).rollFavoriteDice = rollFavoriteDice;
