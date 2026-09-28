// [SECTION:UTILITIES]
// CORE UTILITIES - @utils @helpers @core
// ============================================================
// Polyfill for structuredClone (for older browsers)
if (typeof structuredClone === 'undefined') {
    window.structuredClone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
}
/**
 * DOM-Element-Cache für häufig verwendete Elemente
 * Reduziert DOM-Abfragen bei wiederholtem Zugriff
 */
const domCache = new Map();
/**
 * Gecachte DOM-Element-Abfrage
 * @param id - Element-ID
 * @returns Gecachtes Element oder null
 */
function $c(id) {
    if (!domCache.has(id)) {
        const el = $(id);
        if (el) domCache.set(id, el);
        return el;
    }
    return domCache.get(id) || null;
}
/**
 * Leert den DOM-Cache
 * Nützlich nach dynamischen DOM-Änderungen
 * @param id - Spezifische ID zum Entfernen, oder alle wenn nicht angegeben
 */
function clearDomCache(id) {
    if (id) {
        domCache.delete(id);
    } else {
        domCache.clear();
    }
}
/**
 * Debounce - Verzögert Ausführung bis keine weiteren Aufrufe mehr kommen
 * @param fn - Zu verzögernde Funktion
 * @param delay - Verzögerung in Millisekunden
 * @returns Debounced Funktion
 * @example
 * const debouncedSearch = debounce(search, 300);
 * input.addEventListener('input', debouncedSearch);
 */
function debounce(fn, delay = window.APP_CONFIG?.DEBOUNCE_DELAY || 300) {
    let timeoutId = null;
    return function debounced(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}
/**
 * Throttle - Begrenzt Ausführung auf einmal pro Zeitintervall
 * Verbesserte Version: Speichert den letzten Aufruf und führt ihn nach dem Intervall aus
 * @param fn - Zu drosselnde Funktion
 * @param limit - Mindestabstand zwischen Aufrufen in ms
 * @returns Throttled Funktion
 * @example
 * const throttledScroll = throttle(onScroll, 100);
 * window.addEventListener('scroll', throttledScroll);
 */
function throttle(fn, limit = window.APP_CONFIG?.THROTTLE_DELAY || 100) {
    let inThrottle = false;
    let lastArgs = null;
    let lastThis = null;
    return function throttled(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                // Führe den letzten gepufferten Aufruf aus
                if (lastArgs) {
                    fn.apply(lastThis, lastArgs);
                    lastArgs = null;
                    lastThis = null;
                }
            }, limit);
        } else {
            // Speichere den letzten Aufruf für später
            lastArgs = args;
            lastThis = this;
        }
    };
}
/**
 * Memoization für teure Berechnungen mit Cache-Limit
 * @param fn - Zu cachende Funktion
 * @param maxSize - Maximale Anzahl gecachter Ergebnisse
 * @returns Memoized Funktion
 * @example
 * const expensiveCalc = memoize((n) => fibonacci(n), 50);
 */
function memoize(fn, maxSize = 100) {
    const cache = new Map();
    return function memoized(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        // Cache-Größe begrenzen (FIFO)
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            if (firstKey !== undefined) {
                cache.delete(firstKey);
            }
        }
        cache.set(key, result);
        return result;
    };
}
/**
 * Teilt ein Array in Chunks auf
 * @param array - Zu teilendes Array
 * @param size - Größe jedes Chunks
 * @returns Array von Chunks
 * @example
 * chunkArray([1,2,3,4,5], 2) // [[1,2], [3,4], [5]]
 */
function chunkArray(array, size) {
    if (!Array.isArray(array) || size < 1) return [array];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Parst eine Entity-ID sicher zu einer Nummer
 * Zentrale Utility-Funktion für konsistente ID-Behandlung in allen Modulen
 * @param id - ID als Nummer oder String
 * @returns Numerische ID oder null wenn ungültig
 * @example
 * parseEntityId(42)      // 42
 * parseEntityId('42')    // 42
 * parseEntityId('abc')   // null
 * parseEntityId(null)    // null
 */
function parseEntityId(id) {
    if (id === null || id === undefined) return null;
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    return isNaN(numId) ? null : numId;
}
/**
 * Error Boundary Wrapper für kritische Funktionen
 * Fängt Fehler ab und zeigt eine Toast-Benachrichtigung
 * Unterstützt sowohl synchrone als auch asynchrone Funktionen
 * @param fn - Zu wrappende Funktion
 * @param context - Kontext für Fehlermeldung
 * @returns Gewrappte Funktion mit Error-Handling
 * @example
 * const safeDelete = withErrorBoundary(deleteItem, 'Löschen');
 */
function withErrorBoundary(fn, context = 'Operation') {
    return function errorBoundary(...args) {
        try {
            const result = fn.apply(this, args);
            // Promise-Handling für async Funktionen
            if (result instanceof Promise) {
                return result.catch(error => {
                    window.ErrorHandler?.log('safeExecute', error, context);
                    showToast(`❌ Fehler: ${context}`, 'error');
                    return null;
                });
            }
            return result;
        } catch (error) {
            window.ErrorHandler?.log('safeExecute', error, context);
            showToast(`❌ Fehler: ${context}`, 'error');
            return null;
        }
    };
}
// ============================================================
// ID-INVARIANTE (Code-Review 2026-09-21, R03)
// Eine gueltige Entitaets-ID ist eine sichere positive Ganzzahl <= ENTITY_ID_MAX.
// nextId() vertraut keinem gespeicherten Zaehler blind: die Untergrenze ist immer
// die groesste gueltige ID der Sammlung + 1 (Sammlung ueber ID_COUNTER_PATHS, damit
// auch verschachtelte Sammlungen wie D.calendar.events gefunden werden).
// ============================================================
/**
 * Obergrenze gueltiger Entitaets-IDs. Date.now()-basierte IDs (~1.8e12) bleiben gueltig;
 * 1e300 oder Werte >= 2^53 wuerden nextId() doppelte bzw. unaufloesbare IDs liefern lassen.
 */
const ENTITY_ID_MAX = 1e15;
/**
 * Register ALLER je an nextId() uebergebenen Typen -> Pfad ihrer Sammlung im Kampagnenobjekt.
 * calendarEvents und combatants liegen NICHT unter D[type]. Jeder neue nextId-Aufruf mit
 * Typ-Literal braucht hier einen Eintrag (tests/unit/next-id.test.js N6 scannt den Quellbaum).
 * Bewusst ohne das Phantom 'items' (kein Schreibpfad; nur in NEXT_ID_REPAIR_TYPES).
 */
const ID_COUNTER_PATHS = Object.freeze({
    characters: Object.freeze(['characters']),
    npcs: Object.freeze(['npcs']),
    locations: Object.freeze(['locations']),
    quests: Object.freeze(['quests']),
    encounters: Object.freeze(['encounters']),
    spells: Object.freeze(['spells']),
    loot: Object.freeze(['loot']),
    wiki: Object.freeze(['wiki']),
    sessionNotes: Object.freeze(['sessionNotes']),
    randomTables: Object.freeze(['randomTables']),
    shops: Object.freeze(['shops']),
    links: Object.freeze(['links']),
    filters: Object.freeze(['filters']),
    bestiary: Object.freeze(['bestiary']),
    factions: Object.freeze(['factions']),
    sessionPreps: Object.freeze(['sessionPreps']),
    quickRefCustom: Object.freeze(['quickRefCustom']),
    calendarEvents: Object.freeze(['calendar', 'events']),
    combatants: Object.freeze(['initiative', 'combatants'])
});
/**
 * Alt-Liste der Typen, die validateAndRepairNextId() ohne Argumente prueft — Inhalt und
 * Reihenfolge unveraendert (inkl. Phantom 'items'). NICHT erweitern: die E2E-Seeds in
 * tests/e2e/helpers/test-utils.js sind darauf kalibriert, dass beim Boot KEINE Reparatur
 * (und damit kein verzoegertes save() mit Toast-Rennen) ausgeloest wird.
 */
const NEXT_ID_REPAIR_TYPES = Object.freeze([
    'characters',
    'npcs',
    'locations',
    'quests',
    'encounters',
    'spells',
    'loot',
    'items',
    'wiki',
    'sessionNotes',
    'randomTables'
]);
/**
 * Prueft auf ein einfaches Datenobjekt (kein Array, kein null) — realm-unabhaengig,
 * damit auch Objekte aus JSON.parse in einem anderen Kontext (Tests, Worker) passen.
 * @param v - Beliebiger Wert
 * @returns true fuer ein einfaches Objekt
 */
function isPlainDataObject(v) {
    return (
        v !== null &&
        typeof v === 'object' &&
        Object.prototype.toString.call(v) === '[object Object]'
    );
}
/**
 * Liefert die ID-Sammlung eines Typs (verschachtelte Pfade laut ID_COUNTER_PATHS).
 * @param data - Kampagnenobjekt (z. B. window.D)
 * @param type - Typ wie an nextId() uebergeben
 * @returns Das Array oder undefined, wenn am Pfad kein Array liegt
 */
function getIdCollection(data, type) {
    const segments = Object.prototype.hasOwnProperty.call(ID_COUNTER_PATHS, type)
        ? ID_COUNTER_PATHS[type]
        : [type];
    let cursor = data;
    for (const segment of segments) {
        if (cursor === null || typeof cursor !== 'object') return undefined;
        cursor = cursor[segment];
    }
    return Array.isArray(cursor) ? cursor : undefined;
}
/**
 * Wandelt eine gespeicherte ID in eine Zahl: Zahlen bleiben, rein numerische
 * Zeichenketten ('7') werden zur Zahl, alles andere wird NaN.
 * @param id - Gespeicherte ID
 * @returns Zahl oder NaN
 */
function toEntityIdNumber(id) {
    if (typeof id === 'number') return id;
    if (typeof id === 'string' && /^[0-9]+$/.test(id)) return Number(id);
    return NaN;
}
/**
 * Gueltige Entitaets-ID: sichere positive Ganzzahl bis ENTITY_ID_MAX.
 * @param n - Zu pruefender Wert
 * @returns true, wenn gueltig
 */
function isValidEntityId(n) {
    return Number.isSafeInteger(n) && n > 0 && n <= ENTITY_ID_MAX;
}
/**
 * Neu zu vergebende ID: gueltig UND strikt unterhalb der Obergrenze.
 * Warum strikt unterhalb: nextId() merkt sich die Vergabe ausschliesslich in
 * `_nextId[type] = id + 1`. Nur wenn id + 1 selbst noch eine gueltige ID ist, bleibt
 * dieser Zaehler erhalten und traegt die Information "id ist vergeben" in den naechsten
 * Aufruf. Genau ENTITY_ID_MAX zu muenzen wuerde den Zaehler ungueltig machen — der
 * naechste Aufruf im Stapel (noch kein push in die Sammlung) haette die Information
 * verloren und dieselbe ID erneut ausgegeben (doppelte IDs = R03-Fehlerklasse).
 * ENTITY_ID_MAX bleibt als GESPEICHERTE ID gueltig (fremde Dateien), wird aber nie
 * neu gemuenzt; das kostet genau eine von 1e15 IDs.
 * @param n - Zu pruefender Wert
 * @returns true, wenn n neu vergeben werden darf
 */
function isMintableEntityId(n) {
    return isValidEntityId(n) && n < ENTITY_ID_MAX;
}
/**
 * Groesste gueltige ID einer Sammlung (ungueltige IDs zaehlen nicht).
 * Schleife statt Math.max(...spread): kein Stapelueberlauf bei sehr grossen Sammlungen.
 * @param items - Sammlung
 * @returns Groesste gueltige ID oder 0
 */
function maxEntityId(items) {
    if (!Array.isArray(items)) return 0;
    let max = 0;
    for (const item of items) {
        if (item === null || typeof item !== 'object') continue;
        const n = toEntityIdNumber(item.id);
        if (isValidEntityId(n) && n > max) max = n;
    }
    return max;
}
/**
 * Erste freie gueltige ID einer Sammlung ab `start` (aufwaerts gesucht).
 * Nur fuer den Saettigungsfall gedacht: sobald max(ID) + 1 die Obergrenze
 * erreicht oder ueberschreitet, gibt es oberhalb keine neu vergebbare ID mehr
 * (siehe isMintableEntityId), also werden die Luecken UNTERHALB des Maximums
 * genutzt.
 * Die Sammlung allein beantwortet die Frage "ist diese ID frei?" NICHT: eine ID, die
 * dieses Seitenleben schon herausgegeben hat, ist bis zum `push` in KEINER Sammlung
 * (Stapel ohne push, liegen gebliebener Import-Datensatz, abgebrochenes Speichern).
 * Darum nimmt die Suche mit `vergeben` dieselbe Erinnerung, mit der auch der Waechter
 * in nextId() arbeitet (MINT_ISSUED) — sonst gibt sie eine unterwegs befindliche ID ein
 * zweites Mal aus, sobald der Startzeiger unter sie zurueckfaellt (G2).
 * @param items - Sammlung (Nicht-Arrays werden als leer behandelt)
 * @param start - Startkandidat; nicht vergebbare Werte starten bei 1
 * @param vergeben - Zusaetzlich belegte IDs dieses Seitenlebens (Set, optional)
 * @returns Freie vergebbare ID (1 .. ENTITY_ID_MAX - 1)
 * @throws Error, wenn jede ID bis ENTITY_ID_MAX - 1 belegt ist (praktisch unerreichbar)
 */
function nextFreeEntityId(items, start, vergeben) {
    const belegt = new Set();
    if (Array.isArray(items)) {
        for (const item of items) {
            if (item === null || typeof item !== 'object') continue;
            const n = toEntityIdNumber(item.id);
            if (isValidEntityId(n)) belegt.add(n);
        }
    }
    const frei = n => !belegt.has(n) && !(vergeben ? vergeben.has(n) : false);
    let candidate = isMintableEntityId(start) ? start : 1;
    while (!frei(candidate) && isMintableEntityId(candidate)) candidate++;
    // Der Aufstieg kann oben anstossen, obwohl UNTERHALB des Zeigers frei ist — der
    // Zeiger steht ja dort, wo die letzte Vergabe endete, nicht dort, wo die Luecken
    // liegen. Dann noch einmal von 1 an, sonst gibt die Suche auf, obwohl praktisch
    // alle IDs frei sind (G2m).
    if (!isMintableEntityId(candidate) && candidate > 1) {
        candidate = 1;
        while (!frei(candidate) && isMintableEntityId(candidate)) candidate++;
    }
    // Bewusst ein Fehler statt einer ungueltigen oder doppelten ID: lieber ein
    // sichtbarer Abbruch als stiller Datenverlust beim naechsten Loeschen. Hier ist
    // er echt: jede vergebbare ID ist belegt.
    if (!isMintableEntityId(candidate)) throw new Error('Keine freie ID');
    return candidate;
}
/**
 * Suchzeiger je Typ — bewusst NUR im Speicher, nie persistiert.
 * Er hat GENAU EINE Aufgabe: er ist der Startwert der Lueckensuche im Saettigungszweig,
 * damit ein Stapel nicht bei jeder Vergabe wieder von 1 an hochzaehlt. Mehr ist er nicht.
 * `MINT_CURSOR.get` steht an genau einer Stelle, eben dort.
 * Was er ausdruecklich NICHT (mehr) ist — hier stand bis G3 das Gegenteil, und diese
 * Fehlbeschreibung hat die Anlaeufe an dieser Kante wiederholt in die Irre gefuehrt:
 * er ist KEINE Schranke, unterhalb derer nicht geheilt werden darf, und er traegt AUCH
 * NICHT die Erinnerung an die Vergaben eines Stapels. Beides leistet allein MINT_ISSUED,
 * und zwar an BEIDEN Vergabestellen (der Waechter fragt es direkt, die Lueckensuche
 * bekommt es als `vergeben`). Der Waechter liest den Zeiger seit G2 gar nicht mehr.
 * Daraus folgt die Sicherheitsaussage: der Zeiger kann KEINE doppelte ID verursachen,
 * egal wo er steht. Die Suche prueft jeden Kandidaten gegen Sammlung UND `vergeben` und
 * gibt nur einen freien zurueck — ein falsch stehender Zeiger kostet Schleifendurch-
 * laeufe, nie die Eindeutigkeit.
 * Er wird deshalb bewusst NICHT monoton gefuehrt: er faellt auf die zuletzt vergebene ID
 * zurueck, auch wenn der Waechter auf eine niedrige Untergrenze geheilt hat. Das ist
 * Absicht, kein Ruecklauf-Fehler. Ein monotoner Zeiger (Math.max, in der Abschlussrunde
 * G3 geprueft und verworfen) bliebe nach einer hohen Normalpfad-Vergabe an der
 * Obergrenze stehen, waere dort nie vergebbar, und die Suche finge danach bei JEDER
 * Vergabe wieder bei 1 an — gemessen 1,5x langsamer bei 500..4000 Vergaben im
 * Saettigungszweig, ohne dass sich an Gueltigkeit oder Eindeutigkeit irgendetwas aendert
 * (1008 Gitterpunkte in tests/unit/next-id.test.js, G3a/G3b).
 * Nach einem Neuladen ist der Zeiger weg, die vergebenen IDs stehen dann aber in der
 * Sammlung, also setzt die Lueckensuche dort korrekt fort.
 */
const MINT_CURSOR = new Map();
/**
 * Die in diesem Prozess herausgegebenen IDs je Typ — ebenfalls nur im Speicher. Sie sind
 * die Erinnerung, mit der BEIDE Vergabestellen in nextId() arbeiten (der Waechter und die
 * Lueckensuche der Saettigung, die sie als `vergeben` bekommt: fragt nur eine von beiden,
 * gibt die andere eine unterwegs befindliche ID erneut aus). Ihre FORM ist der Punkt:
 * sie muss genau eine Frage beantworten — "ist GENAU DIESE ID hier schon herausgegeben?".
 * Eine Hoechstmarke (hier stand vorher MINT_PEAK) ueberapproximiert das zu "jede ID bis
 * zur hoechsten je gemuenzten koennte unterwegs sein" und verfaellt nie: ein einziges
 * Muenzen nahe der Obergrenze — voellig regulaer, z. B. aus einem Datei-Zaehler von
 * 1e15 - 1 — haette den Waechter fuer diesen Typ den Rest des Seitenlebens abgeschaltet.
 * Der Suchzeiger taugt genauso wenig, weil der Saettigungszweig ihn selbst wieder nach
 * unten setzt. Deshalb steht hier die Menge selbst und nicht ihr Maximum.
 * Bewusst NICHT beschnitten: eine ID, die heute in der Sammlung steht, kann morgen
 * geloescht sein — dann braucht der Waechter die Erinnerung wieder, und die Sammlung
 * traegt sie nicht mehr. Die Menge waechst um genau einen Eintrag je Vergabe und ist nach
 * einem Neuladen weg; dann tragen die Sammlungen die Wahrheit.
 */
const MINT_ISSUED = new Map();
/**
 * Generiert eine eindeutige ID für einen Entity-Typ.
 * Monoton: ein gueltiger Zaehler wird nie gesenkt (geloeschte IDs werden nicht
 * wiederverwendet); veraltete, ungueltige (NaN, 1e300, 'abc', 2.5) Zaehler und
 * verschachtelte Sammlungen heilen sich selbst ueber die Untergrenze max(ID) + 1.
 * Ausnahme ist allein die Saettigung: reicht die SAMMLUNG bis an die Obergrenze, gibt es
 * oberhalb keine vergebbare ID mehr, also werden Luecken darunter wiederverwendet. Das ist
 * eine Eigenschaft der Sammlung (und des laufenden Stapels, siehe MINT_CURSOR), nie eine
 * dauerhafte Eigenschaft des Zaehlers.
 * @param type - Entity-Typ (characters, npcs, calendarEvents, combatants, ...)
 * @returns Neue eindeutige ID
 */
function nextId(type) {
    const D = window.D;
    if (!isPlainDataObject(D._nextId)) D._nextId = {};
    let issued = MINT_ISSUED.get(type);
    if (!issued) {
        issued = new Set();
        MINT_ISSUED.set(type, issued);
    }
    const floor = maxEntityId(getIdCollection(D, type)) + 1;
    const counter = D._nextId[type];
    let id = isValidEntityId(counter) && counter >= floor ? counter : floor;
    // Veralteter Saettigungs-Pin (G2): die berechnete ID taugt nicht, die Untergrenze aber
    // schon — dann stammt sie aus dem Zaehler und der ist genau ENTITY_ID_MAX (der einzige
    // gueltige, nie vergebbare Wert). Der Zaehler behauptet also die Saettigung, die
    // Sammlung liegt aber weit darunter: entweder kam der Wert aus einer fremden Datei,
    // oder die Entitaet an der Obergrenze wurde inzwischen geloescht. Dann darf die
    // monotone Vergabe oberhalb der Untergrenze wieder aufsetzen, statt geloeschte IDs zu
    // wiederverwenden — und zwar auch mitten in einer Sitzung, in der fuer den Typ schon
    // gemuenzt wurde. Genau daran hingen die beiden Vorlaeufer dieses Waechters: erst die
    // Anwesenheit eines Zeigers, dann eine Hoechstmarke — beides Flaggen mit
    // Seitenlebensdauer. Gefragt ist die einzelne ID: die Untergrenze ist frei, sobald
    // KEINE Sammlung und KEINE Vergabe dieses Prozesses sie belegt. Die Sammlung kann es
    // nicht sein (floor = max(ID) + 1 liegt ueber jeder gespeicherten ID), also genuegt es,
    // die schon herausgegebenen IDs (MINT_ISSUED) aufwaerts zu ueberspringen — das trifft
    // sowohl die noch nicht abgelegte Luecken-ID eines Stapels als auch eine bereits
    // monoton vergebene Untergrenze. Ist auch der erste freie Kandidat nicht mehr
    // vergebbar, bleibt die Lueckensuche zustaendig.
    // Derselbe Aufstieg heilt einen zweiten Fall (G2l): die berechnete ID ist vergebbar,
    // aber dieses Seitenleben hat sie schon herausgegeben. Der Zaehler kann das nicht
    // verhindern — schreibt der Waechter eine niedrige geheilte ID hinein, ist die
    // Erinnerung an eine hohe, noch unterwegs befindliche ID dort weg, und ein Restore
    // hebt die Untergrenze auf genau sie zurueck. Beide Faelle sind dieselbe Frage nach
    // derselben Menge, also derselbe Aufstieg — nur beginnt er beim Kandidaten selbst,
    // wenn der schon oberhalb der Untergrenze liegt (die Vergabe bleibt monoton).
    if ((!isMintableEntityId(id) || issued.has(id)) && isMintableEntityId(floor)) {
        let candidate = isMintableEntityId(id) && id > floor ? id : floor;
        while (issued.has(candidate) && isMintableEntityId(candidate)) candidate++;
        if (isMintableEntityId(candidate)) id = candidate;
    }
    // Saettigung: reicht die Sammlung bis an die Obergrenze heran (solche IDs gibt es nur
    // aus einer fremden oder beschaedigten Datei), taugt die berechnete ID nicht mehr —
    // sie ist entweder selbst ungueltig oder genau ENTITY_ID_MAX, und beides kommt bei
    // jedem Aufruf identisch zurueck, also doppelte IDs. Stattdessen die erste freie
    // Luecke unterhalb des Maximums vergeben: geloeschte IDs werden hier bewusst
    // wiederverwendet, weil es oberhalb keine mehr gibt. Zustaendig ist die Suche auch
    // dann, wenn der Aufstieg oben angestossen ist und die ID noch herausgegeben ist
    // (G2l): oberhalb der Untergrenze existiert dann nachweislich nichts Freies mehr.
    if (!isMintableEntityId(id) || issued.has(id)) {
        // Die Suche bekommt BEIDE Belegungen: die Sammlung und die schon herausgegebenen
        // IDs dieses Seitenlebens. Der Startzeiger allein genuegt nicht — er faellt mit
        // jeder geheilten niedrigen Untergrenze zurueck und laeuft dann erneut ueber
        // Zahlen, die noch unterwegs sind und in keiner Sammlung stehen (G2j/G2k).
        id = nextFreeEntityId(getIdCollection(D, type), MINT_CURSOR.get(type) || 1, issued);
        MINT_CURSOR.set(type, id + 1);
        issued.add(id);
        // Der persistente Zaehler darf die niedrige Luecken-ID NICHT tragen: sie liegt
        // unter der Untergrenze, gilt beim naechsten Aufruf als veraltet und wird
        // verworfen — die Untergrenze waere dann ein zweites Mal vergeben. Er bekommt
        // stattdessen die Obergrenze selbst: eine gueltige ID, die nie neu gemuenzt wird
        // (N12), also ein Platzhalter, der den naechsten Aufruf nicht in die Irre fuehrt.
        // Ob dieser weiter Luecken sucht, entscheidet die Sammlung, nicht dieser Wert.
        D._nextId[type] = ENTITY_ID_MAX;
        return id;
    }
    // Auch der Normalpfad fuehrt den Zeiger nach — und zwar UNBEDINGT, nicht monoton
    // (kein Math.max, siehe MINT_CURSOR): heilt der Waechter oben auf eine niedrige
    // Untergrenze, soll die Lueckensuche danach genau dort fortsetzen und nicht wieder
    // bei 1 beginnen. Jede Vergabe wird zusaetzlich gemerkt, egal auf welchem Zweig:
    // der Waechter oben fragt nach der einzelnen ID (siehe MINT_ISSUED).
    MINT_CURSOR.set(type, id + 1);
    issued.add(id);
    // Unterhalb der Saettigung traegt der Zaehler die Erinnerung an die Vergabe und bleibt
    // dabei immer selbst eine gueltige ID (siehe isMintableEntityId): Stapelaufrufe ohne
    // push dazwischen (z. B. der Merge-Zweig des Imports) liefern nie zweimal dieselbe ID.
    D._nextId[type] = id + 1;
    return id;
}
/**
 * Validates and repairs data._nextId for the given entity types
 * Ensures _nextId[type] is a valid id and always greater than the max valid ID of the collection
 * @param data - Kampagnenobjekt (Standard: window.D)
 * @param types - Zu pruefende Typen (Standard: die 11 Alt-Typen, NEXT_ID_REPAIR_TYPES)
 * @returns Object with validation status and repairs performed
 */
function validateAndRepairNextId(data = window.D, types = NEXT_ID_REPAIR_TYPES) {
    if (!isPlainDataObject(data._nextId)) data._nextId = {};
    const counters = data._nextId;
    const repairs = [];
    types.forEach(type => {
        const collection = getIdCollection(data, type);
        if (!collection) return;
        // Calculate correct next ID
        const maxId = maxEntityId(collection);
        const correctNextId = maxId + 1;
        // Check if current _nextId is valid
        const counter = counters[type];
        if (!isValidEntityId(counter) || counter <= maxId) {
            repairs.push(
                `${type}: _nextId was ${counter || 'undefined'}, ` +
                    `corrected to ${correctNextId} (max ID in array: ${maxId})`
            );
            counters[type] = correctNextId;
        }
    });
    if (
        repairs.length > 0 &&
        window.APP_CONFIG?.DEBUG_MODE &&
        typeof window.debugLogAdd === 'function'
    ) {
        // Reparatur ist Normalverhalten (Selbstheilung), kein Fehler — nur ins in-App-Debug-Log,
        // nicht ueber den Browser-Konsolenkanal (UAT 01: Konsolen-Hygiene beim Boot)
        window.debugLogAdd(`[validateAndRepairNextId] ID-Reparaturen: ${repairs.join('; ')}`);
    }
    return { valid: repairs.length === 0, repairs };
}
/**
 * Macht die IDs aller Register-Sammlungen eindeutig und gueltig (in place).
 * Pass 1: rein numerische Zeichenketten-IDs werden zur Zahl (Referenzen wie giverId: 7
 * bleiben so aufloesbar). Pass 2: die erste gueltige Instanz einer ID bleibt; fehlende,
 * doppelte, gebrochene, <= 0, zu grosse und nicht-numerische IDs bekommen eine neue ID
 * oberhalb des Maximums. Nicht-Objekt-Eintraege bleiben unangetastet — nichts wird still
 * geloescht.
 * @param data - Kampagnenobjekt
 * @returns Liste der Aenderungen [{ type, from, to }] — [] = nichts geaendert
 */
function normalizeEntityIds(data) {
    const changes = [];
    for (const type of Object.keys(ID_COUNTER_PATHS)) {
        const collection = getIdCollection(data, type);
        if (!collection) continue;
        for (const item of collection) {
            if (!isPlainDataObject(item)) continue;
            if (typeof item.id === 'string' && /^[0-9]+$/.test(item.id)) {
                const to = Number(item.id);
                changes.push({ type, from: item.id, to });
                item.id = to;
            }
        }
        let next = maxEntityId(collection) + 1;
        const seen = new Set();
        // Alle bereits belegten gueltigen IDs der Sammlung — auch die weiter hinten
        // stehenden, die beim Umnummerieren noch nicht in `seen` sind.
        const taken = new Set();
        for (const item of collection) {
            if (!isPlainDataObject(item)) continue;
            const n = toEntityIdNumber(item.id);
            if (isValidEntityId(n)) taken.add(n);
        }
        for (const item of collection) {
            if (!isPlainDataObject(item)) continue;
            if (isValidEntityId(item.id) && !seen.has(item.id)) {
                seen.add(item.id);
                continue;
            }
            // Saettigung (siehe nextId): oberhalb von ENTITY_ID_MAX gibt es keine
            // gueltige ID mehr, also die Luecken unterhalb des Maximums auffuellen.
            if (!isValidEntityId(next)) next = 1;
            while (taken.has(next) || seen.has(next)) next++;
            changes.push({ type, from: item.id, to: next });
            item.id = next;
            seen.add(next);
            taken.add(next);
            next++;
        }
    }
    return changes;
}
/**
 * Bestimmt data._nextId neu: gueltige Zaehler der Datei bleiben erhalten (auch Alt-Schluessel
 * wie 'items'), jeder Registertyp bekommt mindestens max(ID) + 1.
 * @param data - Kampagnenobjekt (IDs bereits per normalizeEntityIds() bereinigt)
 * @param fileCounters - _nextId aus der Datei (optional)
 * @returns Das neue _nextId-Objekt (auch als data._nextId gesetzt)
 */
function recomputeNextIds(data, fileCounters) {
    const counters = {};
    if (isPlainDataObject(fileCounters)) {
        for (const key of Object.keys(fileCounters)) {
            if (isValidEntityId(fileCounters[key])) counters[key] = fileCounters[key];
        }
    }
    for (const type of Object.keys(ID_COUNTER_PATHS)) {
        const floor = maxEntityId(getIdCollection(data, type)) + 1;
        const counter = counters[type];
        // isMintableEntityId statt isValidEntityId (G2): ein Datei-Zaehler von genau
        // ENTITY_ID_MAX wird nie gemuenzt, traegt also keine Vergabe-Information — er ist
        // nur das Signal "gesaettigt" aus einer fremden Datei. Hier, wo garantiert keine
        // Vergabe unterwegs ist (Restore/Import bauen den Stand gerade erst auf), faellt er
        // deshalb auf die Untergrenze zurueck. Ist die Sammlung wirklich gesaettigt, ist die
        // Untergrenze selbst >= ENTITY_ID_MAX und nextId() sucht ohnehin Luecken.
        counters[type] = isMintableEntityId(counter) && counter >= floor ? counter : floor;
    }
    data._nextId = counters;
    return counters;
}
// Exporte der ID-Invariante (Restore/Import/Normalisierer nutzen sie modulübergreifend)
window.ID_COUNTER_PATHS = ID_COUNTER_PATHS;
window.isPlainDataObject = isPlainDataObject;
window.getIdCollection = getIdCollection;
window.maxEntityId = maxEntityId;
window.isValidEntityId = isValidEntityId;
window.normalizeEntityIds = normalizeEntityIds;
window.recomputeNextIds = recomputeNextIds;
/**
 * Formatiert ein Datum für die deutsche Anzeige
 * @param date - Datum (ISO-String, Date-Objekt oder Timestamp)
 * @param options - Intl.DateTimeFormat Optionen
 * @returns Formatiertes Datum
 */
function formatDate(date, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
    try {
        return new Date(date).toLocaleDateString('de-DE', options);
    } catch {
        return String(date);
    }
}
/**
 * Zeigt einen Event-Log-Eintrag an (ersetzt Toast)
 * @param msg - Nachricht
 * @param type - Nachrichtentyp
 * @param duration - Anzeigedauer in ms (Standard: APP_CONFIG.TOAST_DURATION)
 */
function showToast(
    msg = '✓ Gespeichert',
    type = 'success',
    duration = window.APP_CONFIG?.TOAST_DURATION || 2000
) {
    const log = $('event-log');
    if (!log) return;
    // Icons für verschiedene Typen
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    // Zeitstempel formatieren
    const now = new Date();
    const timeStr = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    // Entry erstellen
    const entry = document.createElement('div');
    entry.className = `event-log-entry ${type}`;
    entry.setAttribute('role', 'alert');
    entry.setAttribute('aria-live', 'polite');
    // Use esc function (needs to be available globally or imported)
    const escMsg = window.esc ? window.esc(msg) : msg;
    entry.innerHTML = `
        <span class="event-log-icon">${icons[type] || icons.success}</span>
        <div class="event-log-content">
            <div class="event-log-message">${escMsg}</div>
            <div class="event-log-time">${timeStr}</div>
        </div>
    `;
    // Nach Header einfügen (neueste oben)
    const header = log.querySelector('.event-log-header');
    if (header && header.nextSibling) {
        log.insertBefore(entry, header.nextSibling);
    } else if (header) {
        log.appendChild(entry);
    } else {
        log.insertBefore(entry, log.firstChild);
    }
    // Im persistenten Modus: mehr Einträge behalten
    const isPersistent = log.classList.contains('persistent');
    const maxEntries = isPersistent ? 50 : 5;
    // Nur event-log-entry Elemente zählen (als Array für sichere Iteration)
    const entries = Array.from(log.querySelectorAll('.event-log-entry'));
    while (entries.length > maxEntries) {
        entries.pop()?.remove();
    }
    // Nur ausblenden wenn nicht persistent
    if (!isPersistent) {
        setTimeout(() => {
            entry.classList.add('fade-out');
            setTimeout(() => entry.remove(), 400);
        }, duration);
    }
    // Backward compatibility: Update legacy #toast element for E2E tests
    // getElementById statt $() — Element wird absichtlich bei Bedarf erzeugt, keine DEBUG-Warnung
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText =
            'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    // Set background color based on type
    const bgColors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    toast.style.backgroundColor = bgColors[type] || bgColors.success;
    toast.style.color = '#ffffff';
    if (!isPersistent) {
        setTimeout(() => {
            if (toast) toast.style.display = 'none';
        }, duration);
    }
}
/**
 * Toggle Event-Log persistent mode
 */
function toggleEventLog() {
    const log = $('event-log');
    if (!log) return;
    log.classList.toggle('persistent');
}
/**
 * Clear all event log entries
 */
function clearEventLog() {
    const log = $('event-log');
    if (!log) return;
    const entries = log.querySelectorAll('.event-log-entry');
    entries.forEach(e => e.remove());
}
/**
 * Prüft ob ein Wert leer ist
 * @param value - Zu prüfender Wert
 * @returns True wenn null, undefined, leerer String, leeres Array oder leeres Objekt
 */
function isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
/**
 * Erstellt eine tiefe Kopie eines Objekts
 * @param obj - Zu klonendes Objekt
 * @returns Tiefe Kopie des Objekts
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    // Nutze structuredClone wenn verfügbar (moderne Browser)
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(obj);
        } catch {
            // Fallback für nicht-klonbare Objekte
        }
    }
    // JSON-Fallback
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Berechnet den D&D-Modifikator für einen Attributwert
 * @param score - Attributwert (1-30)
 * @returns Modifikator (z.B. 10 → 0, 14 → 2, 8 → -1)
 */
function getAttrMod(score) {
    return Math.floor((score - 10) / 2);
}
/**
 * Formatiert einen Modifikator mit Vorzeichen
 * @param mod - Modifikator
 * @returns Formatierter String (z.B. "+2", "-1", "+0")
 */
function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}
/**
 * Berechnet den Übungsbonus für eine Charakterstufe (D&D 5E)
 * @param level - Charakterstufe (1-20)
 * @returns Übungsbonus (2-6)
 */
function getProfBonus(level) {
    return Math.ceil(level / 4) + 1;
}
// getProficiencyBonus removed - use utils/game-rules.js instead
/**
 * Generiert eine einfache UUID v4
 * @returns UUID v4
 */
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback für ältere Browser
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
/**
 * Wartet eine bestimmte Zeit (für async/await)
 * @param ms - Wartezeit in Millisekunden
 * @returns Promise that resolves after the delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Klemmt einen Wert zwischen min und max
 * @param value - Wert
 * @param min - Minimum
 * @param max - Maximum
 * @returns Geklemmter Wert
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
