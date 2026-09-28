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
 * Freier Schluessel fuer eine neue Kampagne: weder im Index noch in localStorage belegt. So
 * kann ein Rueckbau nie fremde Daten loeschen (zwei Anlagen in derselben Millisekunde
 * bekommen ein Zaehler-Suffix).
 * @param {{campaigns: Array}} index - streng gelesener Index
 * @returns {string}
 */
function newCampaignKey(index) {
    const taken = key =>
        index.campaigns.some(c => c && c.key === key) || StorageAPI.get(key, null) !== null;
    const base = 'dnd-campaign-' + Date.now();
    let key = base;
    for (let n = 1; taken(key); n++) key = base + '-' + n;
    return key;
}
/**
 * Entfernt die Daten einer eben angelegten, nicht in den Index uebernommenen Kampagne.
 * Nur localStorage beschrieben: gezielt dort (funktioniert auch ohne oeffnbare IndexedDB);
 * sonst ueber removeCampaignData() (IndexedDB mit bestaetigtem Commit, dann localStorage).
 * @param {string} key
 * @param {'localStorage'|'indexedDB'|null} backend - wohin writeCampaignData() geschrieben hat
 */
async function rollbackNewCampaignData(key, backend) {
    if (backend === 'localStorage') {
        StorageAPI.remove(key);
        StorageAPI.remove(key + '_ts');
        return;
    }
    const removal =
        typeof window.removeCampaignData === 'function'
            ? await window.removeCampaignData(key)
            : null;
    if ((!removal || !removal.success) && APP_CONFIG.DEBUG_MODE && window.ErrorHandler) {
        window.ErrorHandler.log(
            'addCampaignWithData',
            removal && removal.error,
            'Rueckbau der neuen Kampagne unvollstaendig: ' + key
        );
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
    let key = null;
    let backend = null;
    try {
        const before = readCampaignIndexStrict();
        if (!before.ok) return { success: false, stage: 'index', error: before.error };
        key = newCampaignKey(before.index);
        const write = await window.writeCampaignData(key, data);
        if (!write || !write.success) {
            await rollbackNewCampaignData(key, null);
            return { success: false, stage: 'data', key, error: write && write.error };
        }
        backend = write.backend;
        // Nach dem await frisch lesen: ein anderer Tab kann den Index inzwischen geaendert haben
        const current = readCampaignIndexStrict();
        if (!current.ok) {
            await rollbackNewCampaignData(key, backend);
            return { success: false, stage: 'index', key, error: current.error };
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
        if (key) await rollbackNewCampaignData(key, backend);
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
        status =
            typeof window.createAutoBackup === 'function'
                ? await window.createAutoBackup({ reason: 'safety' })
                : 'failed';
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
    if (typeof window.flushPendingSaveAndSettle === 'function') {
        await window.flushPendingSaveAndSettle();
    }
    // D-C: In einem veralteten Tab schreibt der Flush nichts. Ausdrueckliche Arbeit wird dann
    // erst gesichert (siehe secureStaleTabBeforeSwitch), sonst ginge sie beim Neuladen
    // verloren oder das beforeunload fragte nach.
    const gesichert = await secureStaleTabBeforeSwitch();
    if (!gesichert.mayContinue) return;
    if (gesichert.secured && typeof window.retireCampaignWrites === 'function') {
        // Schreibsperre statt Flush: sie verwirft den ausstehenden Save und haelt das
        // beforeunload still (persistOnUnload kehrt unter der Sperre sofort zurueck). Der
        // Stand liegt in der Sicherungskopie, der Speicher behaelt den neueren fremden Stand.
        await window.retireCampaignWrites();
    }
    const index = getCampaignIndex();
    index.active = key;
    // Nur neu laden, wenn der Wechsel wirklich gespeichert ist (R07)
    const result = saveCampaignIndex(index);
    if (!result || !result.success) {
        // Der Tab bleibt, wo er ist — und muss wieder schreiben duerfen
        if (gesichert.secured && typeof window.resumeCampaignWrites === 'function') {
            window.resumeCampaignWrites();
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
    // Soundboard-Audio stoppen — Web Audio überlebt sonst den D-Reset und spielt im Hintergrund weiter
    if (typeof window.stopAllTracks === 'function') window.stopAllTracks();
    // R02: Schreibsperre ZUERST — ein ausstehender/ueberfaelliger save() oder das Verlassen
    // wuerde die geloeschte Kampagne sonst neu anlegen. Jeder Abbruchpfad hebt sie wieder auf.
    const resume = () => {
        if (typeof window.resumeCampaignWrites === 'function') window.resumeCampaignWrites();
    };
    if (typeof window.retireCampaignWrites === 'function') await window.retireCampaignWrites();
    let dataRemoved = false;
    try {
        log('[deleteCampaign] Lösche Kampagne:', key);
        // 1. Benannte Kampagne: zuerst aus dem Index entfernen (frisch gelesen). Die aktive
        //    Auswahl eines anderen Tabs bleibt stehen; scheitert der Write, wird nichts geloescht.
        let entfernterEintrag = null; // gesetzt, sobald Schritt 1 den Eintrag entfernt hat
        let warAktiv = false;
        if (!isDefault) {
            const current = getCampaignIndex();
            entfernterEintrag = (current.campaigns || []).find(c => c && c.key === key) || {
                key,
                name: campaignName
            };
            warAktiv = current.active === key;
            const next = Object.assign({}, current, {
                campaigns: (current.campaigns || []).filter(c => c.key !== key)
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
         * Legt den in Schritt 1 entfernten Indexeintrag zurueck (Korrekturrunde F9). Notwendig
         * nur auf dem D-B-Abbruchpfad: dort ist NICHTS geloescht, die Rueckfrage hat das
         * ausdruecklich zugesagt ("ABBRECHEN: Es wird nichts geloescht. Erst exportieren"), und
         * ohne den Eintrag waere die Kampagne ueber die Oberflaeche nicht mehr erreichbar —
         * getCampaignIndex()/renderCampaignList() zeigen nur Standard + index.campaigns, eine
         * Waisen-Wiederherstellung gibt es nicht. Frisch gelesen, damit ein anderer Tab nicht
         * ueberschrieben wird; `active` nur dann zurueck, wenn niemand sonst gewechselt hat.
         * @returns {boolean} der Eintrag steht wieder im Index (oder war nie entfernt)
         */
        const indexEintragZuruecklegen = () => {
            if (!entfernterEintrag) return true;
            const current = getCampaignIndex();
            const campaigns = (current.campaigns || []).slice();
            if (!campaigns.some(c => c && c.key === key)) campaigns.push(entfernterEintrag);
            const next = Object.assign({}, current, { campaigns });
            if (warAktiv && current.active === APP_CONFIG.STORAGE_KEY) next.active = key;
            const result = saveCampaignIndex(next);
            return !!(result && result.success);
        };
        // 2. Gespeicherte Daten entfernen: IndexedDB (bestaetigter Commit) VOR localStorage
        const removal = await window.removeCampaignData(key);
        dataRemoved = !!(removal && removal.success);
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
        // 3. Globales D-Objekt zurücksetzen (falls Seite nicht neu lädt) — vollstaendiges
        //    Grundgeruest aus initializeData(), in place (D ist const)
        window.replaceCampaignData(window.D, window.initializeData());
        if (dataRemoved && !nurLokal) {
            alert(`✅ "${campaignName}" wurde gelöscht!\n\nDie Seite wird neu geladen...`);
        }
        // 4. Seite mit Cache-Bypass neu laden
        window.location.href = window.location.pathname + '?cleared=' + Date.now();
    } catch (error) {
        // Nur solange nichts entfernt ist, darf der Tab wieder schreiben
        if (!dataRemoved) resume();
        if (window.ErrorHandler) {
            window.ErrorHandler.log('deleteCampaign', error);
        }
        alert('❌ Fehler beim Löschen:\n\n' + error.message);
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
        html += `<div class="campaign-item ${index.active === camp.key ? 'active' : ''}" data-action="switch-campaign" data-value="${camp.key}">
            <div>
                <div class="campaign-name">${esc(camp.name)}</div>
                <div class="campaign-info">Erstellt: ${formatDate(camp.created)}</div>
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
