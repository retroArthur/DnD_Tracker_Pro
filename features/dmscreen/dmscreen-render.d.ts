interface DMScreenWidget {
    id: string;
    type: string;
    visible: boolean;
}
interface DMScreenLayout {
    widgets: DMScreenWidget[];
}
interface DMScreenProfile {
    name: string;
    icon: string;
    widgets: DMScreenWidget[];
}
interface WidgetDefinition {
    name: string;
    icon: string;
    render: () => string;
    compact: boolean;
}
interface DCEntry {
    dc: number;
    desc: string;
    color: string;
}
interface TableEntry {
    weight: number;
    text: string;
}
interface RandomTable {
    id: number;
    name: string;
    icon: string;
    entries: TableEntry[];
}
interface Combatant {
    name: string;
    initiative: number;
    currentHp: number;
    maxHp: number;
}
interface Character {
    name: string;
    hpCurrent: number;
    hpMax: number;
    passivePerception?: number;
}
declare const APP_CONFIG: any;
declare const UI_TIMING: any;
declare const ErrorHandler: any;
declare const D: any;
/**
 * Standard-Layout für den DM Screen
 */
declare const DEFAULT_DMSCREEN_LAYOUT: DMScreenLayout;
/**
 * Vordefinierte Layout-Profile
 */
declare const DEFAULT_DMSCREEN_PROFILES: {
    [key: string]: DMScreenProfile;
};
/**
 * Debounce-Timer für Live-Sync
 */
declare let dmsLiveSyncTimer: number | null;
declare const DMS_LIVE_SYNC_DELAY: number;
/**
 * Prüft ob DM Screen aktuell sichtbar ist
 */
declare function isDMScreenVisible(): boolean;
/**
 * Aktualisiert den DM Screen wenn sichtbar (debounced)
 */
declare function refreshDMScreenIfVisible(): void;
/**
 * Rendert nur die Widget-Inhalte neu (ohne Layout-Neuaufbau)
 * Schneller als vollständiges renderDMScreen()
 */
declare function renderDMScreenWidgetsOnly(): void;
/**
 * Hook: Wird bei jedem save() aufgerufen
 * Registriert sich beim globalen Save-System
 */
declare function setupDMScreenLiveSync(): void;
/**
 * Initialisiert das DM Screen Layout falls nicht vorhanden
 */
declare function initDMScreenLayout(): void;
/**
 * Setzt das DM Screen Layout auf Standard zurück
 */
declare function resetDMScreenLayout(): void;
/**
 * Wechselt zu einem vordefinierten oder gespeicherten Profil
 */
declare function switchDMSProfile(profileId: string): void;
/**
 * Speichert aktuelles Layout als neues Profil
 */
declare function saveDMSProfileAs(): void;
/**
 * Löscht ein benutzerdefiniertes Profil
 */
declare function deleteDMSProfile(profileId: string): void;
/**
 * Zeigt das Profil-Auswahl-Dropdown
 */
declare function toggleDMSProfileDropdown(): void;
/**
 * Rendert die Profil-Liste im Dropdown
 */
declare function renderDMSProfileList(): void;
/**
 * Rendert den gesamten DM Screen
 */
declare function renderDMScreen(): void;
/**
 * Rendert die Widget-Konfigurations-Liste
 */
declare function renderDMSConfigList(): void;
/**
 * Toggled die Sichtbarkeit eines Widgets
 */
declare function toggleDMSWidget(widgetId: string): void;
/**
 * Versteckt ein Widget (vom X-Button)
 */
declare function hideDMSWidget(widgetId: string): void;
/**
 * Speichert das DM Screen Layout
 */
declare function saveDMScreenLayout(): void;
/**
 * Toggle Config Dropdown
 */
declare function toggleDMSConfigDropdown(): void;
declare let dmsDraggedWidget: HTMLElement | null;
declare function initDMSWidgetDragDrop(): void;
declare function handleDMSWidgetDragStart(this: HTMLElement, e: DragEvent): void;
declare function handleDMSWidgetDragEnd(this: HTMLElement, _e: DragEvent): void;
declare function handleDMSWidgetDragOver(e: DragEvent): void;
declare function handleDMSWidgetDragEnter(this: HTMLElement, e: DragEvent): void;
declare function handleDMSWidgetDragLeave(this: HTMLElement, _e: DragEvent): void;
declare function handleDMSWidgetDrop(this: HTMLElement, e: DragEvent): void;
declare function reorderDMSWidgets(draggedId: string, targetId: string): void;
declare let dmsConfigDraggedItem: HTMLElement | null;
declare function initDMSConfigDragDrop(): void;
declare function handleDMSConfigDragStart(this: HTMLElement, e: DragEvent): void;
declare function handleDMSConfigDragEnd(this: HTMLElement, _e: DragEvent): void;
declare function handleDMSConfigDragOver(e: DragEvent): void;
declare function handleDMSConfigDragEnter(this: HTMLElement, e: DragEvent): void;
declare function handleDMSConfigDragLeave(this: HTMLElement, _e: DragEvent): void;
declare function handleDMSConfigDrop(this: HTMLElement, e: DragEvent): void;
declare function getDMScreenWidgets(): {
    [key: string]: WidgetDefinition;
};
/**
 * Compact Conditions Button für Quick Bar
 */
declare function renderDMSConditionsCompact(): string;
declare function renderDMSPartyWidget(): string;
declare function renderDMSInitiativeWidget(): string;
declare function renderDMSDiceWidget(): string;
/**
 * DM Screen Würfelwurf
 */
declare function dmsRollDice(formula: string): number;
declare function renderDMSDCWidget(): string;
declare function renderDMSTablesWidget(): string;
declare function renderDMSRulesWidget(): string;
declare function renderDMSNotesWidget(): string;
declare function saveDMSNotes(): void;
/**
 * Aktionen-Widget - Übersicht aller Aktionstypen im Kampf
 */
declare function renderDMSActionsWidget(): string;
/**
 * Attribute-Widget - Die 6 Attribute mit Modifikator-Tabelle
 */
declare function renderDMSAttributesWidget(): string;
/**
 * Rettungswürfe-Widget - Übersicht mit typischen Auslösern
 */
declare function renderDMSSavesWidget(): string;
/**
 * Fertigkeiten-Widget - Alle 18 Fertigkeiten nach Attribut
 */
declare function renderDMSSkillsWidget(): string;
/**
 * Kampfökonomie-Widget - Was du pro Runde tun kannst
 */
declare function renderDMSEconomyWidget(): string;
/**
 * Kreaturengröße-Widget - Größenkategorien und Platzbedarf
 */
declare function renderDMSSizesWidget(): string;
/**
 * Objekte-Widget - RK und TP von Gegenständen
 */
declare function renderDMSObjectsWidget(): string;
/**
 * Improvisierte Waffen-Widget
 */
declare function renderDMSImprovisedWidget(): string;
/**
 * Ritual & Konzentration-Widget
 */
declare function renderDMSRitualWidget(): string;
/**
 * Schadensarten-Widget - Alle 13 Schadensarten
 */
declare function renderDMSDamageWidget(): string;
/**
 * Gelände-Widget - Geländetypen und Effekte
 */
declare function renderDMSTerrainWidget(): string;
/**
 * Wissensgebiete-Widget - INT-Fertigkeiten und ihre Anwendung
 */
declare function renderDMSKnowledgeWidget(): string;
/**
 * Reisen & Traglast-Widget
 */
declare function renderDMSTravelWidget(): string;
declare function dmsRollOnTable(tableId: number): void;
declare function dmsShowConditionDetail(_conditionId?: string): void;
//# sourceMappingURL=dmscreen-render.d.ts.map