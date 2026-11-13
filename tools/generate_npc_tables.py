#!/usr/bin/env python3
"""
tools/generate_npc_tables.py
Erzeugt features/npc-generator/npc-default-tables.js mit allen deutschen
Default-Tabellen für den NPC-Generator (WELT-02).

Aufruf: python tools/generate_npc_tables.py
Output: features/npc-generator/npc-default-tables.js
        (in loader.js + build.py registriert durch Plan 05-01)

Inhalt: NPC_DEFAULT_TABLES mit
  - namen: Völker × Geschlechter (maennlich/weiblich/neutral)
  - persoenlichkeitszuege, marotten, berufe, aussehen
"""

import os
import sys
import json

# ---------------------------------------------------------------------------
# Pfad-Setup (script-relativ, idempotent)
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.dirname(SCRIPT_DIR)
OUTPUT_PATH = os.path.join(REPO_ROOT, 'features', 'npc-generator', 'npc-default-tables.js')


# ---------------------------------------------------------------------------
# ROHDATEN — Deutsche, setting-passende Inhalte (Faerûn/Generic Fantasy)
# ---------------------------------------------------------------------------

# --- Namen ---

NAMEN_MENSCH_MAENNLICH = [
    "Aldric", "Berthold", "Conrad", "Dietmar", "Erasmus",
    "Friedrich", "Gerhard", "Heinrich", "Ingmar", "Jakob",
    "Klaus", "Lothar", "Markus", "Nikolaus", "Otto",
    "Philipp", "Quentin", "Rudolf", "Siegfried", "Tobias",
    "Ulrich", "Volker", "Werner", "Xaver", "Yannick",
    "Zacharias", "Albrecht", "Bruno", "Caspar", "Dieter",
    "Edmund", "Florian", "Gustav", "Herbert", "Ignatz",
    "Josef", "Karl", "Ludwig", "Matthias", "Norbert",
]

NAMEN_MENSCH_WEIBLICH = [
    "Adelheid", "Brigitte", "Clara", "Dorothea", "Elsbeth",
    "Friederike", "Greta", "Hedwig", "Ingrid", "Johanna",
    "Katharina", "Lotte", "Margarete", "Nora", "Ottilie",
    "Petra", "Renate", "Sabine", "Theresia", "Ursula",
    "Veronika", "Wilhelmine", "Xenia", "Yvonne", "Zelda",
    "Amalia", "Berta", "Christine", "Dagmar", "Eva",
    "Franziska", "Gertrude", "Hannelore", "Ilse", "Julia",
    "Kunigunde", "Lieselotte", "Mathilde", "Natalia", "Olga",
]

NAMEN_MENSCH_NEUTRAL = [
    "Asche", "Bernstein", "Dämmer", "Eiche", "Funke",
    "Grau", "Hain", "Iris", "Jade", "Kiesel",
    "Lenz", "Moor", "Nebel", "Opal", "Pfeil",
    "Quarz", "Rauch", "Stein", "Tau", "Urne",
]

NAMEN_ELF_MAENNLICH = [
    "Aelindra", "Caladrel", "Ehlindra", "Filarion", "Galandel",
    "Halamar", "Ielindel", "Jorildyn", "Kelemvor", "Laeroth",
    "Melisrion", "Naivara", "Orendir", "Paelias", "Quarion",
    "Riardon", "Soveliss", "Thamior", "Varis", "Windolen",
    "Arannis", "Berrian", "Carric", "Dardlara", "Enialis",
]

NAMEN_ELF_WEIBLICH = [
    "Adrie", "Birel", "Caelynn", "Dara", "Enna",
    "Faral", "Galea", "Hadarai", "Immeral", "Jelenneth",
    "Keyleth", "Leshanna", "Mialee", "Naivara", "Quelenna",
    "Rieve", "Sariel", "Thia", "Vadania", "Valanthe",
    "Aranea", "Briala", "Celeste", "Dara", "Elara",
]

NAMEN_ZWERG_MAENNLICH = [
    "Adrick", "Brottor", "Dolgrin", "Eberk", "Fargrim",
    "Gardain", "Harbek", "Ilvara", "Kildrak", "Morgran",
    "Orsik", "Oskar", "Rangrim", "Rurik", "Taklinn",
    "Thoradin", "Thorin", "Tordek", "Traubon", "Ulfgar",
    "Barendd", "Bram", "Darrak", "Duergath", "Gargac",
]

NAMEN_ZWERG_WEIBLICH = [
    "Amber", "Artin", "Audhild", "Bardryn", "Dagnal",
    "Diesa", "Eldeth", "Falkrunn", "Finellen", "Gunnloda",
    "Gurdis", "Helja", "Hlin", "Kathra", "Kristryd",
    "Ilde", "Liftrasa", "Mardred", "Riswynn", "Sannl",
    "Torbera", "Torgga", "Vistra", "Vonira", "Wulda",
]

NAMEN_HALBLING_MAENNLICH = [
    "Alton", "Ander", "Cade", "Corrin", "Eldon",
    "Errich", "Finnan", "Garret", "Lindal", "Lyle",
    "Merric", "Milo", "Osborn", "Posso", "Rye",
    "Wellby", "Wilf", "Boffin", "Bolger", "Bunce",
    "Chubb", "Grubb", "Hornblower", "Proudfoot", "Sackville",
]

NAMEN_HALBLING_WEIBLICH = [
    "Andry", "Bree", "Callie", "Cora", "Euphemia",
    "Jillian", "Kithri", "Lavinia", "Lidda", "Merla",
    "Nedda", "Paela", "Portia", "Seraphina", "Shaena",
    "Trym", "Vani", "Verna", "Wren", "Yolanda",
    "Belinda", "Daisy", "Elanor", "Goldberry", "Lobelia",
]

NAMEN_HALBORK_MAENNLICH = [
    "Dench", "Feng", "Gell", "Henk", "Holg",
    "Imsh", "Keth", "Krusk", "Mhurren", "Ront",
    "Shump", "Thokk", "Vrog", "Brogg", "Durgin",
    "Falgor", "Gnarl", "Hugnor", "Krag", "Norg",
]

NAMEN_HALBORK_WEIBLICH = [
    "Baggi", "Emen", "Engong", "Kansif", "Myev",
    "Neega", "Ovak", "Ownka", "Shautha", "Sutha",
    "Vola", "Volen", "Yevelda", "Zarka", "Brosa",
    "Dura", "Frenza", "Gorva", "Hinga", "Larka",
]

NAMEN_TIEFLING_MAENNLICH = [
    "Akmenos", "Amnon", "Barakas", "Damakos", "Ekemon",
    "Iados", "Kairon", "Leucis", "Melech", "Mordai",
    "Morthos", "Pelaios", "Skamos", "Therai", "Zoma",
    "Asar", "Crios", "Daemon", "Eligos", "Ferox",
]

NAMEN_TIEFLING_WEIBLICH = [
    "Akta", "Anakis", "Bryseis", "Criella", "Damaia",
    "Ea", "Kallista", "Lerissa", "Makaria", "Nemeia",
    "Orianna", "Phelaia", "Rieta", "Sabia", "Talanashta",
    "Abbith", "Braxas", "Callista", "Delia", "Estira",
]

NAMEN_GNOM_MAENNLICH = [
    "Alston", "Alvyn", "Boddynock", "Brocc", "Burgell",
    "Dimble", "Eldon", "Erky", "Fonkin", "Frug",
    "Gerbo", "Gimble", "Glim", "Jebeddo", "Kellen",
    "Namfoodle", "Orryn", "Roondar", "Seebo", "Sindri",
]

NAMEN_GNOM_WEIBLICH = [
    "Bimpnottin", "Breena", "Caramip", "Carlin", "Donella",
    "Duvamil", "Ella", "Ellywick", "Lilli", "Loopmottin",
    "Lorilla", "Mardnab", "Nissa", "Nyx", "Oda",
    "Orla", "Roywyn", "Shamil", "Tana", "Waywocket",
]


NAMENSPOOLS = {
    'mensch': (NAMEN_MENSCH_MAENNLICH, NAMEN_MENSCH_WEIBLICH, NAMEN_MENSCH_NEUTRAL),
    'elf': (
        NAMEN_ELF_MAENNLICH, NAMEN_ELF_WEIBLICH,
        ["Aelven", "Caerith", "Elyr", "Ithrien", "Laevin", "Nymriel", "Sylthir", "Vaeloren"],
    ),
    'zwerg': (
        NAMEN_ZWERG_MAENNLICH, NAMEN_ZWERG_WEIBLICH,
        ["Ambrun", "Brondil", "Dorgast", "Garneth", "Keldrum", "Morveth", "Taldrek", "Varnim"],
    ),
    'halbling': (
        NAMEN_HALBLING_MAENNLICH, NAMEN_HALBLING_WEIBLICH,
        ["Auenklee", "Birnblatt", "Flinkfarn", "Haselkorn", "Kesselblüte", "Mohnfink", "Riedgras", "Tautropf"],
    ),
    'halbork': (
        NAMEN_HALBORK_MAENNLICH, NAMEN_HALBORK_WEIBLICH,
        ["Brakka", "Drav", "Ghorin", "Khar", "Morga", "Rusk", "Tharok", "Vargan"],
    ),
    'tiefling': (
        NAMEN_TIEFLING_MAENNLICH, NAMEN_TIEFLING_WEIBLICH,
        ["Aufbruch", "Funkenmut", "Gnade", "Glut", "Hoffnung", "Klarheit", "Nachhall", "Wagnis"],
    ),
    'gnom': (
        NAMEN_GNOM_MAENNLICH, NAMEN_GNOM_WEIBLICH,
        ["Brixel", "Dimpel", "Fimblek", "Knirpsi", "Moxlin", "Nibrel", "Pindit", "Tixli"],
    ),
    'drow': (
        ["Drelvyr", "Ilveth", "Kharzenn", "Malzair", "Nethryl", "Rylzun", "Sszorin", "Velthar"],
        ["Alyzzra", "Belvrae", "Drisvyn", "Kelzara", "Lethyra", "Myrzael", "Thalyss", "Veldrissa"],
        ["Aelzryn", "Draevel", "Ithzair", "Kelthyr", "Lyzven", "Nymzeth", "Sornyl", "Vraezil"],
    ),
    'halbelf': (
        ["Alwinor", "Berelar", "Cadrin", "Elarven", "Ivenar", "Joranel", "Mariven", "Thalrik"],
        ["Alineth", "Celandria", "Elswyn", "Ilenora", "Kaelinde", "Maralyn", "Noriel", "Terenya"],
        ["Avenil", "Eliarn", "Fenniel", "Lioren", "Marel", "Nairen", "Selwyn", "Tiralen"],
    ),
    'drachenbluetiger': (
        ["Aarvok", "Bharvak", "Dharrak", "Kalthor", "Medrazz", "Orvash", "Rhashkar", "Vethrak"],
        ["Arrisha", "Dharessa", "Irzatha", "Kharvessa", "Myrazha", "Ralshira", "Sarvekka", "Vezhara"],
        ["Ashvyr", "Drethak", "Izzar", "Korveth", "Qashir", "Rhaaz", "Tazren", "Vyrash"],
    ),
    'goblin': (
        ["Bregg", "Gribs", "Knorx", "Murgit", "Prakk", "Skorbel", "Trumms", "Zirrk"],
        ["Brikka", "Fizzla", "Knerga", "Murgela", "Prazzi", "Rikkla", "Trubza", "Ziska"],
        ["Blinz", "Drelk", "Fitz", "Glimm", "Klips", "Pritsch", "Skratz", "Zwick"],
    ),
    'kobold': (
        ["Brizk", "Drikk", "Ikzun", "Kazzik", "Mitzrak", "Rizzik", "Skrivik", "Tikzark"],
        ["Azrikka", "Ezzili", "Kriissa", "Mikrazi", "Nizirka", "Sazzila", "Tizziri", "Vrixa"],
        ["Chirk", "Ezzik", "Izri", "Krakz", "Rits", "Skizz", "Tzik", "Vrik"],
    ),
    'ork': (
        ["Bragosh", "Droggar", "Gharrok", "Korgath", "Mogrul", "Raghun", "Thorgak", "Urgrim"],
        ["Ashgura", "Drozha", "Grushka", "Karzhna", "Morgatha", "Ruzgana", "Tharga", "Urzhal"],
        ["Drak", "Ghur", "Kharz", "Mok", "Rhogg", "Thruk", "Uzg", "Vrak"],
    ),
    'tabaxi': (
        [
            "Schatten unterm Steg", "Regen auf Zinn", "Funke im Schilf", "Schritt im Schnee",
            "Fuchs vorm Tor", "Splitter im Wind", "Kupfermond", "Tanz auf Dächern",
        ],
        [
            "Blüte nach Frost", "Glut in der Dämmerung", "Lied der Dachrinne", "Pfote im Mondlicht",
            "Perle im Sand", "Feder im Aufwind", "Klinge aus Nebel", "Tinte im Wasser",
        ],
        [
            "Wind durchs Korn", "Atem vor dem Sprung", "Echo im Gewölbe", "Glanz auf Schiefer",
            "Funkeln zwischen Wellen", "Rascheln im Farn", "Salz in der Luft", "Wolke über Türmen",
        ],
    ),
    'kenku': (
        [
            "Fassklang", "Flügelschlag", "Hofpfiff", "Kettenklirr",
            "Riegelklick", "Seilknarren", "Trommelschlag", "Wagenrumpeln",
        ],
        [
            "Dachtröpfeln", "Glockenspiel", "Kielkratzen", "Kreidestrich",
            "Muschelruf", "Samtrascheln", "Trillertropfen", "Windpfeife",
        ],
        [
            "Bogenknacks", "Brunnenecho", "Donnerhall", "Kiesknirschen",
            "Münzklang", "Ofenknacken", "Schlüsselschnapp", "Tassenklack",
        ],
    ),
    'goliath': (
        ["Akravan", "Dhornak", "Golavar", "Kadrom", "Malgoran", "Orukan", "Thavor", "Vordek"],
        ["Alraka", "Dhorvani", "Galara", "Harvoka", "Kelvanna", "Morakha", "Tavora", "Varkana"],
        ["Felsgruß", "Firn", "Gratwacht", "Lawinenruh", "Schneelicht", "Steinatem", "Sturmspur", "Wolkenbruch"],
    ),
    'aasimar': (
        ["Aelvarin", "Caelior", "Elathen", "Heliandor", "Maerion", "Orelian", "Solvian", "Valeriel"],
        ["Altheira", "Aurielis", "Caelina", "Elaris", "Helivara", "Liorana", "Orelisse", "Solmira"],
        ["Dämmerglanz", "Fernlicht", "Himmelsruh", "Lichtfaden", "Morgenstern", "Nachtgold", "Sonnensegel", "Sternensaum"],
    ),
}


# --- Persönlichkeitszüge ---

PERSOENLICHKEITSZUEGE = [
    "Redet pausenlos, auch wenn niemand zuhört.",
    "Misstrauisch gegenüber allen Fremden.",
    "Unerschütterlich optimistisch, egal wie schlimm die Lage ist.",
    "Ständig hungrig — denkt in jeder Situation an Essen.",
    "Wiederholt wichtige Dinge dreimal zur Sicherheit.",
    "Lacht nervös, wenn er/sie sich unwohl fühlt.",
    "Hält alles penibel sauber und ordentlich.",
    "Trifft Entscheidungen immer durch Münzwurf.",
    "Spricht von sich selbst in der dritten Person.",
    "Sammelt nutzlose Kleinigkeiten als 'Souvenirs'.",
    "Beobachtet Menschen lieber, als mit ihnen zu sprechen.",
    "Liebt abenteuerliche Geschichten und übertreibt die eigenen maßlos.",
    "Pfeift oder summt ständig eine einzige Melodie.",
    "Fragt bei allem nach dem 'Warum dahinter'.",
    "Schläft nie tief — schreckt bei jedem Geräusch auf.",
    "Zitiert bekannte Persönlichkeiten, auch wenn es unpassend ist.",
    "Besteht auf Höflichkeitsformeln in jeder Situation.",
    "Gibt gerne ungebetene Ratschläge.",
    "Spricht leiser, wenn er/sie aufgeregt ist — nicht lauter.",
    "Vertraut Tieren mehr als Menschen.",
    "Hat für jede Situation eine Redensart parat.",
    "Arbeitet lieber allein und erklärt nichts dabei.",
    "Vergisst Namen, merkt sich aber jedes Detail der Kleidung.",
    "Hört aktiv zu und wiederholt das Gehörte zur Bestätigung.",
    "Verteidigt leidenschaftlich jede Meinung, die er/sie gerade hat.",
    "Trägt ein Glücksbringer und berührt ihn bei Unsicherheit.",
    "Redet schnell, wenn er/sie nervös ist, und langsam, wenn er/sie lügt.",
    "Traut seiner/ihrer Intuition mehr als Fakten.",
    "Macht Situationen mit schwarzem Humor erträglicher.",
    "Besteht darauf, immer den Plan A zu kennen — und B und C.",
    "Hilft Fremden sofort und bittet sie später um einen kleinen Gefallen.",
    "Kann eine Bitte kaum ablehnen, wenn sie offen ausgesprochen wird.",
    "Fragt bei einem Streit zuerst nach den stillen Beteiligten.",
    "Erzählt schlechte Nachrichten mit großer Sachlichkeit.",
    "Hält jedes gegebene Wort, auch wenn es inzwischen teuer geworden ist.",
    "Will jeden Raum gemeinsam verlassen und achtet darauf, wer zurückbleibt.",
    "Versucht, sich bei jeder Begegnung etwas beibringen zu lassen.",
    "Bietet eine ehrliche Antwort an, wenn das Gegenüber zuerst ehrlich ist.",
    "Behandelt Dienstboten mit derselben Förmlichkeit wie Adlige.",
    "Verhandelt hart, schenkt aber großzügig, sobald der Handel abgeschlossen ist.",
    "Lenkt mit Nachfragen ab, sobald die eigene Vergangenheit zur Sprache kommt.",
    "Gibt Fehler bereitwillig zu und möchte sie sofort wiedergutmachen.",
]

# --- Marotten ---

MAROTTEN = [
    "Klopft dreimal auf Holz, bevor er/sie ein Gebäude betritt.",
    "Nennt alle Tiere, die er/sie länger als einen Tag begleiten.",
    "Poliert Waffen oder Werkzeug, während er/sie nachdenkt.",
    "Trinkt nach jeder wichtigen Entscheidung einen Schluck Wasser.",
    "Zählt Schritte beim Gehen durch unbekannte Orte.",
    "Schaut beim Sprechen nie in die Augen, sondern auf den Mund.",
    "Stapelt leere Becher oder Schüsseln zu Türmen.",
    "Murmelt die Namen verstorbener Gefährten vor dem Schlafengehen.",
    "Legt niemals den Rücken zur Tür.",
    "Zeichnet kleine Karten von jedem Ort, den er/sie besucht.",
    "Spricht mit seinem/ihrem Werkzeug oder seiner/ihrer Waffe.",
    "Isst immer in der gleichen Reihenfolge — erst Gemüse, dann Fleisch.",
    "Beißt die Unterlippe, wenn er/sie lügt.",
    "Berührt jeden Türrahmen beim Durchgehen.",
    "Schnuppert an unbekannten Dingen, bevor er/sie sie anfasst.",
    "Sortiert Münzen immer nach Größe, bevor er/sie bezahlt.",
    "Kratzt sich am Hinterkopf, wenn er/sie verwirrt ist.",
    "Trägt immer zwei Messer — eins fürs Essen, eins für alles andere.",
    "Wiederholt das letzte Wort des Gesprächspartners.",
    "Schleift bei Langeweile einen Stein auf dem Boden.",
    "Redet im Schlaf — manchmal in fremden Sprachen.",
    "Faltet Papier zu kleinen Figuren, wenn er/sie warten muss.",
    "Steht bei Entscheidungen immer zuerst auf und geht herum.",
    "Begrüßt jeden mit zwei Schlägen auf die Schulter.",
    "Schnippt mit den Fingern, wenn er/sie sich etwas merkt.",
    "Trägt immer ein leeres Fläschchen — 'für später'.",
    "Untersucht jeden Boden auf Unebenheiten.",
    "Malt mit dem Finger Kreise auf jede flache Fläche.",
    "Spuckt dreimal aus, bevor er/sie ein schlechtes Omen erwähnt.",
    "Kratzt heimlich Marken in Holz, um seinen/ihren Weg zu markieren.",
    "Bindet beim Zuhören kleine Knoten in eine Schnur.",
    "Richtet Gegenstände an der Tischkante aus, bevor ein Gespräch beginnt.",
    "Nennt unbekannte Leute nach dem ersten Geräusch, das sie machen.",
    "Notiert neue Redewendungen auf der Rückseite alter Quittungen.",
    "Legt bei jedem Angebot wortlos einen Kiesel auf den Tisch.",
    "Sucht beim Betreten eines Raums zuerst nach der Lichtquelle.",
    "Schreibt bei schwierigen Fragen erst ein Stichwort in die Luft.",
    "Bittet um die Geschichte hinter jedem getragenen Schmuckstück.",
    "Sammelt beim Gehen Fäden vom eigenen Mantel und wickelt sie zu einer Kugel.",
    "Dreht vor jeder ernsten Antwort den Bechergriff vom Gegenüber weg.",
    "Schüttelt bei der Begrüßung das eigene Handgelenk, bis die Ärmel zurückrutschen.",
    "Gibt jedem neuen Gerücht einen eigenen Titel.",
]

# --- Berufe ---

BERUFE = [
    "Schmied",
    "Händler",
    "Söldner",
    "Priester / Priesterin",
    "Wirtin / Wirt",
    "Bauer / Bäuerin",
    "Fischer / Fischerin",
    "Jäger / Jägerin",
    "Zimmermann / Zimmerin",
    "Gärtner / Gärtnerin",
    "Kräuterhändler / -händlerin",
    "Hebamme / Heiler",
    "Wachsoldat / Wachsoldatin",
    "Dieb / Diebin",
    "Straßenmusiker / -musikerin",
    "Schreiber / Schreiberin",
    "Kurier / Kurierin",
    "Koch / Köchin",
    "Schneider / Schneiderin",
    "Lederarbeiter / -arbeiterin",
    "Töpfer / Töpferin",
    "Zimmermädchen / -mann",
    "Stallknecht / Stallmagd",
    "Barbier / Friseurin",
    "Apotheker / Apothekerin",
    "Schreiner / Schreinerin",
    "Glasbläser / -bläserin",
    "Bergmann / Bergfrau",
    "Söldnerführer / -führerin",
    "Matrose / Matrosin",
    "Kapitän / Kapitänin",
    "Magierlehrling",
    "Straßenhändler / -händlerin",
    "Fährmann / Fährfrau",
    "Henker",
    "Wächter / Wächterin",
    "Bettler / Bettlerin",
    "Alchimist / Alchimistin",
    "Bibliothekar / Bibliothekarin",
    "Waisenhausleiter / -leiterin",
    "Adeliger / Adelige",
    "Spion / Spionin",
    "Gauner / Gaunerin",
    "Barde / Bardin",
    "Glücksritter / -ritterin",
    "Leuchtturmwache",
    "Kartenzeichner / Kartenzeichnerin",
    "Zollschreiber / Zollschreiberin",
    "Brückenbauer / Brückenbauerin",
    "Glockengießer / Glockengießerin",
    "Pilzsammler / Pilzsammlerin",
    "Runenrestaurator / Runenrestauratorin",
    "Botenreiter / Botenreiterin",
    "Grabungsaufsicht",
    "Schleusenwärter / Schleusenwärterin",
    "Pilgerführer / Pilgerführerin",
    "Siegelmacher / Siegelmacherin",
]

# --- Aussehen / Merkmale ---

AUSSEHEN = [
    "Narbe, die sich vom Kinn bis zur linken Wange zieht.",
    "Ungewöhnlich groß für sein/ihr Volk.",
    "Auffällig kleiner als Gleichaltrige.",
    "Graues Haar trotz jugendlichen Gesichts.",
    "Augen zweier verschiedener Farben.",
    "Fehlt ein kleiner Finger an der rechten Hand.",
    "Dunkle Tintenflecken an den Fingern.",
    "Immer in Kleidung, die eine Nummer zu groß ist.",
    "Trägt einen auffälligen, verbeulten Helm.",
    "Verwittertes, wettergegerbtes Gesicht.",
    "Auffällig gepflegte, manikürte Hände.",
    "Narbengezeichnete Hände, die von vielen Schlachten erzählen.",
    "Trägt stets einen langen, braunen Reisemantel.",
    "Aufwendig gesticktes Wappen auf dem Umhang.",
    "Fehlendes Ohrläppchen an der linken Seite.",
    "Tätowierung, die aus dem Kragen herauslugt.",
    "Immer leicht nach Kräutern riechend.",
    "Stark behaarte Arme, die aus den Ärmeln schauen.",
    "Lächelt nie mit den Augen — nur mit dem Mund.",
    "Nase einmal gebrochen und schief verheilt.",
    "Leuchtend rote Haare, die sofort ins Auge stechen.",
    "Pechschwarze Haare mit einer markanten weißen Strähne.",
    "Sommersprossen über die gesamte Nase verteilt.",
    "Gebuckelte Haltung, obwohl er/sie durchaus kräftig wirkt.",
    "Immer frisch rasiert, selbst auf langer Reise.",
    "Dicker Bart, der ordentlich geflochten ist.",
    "Breite Schultern und ein kurzer Hals.",
    "Hängt immer leicht zur Seite — alte Verletzung.",
    "Tätowierung eines Wolfskopfes auf dem rechten Unterarm.",
    "Wirft einen merkwürdig ungleichmäßigen Schatten.",
    "Trägt einen Mantel, dessen Saum mit kleinen Kupferringen beschwert ist.",
    "Auf den Handschuhen sind winzige Sternkarten eingestickt.",
    "Ein kurzer, fleckiger Schal ist mit einer Porzellanscherbe geschlossen.",
    "Der Mantel ist mit Stoffstücken in drei verschiedenen Blautönen geflickt.",
    "Ein Bündel Messingschlüssel hängt sichtbar am Gürtel.",
    "Die Kleidung ist von feinem Glimmerstaub überzogen.",
    "Die Stiefelspitzen sind mit silbrigem Draht umwickelt.",
    "Am Kragen steckt eine gepresste rote Blüte.",
    "Ein gelbes Halstuch trägt ein handgemaltes Wegzeichen.",
    "Ein Bündel schmaler Papierstreifen lugt aus der Brusttasche.",
    "Über der Schulter hängt ein geflochtener Gurt mit geschnitzten Holzperlen.",
    "Ein gläsernes Monokel wirft bei Kerzenlicht bunte Punkte.",
]


# ---------------------------------------------------------------------------
# Ausgabe-Generator
# ---------------------------------------------------------------------------

def js_string_array(lst, indent='    '):
    """Gibt ein JS-Array mit String-Elementen zurück."""
    if not lst:
        return '[]'
    items = ',\n'.join(f'{indent}    {json.dumps(s, ensure_ascii=False)}' for s in lst)
    return f'[\n{items}\n{indent}]'


def build_js():
    lines = []
    lines.append('// [SECTION:NPC_DEFAULT_TABLES]')
    lines.append('// ACHTUNG: Diese Datei wird von tools/generate_npc_tables.py generiert.')
    lines.append('// Nicht manuell bearbeiten! Aenderungen im Python-Skript vornehmen.')
    lines.append('// Aufruf: python tools/generate_npc_tables.py')
    lines.append('// ============================================================')
    lines.append('')
    lines.append('const NPC_DEFAULT_TABLES = {')

    # -- namen --
    lines.append('    namen: {')

    for i, (volk, (maennlich, weiblich, neutral)) in enumerate(NAMENSPOOLS.items()):
        lines.extend([
            f'        {volk}: {{',
            f'            maennlich: {js_string_array(maennlich, "            ")},',
            f'            weiblich:  {js_string_array(weiblich, "            ")},',
            f'            neutral:   {js_string_array(neutral, "            ")}',
            '        },' if i < len(NAMENSPOOLS) - 1 else '        }',
        ])

    lines.append('    },')

    # -- persoenlichkeitszuege --
    lines.append(f'    persoenlichkeitszuege: {js_string_array(PERSOENLICHKEITSZUEGE, "    ")},')

    # -- marotten --
    lines.append(f'    marotten: {js_string_array(MAROTTEN, "    ")},')

    # -- berufe --
    lines.append(f'    berufe: {js_string_array(BERUFE, "    ")},')

    # -- aussehen --
    lines.append(f'    aussehen: {js_string_array(AUSSEHEN, "    ")}')

    lines.append('};')
    lines.append('')
    lines.append('window.NPC_DEFAULT_TABLES = NPC_DEFAULT_TABLES;')
    lines.append('')

    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Validierung
# ---------------------------------------------------------------------------

def validate():
    """Einfache Mindestmengen-Prüfung der Rohdaten."""
    errors = []
    bestehende_minima = {
        'mensch': 20, 'elf': 15, 'zwerg': 15, 'halbling': 12,
        'halbork': 10, 'tiefling': 10, 'gnom': 10,
    }
    for volk, (maennlich, weiblich, neutral) in NAMENSPOOLS.items():
        minimum = bestehende_minima.get(volk, 8)
        for geschlecht, pool, limit in (
            ('maennlich', maennlich, minimum),
            ('weiblich', weiblich, minimum),
            ('neutral', neutral, 8),
        ):
            anzahl = len(set(pool))
            if anzahl < limit:
                errors.append(f'{volk}/{geschlecht}: {anzahl} verschiedene Namen < {limit}')
    if len(PERSOENLICHKEITSZUEGE) < 20:
        errors.append(f'persoenlichkeitszuege: {len(PERSOENLICHKEITSZUEGE)} < 20')
    if len(MAROTTEN) < 20:
        errors.append(f'marotten: {len(MAROTTEN)} < 20')
    if len(BERUFE) < 30:
        errors.append(f'berufe: {len(BERUFE)} < 30')
    if len(AUSSEHEN) < 20:
        errors.append(f'aussehen: {len(AUSSEHEN)} < 20')
    return errors


# ---------------------------------------------------------------------------
# Haupt-Einstiegspunkt
# ---------------------------------------------------------------------------

def main():
    errors = validate()
    if errors:
        print('FEHLER — Mindestmengen unterschritten:', file=sys.stderr)
        for e in errors:
            print(f'  - {e}', file=sys.stderr)
        sys.exit(1)

    js_content = build_js()

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(js_content)

    total_names = sum(len(pool) for gruppen in NAMENSPOOLS.values() for pool in gruppen)
    total_traits = len(PERSOENLICHKEITSZUEGE) + len(MAROTTEN) + len(BERUFE) + len(AUSSEHEN)
    total = total_names + total_traits

    print(f'OK — {OUTPUT_PATH}')
    print(f'     Namen: {total_names} Eintraege ({len(NAMENSPOOLS)} Voelker)')
    print(f'     Zuege/Marotten/Berufe/Aussehen: {total_traits} Eintraege')
    print(f'     Gesamt: {total} Eintraege')


if __name__ == '__main__':
    main()
