// [SECTION:NOTES_TEMPLATES]
// Extrahiert aus spellslots.js
// Notizen-Templates
// Zeilen: 70

import { $ } from '@utils/basic';

// NOTIZEN TEMPLATES
// ============================================================
export const NOTE_TEMPLATES: Record<string, string> = {
    kampf: `<h3>⚔️ Kampfbericht</h3>
<p><b>Ort:</b> </p>
<p><b>Gegner:</b> </p>
<h4>Verlauf</h4>
<ul><li></li></ul>
<h4>Beute</h4>
<ul><li></li></ul>
<h4>Notizen</h4>
<p></p>`,

    sozial: `<h3>💬 Soziale Begegnung</h3>
<p><b>NPCs:</b> </p>
<p><b>Ort:</b> </p>
<h4>Gespräch</h4>
<blockquote></blockquote>
<h4>Ergebnisse</h4>
<ul><li></li></ul>
<h4>Offene Fragen</h4>
<ul><li></li></ul>`,

    exploration: `<h3>🗺️ Exploration</h3>
<p><b>Ort:</b> </p>
<p><b>Entdeckungen:</b></p>
<h4>Beschreibung</h4>
<p></p>
<h4>Gefundene Hinweise</h4>
<ul><li></li></ul>
<h4>Nächste Schritte</h4>
<ul><li></li></ul>`,

    rast: `<h3>🏕️ Rast</h3>
<p><b>Typ:</b> Kurze Rast / Lange Rast</p>
<p><b>Ort:</b> </p>
<h4>Aktivitäten während der Rast</h4>
<ul><li></li></ul>
<h4>Heilung</h4>
<ul><li></li></ul>
<h4>Ereignisse</h4>
<p></p>`,

    einkauf: `<h3>🛒 Einkauf & Handel</h3>
<p><b>Händler:</b> </p>
<p><b>Ort:</b> </p>
<h4>Gekauft</h4>
<table style="width:100%; border-collapse: collapse;"><tr><th style="border: 1px solid var(--border); padding: 4px;">Item</th><th style="border: 1px solid var(--border); padding: 4px;">Preis</th></tr><tr><td style="border: 1px solid var(--border); padding: 4px;"></td><td style="border: 1px solid var(--border); padding: 4px;"></td></tr></table>
<h4>Verkauft</h4>
<table style="width:100%; border-collapse: collapse;"><tr><th style="border: 1px solid var(--border); padding: 4px;">Item</th><th style="border: 1px solid var(--border); padding: 4px;">Preis</th></tr><tr><td style="border: 1px solid var(--border); padding: 4px;"></td><td style="border: 1px solid var(--border); padding: 4px;"></td></tr></table>
<h4>Sonstiges</h4>
<p></p>`
};

export function applyNoteTemplate(templateKey: string): void {
    const template = NOTE_TEMPLATES[templateKey];
    if (!template) return;

    const editor = $('session-text') as HTMLElement;
    if (editor) {
        // Wenn bereits Text vorhanden, frage nach
        if (editor.innerHTML.trim() && !confirm('Vorhandenen Text ersetzen?')) {
            return;
        }
        editor.innerHTML = template;
        editor.focus();
    }
}

// ============================================================
