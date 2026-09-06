// [SECTION:DMSCREEN_WIDGETS_REFERENCE]
// ============================================================
// DM SCREEN - CHARAKTER- UND UMGEBUNGSBEZOGENE REFERENZ-WIDGETS
// ============================================================
// Teil der MAINT-01-Aufteilung von dmscreen-render.js (Plan 13-12, Task 1).
// Enthaelt die 8 charakter- und umgebungsbezogenen Referenz-Widgets aus der
// urspruenglichen "NEUE REFERENZ-WIDGETS"-Sektion. Reine, zustandslose
// Referenzdarstellungen ohne Ereignisbehandlung und ohne gegenseitige
// Abhaengigkeit; werden ausschliesslich ueber die Widget-Registry
// (getDMScreenWidgets() in dmscreen-render.js) aufgerufen, daher keine
// window.-Exporte (CLAUDE.md Export Audit Rule).
// ============================================================

/**
 * Attribute-Widget - Die 6 Attribute mit Modifikator-Tabelle
 */
function renderDMSAttributesWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-attr-grid">
                <div class="dms-attr-item str"><span class="dms-attr-abbr">STR</span><span class="dms-attr-name">Stärke</span></div>
                <div class="dms-attr-item dex"><span class="dms-attr-abbr">DEX</span><span class="dms-attr-name">Geschick</span></div>
                <div class="dms-attr-item con"><span class="dms-attr-abbr">KON</span><span class="dms-attr-name">Konstitution</span></div>
                <div class="dms-attr-item int"><span class="dms-attr-abbr">INT</span><span class="dms-attr-name">Intelligenz</span></div>
                <div class="dms-attr-item wis"><span class="dms-attr-abbr">WIS</span><span class="dms-attr-name">Weisheit</span></div>
                <div class="dms-attr-item cha"><span class="dms-attr-abbr">CHA</span><span class="dms-attr-name">Charisma</span></div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">Modifikator-Tabelle</div>
                <div class="dms-mod-table">
                    <div class="dms-mod-row"><span>1</span><span>-5</span></div>
                    <div class="dms-mod-row"><span>2-3</span><span>-4</span></div>
                    <div class="dms-mod-row"><span>4-5</span><span>-3</span></div>
                    <div class="dms-mod-row"><span>6-7</span><span>-2</span></div>
                    <div class="dms-mod-row"><span>8-9</span><span>-1</span></div>
                    <div class="dms-mod-row"><span>10-11</span><span>±0</span></div>
                    <div class="dms-mod-row"><span>12-13</span><span>+1</span></div>
                    <div class="dms-mod-row"><span>14-15</span><span>+2</span></div>
                    <div class="dms-mod-row"><span>16-17</span><span>+3</span></div>
                    <div class="dms-mod-row"><span>18-19</span><span>+4</span></div>
                    <div class="dms-mod-row"><span>20-21</span><span>+5</span></div>
                    <div class="dms-mod-row"><span>22+</span><span>+6</span></div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Rettungswürfe-Widget - Übersicht mit typischen Auslösern
 */
function renderDMSSavesWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-save-list">
                <div class="dms-save-item str">
                    <span class="dms-save-attr">STR</span>
                    <span class="dms-save-desc">Festhalten, Schieben, Fallen widerstehen</span>
                </div>
                <div class="dms-save-item dex">
                    <span class="dms-save-attr">DEX</span>
                    <span class="dms-save-desc">Flächenzauber, Fallen, Reflexe</span>
                </div>
                <div class="dms-save-item con">
                    <span class="dms-save-attr">KON</span>
                    <span class="dms-save-desc">Gift, Krankheit, Konzentration</span>
                </div>
                <div class="dms-save-item int">
                    <span class="dms-save-attr">INT</span>
                    <span class="dms-save-desc">Illusionen, Psi-Angriffe</span>
                </div>
                <div class="dms-save-item wis">
                    <span class="dms-save-attr">WIS</span>
                    <span class="dms-save-desc">Bezauberung, Furcht, mental</span>
                </div>
                <div class="dms-save-item cha">
                    <span class="dms-save-attr">CHA</span>
                    <span class="dms-save-desc">Verbannung, Besitzergreifung</span>
                </div>
            </div>
            <div class="dms-ref-note">Häufigkeit: DEX › KON › WIS › CHA › INT › STR</div>
        </div>
    `;
}
/**
 * Fertigkeiten-Widget - Alle 18 Fertigkeiten nach Attribut
 */
function renderDMSSkillsWidget() {
    return `
        <div class="dms-ref-widget dms-skills-widget">
            <div class="dms-skill-group">
                <div class="dms-skill-header str">STR</div>
                <div class="dms-skill-item">Athletik</div>
            </div>
            <div class="dms-skill-group">
                <div class="dms-skill-header dex">DEX</div>
                <div class="dms-skill-item">Akrobatik</div>
                <div class="dms-skill-item">Fingerfertigkeit</div>
                <div class="dms-skill-item">Heimlichkeit</div>
            </div>
            <div class="dms-skill-group">
                <div class="dms-skill-header int">INT</div>
                <div class="dms-skill-item">Arkane Kunde</div>
                <div class="dms-skill-item">Geschichte</div>
                <div class="dms-skill-item">Nachforschung</div>
                <div class="dms-skill-item">Naturkunde</div>
                <div class="dms-skill-item">Religion</div>
            </div>
            <div class="dms-skill-group">
                <div class="dms-skill-header wis">WIS</div>
                <div class="dms-skill-item">Wahrnehmung</div>
                <div class="dms-skill-item">Einsicht</div>
                <div class="dms-skill-item">Medizin</div>
                <div class="dms-skill-item">Überleben</div>
                <div class="dms-skill-item">Tierkunde</div>
            </div>
            <div class="dms-skill-group">
                <div class="dms-skill-header cha">CHA</div>
                <div class="dms-skill-item">Täuschung</div>
                <div class="dms-skill-item">Einschüchtern</div>
                <div class="dms-skill-item">Auftreten</div>
                <div class="dms-skill-item">Überzeugen</div>
            </div>
        </div>
    `;
}
/**
 * Kreaturengröße-Widget - Größenkategorien und Platzbedarf
 */
function renderDMSSizesWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-size-table">
                <div class="dms-size-row header">
                    <span>Größe</span><span>Bereich</span><span>Feld</span>
                </div>
                <div class="dms-size-row"><span>Winzig</span><span>< 0,75m</span><span>½×½</span></div>
                <div class="dms-size-row"><span>Klein</span><span>0,75-1,5m</span><span>1×1</span></div>
                <div class="dms-size-row"><span>Mittel</span><span>1,5-2,4m</span><span>1×1</span></div>
                <div class="dms-size-row"><span>Groß</span><span>2,4-4,5m</span><span>2×2</span></div>
                <div class="dms-size-row"><span>Riesig</span><span>4,5-7,5m</span><span>3×3</span></div>
                <div class="dms-size-row"><span>Gigantisch</span><span>7,5m+</span><span>4×4+</span></div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-note">• Greifen: Ziel max. 1 Größe größer</div>
                <div class="dms-ref-note">• Reiten: Reittier min. 1 Größe größer</div>
                <div class="dms-ref-note">• Durch Feind: 2 Größen Unterschied</div>
            </div>
        </div>
    `;
}
/**
 * Objekte-Widget - RK und TP von Gegenständen
 */
function renderDMSObjectsWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-ref-section">
                <div class="dms-ref-title">RK nach Material</div>
                <div class="dms-obj-table">
                    <div class="dms-obj-row"><span>Stoff, Papier</span><span>11</span></div>
                    <div class="dms-obj-row"><span>Kristall, Glas</span><span>13</span></div>
                    <div class="dms-obj-row"><span>Holz, Knochen</span><span>15</span></div>
                    <div class="dms-obj-row"><span>Stein</span><span>17</span></div>
                    <div class="dms-obj-row"><span>Eisen, Stahl</span><span>19</span></div>
                    <div class="dms-obj-row"><span>Mithral</span><span>21</span></div>
                    <div class="dms-obj-row"><span>Adamantin</span><span>23</span></div>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">TP nach Größe</div>
                <div class="dms-obj-table">
                    <div class="dms-obj-row header"><span>Größe</span><span>Zerbrech.</span><span>Robust</span></div>
                    <div class="dms-obj-row"><span>Winzig</span><span>2</span><span>5</span></div>
                    <div class="dms-obj-row"><span>Klein</span><span>3</span><span>10</span></div>
                    <div class="dms-obj-row"><span>Mittel</span><span>4</span><span>18</span></div>
                    <div class="dms-obj-row"><span>Groß</span><span>5</span><span>27</span></div>
                </div>
            </div>
            <div class="dms-ref-note">Immun: Gift, Psychisch</div>
        </div>
    `;
}
/**
 * Ritual & Konzentration-Widget
 */
function renderDMSRitualWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-ref-section">
                <div class="dms-ref-title">🔮 Ritual</div>
                <div class="dms-ritual-list">
                    <div class="dms-ritual-item">• Zauberzeit: +10 Minuten</div>
                    <div class="dms-ritual-item">• Kein Zauberplatz verbraucht</div>
                    <div class="dms-ritual-item">• Konzentration während Ritual</div>
                    <div class="dms-ritual-item">• Unterbrechung = Neustart</div>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">🎯 Konzentration</div>
                <div class="dms-ritual-list">
                    <div class="dms-ritual-item">• Max. 1 Konz.-Zauber aktiv</div>
                    <div class="dms-ritual-item">• Endet: Neuer Zauber, bewusstlos, Tod</div>
                    <div class="dms-ritual-item highlight">• Bei Schaden: KON DC = max(10, Schaden÷2)</div>
                    <div class="dms-ritual-item">• Freiwillig beendbar (keine Aktion)</div>
                </div>
            </div>
        </div>
    `;
}
/**
 * Wissensgebiete-Widget - INT-Fertigkeiten und ihre Anwendung
 */
function renderDMSKnowledgeWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-knowledge-list">
                <div class="dms-knowledge-item">
                    <span class="dms-know-skill">Arkane Kunde</span>
                    <span class="dms-know-types">Aberrationen, Konstrukte, Elementare</span>
                </div>
                <div class="dms-knowledge-item">
                    <span class="dms-know-skill">Religion</span>
                    <span class="dms-know-types">Himmlische, Teuflische, Untote</span>
                </div>
                <div class="dms-knowledge-item">
                    <span class="dms-know-skill">Geschichte</span>
                    <span class="dms-know-types">Riesen, Humanoide</span>
                </div>
                <div class="dms-knowledge-item">
                    <span class="dms-know-skill">Naturkunde</span>
                    <span class="dms-know-types">Biester, Drachen, Feen, Pflanzen</span>
                </div>
                <div class="dms-knowledge-item">
                    <span class="dms-know-skill">Nachforschung</span>
                    <span class="dms-know-types">Hinweise, Rätsel, Schwachstellen</span>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">DC-Richtwerte</div>
                <div class="dms-dc-mini">
                    <span>10 Trivial</span>
                    <span>15 Mittel</span>
                    <span>20 Schwer</span>
                    <span>25 Sehr schwer</span>
                </div>
            </div>
        </div>
    `;
}
/**
 * Reisen & Traglast-Widget
 */
function renderDMSTravelWidget() {
    return `
        <div class="dms-ref-widget">
            <div class="dms-ref-section">
                <div class="dms-ref-title">Reisegeschwindigkeit (8h/Tag)</div>
                <div class="dms-travel-table">
                    <div class="dms-travel-row header"><span>Tempo</span><span>/h</span><span>/Tag</span><span>Effekt</span></div>
                    <div class="dms-travel-row"><span>Langsam</span><span>3km</span><span>24km</span><span>Heimlichkeit</span></div>
                    <div class="dms-travel-row"><span>Normal</span><span>4,5km</span><span>36km</span><span>—</span></div>
                    <div class="dms-travel-row"><span>Schnell</span><span>6km</span><span>48km</span><span>-5 Wahrn.</span></div>
                </div>
            </div>
            <div class="dms-ref-section">
                <div class="dms-ref-title">Traglast (STR-basiert)</div>
                <div class="dms-carry-table">
                    <div class="dms-carry-row"><span>Tragen</span><span>STR × 7,5 kg</span></div>
                    <div class="dms-carry-row"><span>Belastet (–3m)</span><span>> STR × 2,5 kg</span></div>
                    <div class="dms-carry-row"><span>Schwer (–6m, Nachteil)</span><span>> STR × 5 kg</span></div>
                </div>
            </div>
            <div class="dms-ref-note">Gewaltmarsch: KON DC 10+1/h nach 8h</div>
        </div>
    `;
}
