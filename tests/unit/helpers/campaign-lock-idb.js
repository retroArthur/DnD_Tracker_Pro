const { setImmediate: naechsterTask } = require('timers');
const { erzeugeFakeIDB } = require('./fake-idb.js');

function erzeugeSperrDatenbank() {
    const { db } = erzeugeFakeIDB();
    const stores = new Set();
    db.objectStoreNames = { contains: name => stores.has(name) };
    db.createObjectStore = name => stores.add(name);
    let initialisiert = false;

    return () => {
        const request = { result: db };
        naechsterTask(() => {
            const event = { target: request };
            if (!initialisiert) {
                initialisiert = true;
                request.onupgradeneeded?.(event);
            }
            request.onsuccess?.(event);
        });
        return request;
    };
}

function erzeugeKampagnenSperrDb() {
    const datenbanken = new Map([
        ['dnd-tracker-db-campaign-operations', erzeugeSperrDatenbank()],
        ['dnd-tracker-db-campaign-import-recovery', erzeugeSperrDatenbank()]
    ]);
    return {
        open(name, version) {
            const oeffnen = datenbanken.get(name);
            if (!oeffnen || version !== 1) {
                throw new Error(
                    `Unerwartete Kampagnen-Sperrdatenbank: ${name}, Version ${version}`
                );
            }
            return oeffnen();
        }
    };
}

module.exports = { erzeugeKampagnenSperrDb };
