interface DiceFavorite {
    name: string;
    notation: string;
}
declare const APP_CONFIG: any;
declare const StorageAPI: any;
declare const rollCustomDice: any;
declare const DICE_FAV_KEY: string;
declare function getDiceFavorites(): DiceFavorite[];
declare function saveDiceFavorites(favs: DiceFavorite[]): void;
declare function renderDiceFavorites(): void;
declare function addDiceFavorite(): void;
declare function deleteDiceFavorite(index: number): void;
declare function rollFavoriteDice(index: number): void;
//# sourceMappingURL=dice-favorites.d.ts.map