// [SECTION:CAMPAIGN_MANAGER]
// Was: features/dice/campaign-manager.js, Now: systems/campaign-manager/campaign-manager.js
// Kampagnen-Verwaltung
// Zeilen: 163
// ============================================================
// CAMPAIGN MANAGER
// ============================================================
// Alias für Rückwärtskompatibilität
// var initIndexedDB = window.initIndexedDB;  // [REMOVED: conflicts with function declaration]
const CAMPAIGN_INDEX_KEY = APP_CONFIG.CAMPAIGN_INDEX_KEY;
function getCampaignIndex() {
    return StorageAPI.getJSON(CAMPAIGN_INDEX_KEY, {
        campaigns: [],
        active: APP_CONFIG.STORAGE_KEY
    });
}
// Liefert das StorageAPI-Ergebnis ({success, error?}), damit Aufrufer einen gescheiterten
// Index-Write erkennen koennen (deleteCampaign bricht dann ab, R04/R07).
function saveCampaignIndex(index) {
    return StorageAPI.setJSON(CAMPAIGN_INDEX_KEY, index);
}
// Anzeigename einer Kampagne (Code-Review 2026-09-21, R05: Backup-Modal und
// Restore-Rueckfrage nennen die Kampagne): Standard-Kampagne, sonst der Name aus dem
// Index, sonst der Schluessel selbst.
function getCampaignDisplayName(key) {
    if (key === APP_CONFIG.STORAGE_KEY) return 'Standard-Kampagne';
    const index = getCampaignIndex();
    const campaigns = index && Array.isArray(index.campaigns) ? index.campaigns : [];
    const entry = campaigns.find(c => c && c.key === key);
    return entry && typeof entry.name === 'string' && entry.name !== '' ? entry.name : key;
}
// ============================================================
// KAMPAGNENANLAGE (Code-Review 2026-09-21, R07)
// INVARIANTE: der Index verweist nie auf eine Kampagne, deren Daten nicht gespeichert sind,
// und `active` aendert sich nur im letzten, einzigen Indexwrite. Reihenfolge: Daten
// (writeCampaignData: localStorage oder IndexedDB nach den Regeln von save()) -> EIN
// Indexwrite; jeder Fehlschlag nimmt die geschriebenen Daten wieder zurueck.
// ============================================================
/**
 * Liest den Kampagnenindex STRENG. Ein vorhandener, aber unlesbarer Index wird nie durch
 * einen Standardindex ersetzt: getJSON() liefert dann den Rueckfallwert, und wer den
 * zurueckschreibt, macht jeden Kampagneneintrag unerreichbar.
 * @returns {{ok: true, index: {campaigns: Array, active: string}} | {ok: false, error: string}}
 */
function readCampaignIndexStrict() {
    const raw = StorageAPI.get(CAMPAIGN_INDEX_KEY, null);
    if (raw === null) {
        return { ok: true, index: { campaigns: [], active: APP_CONFIG.STORAGE_KEY } };
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ok: false, error: 'Kampagnenindex ist beschädigt' };
    }
    if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        !Array.isArray(parsed.campaigns)
    ) {
        return { ok: false, error: 'Kampagnenindex ist beschädigt' };
    }
    return { ok: true, index: parsed };
}
/**
 * Freier Schluessel fuer eine neue Kampagne. Eine zufaellige Kennung trennt Tabs,
 * die denselben Millisekundentakt sehen. Das numerische Suffix erhaelt das
 * Schluesselformat bestehender Umzugsdateien.
 * @param {{campaigns: Array}} index - streng gelesener Index
 * @param {Set<string>} tried - in IndexedDB bereits als belegt erkannte Kandidaten
 * @returns {string}
 */
function newCampaignKey(index, tried) {
    const entropy = new Uint32Array(4);
    if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(entropy);
    } else {
        for (let i = 0; i < entropy.length; i++) entropy[i] = Math.floor(Math.random() * 2 ** 32);
    }
    const random = Array.from(entropy, n => String(n).padStart(10, '0')).join('');
    const base = 'dnd-campaign-' + Date.now() + '-' + random;
    const taken = key =>
        tried.has(key) ||
        index.campaigns.some(c => c && c.key === key) ||
        StorageAPI.get(key, null) !== null;
    let key = base;
    for (let n = 1; taken(key); n++) key = base + n;
    return key;
}
/**
 * Entfernt die Daten einer eben angelegten, nicht in den Index uebernommenen Kampagne.
 * Nur den Speicherzweig anfassen, in dem diese Anlage erfolgreich geschrieben hat.
 * @param {string} key
 * @param {'localStorage'|'indexedDB'} backend - wohin writeCampaignData() geschrieben hat
 */
async function rollbackNewCampaignData(key, backend) {
    const current = readCampaignIndexStrict();
    if (current.ok && current.index.campaigns.some(c => c && c.key === key)) return;
    if (backend === 'localStorage') {
        StorageAPI.remove(key);
        StorageAPI.remove(key + '_ts');
        return;
    }
    try {
        await window.idbWriteTx(
            ['campaigns'],
            tx => tx.objectStore('campaigns').delete(key),
            { durability: 'strict' }
        );
    } catch (error) {
        if (APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log(
                'addCampaignWithData',
                error,
                'Rueckbau der neuen Kampagne unvollstaendig: ' + key
            );
        }
    }
}
/**
 * Legt eine Kampagne atomar an: Daten zuerst, danach EIN Indexwrite (Eintrag, bei
 * activate auch `active`). Scheitert ein Schritt, werden die Daten zurueckgenommen und der
 * Index bleibt byte-identisch. Wirft nie.
 * @param {string} name - Anzeigename
 * @param {object|string} data - vollstaendiger Kampagnenstand
 * @param {{activate?: boolean}} [options]
 * @returns {Promise<{success: true, key: string, backend: string} |
 *   {success: false, stage: 'index'|'data'|'unexpected', key?: string, error: *}>}
 */
async function addCampaignWithData(name, data, { activate = false } = {}) {
    const create = () => _addCampaignWithData(name, data, activate);
    let started = false;
    try {
        const locks = window.navigator?.locks;
        if (!locks?.request) return create();
        return await locks.request(CAMPAIGN_INDEX_KEY, () => {
            started = true;
            return create();
        });
    } catch (error) {
        // Wo Web Locks gesperrt sind, bleiben zufaellige Schluessel und IDB-add wirksam.
        if (!started) return create();
        return { success: false, stage: 'unexpected', error };
    }
}

async function _addCampaignWithData(name, data, activate) {
    let key = null;
    let backend = null;
    try {
        const before = readCampaignIndexStrict();
        if (!before.ok) return { success: false, stage: 'index', error: before.error };
        const tried = new Set();
        let write;
        for (let attempt = 0; attempt < 4; attempt++) {
            key = newCampaignKey(before.index, tried);
            write = await window.writeCampaignData(key, data, { createOnly: true });
            if (!write?.collision) break;
            tried.add(key);
        }
        if (!write || !write.success) {
            // Ohne bestaetigten Write gehoert uns kein Datensatz zum Entfernen.
            return { success: false, stage: 'data', key, error: write && write.error };
        }
        backend = write.backend;
        // Nach dem await frisch lesen: ein anderer Tab kann den Index inzwischen geaendert haben
        const current = readCampaignIndexStrict();
        if (!current.ok) {
            await rollbackNewCampaignData(key, backend);
            return { success: false, stage: 'index', key, error: current.error };
        }
        if (current.index.campaigns.some(c => c && c.key === key)) {
            return { success: false, stage: 'index', key, error: 'Kampagnenschlüssel ist bereits belegt' };
        }
        const next = Object.assign({}, current.index, {
            campaigns: current.index.campaigns.concat([
                { key, name, created: new Date().toISOString() }
            ])
        });
        if (activate) next.active = key;
        const indexResult = saveCampaignIndex(next);
        if (!indexResult || !indexResult.success) {
            await rollbackNewCampaignData(key, backend);
            return {
                success: false,
                stage: 'index',
                key,
                error: (indexResult && indexResult.error) || 'Index nicht gespeichert'
            };
        }
        return { success: true, key, backend };
    } catch (error) {
        if (key && backend) await rollbackNewCampaignData(key, backend);
        return {
            success: false,
            stage: 'unexpected',
            key,
            error: (error && error.message) || String(error)
        };
    }
}
// Doppelklick-Schutz: waehrend einer laufenden Anlage (IndexedDB-Rueckfall ist asynchron)
// wird ein zweiter Klick ignoriert
let _campaignCreateInFlight = false;
// async (R07): der data-action-'call'-Dispatcher ignoriert das Promise; die Funktion lehnt nie ab
async function createCampaign() {
    const input = $('new-campaign-name');
    if (!input || _campaignCreateInFlight) return;
    const name = input.value.trim().slice(0, 100);
    if (!name) {
        showToast('⚠️ Name erforderlich', 'error');
        return;
    }
    _campaignCreateInFlight = true;
    input.disabled = true;
    try {
        // Vollstaendiges Grundgeruest aus initializeData(); eine neue Kampagne wird nicht aktiviert
        const result = await addCampaignWithData(name, window.initializeData());
        if (!result.success) {
            if (window.ErrorHandler) {
                window.ErrorHandler.log(
                    'createCampaign',
                    new Error(String(result.error)),
                    result.stage
                );
            }
            showToast('❌ Fehler beim Erstellen der Kampagne', 'error');
            return;
        }
        input.value = '';
        renderCampaignList();
        showToast(`Kampagne "${name}" erstellt`);
    } finally {
        input.disabled = false;
        _campaignCreateInFlight = false;
    }
}
/**
 * D-C (Nutzerentscheidung 2026-09-27): Ist dieser Tab VERALTET und hat er ausdrueckliche, noch
 * nicht gespeicherte Arbeit, darf sein Stand die neueren gespeicherten Daten der alten
 * Kampagne NICHT ueberschreiben — verfallen darf er aber auch nicht. Er wird deshalb als
 * GESCHUETZTE Sicherungskopie (kind 'safety') der ALTEN Kampagne gesichert; erst danach wird
 * gewechselt. Scheitert die Kopie, wird NICHT gewechselt.
 *
 * Vorher schrieb flushPendingSaveAndSettle() hier zu Recht nichts (der Save wuerde den
 * fremden, neueren Stand ueberschreiben), liess den Save aber eingeplant: das beforeunload des
 * Neuladens fragte nach (D5), und nach "Bleiben" zeigte der Tab die ALTE Kampagne, waehrend
 * index.active schon auf die neue zeigte.
 * Wirft nie.
 * @returns {Promise<{mayContinue: boolean, secured: boolean}>} secured: der Stand dieses Tabs
 *   ist gesichert (oder enthielt keinen sicherungsfaehigen Inhalt) — dann wird die
 *   Schreibsperre statt eines Flushs benutzt
 */
async function secureStaleTabBeforeSwitch() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    const veraltet =
        !!key &&
        typeof window.isCampaignStorageStale === 'function' &&
        window.isCampaignStorageStale(key);
    const ausdruecklich =
        typeof window.hasExplicitPendingWork === 'function' && window.hasExplicitPendingWork();
    if (!veraltet || !ausdruecklich) return { mayContinue: true, secured: false };
    let status = 'failed';
    try {
        const snapshot = JSON.stringify(window.D);
        status =
            typeof window.createAutoBackup === 'function'
                ? await window.createAutoBackup({ reason: 'safety' })
                : 'failed';
        if (status !== 'failed' && snapshot !== JSON.stringify(window.D)) {
            showToast(
                '⚠️ Kampagnenwechsel abgebrochen: Der Stand hat sich während der Sicherung geändert. Starte den Wechsel erneut, um die Änderungen zu sichern.',
                'warning',
                8000
            );
            return { mayContinue: false, secured: false };
        }
    } catch (error) {
        if (window.ErrorHandler) {
            window.ErrorHandler.log('switchCampaign', error, 'Sicherungskopie vor dem Wechsel');
        }
        status = 'failed';
    }
    if (status === 'failed') {
        showToast(
            '❌ Kampagnenwechsel abgebrochen: Die ungespeicherte Änderung dieses Tabs konnte ' +
                'nicht als Sicherungskopie gesichert werden.',
            'error',
            8000
        );
        return { mayContinue: false, secured: false };
    }
    // Zustellbarkeit (Korrekturrunde F9): showToast() schreibt nur in das DOM-Element
    // #event-log, und switchCampaign() ruft unmittelbar danach location.reload() — der Toast
    // allein ist nie lesbar. Der Hinweis ist aber das Einzige, was den Weg zurueck nennt: die
    // Sicherungskopie gehoert der ALTEN Kampagne, und getBackups() zeigt nur die Backups der
    // aktiven. Er wird deshalb blockierend per nativem alert() zugestellt, VOR dem Neuladen.
    const alteKampagne = getCampaignDisplayName(key);
    if (status === 'skipped-empty') {
        // Kein sicherungsfaehiger Inhalt (gemeinsame Definition hasCampaignContent): eine
        // Sicherungskopie koennte nichts zurueckholen. Ehrlich benennen statt Erfolg melden.
        showToast(
            '⚠️ Veralteter Tab: Die ungespeicherte Änderung enthielt keinen sicherungsfähigen ' +
                'Inhalt und wurde nicht gespeichert.',
            'warning',
            8000
        );
        alert(
            `⚠️ Veralteter Tab\n\nEin anderer Tab hat „${alteKampagne}“ inzwischen gespeichert. Die ungespeicherte Änderung dieses Tabs enthielt keinen sicherungsfähigen Inhalt und wurde nicht gespeichert.`
        );
        return { mayContinue: true, secured: true };
    }
    showToast(
        '⚠️ Ein anderer Tab hat diese Kampagne inzwischen gespeichert. Die ungespeicherte ' +
            'Änderung dieses Tabs wurde als Sicherungskopie gesichert — über Backups ' +
            'wiederherstellbar.',
        'warning',
        8000
    );
    alert(
        `⚠️ Veralteter Tab\n\nEin anderer Tab hat „${alteKampagne}“ inzwischen gespeichert. Die ungespeicherte Änderung dieses Tabs wurde deshalb nicht in den Speicher geschrieben, sondern als geschützte Sicherungskopie von „${alteKampagne}“ gesichert.\n\nSo kommen Sie heran: zu „${alteKampagne}“ zurückwechseln und die Sicherungskopie unter Backups wiederherstellen.`
    );
    return { mayContinue: true, secured: true };
}
// async (R02): einen ausstehenden Save der alten Kampagne erst festschreiben und den Commit
// abwarten — sonst muesste das Verlassen im IndexedDB-Modus nachfragen
async function switchCampaign(key) {
    if (
        typeof window.flushPendingSaveAndSettle === 'function' &&
        !(await window.flushPendingSaveAndSettle({ allowStale: true }))
    ) {
        showToast(
            '⚠️ Kampagnenwechsel abgebrochen: Warte auf den laufenden Speichervorgang oder wiederhole das fehlgeschlagene Speichern.',
            'warning',
            8000
        );
        return;
    }
    // D-C: In einem veralteten Tab schreibt der Flush nichts. Ausdrueckliche Arbeit wird dann
    // erst gesichert (siehe secureStaleTabBeforeSwitch), sonst ginge sie beim Neuladen
    // verloren oder das beforeunload fragte nach.
    const sichern = async () => {
        const result = await secureStaleTabBeforeSwitch();
        if (result.secured && typeof window.retireCampaignWrites === 'function') {
            // Die Sicherung ist bestätigt. Die Sperre verwirft vorgemerkte Saves
            // und hält beforeunload beim anschließenden Neuladen still.
            await window.retireCampaignWrites();
        }
        return result;
    };
    const gesichert =
        typeof window.runWithCampaignSwitchProtection === 'function'
            ? await window.runWithCampaignSwitchProtection(sichern)
            : await sichern();
    if (!gesichert?.mayContinue) return;
    const index = getCampaignIndex();
    index.active = key;
    // Nur neu laden, wenn der Wechsel wirklich gespeichert ist (R07)
    const result = saveCampaignIndex(index);
    if (!result || !result.success) {
        // Die Sicherung bleibt erhalten. Ein neuer Save braucht einen neuen Auftrag (N55).
        if (gesichert.secured && typeof window.resumeCampaignWrites === 'function') {
            window.resumeCampaignWrites({ retryPending: false });
        }
        showToast('❌ Kampagnenwechsel fehlgeschlagen (Speicher voll?)', 'error');
        return;
    }
    location.reload();
}
// Loescht die Kampagne, die DIESER Tab zeigt (getActiveCampaignKey), nicht index.active:
// nach einem Wechsel in einem anderen Tab oder einem gescheiterten Import koennen beide
// auseinanderlaufen. Reihenfolge (R04/R07): Index zuerst (benannte Kampagne), dann
// removeCampaignData() — IndexedDB-Delete mit bestaetigtem Commit VOR localStorage.
// Erfolgsmeldung und Navigation erst danach.
async function deleteCampaign() {
    const key =
        typeof window.getActiveCampaignKey === 'function' ? window.getActiveCampaignKey() : null;
    if (!key) {
        alert(
            '❌ Fehler beim Löschen:\n\nDie aktive Kampagne konnte nicht bestimmt werden. Es wurde nichts gelöscht.'
        );
        return;
    }
    const isDefault = key === APP_CONFIG.STORAGE_KEY;
    const index = getCampaignIndex();
    // Datengröße ermitteln
    const dataSize = localStorage.getItem(key);
    const sizeKB = dataSize ? (dataSize.length / 1024).toFixed(1) : 0;
    const campaignName = isDefault
        ? 'Standard-Kampagne'
        : index.campaigns.find(c => c.key === key)?.name || 'Unbekannt';
    if (
        !confirm(
            `⚠️ "${campaignName}" LÖSCHEN?\n\nAlle Daten (${sizeKB} KB) werden gelöscht:\n- Charaktere, NPCs, Orte\n- Quests, Encounters\n- Initiative, Beute\n- Wiki, Netzwerk\n- Sessions\n- Automatische Backups dieser Kampagne\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!`
        )
    ) {
        return;
    }
    // R02: Schreibsperre ZUERST — ein ausstehender/ueberfaelliger save() oder das Verlassen
    // wuerde die geloeschte Kampagne sonst neu anlegen. Jeder Abbruchpfad hebt sie wieder auf.
    const resume = () => {
        if (typeof window.resumeCampaignWrites === 'function') window.resumeCampaignWrites();
    };
    let result;
    let started = false;
    try {
        await window.withCampaignIndexLock(async (assertHeld, runRollback) => {
            started = true;
            // Jeder wartende Löschvorgang sperrt erst seinen eigenen Schreibabschnitt.
            if (typeof window.retireCampaignWrites === 'function') await window.retireCampaignWrites();
            assertHeld();
            if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
            result = await _deleteCampaignStorage(
                key,
                isDefault,
                campaignName,
                resume,
                assertHeld,
                runRollback
            );
        });
        if (!result) return;
        if (result.error) throw result.error;
        // Erst nach Freigabe der Sperre navigieren oder die Erfolgsmeldung anzeigen.
        window.replaceCampaignData(window.D, window.initializeData());
        if (result.dataRemoved && !result.nurLokal) {
            alert(`✅ "${campaignName}" wurde gelöscht!\n\nDie Seite wird neu geladen...`);
        }
        window.location.href = window.location.pathname + '?cleared=' + Date.now();
    } catch (error) {
        if (started && !result?.dataRemoved) resume();
        const failure = result?.error ?? error;
        if (window.ErrorHandler) window.ErrorHandler.log('deleteCampaign', failure);
        alert('❌ Fehler beim Löschen:\n\n' + failure.message);
    }
}

async function _deleteCampaignStorage(key, isDefault, campaignName, resume, assertHeld, runRollback) {
    let dataRemoved = false;
    try {
        log('[deleteCampaign] Lösche Kampagne:', key);
        // 1. Benannte Kampagne: zuerst aus dem Index entfernen (frisch gelesen). Die aktive
        //    Auswahl eines anderen Tabs bleibt stehen; scheitert der Write, wird nichts geloescht.
        let entfernterEintrag = null; // gesetzt, sobald Schritt 1 den Eintrag entfernt hat
        let entferntePosition = -1;
        let warAktiv = false;
        if (!isDefault) {
            const current = getCampaignIndex();
            const campaigns = current.campaigns || [];
            entferntePosition = campaigns.findIndex(c => c && c.key === key);
            entfernterEintrag = campaigns[entferntePosition] || {
                key,
                name: campaignName
            };
            warAktiv = current.active === key;
            const next = Object.assign({}, current, {
                campaigns: campaigns.filter(c => c.key !== key)
            });
            if (warAktiv) next.active = APP_CONFIG.STORAGE_KEY;
            const indexResult = saveCampaignIndex(next);
            if (!indexResult || !indexResult.success) {
                entfernterEintrag = null;
                resume();
                alert(
                    '❌ Fehler beim Löschen:\n\nDer Kampagnenindex konnte nicht gespeichert werden. Es wurde nichts gelöscht.'
                );
                return;
            }
        }
        /**
         * Legt den entfernten Eintrag nach einem Abbruch an seine ursprüngliche Position zurück.
         * Ein inzwischen gespeicherter Eintrag oder Wechsel in eine andere Kampagne bleibt erhalten.
         * @returns {boolean} der Eintrag steht wieder im Index (oder war nie entfernt)
         */
        const indexEintragZuruecklegen = () => {
            if (!entfernterEintrag) return true;
            const { ok, index: current } = readCampaignIndexStrict();
            if (!ok) return false;
            const campaigns = (current.campaigns || []).slice();
            if (campaigns.some(c => c && c.key === key)) return true;
            campaigns.splice(
                entferntePosition < 0 ? campaigns.length : entferntePosition,
                0,
                entfernterEintrag
            );
            const next = Object.assign({}, current, { campaigns });
            if (warAktiv && current.active === APP_CONFIG.STORAGE_KEY) next.active = key;
            const result = saveCampaignIndex(next);
            return !!(result && result.success);
        };
        // 2. Gespeicherte Daten entfernen: IndexedDB (bestaetigter Commit) VOR localStorage
        const removal = await window.removeCampaignData(key, assertHeld);
        dataRemoved = !!(removal && removal.success);
        try {
            assertHeld();
        } catch (error) {
            if (entferntePosition >= 0 && !dataRemoved) {
                try {
                    await runRollback(async assertRollbackHeld => {
                        // Nach einem unterbrochenen Delete kann eine Kopie übrig sein.
                        const vorhanden =
                            StorageAPI.get(key, null) !== null ||
                            !!(await window.loadFromIndexedDBFallbackRaw(key));
                        assertRollbackHeld();
                        if (vorhanden && !indexEintragZuruecklegen()) {
                            throw new Error('Der Kampagnenindex konnte nicht gespeichert werden.');
                        }
                    });
                } catch (rollbackError) {
                    throw new Error(
                        `${error.message}. Der Kampagneneintrag konnte nicht wiederhergestellt werden (${rollbackError.message}).`,
                        { cause: rollbackError }
                    );
                }
            }
            throw error;
        }
        // D-B (Nutzerentscheidung 2026-09-27): IndexedDB ist gemeldet, liess sich aber nicht
        // OEFFNEN — ob dort eine Kopie liegt, ist unbekannt. Statt fail-closed ("Es wurde
        // nichts gelöscht") entscheidet der Nutzer, ob wenigstens die lokale Kopie weichen
        // soll. Ein abgebrochener Commit einer GEOEFFNETEN Datenbank bleibt fail-closed.
        let nurLokal = false;
        if (
            !dataRemoved &&
            removal &&
            removal.stage === 'indexedDB' &&
            removal.reason === 'open' &&
            typeof window.confirmLocalOnlyCampaignRemoval === 'function'
        ) {
            const entscheidung = window.confirmLocalOnlyCampaignRemoval(key, campaignName);
            if (entscheidung.removed) {
                nurLokal = true;
                dataRemoved = true;
            } else {
                // ABBRECHEN (oder ein Fehler beim Leeren): es ist nichts geloescht — also auch
                // der Indexeintrag zurueck, sonst haelt die Zusage der Rueckfrage nicht und die
                // Kampagne ist weg, obwohl ihre Daten liegen (Korrekturrunde F9). Danach bleibt
                // der Tab, wo er ist: keine Navigation, kein D-Reset, Schreibsperre auf.
                const zurueck = indexEintragZuruecklegen();
                resume();
                if (entscheidung.error && window.ErrorHandler) {
                    window.ErrorHandler.log(
                        'deleteCampaign',
                        entscheidung.error,
                        'Lokale Kampagnendaten konnten nicht entfernt werden'
                    );
                }
                const kopf = entscheidung.error
                    ? `⚠️ "${campaignName}": Die lokalen Daten ließen sich nicht entfernen.`
                    : `❌ "${campaignName}" wurde nicht gelöscht.\n\nEs wurde nichts gelöscht.`;
                let hinweis;
                if (!zurueck) {
                    hinweis =
                        'ACHTUNG: Die Kampagne ließ sich nicht in die Liste zurücklegen und ist ' +
                        `über die Oberfläche nicht mehr erreichbar. Ihre gespeicherten Daten liegen unverändert unter dem Schlüssel "${key}".`;
                } else if (entfernterEintrag) {
                    hinweis =
                        'Die Kampagne bleibt in der Liste — exportieren Sie sie und versuchen ' +
                        'Sie es später erneut.';
                } else {
                    hinweis = 'Exportieren Sie die Kampagne und versuchen Sie es später erneut.';
                }
                alert(kopf + '\n\n' + hinweis);
                return;
            }
        }
        if (!dataRemoved) {
            if (window.ErrorHandler) {
                window.ErrorHandler.log(
                    'deleteCampaign',
                    removal && removal.error,
                    'Kampagnendaten konnten nicht entfernt werden'
                );
            }
            if (isDefault) {
                resume();
                alert(
                    '❌ Fehler beim Löschen:\n\nDie IndexedDB-Kopie konnte nicht entfernt werden. Es wurde nichts gelöscht.'
                );
                return;
            }
            alert(
                `⚠️ "${campaignName}" wurde aus der Liste entfernt, aber die gespeicherten Daten konnten nicht vollständig gelöscht werden.`
            );
        } else if (nurLokal) {
            // Ehrlich benennen, was geschehen ist. Die Auto-Backups dieser Kampagne werden
            // hier BEWUSST nicht entfernt (Abweichung von D2 = A): sie sind der einzige Weg
            // zurueck, solange die IndexedDB-Kopie unerreichbar ist.
            alert(
                `⚠️ "${campaignName}": Nur die lokalen Daten wurden gelöscht.\n\nDie IndexedDB-Kopie konnte nicht entfernt werden und kann beim nächsten Start wieder auftauchen. Die automatischen Backups dieser Kampagne bleiben erhalten.`
            );
        } else {
            log('[deleteCampaign] Kampagnendaten entfernt');
            // D2 = A: auch die Auto-Backups dieser Kampagne entfernen — erst NACH dem
            // erfolgreichen Entfernen der Daten; ein Fehler hier haelt das Loeschen nicht auf
            if (typeof window.purgeCampaignBackups === 'function') {
                const purge = await window.purgeCampaignBackups(key);
                if (!purge.success && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
                    window.ErrorHandler.log(
                        'deleteCampaign',
                        purge.error,
                        'Auto-Backups der Kampagne konnten nicht entfernt werden'
                    );
                }
            }
        }
        return { dataRemoved, nurLokal };
    } catch (error) {
        return { dataRemoved, error };
    }
}
function renderCampaignList() {
    const c = $('campaign-list');
    if (!c) return;
    const index = getCampaignIndex();
    // Standard campaign
    let html = `<div class="campaign-item ${index.active === APP_CONFIG.STORAGE_KEY ? 'active' : ''}" data-action="switch-campaign" data-value="${APP_CONFIG.STORAGE_KEY}">
        <div>
            <div class="campaign-name">📚 Standard-Kampagne</div>
            <div class="campaign-info">Ursprüngliche Daten</div>
        </div>
        ${index.active === APP_CONFIG.STORAGE_KEY ? '<span style="color:var(--green);">✓ Aktiv</span>' : ''}
    </div>`;
    // Other campaigns
    index.campaigns.forEach(camp => {
        html += `<div class="campaign-item ${index.active === camp.key ? 'active' : ''}" data-action="switch-campaign" data-value="${esc(camp.key)}">
            <div>
                <div class="campaign-name">${esc(camp.name)}</div>
                <div class="campaign-info">Erstellt: ${esc(formatDate(camp.created))}</div>
            </div>
            ${index.active === camp.key ? '<span style="color:var(--green);">✓ Aktiv</span>' : ''}
        </div>`;
    });
    c.innerHTML = html;
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.getCampaignIndex = getCampaignIndex;
window.getCampaignDisplayName = getCampaignDisplayName;
window.readCampaignIndexStrict = readCampaignIndexStrict;
window.addCampaignWithData = addCampaignWithData;
window.createCampaign = createCampaign;
window.switchCampaign = switchCampaign;
window.deleteCampaign = deleteCampaign;
