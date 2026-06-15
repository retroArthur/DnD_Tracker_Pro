// [SECTION:REISE_DEFAULT_TABLES]
// ACHTUNG: Diese Datei wird von tools/generate_reise_tables.py generiert.
// Nicht manuell bearbeiten! Aenderungen im Python-Skript vornehmen.
// Aufruf: python tools/generate_reise_tables.py
// ============================================================

/**
 * Gelaendetypen fuer den Reise-Simulator mit Distanzfaktoren.
 * Distanzfaktor 0.5 = schwieriges Gelaende halbiert Tagesmarsch.
 * @type {Array<{id: string, label: string, distanzFaktor: number}>}
 */
const REISE_GELÄNDE = [
    { id: 'normal',    label: 'Normal',             distanzFaktor: 1.0 },
    { id: 'schwierig', label: 'Schwieriges Gelaende', distanzFaktor: 0.5 },
    { id: 'gebirge',   label: 'Gebirge',             distanzFaktor: 0.5 },
    { id: 'sumpf',     label: 'Sumpf',               distanzFaktor: 0.5 },
    { id: 'meer',      label: 'Schiff',              distanzFaktor: 1.0 }
];

/**
 * Reisetempo-Definitionen (5e PHB S. 182).
 * Basiswerte in Meilen/Tag.
 * @type {Object.<string, {label: string, meilenProTag: number, effekt: string}>}
 */
const REISE_TEMPO = {
    langsam: { label: 'Langsam',  meilenProTag: 18, effekt: 'Heimlichkeit moeglich' },
    normal:  { label: 'Normal',   meilenProTag: 24, effekt: '\u2014' },
    schnell: { label: 'Schnell',  meilenProTag: 30, effekt: '\u22125 passive Wahrnehmung' }
};

/**
 * Begegnungstabellen nach Gelaendetyp (1W8).
 * Format kompatibel mit rollWeightedEntry(table): {diceType, entries:[{range, text}]}
 * @type {Object}
 */
const REISE_BEGEGNUNGS_TABELLEN = {
    wald:     { id: "begegnung_wald", diceType: 8, entries: [
            { range: "1", text: "1W4 Wölfe streifen durch das Unterholz." },
            { range: "2", text: "1W6 Goblins hinterhältig aufgestellt — Hinterhalt!" },
            { range: "3", text: "Ein verletzter Hirsch liegt auf dem Weg; Fährte führt zu einem Fallstrick." },
            { range: "4", text: "Eine Gruppe Holzfäller bittet um Hilfe gegen einen aggressiven Bären." },
            { range: "5", text: "1W4 Banditen, getarnt als Händler, sperren den Pfad." },
            { range: "6", text: "Ein alter Waldläufer bietet Essen und harmlose Information an." },
            { range: "7", text: "Ein einsamer Druide meditiert; greift niemanden an, bewacht aber seinen Kreis." },
            { range: "8", text: "Ein riesiger Elch mit leuchtenden Augen — Naturgeist oder Zeichen?" }
        ] },
    gebirge:     { id: "begegnung_gebirge", diceType: 8, entries: [
            { range: "1", text: "1W4 Bergziegen werden von einem Schneeleo gejagt — gefährliche Herde in Panik." },
            { range: "2", text: "1W6 Ork-Späher sichern einen Gebirgspass." },
            { range: "3", text: "Ein Steinlavinen-Geräusch — Würfelprobe oder 2W6 Wuchtschaden durch fallende Brocken." },
            { range: "4", text: "Eine kleine Zwergengruppe auf Erkundung, misstrauisch, aber handelswillig." },
            { range: "5", text: "1W4 Harpyien kreisen über einem engen Kamm." },
            { range: "6", text: "Ein verlassenes Bergdorf — Ruinen deuten auf einen Dämonangriff hin." },
            { range: "7", text: "Ein Yeti (Eisriese) beobachtet aus der Ferne; weicht zurück wenn nicht bedroht." },
            { range: "8", text: "Ein aufgebrachter Riese rollt Felsbrocken; seine Hütte wurde von Banditen geplündert." }
        ] },
    kueste:     { id: "begegnung_kueste", diceType: 8, entries: [
            { range: "1", text: "1W4 Riesenkrabben an einem Strandabschnitt; aggressiv bei Berührung." },
            { range: "2", text: "Ein gestrandetes Fischerboot mit verwundeten Überlebenden." },
            { range: "3", text: "1W4 Sahuagin waten aus dem Wasser — patrouillieren ihr Territorium." },
            { range: "4", text: "Ein Schiff unter falscher Flagge liegt in einer Bucht; Piraten beobachten das Ufer." },
            { range: "5", text: "Ein Leuchtturmwärter bittet um Hilfe — Geister machen nachts Licht unmöglich." },
            { range: "6", text: "Sturmtang treibt an Land; darin ein wasserdichter Behälter mit Nachricht." },
            { range: "7", text: "Eine Meerjungfrau (Nixe) tauscht Informationen gegen ein Silberobjekt." },
            { range: "8", text: "Nebelbank rollt heran; darin schimmert silhouettenhaft ein Geisterschiff." }
        ] },
    strasse:     { id: "begegnung_strasse", diceType: 8, entries: [
            { range: "1", text: "1W6 Straßenräuber verlangen Wegzoll; bereit zu verhandeln oder zu kämpfen." },
            { range: "2", text: "Eine umgekippte Handelskutsche — der Fahrer braucht Hilfe, die Ware ist verstreut." },
            { range: "3", text: "Ein Edelmann reitet vorbei, sucht seinen entlaufenen Boten." },
            { range: "4", text: "Militärpatrouille kontrolliert Ausweise und Waren." },
            { range: "5", text: "Ein Flüchtlingstreck aus einem nahen Dorf — Schreckensnachrichten." },
            { range: "6", text: "Ein Pilger mit Reliquie, der Begleitung nach dem nächsten Tempel sucht." },
            { range: "7", text: "Fahrendes Volk schlägt Lager auf — Wahrsagerin bietet fragwürdige Prophezeiung an." },
            { range: "8", text: "Totenstille — ein frisch aufgestellter Galgen am Wegrand, das Opfer ist verschwunden." }
        ] },
    ruinen:     { id: "begegnung_ruinen", diceType: 8, entries: [
            { range: "1", text: "2W4 Zombies sitzen in einer dunklen Kammer und reagieren erst auf Lärm." },
            { range: "2", text: "1W4 Schakale (oder Schrat) fressen an einem frischen Kadaver." },
            { range: "3", text: "Ein Mimic tarnt sich als Truhe — Warnsignal: Schimmel in perfektem Quadratmuster." },
            { range: "4", text: "Ein Geist schwebt durch einen Flur; er sucht seinen Mörder." },
            { range: "5", text: "Ein Räubertrupp hat die Ruine als Basis genutzt; Wache schläft." },
            { range: "6", text: "Ein altes Golem-Wächter aktiviert sich automatisch beim Betreten eines Raums." },
            { range: "7", text: "Eine alte Bibliothek — 1W4 wertvolle Schriftrollen, aber Decke ist instabil." },
            { range: "8", text: "Ein Kult-Ritual läuft im Keller; Kultisten zu abgelenkt zum Bemerken — noch." }
        ] },
    sumpf:     { id: "begegnung_sumpf", diceType: 8, entries: [
            { range: "1", text: "1W4 Riesenschlangen umringeln leise einen Baum in der Nähe des Pfades." },
            { range: "2", text: "Irrlichter locken in den Sumpfnebel — Orientierung verloren ohne Würfelprobe." },
            { range: "3", text: "Ein Trapper, der den Sumpf kennt, bietet Führerdienste gegen fairen Lohn an." },
            { range: "4", text: "1W6 Lizardfolk-Krieger, misstrauisch gegenüber Eindringlingen in ihr Revier." },
            { range: "5", text: "Schlickfalle — Boden gibt nach; Strength-Probe oder 1 Runde eingesunken." },
            { range: "6", text: "Ein altes Hexenhaus auf Stelzen; die Bewohnerin handelt mit Giften und Zutaten." },
            { range: "7", text: "Ein Sumpftroll schläft auf einem Geflecht aus Schilf; Erschütterung weckt ihn." },
            { range: "8", text: "Grüner Nebel senkt sich: Giftnebel-Zone — CON-Probe oder 1 Stufe Erschöpfung." }
        ] }
};

/**
 * Wettertabellen nach Klima und Jahreszeit (1W8).
 * Format: WETTER_TABELLEN[klima][jahreszeit] = {id, diceType, entries}
 * @type {Object}
 */
const WETTER_TABELLEN = {
    'gemässigt': {
        winter:         { id: "wetter_gem_winter", diceType: 8, entries: [
                { range: "1", text: "Eisiger Ostwind, Schneeschauer — Reise um 2 Meilen verlangsamt, Sicht 30 m." },
                { range: "2", text: "Dichter Schneefall, keine Sicht über 10 m — Orientierungsprobe nötig." },
                { range: "3", text: "Beißende Kälte (−10 °C), klarer Himmel, Boden vereist — Gelände schwierig." },
                { range: "4", text: "Grauer Winterhimmel, leichter Schneeflockentreiben, kalt aber trocken." },
                { range: "5", text: "Tauwetter: Matsch und Eis im Wechsel — Tempo halbe Meilen weniger pro Stunde." },
                { range: "6", text: "Klarer, strahlend blauer Wintertag, hart gefroren, perfekte Sicht." },
                { range: "7", text: "Schwerer Schneesturm, Winde bis Stufe 3 — Lager notwendig, kein Vorankommen." },
                { range: "8", text: "Dunstiger Morgennebel löst sich zu Mittag, mild für die Jahreszeit (0 °C)." }
            ] },
        fruehling:         { id: "wetter_gem_frueh", diceType: 8, entries: [
                { range: "1", text: "Warmer Frühlingsregen, leichter Wind — Wege rutschig aber begehbar." },
                { range: "2", text: "Starker Gewitterregen mit Blitzen, kurze Unterbrechung des Weges nötig." },
                { range: "3", text: "Sonnig mit einzelnen Schauerwolken, angenehme 15 °C, leichte Brise." },
                { range: "4", text: "Dichter Frühlingsmorgennebel — Sicht 30 m bis 9 Uhr, dann klar." },
                { range: "5", text: "Kühler Frühlingstag, 8 °C, Wind aus Nord, keine Niederschläge." },
                { range: "6", text: "Wolkenbruch für 1W4 Stunden, danach Regenbogen und Sonnenschein." },
                { range: "7", text: "Warmer Südwind, Blütengeruch, ideales Reisewetter (18 °C, leicht bewölkt)." },
                { range: "8", text: "Hagelschauer für 10 Minuten — kleine Beulen, Pferde scheu, danach trocken." }
            ] },
        sommer:         { id: "wetter_gem_sommer", diceType: 8, entries: [
                { range: "1", text: "Schwüle Hitze (32 °C), kein Wind — CON-Probe nach 4 Stunden Marsch oder 1 Stufe Erschöpfung." },
                { range: "2", text: "Sommergewitter am Nachmittag, kräftige Schauer, Abkühlung auf 20 °C." },
                { range: "3", text: "Ideales Sommerwetter, 24 °C, leichte Brise, klare Sicht — Bonus +2 Meilen." },
                { range: "4", text: "Drückende Schwüle, keine Brise, Mücken — Ablenkung (Nachteil auf Wahrnehmung)." },
                { range: "5", text: "Dunstige Sommerhitze, Wege flimmern — Distanzen scheinen weiter als sie sind." },
                { range: "6", text: "Heftiges Sommergewitter mit Starkregen (30 Min.) — Lager schlagen, kein Blitz." },
                { range: "7", text: "Sonnig und warm (26 °C), leichte Cirruswolken, angenehmer Reisewind." },
                { range: "8", text: "Trockenheit: verstaubte Wege, ausgetrocknete Bäche — Wasservorkommen prüfen." }
            ] },
        herbst:         { id: "wetter_gem_herbst", diceType: 8, entries: [
                { range: "1", text: "Dichter Herbstmorgennebel, Sicht 20 m, löst sich gegen Mittag, kalt (7 °C)." },
                { range: "2", text: "Ruhiger Herbsttag mit buntem Laubfall, mild (14 °C), keine Wolken." },
                { range: "3", text: "Anhaltender Nieselregen, grauer Himmel, 10 °C — alles wird durchweicht." },
                { range: "4", text: "Stürmischer Herbstwind, Blätter fliegen, Äste knacken — Zelte brauchen Verankerung." },
                { range: "5", text: "Klarer, kühler Herbsttag mit Bodenfrost am Morgen, 5 °C, sonnig." },
                { range: "6", text: "Starker Herbstregen, Pfade werden schlammig — Geschwindigkeit −3 Meilen." },
                { range: "7", text: "Herbststurm: Böen bis 60 km/h, Bäume brechen — Orientierung erschwert, Probe nötig." },
                { range: "8", text: "Goldener Herbsttag, 16 °C, kaum Wind, Sicht weit — angenehmes Reisewetter." }
            ] }
    }
};

window.REISE_GELÄNDE = REISE_GELÄNDE;
window.REISE_TEMPO = REISE_TEMPO;
window.REISE_BEGEGNUNGS_TABELLEN = REISE_BEGEGNUNGS_TABELLEN;
window.WETTER_TABELLEN = WETTER_TABELLEN;
