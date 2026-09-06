// [SECTION:DMSCREEN_WIDGETS_COMBAT]
// ============================================================
// DM SCREEN - KAMPFBEZOGENE REFERENZ-WIDGETS
// ============================================================
// Teil der MAINT-01-Aufteilung von dmscreen-render.js (Plan 13-12, Task 2).
// Enthaelt die 5 kampfbezogenen Referenz-Widgets (Aktionen, Kampfoekonomie,
// Schadensarten, Gelaende, improvisierte Waffen). Reine, zustandslose
// Referenzdarstellungen ohne Ereignisbehandlung und ohne gegenseitige
// Abhaengigkeit; werden ausschliesslich ueber die Widget-Registry
// (getDMScreenWidgets() in dmscreen-render.js) aufgerufen, daher keine
// window.-Exporte (CLAUDE.md Export Audit Rule).
// ============================================================

/**
 * Aktionen-Widget - Übersicht aller Aktionstypen im Kampf
 */
function renderDMSActionsWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-ref-section">
                <div class="dms-ref-title">⚡ Aktion</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Angriff</span>
                    <span class="dms-ref-tag">Ausweichen</span>
                    <span class="dms-ref-tag">Rennen</span>
                    <span class="dms-ref-tag">Helfen</span>
                    <span class="dms-ref-tag">Verstecken</span>
                    <span class="dms-ref-tag">Bereit</span>
                    <span class="dms-ref-tag">Suchen</span>
                    <span class="dms-ref-tag">Zaubern</span>
                    <span class="dms-ref-tag">Greifen</span>
                    <span class="dms-ref-tag">Schieben</span>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">⭐ Bonusaktion</div>
                <div class="dms-ref-note">Nur wenn Fähigkeit/Zauber es erlaubt</div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">↩️ Reaktion</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Gelegenheitsangriff</span>
                    <span class="dms-ref-tag">Bereit auslösen</span>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">🔄 Freie Interaktion</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Tür öffnen</span>
                    <span class="dms-ref-tag">Waffe ziehen</span>
                    <span class="dms-ref-tag">Gegenstand aufheben</span>
                </div>
            </div>
        </div>
    `;
}
/**
 * Kampfökonomie-Widget - Was du pro Runde tun kannst
 */
function renderDMSEconomyWidget() {
    return `
        <div class="dms-ref-widget dms-economy-widget">
            <div class="dms-economy-section">
                <div class="dms-economy-header">Dein Zug</div>
                <div class="dms-economy-item"><span class="dms-econ-icon">🏃</span><span>Bewegung</span><span class="dms-econ-val">bis zu Geschw.</span></div>
                <div class="dms-economy-item"><span class="dms-econ-icon">⚡</span><span>1× Aktion</span><span class="dms-econ-val">immer</span></div>
                <div class="dms-economy-item"><span class="dms-econ-icon">⭐</span><span>1× Bonusaktion</span><span class="dms-econ-val">wenn vorhanden</span></div>
                <div class="dms-economy-item"><span class="dms-econ-icon">🔄</span><span>1× Freie Interaktion</span><span class="dms-econ-val">immer</span></div>
            </div>
            <div class="dms-economy-section">
                <div class="dms-economy-header">Jederzeit</div>
                <div class="dms-economy-item"><span class="dms-econ-icon">↩️</span><span>1× Reaktion</span><span class="dms-econ-val">bis nächster Zug</span></div>
            </div>
            <div class="dms-ref-note">Bewegung kann aufgeteilt werden</div>
        </div>
    `;
}
/**
 * Improvisierte Waffen-Widget
 */
function renderDMSImprovisedWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-ref-section">
                <div class="dms-ref-title">Grundregeln</div>
                <div class="dms-obj-table">
                    <div class="dms-obj-row"><span>Unähnlich</span><span>1d4</span></div>
                    <div class="dms-obj-row"><span>Ähnlich (z.B. Tischbein)</span><span>Wie Original</span></div>
                    <div class="dms-obj-row"><span>Geworfen</span><span>1d4, 20/60 ft</span></div>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">Beispiele</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Flasche → 1d4 Stich</span>
                    <span class="dms-ref-tag">Stuhl → 1d4 Wucht</span>
                    <span class="dms-ref-tag">Pfanne → 1d4 Wucht</span>
                    <span class="dms-ref-tag">Glasscherbe → 1d4 Hieb</span>
                </div>
            </div>
            <div class="dms-ref-note">Keine Übung (außer Kneipenschläger-Talent)</div>
        </div>
    `;
}
/**
 * Schadensarten-Widget - Alle 13 Schadensarten
 */
function renderDMSDamageWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-damage-grid">
                <div class="dms-dmg-item physical"><span class="dms-dmg-icon">🔨</span><span>Wucht</span></div>
                <div class="dms-dmg-item physical"><span class="dms-dmg-icon">🗡️</span><span>Stich</span></div>
                <div class="dms-dmg-item physical"><span class="dms-dmg-icon">⚔️</span><span>Hieb</span></div>
                <div class="dms-dmg-item fire"><span class="dms-dmg-icon">🔥</span><span>Feuer</span></div>
                <div class="dms-dmg-item cold"><span class="dms-dmg-icon">❄️</span><span>Kälte</span></div>
                <div class="dms-dmg-item lightning"><span class="dms-dmg-icon">⚡</span><span>Blitz</span></div>
                <div class="dms-dmg-item acid"><span class="dms-dmg-icon">🧪</span><span>Säure</span></div>
                <div class="dms-dmg-item poison"><span class="dms-dmg-icon">☠️</span><span>Gift</span></div>
                <div class="dms-dmg-item necrotic"><span class="dms-dmg-icon">💀</span><span>Nekrotisch</span></div>
                <div class="dms-dmg-item radiant"><span class="dms-dmg-icon">✨</span><span>Strahlend</span></div>
                <div class="dms-dmg-item force"><span class="dms-dmg-icon">💫</span><span>Energie</span></div>
                <div class="dms-dmg-item psychic"><span class="dms-dmg-icon">🧠</span><span>Psychisch</span></div>
                <div class="dms-dmg-item thunder"><span class="dms-dmg-icon">🔊</span><span>Donner</span></div>
            </div>
            <div class="dms-ref-note">Häufige Resistenzen: Gift, Feuer | Selten: Energie, Strahlend</div>
        </div>
    `;
}
/**
 * Gelände-Widget - Geländetypen und Effekte
 */
function renderDMSTerrainWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-terrain-list">
                <div class="dms-terrain-item normal">
                    <span class="dms-terrain-type">Normal</span>
                    <span class="dms-terrain-effect">Keine Einschränkung</span>
                </div>
                <div class="dms-terrain-item difficult">
                    <span class="dms-terrain-type">Schwierig</span>
                    <span class="dms-terrain-effect">2× Bewegungskosten</span>
                </div>
                <div class="dms-terrain-item hazard">
                    <span class="dms-terrain-type">Gefährlich</span>
                    <span class="dms-terrain-effect">Schaden bei Betreten</span>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">Beispiele schwierig</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Geröll</span>
                    <span class="dms-ref-tag">Unterholz</span>
                    <span class="dms-ref-tag">Schnee</span>
                    <span class="dms-ref-tag">Schlamm</span>
                    <span class="dms-ref-tag">Möbel</span>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">Gefährlich</div>
                <div class="dms-ref-list">
                    <span class="dms-ref-tag">Lava 10d10🔥</span>
                    <span class="dms-ref-tag">Dornen 1d4</span>
                    <span class="dms-ref-tag">Fall 1d6/3m</span>
                </div>
            </div>
        </div>
    `;
}
