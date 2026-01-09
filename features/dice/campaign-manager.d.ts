interface Campaign {
    key: string;
    name: string;
    created: string;
}
interface CampaignIndex {
    campaigns: Campaign[];
    active: string;
}
interface EmptyData {
    locations: any[];
    npcs: any[];
    quests: any[];
    characters: any[];
    sessionNotes: any[];
    storyArcs: any[];
    quickNotes: string;
    initiative: {
        combatants: any[];
        currentTurn: number;
        round: number;
    };
    loot: any[];
    items: any[];
    encounters: any[];
    spells: any[];
    links: any[];
    filters: any[];
    mindmap: {
        nodes: any[];
        connections: any[];
    };
    calendar: {
        day: number;
        month: number;
        year: number;
        events: any[];
    };
    _nextId: Record<string, number>;
}
declare const APP_CONFIG: any;
declare const StorageAPI: any;
declare const log: any;
declare const initIndexedDB: any;
declare const CAMPAIGN_INDEX_KEY: string;
declare function saveCampaignIndex(index: CampaignIndex): void;
declare function deleteCampaign(): Promise<void>;
declare function renderCampaignList(): void;
//# sourceMappingURL=campaign-manager.d.ts.map