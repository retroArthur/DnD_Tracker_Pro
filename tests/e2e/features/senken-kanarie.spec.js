// @ts-check
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * E2E-Waechter SENKEN — Kanarien-Kampagne (Vertrag SENKEN in docs/bugfixes.md: Regeln
 * R1–R6 und der Nachweis ueber Kanarien).
 *
 * WAS ER PRUEFT: kein Wert aus importierten oder gespeicherten Daten wird je als HTML,
 * als Stil oder als javascript:-Ziel wirksam (Regeln R1–R3), und legitime Inhalte werden
 * dabei weder doppelt kodiert noch entformatiert (R5).
 *
 * KANARIEN STATT NUTZLASTEN: jedes String- und Zahlenblatt jeder Sammlung traegt eine
 * HARMLOSE Kanarie mit eindeutiger id = Pfad (Sammlung.Index.Feld…, z. B.
 * `npcs.0.relations.1.status`, `characters.0.skillProficiencies.SCHLUESSEL`):
 *   - Text/Zahl:        <img src="kanarie-<id>.png" data-kanarie="<id>">
 *   - sonstiger String: "><img src="kanarie-<id>.png" data-kanarie="<id>">   (Attribut-Ausbruch)
 *   - Rich-Text:        Text-Kanarie + [[npcs:1:k" data-kanarie="<id>.marke" x="]]
 *                       + [k](javascript:void('kanarie-<id>.md'))   (parseEntityLinks, Markdown)
 *   - Farbe (color):    red);background-image:url(kanarie-<id>.png);x:("><img …>
 *                       (Stil R2 — auch in var(--…) und class/data-*, Begruendung bei stilKanarie)
 *   - links[0].url:     javascript:void('kanarie-<id>')                     (Schema, R3)
 *   - links[1].url:     https://example.org/"><img …>                       (erlaubtes Schema, R1)
 * Kein Script, kein on*-Handler; die Bilddatei existiert nicht.
 *
 * ERKENNUNG (jede Einschleusung zaehlt, nicht erst eine Ausfuehrung):
 *   (a) ein [data-kanarie] im Dokument (MutationObserver ab Dokumentbeginn, auch fluechtige
 *       Knoten und Attribut-Ausbrueche, bei denen data-kanarie auf dem Wirtselement landet),
 *   (b) eine Anforderung einer kanarie-*.png (page.on('request'), Dateiname exakt — ein
 *       escapter Wert als relative URL ist KEIN Fund); deckt losgeloeste Elemente
 *       (div.innerHTML ausserhalb des Dokuments) und Stil-Einschleusung ab,
 *   (c) href/src/action mit javascript: im Dokument oder window.open damit (window.open ist
 *       ersetzt und oeffnet nie etwas).
 * Grossgeschriebene ids (z. B. ENCOUNTERS.0.SAVINGTHROWS.SCHLUESSEL) zeigen eine Senke, die
 * den Wert vor dem Einsetzen per toUpperCase() veraendert.
 *
 * SAAT: Feldsaetze, wie die Speicherfunktionen der App sie schreiben (abgeleitet aus
 * core/data.js, IO_SCHEMA in systems/spellslots/import-export.js, der Messung am Import
 * (Befund SENKEN, docs/bugfixes.md) und echten Datensaetzen), je Sammlung ZWEI Datensaetze:
 * im ersten bleiben IDs, Verweise (…Id, links[].id/.type, relations[].targetId/-Type) und
 * Kaempfer-/Widget-Typen gueltig, damit Details per Klick aufgehen; im zweiten tragen auch
 * sie eine Kanarie. Dazu im ersten Datensatz GEMISCHTE Verweise (Typ vergiftet, ID gueltig:
 * `<sammlung>.0.links.TYP`, `npcs.0.relations.TYP`) fuer Senken, die erst mit aufloesbarem
 * Ziel zeichnen, und ein sauberer Tag hinter dem vergifteten, damit "Tag anklicken" begehbar
 * bleibt. Abgeglichen mit einer ueber die Oberflaeche angelegten Kampagne (Skeptiker
 * 29.10.: npcs triggers/dialogs, relations-Typen, encounters.savingThrows als Text,
 * randomTables range, DM-Screen-Widget 'tables'; dazu die Laufzeitfelder tempHp/lastRoll
 * der Kaempfer und initiative.battlefield, die keine Speicherfunktion eines Formulars
 * schreibt). Verschachtelt vergiftet: links[], relations[], items[], tags[],
 * attacks[], conditions[], effects[], entries[], szenen[], offeneFaeden[], rufHistorie[],
 * attributes.*, currency.*, speed.*, spellSlots.*; Objekt-SCHLUESSEL in savingThrows,
 * skillProficiencies, saveProficiencies, skillExpertise, currency, attributes, spellSlots,
 * speed, skills, dmScreenProfiles. Nicht vergiftet: settings, _version, _nextId (Steuerung
 * der Oberflaeche, keine Kampagnendaten).
 *
 * EINGAENGE (je per Oberflaeche): Kampagnen-Import (Daten -> "Datei auswaehlen" ->
 * erster Dialog "weitere Optionen", zweiter "Ersetzen"), Backup-Wiederherstellung (Daten ->
 * "Backups anzeigen" -> "Wiederherstellen"; das Backup liegt vorher im localStorage-
 * Rueckfall `dnd-tracker-backups`), Start aus localStorage (Saat vor dem Laden, dazu ein
 * Kampagnen-Index mit Kanarien).
 *
 * FALLSCHNITT: Eingang x Ansichtsgruppe (3 x 5) plus der legitime Gegenfall je Eingang
 * (3) = 18 Faelle. Der Gegenfall laeuft durch DENSELBEN Eingang wie die Kanarien: ein Fix,
 * der nur an einem Eingang zu viel kodiert oder entfernt, faellt dort auf.
 * Ein roter Fall nennt Eingang und Gruppe und listet je Schritt die ausgeloesten ids mit
 * Erkennungsart. Die Renders WAEHREND des Eingangs (renderAll zeichnet alle Ansichten,
 * auch verborgene) zaehlen in der Gruppe "Start"; die uebrigen Gruppen zaehlen nur, was
 * ihre eigenen Klicks ausloesen. Alle 15 Kanarien-Faelle gruen <=> kein Fund in irgendeiner
 * Phase.
 * Ein Weg, der nicht begehbar ist (Element fehlt), ist eine Weg-Luecke und macht den Fall
 * ebenfalls rot — der Waechter darf nicht leer gruen werden.
 *
 * Bedienung ausschliesslich ueber echte Klicks und Tasten (Gruppenmenues der Navigation
 * oeffnen wie navigateToTab in tests/e2e/helpers/test-utils.js); kein switchView, kein
 * Funktionsaufruf aus dem Test.
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const KEY = 'dnd-tracker-v4';
const INDEX_KEY = 'dnd-tracker-campaigns';
const BACKUP_KEY = 'dnd-tracker-backups';

// ---------------------------------------------------------------------------
// Kanarien (Vertrag, Nachtrag 29.10.)
// ---------------------------------------------------------------------------
const textKanarie = id => `<img src="kanarie-${id}.png" data-kanarie="${id}">`;
const attrKanarie = id => `"><img src="kanarie-${id}.png" data-kanarie="${id}">`;
/*
 * Stil-Kanarie (Farbfelder). Strenger als die Grundform `red;background-image:url(…)` des
 * Vertrags, aus zwei gemessenen Gruenden (Skeptiker, Stand e446a9e4):
 *   - `)` vor dem `;`: die Farbe steht auch IN einer Funktion, z. B. `var(--${f.color})`
 *     (locations-render.js). Dort schluckte die Klammer der Funktion das `;` der Grundform,
 *     die Deklaration war ungueltig, es ging keine Anforderung raus — eine rohe Senke blieb
 *     unsichtbar.
 *   - `"><img …>` am Ende: die Farbe steht auch in `class`/`data-*` (tags.js `tag-${t.color}`,
 *     npc-popup.js, initiative.js `color-${e.color}`). Ohne Anfuehrungszeichen bricht die
 *     Grundform dort nie aus — eine rohe Senke blieb ebenfalls unsichtbar.
 * Ergebnis: roh in style -> Ausbruch (dom) und Anforderung (netz); nur esc() in style ->
 * `background-image:url(kanarie-….png)` bleibt eine gueltige Deklaration -> Anforderung (R2
 * verlangt die Formpruefung, esc() allein reicht nicht); roh in class/data-* -> Ausbruch;
 * esc() in class -> kein Fund (harmlos); sichereFarbe() -> kein Fund.
 */
const stilKanarie = id =>
    `red);background-image:url(kanarie-${id}.png);x:("><img src="kanarie-${id}.png" data-kanarie="${id}">`;
const linkKanarie = id => `javascript:void('kanarie-${id}')`;
/*
 * Rich-Text-Kanarie: Bild plus Verknuepfungsmarke plus Markdown-Link. sanitizeHTML() entfernt
 * das Bild, laesst aber Text stehen — und `"` in Text serialisiert der Browser NICHT als
 * `&quot;`. parseEntityLinks() (entity-links.js) setzt den Namen der Marke `[[typ:id:name]]`
 * roh in `title="…"`: auch nach einem vorgelagerten sanitizeHTML() bricht `<id>.marke` dort
 * aus. Der Markdown-Link `[k](javascript:…)` prueft, dass renderMarkdownInContent() kein
 * javascript:-Ziel erzeugt.
 */
const htmlKanarie = id =>
    `${textKanarie(id)} [[npcs:1:k" data-kanarie="${id}.marke" x="]] [k](javascript:void('kanarie-${id}.md'))`;

// ---------------------------------------------------------------------------
// Saat (UNVERGIFTET). Feldsaetze wie die Speicherfunktionen der App: party-crud.js
// saveCharacter, npc-crud.js, quests-crud.js, initiative-loot.js, spell-manager.js,
// wiki-crud.js, links.js, session-prep-crud.js, timeline-crud.js, fraktionen-crud.js,
// sessions.js, bestiary-crud.js, initiative.js, random-tables.js, shops-core.js,
// quick-reference.js, tags.js, soundboard-crud.js, dmscreen-config.js — dazu die
// IO_SCHEMA-Felder (class, ac, location, faction, giver, reward, castingTime, components,
// spellClass, region …) und die Querschnittsfelder avatar, tags, links, relations.
// Gleichzeitig der Grundbestand des legitimen Gegenfalls.
// ---------------------------------------------------------------------------
function charakter(id, name) {
    return {
        id,
        name,
        playerName: 'Arthur',
        characterClass: 'Kaempfer',
        class: 'Kaempfer',
        subclass: 'Champion',
        race: 'Zwerg',
        level: 5,
        xp: 6500,
        background: 'Soldat',
        alignment: 'RG',
        weight: 80,
        height: 140,
        attributes: { str: 16, dex: 12, con: 15, int: 10, wis: 11, cha: 8 },
        saveProficiencies: { str: true, con: true },
        skillProficiencies: { athletics: true, perception: true },
        skillExpertise: { athletics: true },
        hpCurrent: 40,
        hpMax: 44,
        tempHp: 5,
        armorClass: 18,
        initiative: 1,
        speed: '7.5m',
        proficiencyBonus: 3,
        hitDice: '5W10',
        passivePerception: 12,
        inspiration: true,
        attacks: [{ name: 'Axt', attackBonus: 6, damage: '1d8+3', damageType: 'Hieb' }],
        resistances: ['poison'],
        immunities: ['fire'],
        languages: ['common', 'dwarvish'],
        spellSlots: { 1: { max: 2, current: 1 }, 2: { max: 1, current: 1 } },
        currency: { pm: 1, gm: 120, em: 3, sm: 7, km: 9 },
        notes: '<p>Notizen</p>',
        avatar: 'https://example.org/held.png',
        spells: [1],
        items: [{ id: 1, quantity: 1 }],
        conditions: [{ type: 'poisoned', name: 'Vergiftet', addedAt: 1700000000000 }],
        tags: [{ name: 'tank', color: '#a855f7' }],
        links: [{ type: 'npcs', id: 1 }]
    };
}

function npc(id, name) {
    return {
        id,
        name,
        role: 'Buergermeister',
        race: 'Mensch',
        location: 'Hafenstadt',
        faction: 'Handelsgilde',
        locationId: 1,
        chapter: 'Kapitel 1',
        filterId: 1,
        quests: ['Die verlorene Fracht'],
        info: ['reich', 'misstrauisch'],
        relationships: ['Bruder von Vela'],
        description: '<p>Beschreibung</p>',
        // Feldnamen wie npc-crud.js sie schreibt (ueber die Oberflaeche angelegt und verglichen)
        triggers: [{ condition: 'Geld', reveal: 'wird gierig', triggered: false }],
        dialogs: [
            {
                title: 'Begruessung',
                triggerCondition: 'Erstkontakt',
                text: 'Willkommen!',
                used: false
            }
        ],
        factionId: 1,
        // targetType wie das Beziehungen-Modal ihn schreibt: 'npcs' | 'characters' | 'party'
        relations: [
            { targetId: 2, targetType: 'npcs', status: 'friendly', note: 'Schwester' },
            { targetId: 1, targetType: 'characters', status: 'hostile', note: 'Rivale' },
            { targetType: 'party', status: 'neutral', note: 'Auftraggeber' }
        ],
        avatar: 'https://example.org/npc.png',
        tags: [{ name: 'adel', color: '#ef4444' }],
        links: [
            { type: 'quests', id: 1 },
            { type: 'locations', id: 1 },
            { type: 'characters', id: 1 }
        ]
    };
}

function rohKampagne() {
    return {
        _version: '2.6.1',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            enableMarkdownImportExport: true,
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        characters: [charakter(1, 'Thorin'), charakter(2, 'Lia')],
        npcs: [npc(1, 'Alrik'), npc(2, 'Vela')],
        locations: [1, 2].map(id => ({
            id,
            name: 'Hafenstadt',
            type: 'Stadt',
            region: 'Kueste',
            description: '<p>Ort</p>',
            filterId: 1,
            avatar: 'https://example.org/ort.png',
            tags: [{ name: 'kueste', color: '#3b82f6' }],
            links: [{ type: 'npcs', id: 1 }]
        })),
        factions: [1, 2].map(id => ({
            id,
            name: 'Handelsgilde',
            symbol: '⚖',
            agenda: '<p>Agenda</p>',
            beschreibung: '<p>Beschreibung</p>',
            ruf: 12,
            rufHistorie: [
                { datum: 1700000000000, zeitstempel: 1700000000000, delta: 12, grund: 'Fracht' },
                { datum: 1700000000001, zeitstempel: 1700000000001, delta: -3, grund: 'Streit' }
            ],
            mitgliederNpcIds: [1],
            sitzOrtId: 1,
            rivalen: 'Diebe',
            verbuendete: 'Stadtwache',
            links: [{ type: 'npcs', id: 1 }]
        })),
        quests: [1, 2].map(id => ({
            id,
            title: 'Die verlorene Fracht',
            status: 'aktiv',
            giver: 'Alrik',
            giverId: 1,
            giverName: 'Alrik',
            location: 'Turmruine',
            locationId: 2,
            locationName: 'Turmruine',
            targetId: 2,
            targetName: 'Vela',
            type: 'main',
            description: '<p>Quest</p>',
            reward: '250 GM',
            rewardGold: 250,
            rewardItems: [{ id: 1, name: 'Flammenschwert' }],
            rewardOther: 'Gunst des Rates',
            epilog: '<p>Epilog</p>',
            completed: false,
            tracked: true,
            rewardReceived: false,
            createdAt: 1700000000000,
            tags: [{ name: 'haupt', color: '#22c55e' }],
            // encounters: die Vorschau eines Encounters ist eine eigene Senke (entity-links.js,
            // `CR ${entity.cr}`), die das Encounter-Detail nicht mitprueft
            links: [
                { type: 'npcs', id: 1 },
                { type: 'quests', id: 1 },
                { type: 'encounters', id: 1 }
            ]
        })),
        loot: [1, 2].map(id => ({
            id,
            name: 'Flammenschwert',
            type: 'Waffe',
            category: 'weapon',
            rarity: 'rare',
            quantity: 1,
            weight: 3,
            value: 500,
            description: '<p>Brennt</p>',
            origin: 'Drachenhort',
            special: '+1W6 Feuer',
            property: 'Vielseitig',
            tags: ['attunement'],
            attunement: true,
            assignedTo: 'Thorin',
            links: [{ type: 'npcs', id: 1 }]
        })),
        spells: [1, 2].map(id => ({
            id,
            name: 'Feuerball',
            type: 'spell',
            level: 3,
            spellClass: 'Magier',
            spellClasses: ['Magier', 'Hexenmeister'],
            school: 'Hervorrufung',
            time: '1 Aktion',
            castingTime: '1 Aktion',
            range: '45 m',
            components: 'V, G, M',
            duration: 'Sofort',
            ritual: false,
            concentration: true,
            v: true,
            g: true,
            m: true,
            material: 'Fledermausguano',
            description: '<p>Explosion</p>',
            note: '<p>Notiz</p>',
            links: [{ type: 'npcs', id: 1 }]
        })),
        wiki: [
            {
                id: 1,
                title: 'Weltwissen',
                category: 'lore',
                content: '<p>Wurzel</p>',
                tags: ['welt'],
                pinned: true,
                parentId: null,
                createdAt: 1700000000000,
                updatedAt: 1700000000001,
                links: [{ type: 'npcs', id: 1 }]
            },
            {
                id: 2,
                title: 'Goetter',
                category: 'lore',
                content: '<p>Kind</p>',
                tags: ['goetter'],
                pinned: false,
                parentId: 1,
                createdAt: 1700000000002,
                updatedAt: 1700000000003,
                links: [{ type: 'npcs', id: 1 }]
            }
        ],
        links: [
            {
                id: 1,
                title: 'SRD',
                url: 'https://example.org/srd',
                category: 'rules',
                description: '<p>Regeln</p>'
            },
            {
                id: 2,
                title: 'Karte',
                url: 'https://example.org/karte',
                category: 'maps',
                description: '<p>Karte</p>'
            }
        ],
        sessionPreps: [1, 2].map(id => ({
            id,
            titel: 'Vorbereitung',
            strongStart: '<p>Ein Schiff brennt</p>',
            szenen: [{ id: 1, titel: 'Hafen', beschreibung: '<p>Szene</p>', ort: 'Hafenstadt' }],
            geheimeHinweise: '<p>Geheimnis</p>',
            wichtigeNpcs: '<p>Alrik</p>',
            belohnungen: '100 GM',
            sessionNr: 3,
            datum: '2026-10-01',
            inGameDatum: '1. Hammer',
            offeneFaeden: [{ text: 'Die verlorene Fracht', quelleId: 1, quelleTyp: 'quest' }],
            links: [{ type: 'npcs', id: 1 }],
            erstellt: 1700000000000
        })),
        calendar: {
            day: 1,
            month: 1,
            year: 1492,
            events: [1, 2].map(id => ({
                id,
                datum: { tag: 3, monat: 1, jahr: 1492 },
                titel: 'Ankunft im Hafen',
                beschreibung: 'Die Gruppe kommt an',
                typ: 'manuell',
                quelleId: null
            }))
        },
        encounters: [1, 2].map(id => ({
            id,
            name: 'Goblin-Hauptmann',
            type: 'Humanoid',
            creatureType: 'humanoid',
            cr: '1',
            ac: 17,
            init: 2,
            hp: 21,
            speed: { walk: '9', climb: '3', swim: '', fly: '', burrow: '' },
            perception: 9,
            languages: ['common', 'goblin'],
            str: 10,
            dex: 14,
            con: 10,
            int: 10,
            wis: 8,
            cha: 10,
            // Werte als Text, wie das Encounter-Formular sie schreibt (#enc-save-val-*); ein
            // Wahrheitswert liesse die Senke `displayValue = saveData` ungeprueft
            savingThrows: { dex: '+4', wis: '1' },
            resistances: ['fire'],
            immunities: ['poison'],
            conditionImmunities: ['charmed'],
            traits: '<p>Flink</p>',
            equipment: '<p>Kettenhemd</p>',
            actions: '<p>Krummsaebel</p>',
            skills: '<p>Heimlichkeit +6</p>',
            tags: [{ name: 'boss', color: '#f59e0b' }],
            links: [{ type: 'npcs', id: 1 }]
        })),
        sessionNotes: [1, 2].map(id => ({
            id,
            number: id,
            name: 'Sitzung',
            date: '2026-10-01',
            arcId: 1,
            summary: 'Zusammenfassung',
            tags: ['haupt'],
            content: '<p>Inhalt</p>'
        })),
        storyArcs: [1, 2].map(id => ({ id, name: 'Hafen-Arc', color: '#d4af37', order: id })),
        bestiary: [1, 2].map(id => ({
            id,
            name: 'Sumpfschrat',
            source: 'custom',
            size: 'Mittelgroß',
            creatureType: 'Humanoid',
            alignment: 'neutral boese',
            cr: '2',
            xp: 450,
            ac: 13,
            acInfo: 'natuerliche Ruestung',
            hp: 30,
            hpFormula: '4W8+12',
            speed: { walk: '9 m', swim: '6 m', climb: '3 m', fly: '12 m', burrow: '1,5 m' },
            str: 14,
            dex: 12,
            con: 16,
            int: 6,
            wis: 10,
            cha: 8,
            savingThrows: { con: '+5' },
            skills: { stealth: '+3' },
            damageResistances: ['Gift'],
            damageImmunities: ['Feuer'],
            conditionImmunities: ['Vergiftet'],
            senses: ['Dunkelsicht 18 m'],
            languages: ['Gemeinsprache'],
            traits: '<p>Schleim</p>',
            actions: '<p>Biss</p>',
            reactions: '<p>Ausweichen</p>',
            legendaryActions: '<p>Legende</p>',
            legendaryActionsPerRound: 1,
            avatar: 'https://example.org/schrat.png'
        })),
        bestiaryFavorites: ['custom:1', 'goblin'],
        initiative: {
            combatants: [1, 2].map(id => ({
                id,
                name: 'Thorin',
                initiative: 15,
                initBonus: 1,
                maxHp: 44,
                currentHp: 0,
                // tempHp und lastRoll stehen NICHT in der Datengrenze und gehen roh in die Zeile
                // (initiative.js `(+${cb.tempHp})`, `title="Letzter Wurf: ${cb.lastRoll}"`)
                tempHp: 3,
                lastRoll: 14,
                cr: '1/4',
                xp: 50,
                ac: 18,
                type: 'player',
                effects: [
                    {
                        id: 1,
                        name: 'Gesegnet',
                        duration: 10,
                        permanent: false,
                        color: 'yellow',
                        description: 'Segen'
                    }
                ],
                concentration: { active: true, spell: 'Segen', lastDC: 10, pendingCheck: 12 },
                deathSaves: { successes: 1, failures: 1 },
                legendaryActions: { max: 3, remaining: 2 },
                legendaryResistance: { max: 3, remaining: 1 }
            })),
            currentTurn: 0,
            round: 2,
            // Banner der Kampfbedingungen, wie der Encounter-Rechner ihn schreibt
            // (encounter-calculator.js) und initiative.js ihn roh zeichnet
            battlefield: {
                terrain: 'difficult',
                terrainLabel: 'Schwieriges Gelaende',
                terrainIcon: '🪨',
                terrainMod: 1.25,
                hasLair: true,
                finalXP: 450,
                difficulty: 'Mittel'
            }
        },
        randomTables: [1, 2].map(id => ({
            id,
            name: 'Wetter',
            icon: '🌦',
            // Bereichsformat, wie random-tables.js es heute schreibt (diceType als Zahl, range
            // als Text); weight bleibt fuer das Altformat stehen
            diceType: 6,
            entries: [
                { range: '1-3', weight: 1, text: 'Regen' },
                { range: '4-6', weight: 2, text: 'Sonne' }
            ]
        })),
        shops: [1, 2].map(id => ({
            id,
            type: 'laden',
            name: 'Schmiede',
            npcId: 1,
            locationId: 1,
            description: 'Heisse Esse',
            special: 'Rabatt',
            note: 'Haendlernotiz',
            items: [
                {
                    unlimited: false,
                    quantity: 2,
                    category: 'weapon',
                    name: 'Langschwert',
                    type: 'Kriegswaffe',
                    weight: '1,5 kg',
                    cost: '15 GM',
                    special: 'scharf',
                    note: 'Notiz',
                    damage: '1W8',
                    properties: 'Vielseitig',
                    mastery: 'Sap'
                },
                {
                    unlimited: false,
                    quantity: 1,
                    category: 'armor',
                    name: 'Kettenhemd',
                    type: 'Schwer',
                    weight: '25 kg',
                    cost: '75 GM',
                    ac: '16',
                    strength: '13',
                    stealth: 'Nachteil'
                },
                {
                    unlimited: true,
                    quantity: null,
                    category: 'potion',
                    name: 'Heiltrank',
                    type: 'Trank',
                    cost: '50 GM',
                    description: 'Heilt 2W4+2',
                    effect: 'Heilung'
                }
            ]
        })),
        quickRefCustom: [1, 2].map(id => ({
            id,
            title: 'Hausregel',
            content: '<p>Kritische Treffer</p>',
            expanded: true
        })),
        filters: [1, 2].map(id => ({ id, name: 'Kueste', color: '#3b82f6' })),
        tags: [
            { name: 'kueste', color: '#3b82f6' },
            { name: 'adel', color: '#ef4444' }
        ],
        soundboard: {
            scenes: [1, 2].map(id => ({
                id: 'scene_' + id,
                name: 'Taverne',
                slot: id,
                tracks: [{ blobId: 'audio_' + id, volume: 0.8 }]
            }))
        },
        dmScreenProfiles: {
            custom_1: {
                name: 'Mein Profil',
                icon: '💾',
                widgets: [{ id: 'party-1', type: 'party', visible: true }]
            }
        },
        // Alle Daten-Widgets mit den Typnamen aus getDMScreenWidgets() (dmscreen-render.js).
        // 'random' gibt es dort nicht — das Tabellen-Widget heisst 'tables' und setzt
        // `${t.icon}` roh (dmscreen-widgets-base.js).
        dmScreenLayout: {
            widgets: [
                'party',
                'initiative',
                'dice',
                'conditions',
                'dc',
                'tables',
                'rules',
                'notes'
            ].map(typ => ({ id: typ + '-1', type: typ, visible: true }))
        },
        dmScreenActiveProfile: 'custom_1',
        dmScreenNotes: 'DM-Notiz',
        monsterFavorites: [1, 2].map(id => ({
            id,
            name: 'Goblin-Trupp',
            monsters: [{ cr: '1/4', count: 4, name: 'Goblin' }]
        })),
        sessionHistory: [{ date: '2026-10-01T18:00:00.000Z', duration: 7200 }],
        diceHistory: [{ dice: 'd20', result: 17, timestamp: 1700000000000 }],
        wikiRecentlyViewed: [1, 2],
        quickNotes: 'Schnellnotiz',
        partyGold: 100,
        timers: [
            { id: 1, name: 'Fackel', totalSeconds: 3600, remainingSeconds: 3000, running: false }
        ],
        campaign: {},
        mindmap: { nodes: [], connections: [] },
        _nextId: {
            characters: 3,
            npcs: 3,
            locations: 3,
            quests: 3,
            encounters: 3,
            spells: 3,
            loot: 3,
            items: 1,
            wiki: 3,
            links: 3,
            sessionNotes: 3,
            randomTables: 3,
            filters: 3,
            factions: 3,
            sessionPreps: 3,
            calendarEvents: 3,
            bestiary: 3,
            shops: 3,
            quickRefCustom: 3,
            combatants: 3
        }
    };
}

// Nicht vergiftet: App-Einstellungen und Verwaltung (keine Kampagnendaten). `settings`
// steuert die Oberflaeche selbst (lastView, Layout, Theme) — eine Kanarie dort testet
// keine Senke, sondern legt die Navigation lahm.
const NICHT_VERGIFTEN = new Set(['_version', '_nextId', 'settings']);
// Rich-Text-Felder (sanitizeHTML-Pfad): Text-Kanarie.
const HTML_FELDER = new Set([
    'notes',
    'description',
    'content',
    'traits',
    'actions',
    'reactions',
    'legendaryActions',
    'equipment',
    'agenda',
    'beschreibung',
    'strongStart',
    'geheimeHinweise',
    'wichtigeNpcs',
    'epilog'
]);
// Sammlungen, die nicht direkt unter D liegen: Index der Datensatz-Stufe ist 2 statt 1.
const VERSCHACHTELT = new Set(['initiative', 'calendar', 'soundboard']);

/**
 * Strukturfelder (IDs, Verweise, Verknuepfungs-Typ) bleiben im ERSTEN Datensatz jeder
 * Sammlung gueltig, damit Details per Klick aufgehen und Verweise aufloesen. Im ZWEITEN
 * Datensatz tragen auch sie eine Kanarie — so ist jedes Blatt mindestens einmal vergiftet.
 */
function istStruktur(teile) {
    const k = teile[teile.length - 1];
    const eltern = teile[teile.length - 2];
    const grosseltern = teile[teile.length - 3];
    // DM-Screen-Layout ist keine Sammlung, also gaebe es keinen "zweiten Datensatz": ohne
    // diese Regel bliebe jede Widget-ID unvergiftet (Senke data-widget-id/data-widget in
    // dmscreen-render.js und dmscreen-config.js). Typ immer gueltig (ein unbekannter Typ wird
    // gar nicht gezeichnet), ID gueltig nur im ersten Widget.
    if (teile[0] === 'dmScreenLayout') {
        if (k === 'type') return true;
        if (k === 'id') return teile[2] === '0';
    }
    if (k === 'id' || k === 'targetType' || /Id$/.test(k)) return true;
    if (grosseltern === 'links' && k === 'type') return true;
    if (
        /^\d+$/.test(k) &&
        ['mitgliederNpcIds', 'wikiRecentlyViewed', 'bestiaryFavorites'].includes(eltern)
    ) {
        return true;
    }
    if (teile[0] === 'characters' && eltern === 'spells') return true;
    // Klassenwert des Kartenelements: als Kanarie bricht er das class-Attribut auf und nimmt
    // data-spell-id mit — die Karte waere vor dem Fix nicht mehr aufklappbar. Datensatz 1
    // traegt die Kanarie (spell-manager.js: class="spell-card ${type}").
    if (teile[0] === 'spells' && k === 'type') return true;
    if (teile[0] === 'initiative' && k === 'type') return true;
    if (teile[0] === 'dmScreenActiveProfile') return true;
    return false;
}

/**
 * Vergiftet jedes String- und Zahlenblatt mit einer Kanarie passend zum Kontext; die id ist
 * der Pfad (Sammlung.Index.Feld…). Dazu Kanarien als Objekt-SCHLUESSEL in den Maps, deren
 * Schluessel gerendert werden. Liefert {daten, ids}.
 */
function vergiften(roh) {
    const ids = [];
    const kanarie = (teile, wert) => {
        const id = teile.join('.');
        const k = teile[teile.length - 1];
        ids.push(id);
        if (typeof wert === 'number') return textKanarie(id);
        if (k === 'color') return stilKanarie(id);
        if (k === 'url') {
            // Datensatz 0: Schema-Kanarie (R3); Datensatz 1: erlaubtes Schema, Attribut-Ausbruch (R1)
            return teile[1] === '0' ? linkKanarie(id) : 'https://example.org/' + attrKanarie(id);
        }
        if (HTML_FELDER.has(k) || (teile[0] === 'spells' && k === 'note')) return htmlKanarie(id);
        return attrKanarie(id);
    };
    const geh = (knoten, teile) => {
        for (const k of Object.keys(knoten)) {
            if (teile.length === 0 && NICHT_VERGIFTEN.has(k)) continue;
            const pfad = teile.concat(String(k));
            const wert = knoten[k];
            const stufe = VERSCHACHTELT.has(pfad[0]) ? 2 : 1;
            const istSammlung = /^\d+$/.test(pfad[stufe] || '');
            const ersterOderEinzel = !istSammlung || pfad[stufe] === '0';
            if (typeof wert === 'string' || typeof wert === 'number') {
                if (ersterOderEinzel && istStruktur(pfad)) continue;
                knoten[k] = kanarie(pfad, wert);
            } else if (wert && typeof wert === 'object') {
                geh(wert, pfad);
            }
        }
    };
    geh(roh, []);
    // Gemischte Verweise im ERSTEN Datensatz: Typ vergiftet, ID gueltig. Im zweiten Datensatz
    // sind beide vergiftet — dort verwirft die Datengrenze die ID, und die Senken, die erst
    // mit einem aufloesbaren Ziel zeichnen (npc-render.js Beziehungen: jeder Typ ausser
    // 'characters'/'party' landet im NPC-Zweig), blieben stumm. Die Verknuepfungsleiste und
    // das Verknuepfungs-Modal (entity-links.js) zeichnen auch ohne Ziel.
    for (const s of Object.keys(roh)) {
        const satz = Array.isArray(roh[s]) ? roh[s][0] : null;
        if (!satz) continue;
        if (Array.isArray(satz.links)) {
            const id = `${s}.0.links.TYP`;
            ids.push(id);
            satz.links.push({ type: attrKanarie(id), id: 1 });
        }
        // Die Farb-Kanarie bricht aus dem class-Attribut des Tags aus und nimmt dessen
        // data-action mit; ein sauberer Tag dahinter haelt den Weg "Tag anklicken" begehbar
        if (Array.isArray(satz.tags) && satz.tags.some(t => t && typeof t === 'object')) {
            satz.tags.push({ name: 'sauber', color: 'gold' });
        }
    }
    ids.push('npcs.0.relations.TYP');
    roh.npcs[0].relations.push({
        targetId: 2,
        targetType: attrKanarie('npcs.0.relations.TYP'),
        status: 'neutral',
        note: 'gemischt'
    });
    // Verweis per NAME: der erste Kaempfer heisst wie der erste Held (EntityLookup.findByName),
    // sonst fehlt der Klick auf den Namen (Vorschau) und die Zauberplaetze im Kampf.
    roh.initiative.combatants[0].name = roh.characters[0].name;
    const schluessel = [
        ['characters', 0, 'skillProficiencies', true],
        ['characters', 0, 'saveProficiencies', true],
        ['characters', 0, 'skillExpertise', true],
        ['characters', 0, 'currency', 5],
        ['characters', 0, 'attributes', 12],
        ['characters', 0, 'spellSlots', { max: 1, current: 1 }],
        ['encounters', 0, 'speed', '9'],
        ['encounters', 0, 'savingThrows', true],
        ['bestiary', 0, 'speed', '9 m'],
        ['bestiary', 0, 'savingThrows', '+2'],
        ['bestiary', 0, 'skills', '+2']
    ];
    for (const [s, i, feld, wert] of schluessel) {
        const id = `${s}.${i}.${feld}.SCHLUESSEL`;
        ids.push(id);
        roh[s][i][feld][attrKanarie(id)] = wert;
    }
    ids.push('dmScreenProfiles.SCHLUESSEL');
    roh.dmScreenProfiles[attrKanarie('dmScreenProfiles.SCHLUESSEL')] = {
        name: 'Profil',
        icon: 'P',
        widgets: [{ id: 'party-2', type: 'party', visible: true }]
    };
    return { daten: roh, ids };
}

/** Kampagnen-Index mit Kanarien (Teil des localStorage-Starts). */
function kanarienIndex() {
    return {
        campaigns: [
            {
                key: attrKanarie('campaignIndex.campaigns.0.key'),
                name: attrKanarie('campaignIndex.campaigns.0.name'),
                created: textKanarie('campaignIndex.campaigns.0.created')
            }
        ],
        active: KEY
    };
}

/** Saubere laufende Kampagne vor Import bzw. Wiederherstellung (Muster CLEAN_SESSION_SEED). */
function saubereKampagne() {
    return {
        _version: '2.6.1',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            enableMarkdownImportExport: true,
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        characters: [{ id: 1, name: 'Vorher', hpCurrent: 10, hpMax: 10, level: 1 }],
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        _nextId: {
            characters: 2,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

// ---------------------------------------------------------------------------
// Erkennung im Seitenkontext — laeuft vor jedem Skript der App (addInitScript).
// (a) [data-kanarie] im Dokument, (c) href/src/action mit javascript: oder window.open
// damit. Jeder Fund traegt die Phase (Eingang bzw. Schritt), in der er auftrat. Funde und
// Phase liegen zusaetzlich im sessionStorage des Tabs: laedt ein Eingang die Seite neu
// (location.reload nach Import/Wiederherstellung), gehen weder die Funde davor verloren noch
// faellt die Phase auf den Startwert zurueck.
// ---------------------------------------------------------------------------
function erkennungInstallieren(startPhase) {
    const lies = (schluessel, ersatz) => {
        try {
            const roh = sessionStorage.getItem(schluessel);
            return roh === null ? ersatz : JSON.parse(roh);
        } catch {
            return ersatz;
        }
    };
    const schreib = (schluessel, wert) => {
        try {
            sessionStorage.setItem(schluessel, JSON.stringify(wert));
        } catch {
            // ohne Speicher bleibt die Erkennung im Fenster gueltig
        }
    };
    const funde = lies('kanarie-funde', []);
    const k = {
        _phase: lies('kanarie-phase', startPhase),
        get phase() {
            return this._phase;
        },
        set phase(p) {
            this._phase = p;
            schreib('kanarie-phase', p);
        },
        funde
    };
    // @ts-ignore
    window.__kanarie = k;
    const idAus = s => {
        const m = /kanarie-([A-Za-z0-9._-]+)/i.exec(String(s));
        return m ? m[1].replace(/\.png$/i, '') : '(ohne id)';
    };
    const melde = (id, art) => {
        k.funde.push({ id, art, phase: k.phase });
        schreib('kanarie-funde', k.funde);
    };
    // Der URL-Parser ignoriert fuehrende Steuer-/Leerzeichen (<= U+0020) und Tab/Zeilenumbruch
    // im Schema — genauso hier, sonst entginge " javascript:" der Erkennung
    const istJs = v => {
        const t = String(v || '').replace(/[\t\n\r]/g, '');
        let i = 0;
        while (i < t.length && t.charCodeAt(i) <= 0x20) i++;
        return /^javascript:/i.test(t.slice(i));
    };
    const pruefe = el => {
        if (!el || el.nodeType !== 1) return;
        const liste = [
            el,
            ...el.querySelectorAll('[data-kanarie],[href],[src],[action],[formaction]')
        ];
        for (const e of liste) {
            if (e.hasAttribute('data-kanarie')) {
                melde(e.getAttribute('data-kanarie'), 'dom:' + e.tagName.toLowerCase());
            }
            for (const a of ['href', 'src', 'action', 'formaction']) {
                const v = e.getAttribute(a);
                if (v !== null && istJs(v))
                    melde(idAus(v), 'js-url:' + e.tagName.toLowerCase() + '@' + a);
            }
        }
    };
    new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === 'childList') m.addedNodes.forEach(pruefe);
            else pruefe(m.target);
        }
    }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-kanarie', 'href', 'src', 'action', 'formaction']
    });
    // window.open: nie wirklich oeffnen; ein javascript:-Ziel ist ein Fund
    window.open = function (url) {
        const s = String(url || '');
        if (istJs(s) || /kanarie/i.test(s)) melde(idAus(s), 'window.open');
        return null;
    };
}

// ---------------------------------------------------------------------------
// Eingaenge
// ---------------------------------------------------------------------------
const EINGAENGE = {
    import: 'Kampagnen-Import (Daten -> Datei auswaehlen -> Ersetzen)',
    backup: 'Backup-Wiederherstellung (Daten -> Backups anzeigen -> Wiederherstellen)',
    start: 'Start aus localStorage (Saat vor dem Laden)'
};

/**
 * Richtet Erkennung, Dialoge und Saat ein, laedt die App und spielt den Eingang ueber die
 * Oberflaeche ein. Liefert den Kontext fuer die Schritte. Ohne `opt` die Kanarien-Kampagne
 * samt Kanarien-Index; der Gegenfall gibt legitime Daten und keinen Index mit.
 * @param {import('@playwright/test').Page} page
 * @param {'import'|'backup'|'start'} eingang
 * @param {{daten?: object, index?: object|null, kampagnenName?: string}} [opt]
 */
async function eingangSpielen(page, eingang, opt = {}) {
    const daten = opt.daten || vergiften(rohKampagne()).daten;
    const index = opt.index === undefined ? kanarienIndex() : opt.index;
    const kampagnenName = opt.kampagnenName || attrKanarie('_campaignName');
    const ctx = {
        phase: eingang === 'start' ? 'Eingang' : 'Vorlauf',
        netz: [],
        fehler: [],
        luecken: [],
        dialoge: [],
        /** @type {string[]} */
        dialogPlan: []
    };
    page.on('pageerror', e => ctx.fehler.push(String(e).split('\n')[0].slice(0, 200)));
    page.on('request', req => {
        const letzte = req.url().split(/[/\\]/).pop() || '';
        let datei = letzte;
        try {
            datei = decodeURIComponent(letzte);
        } catch {
            // unlesbare Kodierung: roh vergleichen
        }
        const m = /^kanarie-(.+)\.png$/i.exec(datei);
        if (m) ctx.netz.push({ id: m[1], art: 'netz:png', phase: ctx.phase });
    });
    // Bestaetigungen nach Plan (Import: erst "weitere Optionen", dann "Ersetzen"),
    // sonst abbrechen; Hinweise (alert) bestaetigen
    page.on('dialog', d => {
        ctx.dialoge.push(d.type() + ': ' + d.message().split('\n')[0].slice(0, 80));
        if (d.type() === 'confirm') {
            const plan = ctx.dialogPlan.length ? ctx.dialogPlan.shift() : 'dismiss';
            return (plan === 'accept' ? d.accept() : d.dismiss()).catch(() => {});
        }
        return d.accept().catch(() => {});
    });
    await page.addInitScript(erkennungInstallieren, ctx.phase);
    const lokal = {};
    if (eingang === 'start') {
        lokal[KEY] = JSON.stringify(daten);
        if (index) lokal[INDEX_KEY] = JSON.stringify(index);
    } else {
        lokal[KEY] = JSON.stringify(saubereKampagne());
    }
    if (eingang === 'backup') {
        lokal[BACKUP_KEY] = JSON.stringify([
            {
                timestamp: 1767225600000,
                campaignKey: KEY,
                data: JSON.stringify(daten),
                kind: 'auto'
            }
        ]);
    }
    // Saat nur beim ersten Laden des Tabs (ein spaeterer Reload behaelt den Stand)
    await page.addInitScript(eintraege => {
        try {
            if (sessionStorage.getItem('kanarie-saat')) return;
            sessionStorage.setItem('kanarie-saat', '1');
            for (const [k, v] of Object.entries(eintraege)) localStorage.setItem(k, v);
            localStorage.setItem('dnd-tracker-v4_ts', String(Date.now()));
        } catch {
            // file://-Speicher gesperrt: der Test meldet dann fehlende Wege
        }
    }, lokal);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(300);

    if (eingang === 'import') {
        await phaseSetzen(page, ctx, 'Eingang');
        await zuReiter(page, 'data');
        ctx.dialogPlan = ['dismiss', 'accept'];
        const datei = Object.assign({ _campaignName: kampagnenName }, daten);
        const [waehler] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.locator('[data-action="trigger-click"][data-value="import-file"]').click()
        ]);
        await waehler.setFiles({
            name: 'kanarien-kampagne.json',
            mimeType: 'application/json',
            buffer: Buffer.from(JSON.stringify(datei))
        });
        await logAbwarten(page, 'Import OK');
    } else if (eingang === 'backup') {
        await phaseSetzen(page, ctx, 'Eingang');
        await zuReiter(page, 'data');
        await page.locator('[data-action="call"][data-value="showBackupsModal"]').click();
        ctx.dialogPlan = ['accept'];
        await page.locator('#backups-list [data-action="restore-backup"]').first().click();
        await logAbwarten(page, 'Backup wiederhergestellt');
        await schliessen(page);
    }
    await page.waitForTimeout(600);
    // Nicht-Vakuitaet: die Kanarien-Kampagne ist wirklich angekommen (je zwei Datensaetze)
    const bestand = await page.evaluate(() =>
        ['characters', 'npcs', 'quests', 'spells', 'shops', 'wiki'].map(
            // @ts-ignore
            k => (window.D[k] || []).length
        )
    );
    if (bestand.join('/') !== '2/2/2/2/2/2') {
        ctx.luecken.push(`Eingang nicht angekommen: Bestand ${bestand.join('/')} statt je 2`);
    }
    return ctx;
}

/** Wartet auf einen Eintrag im Kampfprotokoll (der Ringpuffer verliert keine Meldung). */
async function logAbwarten(page, text) {
    await page.waitForFunction(
        t =>
            (typeof window.getCombatLog === 'function' ? window.getCombatLog() : []).some(e =>
                String(e.text).includes(t)
            ),
        text,
        { timeout: 15000 }
    );
}

async function phaseSetzen(page, ctx, name) {
    ctx.phase = name;
    await page.evaluate(p => {
        // @ts-ignore
        window.__kanarie.phase = p;
    }, name);
}

// ---------------------------------------------------------------------------
// Bedienung — nur echte Klicks und Tasten
// ---------------------------------------------------------------------------
/** Reiter per Klick; liegt er in einem geschlossenen Gruppenmenue, erst die Gruppe oeffnen. */
async function zuReiter(page, ansicht) {
    const tab = page.locator(`.nav-tab[data-view="${ansicht}"]`).first();
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
    }
    await tab.click();
    await page.waitForTimeout(350);
}

/** Klickt das erste SICHTBARE Element zum Selektor (wirft, wenn es keins gibt). */
async function klick(page, selektor, opt = {}) {
    const ziel = page
        .locator(selektor)
        .filter({ visible: true })
        .nth(opt.nr || 0);
    try {
        await ziel.click({ timeout: 2500 });
    } catch (e) {
        const anzahl = await page.locator(selektor).count();
        throw new Error(
            `kein bedienbares ${selektor} (${anzahl} im DOM): ${String(e.message).split('\n')[0]}`
        );
    }
    await page.waitForTimeout(opt.warte ?? 300);
}

/**
 * Raeumt nach einem Schritt auf: solange ein Dialog offen ist, Escape (hoechstens viermal).
 * Ein offen gebliebener Dialog finge sonst den naechsten Klick ab.
 */
async function aufraeumen(page) {
    for (let i = 0; i < 4; i++) {
        const offen = await page
            .locator(
                '.modal-overlay.show, .modal-overlay.active, .modal.show, .npc-popup.show, .cp-overlay.open'
            )
            .filter({ visible: true })
            .count();
        if (!offen) return;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
    }
}

/** Schliesst das zuletzt geoeffnete Overlay (Escape, Vertrag ui/modal-focus.js). */
async function schliessen(page, mal = 1) {
    for (let i = 0; i < mal; i++) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(120);
    }
}

async function tippen(page, selektor, text) {
    const feld = page.locator(selektor).filter({ visible: true }).first();
    try {
        await feld.fill('', { timeout: 2500 });
        await feld.pressSequentially(text, { delay: 10, timeout: 2500 });
    } catch (e) {
        throw new Error(`kein Eingabefeld ${selektor}: ${String(e.message).split('\n')[0]}`);
    }
    await page.waitForTimeout(450);
}

// ---------------------------------------------------------------------------
// Ansichtsgruppen: je Schritt Name + Weg. Ein Schritt, dessen Weg nicht begehbar ist,
// wird als Weg-Luecke gemeldet (der Waechter darf nicht leer gruen werden).
// ---------------------------------------------------------------------------
const GRUPPEN = [
    {
        kuerzel: 'start',
        name: 'Start, Daten und DM-Screen (inkl. aller Renders beim Eingang)',
        mitEingang: true,
        schritte: [
            ['Dashboard', async p => zuReiter(p, 'dashboard')],
            [
                'Daten: Kampagnenliste und Backups',
                async p => {
                    await zuReiter(p, 'data');
                    await klick(p, '[data-action="call"][data-value="showBackupsModal"]');
                    await schliessen(p);
                }
            ],
            [
                'DM-Screen mit Profilen und Konfiguration',
                async p => {
                    await zuReiter(p, 'dmscreen');
                    await klick(p, '[data-action="dms-toggle-profiles"]');
                    await klick(p, '[data-action="dms-toggle-config"]');
                }
            ],
            ['Timer', async p => zuReiter(p, 'timers')],
            ['Soundboard', async p => zuReiter(p, 'soundboard')],
            ['Statistiken', async p => zuReiter(p, 'dicestats')]
        ]
    },
    {
        kuerzel: 'charaktere',
        name: 'Charaktere (Party, NPCs, Fraktionen)',
        schritte: [
            ['Party: Heldenkarten', async p => zuReiter(p, 'party')],
            [
                'Party: Detail-Modal des Helden',
                async p => {
                    await klick(p, '#view-party [data-action="show-char-details"]');
                    await schliessen(p);
                }
            ],
            [
                'Party: Zustaende, HP-Rechner, Zauber und Gegenstaende zuweisen',
                async p => {
                    await klick(p, '#view-party [data-action="show-conditions-modal"]');
                    await schliessen(p);
                    await klick(p, '#view-party [data-action="show-hp-calculator"]');
                    await schliessen(p);
                    await klick(p, '#view-party [data-action="show-assign-spells"]');
                    await schliessen(p);
                    await klick(p, '#view-party [data-action="show-assign-items"]');
                    await schliessen(p);
                }
            ],
            [
                'Party: Vorschau von Zauber und Gegenstand',
                async p => {
                    await klick(
                        p,
                        '#view-party [data-action="navigate-entity-stop"][data-type="spells"]'
                    );
                    await schliessen(p);
                    await klick(
                        p,
                        '#view-party [data-action="navigate-entity-stop"][data-type="loot"]'
                    );
                    await schliessen(p);
                }
            ],
            [
                'Party: Rast-Modal und Bearbeiten-Formular',
                async p => {
                    await klick(p, '#view-party [data-action="show-rest-modal"]');
                    await schliessen(p);
                    await klick(p, '#view-party [data-action="edit-char"]');
                    await klick(p, '[data-action="call"][data-value="cancelCharEdit"]');
                }
            ],
            ['NPCs: Liste', async p => zuReiter(p, 'npcs')],
            [
                'NPCs: Detail, Dialoge, Ausloeser',
                async p => {
                    await klick(p, '#view-npcs [data-action="select-npc"]');
                    await klick(p, '#view-npcs [data-action="toggle-npc-dialog-stop"]');
                    await klick(p, '#view-npcs [data-action="toggle-npc-trigger-stop"]');
                }
            ],
            [
                'NPCs: Beziehungen-Modal',
                async p => {
                    await klick(p, '#view-npcs [data-action="show-relations-modal-stop"]');
                    await schliessen(p);
                }
            ],
            [
                'NPCs: Vorschau der Beziehungsziele (NPC, Held)',
                async p => {
                    for (const typ of ['npcs', 'characters']) {
                        await klick(
                            p,
                            `#npc-detail-panel [data-action="navigate-entity-stop"][data-type="${typ}"]`
                        );
                        await schliessen(p);
                    }
                }
            ],
            [
                'NPCs: Verknuepfungen- und Tag-Modal',
                async p => {
                    await klick(p, '#view-npcs [data-action="show-entity-links-modal"]');
                    await schliessen(p);
                    await klick(p, '#view-npcs [data-action="show-tags-modal"]');
                    await schliessen(p);
                }
            ],
            [
                'NPC-Popup (aus der Orts-Ansicht)',
                async p => {
                    await zuReiter(p, 'locations');
                    await klick(p, '#view-locations [data-action="select-location"]');
                    await klick(p, '[data-action="show-npc-popup"]');
                    await schliessen(p);
                }
            ],
            [
                'Fraktionen: Liste, Detail, Bearbeiten',
                async p => {
                    await zuReiter(p, 'fraktionen');
                    await klick(p, '#view-fraktionen [data-action="select-fraktion"]');
                    await klick(p, '#view-fraktionen [data-action="edit-fraktion"]');
                    await schliessen(p);
                }
            ]
        ]
    },
    {
        kuerzel: 'welt-kampf',
        name: 'Welt und Kampf (Orte, Kalender, Zeitleiste, Reise, Quests, Initiative, Encounter, Bestiar)',
        schritte: [
            [
                'Orte: Detail und Verknuepfungs-Vorschau',
                async p => {
                    await zuReiter(p, 'locations');
                    await klick(p, '#view-locations [data-action="select-location"]');
                    await klick(p, '#view-locations [data-action="show-entity-links-modal"]');
                    await klick(p, '.modal-overlay.show [data-action="navigate-entity-stop"]');
                    await schliessen(p, 2);
                }
            ],
            [
                'Kalender und Zeitleiste mit Ereignis-Modal',
                async p => {
                    await zuReiter(p, 'kalender');
                    await klick(p, '#view-kalender [data-action="show-timeline-modal"]');
                    await schliessen(p);
                }
            ],
            ['Reise', async p => zuReiter(p, 'reise')],
            [
                'Quests: aufklappen und Verknuepfungs-Vorschau',
                async p => {
                    await zuReiter(p, 'quests');
                    // Auf den Titel klicken: die Kopfzeile traegt eigene Knoepfe (Auftraggeber, Status)
                    await klick(p, '#view-quests .quest-header .quest-title');
                    // encounters: Vorschau-Zweig mit `CR ${entity.cr}` (entity-links.js)
                    for (const typ of ['quests', 'npcs', 'encounters']) {
                        await klick(
                            p,
                            `#view-quests .quest-details [data-action="navigate-entity-stop"][data-type="${typ}"]`
                        );
                        await schliessen(p);
                    }
                    await klick(p, '#view-quests [data-action="show-entities-with-tag-stop"]');
                    await schliessen(p);
                }
            ],
            [
                'Initiative: Kaempfer, Effekte, Konzentration, Todesrettungen',
                async p => {
                    await zuReiter(p, 'initiative');
                    await klick(p, '#view-initiative [data-action="navigate-entity-stop"]');
                    await schliessen(p);
                    await klick(
                        p,
                        '#view-initiative [data-action="roll-concentration-check-stop"]'
                    );
                    await klick(p, '#view-initiative [data-action="show-add-effect"]');
                    await schliessen(p);
                    await klick(p, '#view-initiative [data-action="break-concentration-stop"]');
                    await klick(
                        p,
                        '#view-initiative [data-action="show-concentration-modal-stop"]'
                    );
                    await schliessen(p);
                }
            ],
            [
                'Initiative: Statblock, HP-Rechner, Flaechenschaden, Zustands-Referenz',
                async p => {
                    await klick(p, '#view-initiative [data-action="show-init-statblock"]');
                    await schliessen(p);
                    await klick(p, '#view-initiative [data-action="show-hp-calculator"]');
                    await schliessen(p);
                    await klick(p, '#view-initiative [data-action="show-aoe-damage-modal"]');
                    await schliessen(p);
                    await klick(p, '#view-initiative [data-action="show-condition-reference"]');
                    await schliessen(p);
                }
            ],
            [
                'Encounter: Detail und Rechner',
                async p => {
                    await zuReiter(p, 'encounter');
                    await klick(p, '#view-encounter [data-action="select-encounter"]');
                    await klick(
                        p,
                        '#view-encounter [data-action="call"][data-value="showCalculatorModal"]'
                    );
                    await schliessen(p);
                }
            ],
            [
                'Bestiar: eigene Kreatur',
                async p => {
                    await zuReiter(p, 'bestiary');
                    await klick(
                        p,
                        '#view-bestiary [data-action="bestiary-select"]:not([data-source="srd"])'
                    );
                }
            ]
        ]
    },
    {
        kuerzel: 'inhalte',
        name: 'Inhalte (Wiki, Notizen, Story-Arcs, Notizen-Suche, Zauber, Truhe, Shops, Links, Zufallstabellen, Schnellreferenz)',
        schritte: [
            [
                'Wiki: Eintrag und Brotkrumen',
                async p => {
                    await zuReiter(p, 'wiki');
                    await klick(
                        p,
                        '#view-wiki [data-action="call"][data-value="expandAllWikiCategories"]'
                    );
                    await klick(p, '#view-wiki [data-action="select-wiki-entry"][data-id="2"]');
                    await klick(p, '#view-wiki [data-action="select-wiki-entry"][data-id="1"]');
                }
            ],
            [
                'Notizen: Sitzung aufklappen',
                async p => {
                    await zuReiter(p, 'notes');
                    await klick(p, '#view-notes [data-action="toggle-session-content"]');
                }
            ],
            [
                'Notizen: Story-Arc-Verwaltung',
                async p => {
                    await klick(
                        p,
                        '#view-notes [data-action="toggle-collapse"][data-value="session-form"]'
                    );
                    await klick(p, '[data-action="call"][data-value="manageStoryArcs"]');
                    await schliessen(p);
                    await klick(
                        p,
                        '#view-notes [data-action="toggle-collapse"][data-value="session-form"]'
                    );
                }
            ],
            [
                'Notizen-Suche (System -> Debug)',
                async p => {
                    const tab = p.locator('.nav-tab[data-value="showDebugModal"]');
                    await p.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
                    await tab.click();
                    await p.waitForTimeout(300);
                    await klick(p, '[data-action="call"][data-value="showNotesSearch"]');
                    await tippen(p, '#notes-search-input', 'kanarie');
                    await schliessen(p, 2);
                }
            ],
            [
                'Zauber: Karte aufklappen',
                async p => {
                    await zuReiter(p, 'spells');
                    await klick(p, '#view-spells .spell-card-header .spell-level');
                }
            ],
            [
                'Truhe: Detail und Verteilung',
                async p => {
                    await zuReiter(p, 'loot');
                    await klick(p, '#view-loot [data-action="select-loot"]');
                    await klick(p, '#view-loot [data-action="show-loot-distribution"]');
                    await schliessen(p);
                }
            ],
            [
                'Shops: aufklappen, Artikel, Artikel-Modal',
                async p => {
                    await zuReiter(p, 'shops');
                    await klick(p, '#view-shops .shop-header .shop-toggle');
                    await klick(p, '#view-shops [data-action="toggle-shop-item"]');
                    await klick(p, '#view-shops [data-action="edit-shop-item"]');
                    await schliessen(p);
                }
            ],
            [
                'Links: Liste und Bearbeiten',
                async p => {
                    await zuReiter(p, 'links');
                    await klick(p, '#view-links [data-action="edit-link"]');
                    await klick(p, '[data-action="call"][data-value="cancelLinkEdit"]');
                }
            ],
            [
                'Zufallstabellen: waehlen, wuerfeln, bearbeiten',
                async p => {
                    await zuReiter(p, 'dice');
                    await klick(p, '#view-dice details.dice-details:has(.rt-panel) > summary');
                    await klick(p, '#view-dice [data-action="select-table"]');
                    await klick(p, '#view-dice [data-action="roll-on-table"]');
                    await klick(p, '#view-dice [data-action="show-table-modal"][data-id]');
                    await schliessen(p);
                }
            ],
            [
                'Schnellreferenz: Eigene, aufklappen, bearbeiten',
                async p => {
                    await klick(p, '[data-action="toggle-quick-ref"].qref-fab');
                    await klick(p, '[data-action="qref-tab"][data-value="custom"]');
                    await klick(p, '[data-action="toggle-quick-ref-custom"]');
                    await klick(p, '[data-action="edit-quick-ref-entry"]');
                    await schliessen(p, 2);
                }
            ]
        ]
    },
    {
        kuerzel: 'werkzeuge-suche',
        name: 'Werkzeuge und Suche (Wuerfel, Session-Prep, globale Suche, Befehlspalette, Markdown-Export, Telefon-Suche)',
        schritte: [
            [
                'Wuerfel: Gruppe und Fertigkeiten',
                async p => {
                    await zuReiter(p, 'dice');
                    await klick(p, '#view-dice [data-action="roll-group-perception"]');
                    await klick(
                        p,
                        '#view-dice details.dice-details:has(#dice-char-select) > summary'
                    );
                    await p.locator('#dice-char-select').selectOption({ index: 1 });
                    await p.waitForTimeout(300);
                    await klick(p, '#view-dice [data-action="roll-skill"]');
                    await klick(p, '#view-dice [data-action="roll-attr-check"]');
                }
            ],
            [
                'Session-Prep: Liste und Bearbeiten',
                async p => {
                    await zuReiter(p, 'sessionprep');
                    await klick(p, '#view-sessionprep [data-action="edit-session-prep"]');
                    await schliessen(p);
                }
            ],
            [
                'Globale Suche (Desktop) mit Treffer',
                async p => {
                    await p.keyboard.press('Control+k');
                    await tippen(p, '#global-search', 'kanarie');
                    await klick(p, '#global-search-results [data-action]');
                    await schliessen(p);
                }
            ],
            [
                'Befehlspalette',
                async p => {
                    await p
                        .locator('body')
                        .click({ position: { x: 5, y: 5 } })
                        .catch(() => {});
                    await p.keyboard.press('Control+Shift+K');
                    await tippen(p, '.cp-input', 'npc');
                    await schliessen(p);
                }
            ],
            [
                'Markdown-Export: NPC',
                async p => {
                    await zuReiter(p, 'npcs');
                    await klick(p, '#view-npcs [data-action="select-npc"]');
                    await klick(p, '#view-npcs [data-action="edit-npc"]');
                    await klick(p, '[data-action="export-markdown"][data-type="npcs"]', {
                        warte: 500
                    });
                    await schliessen(p);
                }
            ],
            [
                'Markdown-Export: Quest',
                async p => {
                    await zuReiter(p, 'quests');
                    await klick(p, '#view-quests .quest-header .quest-title');
                    await klick(p, '#view-quests [data-action="edit-quest"]');
                    await klick(p, '[data-action="export-markdown"][data-type="quests"]', {
                        warte: 500
                    });
                    await schliessen(p);
                }
            ],
            [
                'Markdown-Export: Zauber',
                async p => {
                    await zuReiter(p, 'spells');
                    await klick(p, '#view-spells .spell-card-header .spell-level');
                    await klick(p, '#view-spells [data-action="edit-spell-stop"]');
                    await klick(p, '[data-action="export-markdown"][data-type="spells"]', {
                        warte: 500
                    });
                    await schliessen(p);
                }
            ],
            [
                'Telefon-Suche (390x844) mit Detail',
                async p => {
                    await p.setViewportSize({ width: 390, height: 844 });
                    await p.waitForTimeout(500);
                    await klick(p, '.mobile-search-btn[data-value="showMobileSearch"]');
                    await tippen(p, '#mobile-search-input', 'kanarie');
                    await klick(
                        p,
                        '#mobile-search-results [data-action="mobile-search-navigate"]',
                        { warte: 600 }
                    );
                }
            ]
        ]
    }
];

/**
 * Sammelt die Funde der Phasen dieses Falls (DOM, javascript:-Ziele, Netz) und baut die
 * Meldung: je Schritt die ausgeloesten Kanarien-ids mit Erkennungsart.
 */
async function auswerten(page, ctx, phasen) {
    const imDom = await page.evaluate(() => {
        // @ts-ignore
        return window.__kanarie.funde;
    });
    const alle = imDom.concat(ctx.netz).filter(f => phasen.includes(f.phase));
    const proPhase = new Map();
    for (const f of alle) {
        if (!proPhase.has(f.phase)) proPhase.set(f.phase, new Map());
        const ids = proPhase.get(f.phase);
        if (!ids.has(f.id)) ids.set(f.id, new Set());
        ids.get(f.id).add(f.art);
    }
    const ids = new Set(alle.map(f => f.id));
    const zeilen = [];
    for (const phase of phasen) {
        const m = proPhase.get(phase);
        if (!m) continue;
        const eintraege = [...m.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, arten]) => `${id} (${[...arten].sort().join(', ')})`);
        zeilen.push(`  [${phase}] ${eintraege.length}: ${eintraege.join('; ')}`);
    }
    return { ids: [...ids].sort(), zeilen };
}

// Ein fehlendes Element darf nicht bis zur Testzeitgrenze warten: es ist eine Weg-Luecke.
test.use({ actionTimeout: 5000 });

for (const [eingang, eingangName] of Object.entries(EINGAENGE)) {
    for (const gruppe of GRUPPEN) {
        test(`Kanarien: ${eingangName} -> ${gruppe.name}`, async ({ page }) => {
            test.setTimeout(90000);
            const ctx = await eingangSpielen(page, /** @type {any} */ (eingang));
            const phasen = gruppe.mitEingang ? ['Vorlauf', 'Eingang'] : [];
            for (const [name, weg] of gruppe.schritte) {
                const phase = `${gruppe.kuerzel}: ${name}`;
                phasen.push(phase);
                await phaseSetzen(page, ctx, phase);
                try {
                    await weg(page);
                } catch (e) {
                    ctx.luecken.push(
                        `${name}: ${String(e && e.message)
                            .split('\n')[0]
                            .slice(0, 160)}`
                    );
                    await schliessen(page).catch(() => {});
                }
                await page.waitForTimeout(150);
                await aufraeumen(page).catch(() => {});
            }
            // Nachlauf: Bild- und Stil-Anforderungen des letzten Schritts abwarten
            await page.waitForTimeout(400);
            const { ids, zeilen } = await auswerten(page, ctx, phasen);
            const meldung =
                `Eingang „${eingangName}“, Ansichtsgruppe „${gruppe.name}“: ` +
                `${ids.length} Kanarie(n) ausgeloest: ${ids.join(', ')}\n` +
                zeilen.join('\n') +
                (ctx.luecken.length ? `\n  Weg-Luecken: ${ctx.luecken.join(' | ')}` : '') +
                (ctx.fehler.length
                    ? `\n  Seitenfehler: ${[...new Set(ctx.fehler)].join(' | ')}`
                    : '');
            expect.soft(ids, meldung).toEqual([]);
            expect
                .soft(
                    ctx.luecken,
                    `Weg nicht begehbar (${eingangName}, ${gruppe.name}):\n  ${ctx.luecken.join('\n  ')}`
                )
                .toEqual([]);
        });
    }
}

// ---------------------------------------------------------------------------
// Legitimer Gegenfall (R5): Sonderzeichen woertlich, Rich-Text formatiert
// ---------------------------------------------------------------------------
const NAME_HELD = 'Thorin "Eisenfaust" & Söhne <Zwerg> 🪓';
const NAME_NPC = 'Bäcker <Zunft> & "Hans" 🍞';
const TITEL_QUEST = 'Fracht <3 & "mehr" — Übergabe 📦';
const NAME_ORT = 'Hafen & Turm <Alt> "Nord" 🌊';
const TITEL_WIKI = 'Götter & <Dämonen> "Zeitalter" ✨';
const URL_LINK = 'https://example.org/suche?a=1&b=<2>';

function legitimeKampagne() {
    const k = rohKampagne();
    k.characters[0].name = NAME_HELD;
    k.characters[0].hpCurrent = '40';
    k.npcs[0].name = NAME_NPC;
    k.npcs[0].description = '<p>Ein <b>fetter</b> und <i>kursiver</i> Text &amp; mehr</p>';
    k.quests[0].title = TITEL_QUEST;
    k.locations[0].name = NAME_ORT;
    k.wiki[0].title = TITEL_WIKI;
    k.links[0].url = URL_LINK;
    k.links[0].title = 'Regeln & <Tabellen>';
    k.encounters[0].cr = '1/4';
    // Verknuepfungsmarke mit Sonderzeichen im Namen, so gespeichert, wie der Editor sie
    // ablegt (Text serialisiert: & als &amp;, < als &lt;). Haelt fest, dass der Fix fuer
    // parseEntityLinks den schon serialisierten Namen nicht ein zweites Mal kodiert. Ohne `"`:
    // das ist die Einschleusung selbst (Kanarie `.marke`), heute kaputt und kein Gegenfall.
    k.quickRefCustom[0].content = `<p>Siehe ${MARKE_ROH}</p>`;
    return k;
}

const MARKE_ROH = '[[npcs:1:Bäcker &amp; &lt;Zunft&gt;]]';
const MARKE_NAME = 'Bäcker & <Zunft>';

for (const [eingang, eingangName] of Object.entries(EINGAENGE)) {
    test(`Gegenfall R5: Namen mit &, <, ", Umlauten und Emojis woertlich, Rich-Text formatiert (${eingangName})`, async ({
        page
    }) => {
        test.setTimeout(60000);
        // Derselbe Eingang wie die Kanarien-Faelle, nur mit legitimen Daten: ein Fix, der an
        // EINEM Eingang zu viel kodiert oder entfernt, faellt hier auf
        const ctx = await eingangSpielen(page, /** @type {any} */ (eingang), {
            daten: legitimeKampagne(),
            index: null,
            kampagnenName: 'Legitim & <Echt>'
        });
        expect(ctx.luecken).toEqual([]);

        // Nicht-Vakuitaet: der Eingang ist angekommen, Zahl als Text wurde Zahl (R4)
        const d = await page.evaluate(() => ({
            // @ts-ignore
            name: window.D.characters[0].name,
            // @ts-ignore
            hp: window.D.characters[0].hpCurrent
        }));
        expect(d).toEqual({ name: NAME_HELD, hp: 40 });

        // Woertlich (kein Doppel-Kodieren, keine Entfernung von Zeichen)
        await zuReiter(page, 'party');
        await expect(page.locator('#party-list')).toContainText(NAME_HELD);
        await zuReiter(page, 'npcs');
        await expect(page.locator('#npc-list')).toContainText(NAME_NPC);
        await klick(page, '#view-npcs [data-action="select-npc"]');
        // Rich-Text bleibt formatiert: <b> und <i> sind Elemente, &amp; erscheint als &
        const fett = page.locator('#npc-detail-panel b', { hasText: 'fetter' });
        await expect(fett).toHaveCount(1);
        await expect(page.locator('#npc-detail-panel i', { hasText: 'kursiver' })).toHaveCount(1);
        await expect(page.locator('#npc-detail-panel')).toContainText('kursiver Text & mehr');
        await zuReiter(page, 'quests');
        await expect(page.locator('#view-quests')).toContainText(TITEL_QUEST);
        await zuReiter(page, 'locations');
        await expect(page.locator('#view-locations')).toContainText(NAME_ORT);
        await zuReiter(page, 'wiki');
        await klick(page, '#view-wiki [data-action="call"][data-value="expandAllWikiCategories"]');
        await expect(page.locator('#view-wiki')).toContainText(TITEL_WIKI);
        await zuReiter(page, 'links');
        await expect(page.locator('#view-links')).toContainText('Regeln & <Tabellen>');
        // Ein erlaubter Link bleibt bedienbar und unveraendert (R3 verwirft nur fremde Schemata)
        await expect(page.locator('#view-links a[href]').first()).toHaveAttribute('href', URL_LINK);

        // Kein sichtbares Entity-Rudiment in den besuchten Ansichten
        const rudimente = await page.evaluate(() =>
            ['party', 'npcs', 'quests', 'locations', 'wiki', 'links']
                .map(v => document.getElementById('view-' + v)?.innerText || '')
                .join('\n')
                .match(/&(amp|lt|gt|quot|#39|#x27);/g)
        );
        expect(rudimente).toBeNull();

        // Verknuepfungsmarke der Schnellreferenz: Name woertlich in Text UND title
        await klick(page, '[data-action="toggle-quick-ref"].qref-fab');
        await klick(page, '[data-action="qref-tab"][data-value="custom"]');
        // Ohne Sichtbarkeitsfilter: der Inhalt eines eigenen Eintrags bleibt auch aufgeklappt
        // per CSS verborgen (dashboard.css zeigt `.qref-custom-content`, das Markup heisst
        // `quick-ref-custom-content`) — ein Darstellungsfehler am Rand, keine Senke
        const marke = page.locator('#quick-ref-custom .entity-link[data-type="npcs"]').first();
        await expect(marke).toContainText(MARKE_NAME);
        await expect(marke).toHaveAttribute('title', `npcs: ${MARKE_NAME}`);

        // Und natuerlich: nichts davon wurde als HTML wirksam
        // @ts-ignore
        const funde = await page.evaluate(() => window.__kanarie.funde);
        expect(funde.concat(ctx.netz)).toEqual([]);
        expect(ctx.fehler).toEqual([]);
    });
}
