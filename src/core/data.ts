import { APP_CONFIG } from './config';
import type { AppData } from '../types';

export const STORAGE_KEY = APP_CONFIG.STORAGE_KEY;

export function initializeData(): AppData {
    return {
        locations: [],
        npcs: [],
        quests: [],
        characters: [],
        sessionNotes: [],
        quickNotes: '',
        initiative: {
            combatants: [],
            currentTurn: 0,
            round: 1
        },
        loot: [],
        encounters: [],
        spells: [],
        links: [],
        wiki: [],
        filters: [],
        mindmap: {
            nodes: [],
            connections: []
        },
        calendar: {
            day: 1,
            month: 0,
            year: 1492,
            events: []
        },
        tags: [],
        settings: {
            theme: 'dark',
            lastView: 'dashboard'
        },
        _nextId: {}
    };
}
