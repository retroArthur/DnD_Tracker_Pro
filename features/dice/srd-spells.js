// [SECTION:SRD_SPELLS]
// Extrahiert aus dice.js
// SRD-Zauber-Datenbank
// Zeilen: 157
// ============================================================
// SRD SPELLS DATABASE - LAZY LOADED
// ============================================================
// Die Daten werden erst beim ersten Zugriff initialisiert
var log = window.log;
var D = window.D;
var nextId = window.nextId;
var renderSpells = window.renderSpells;
let _srdSpellsCache = null;
function getSRDSpells() {
    if (_srdSpellsCache)
        return _srdSpellsCache;
    _srdSpellsCache = [
        // CANTRIPS
        { name: 'Licht', type: 'cantrip', school: 'Hervorrufung', castingTime: '1 Aktion', range: 'Berührung', duration: '1 Stunde', components: 'V, M', material: 'Ein Glühwürmchen oder phosphoreszierendes Moos', classes: ['Barde', 'Kleriker', 'Magier', 'Zauberer'], description: 'Du berührst einen Gegenstand, der nicht größer als 3m ist. Bis der Zauber endet, strahlt der Gegenstand helles Licht in einem Radius von 6m und dämmriges Licht für weitere 6m aus.' },
        { name: 'Froststrahl', type: 'cantrip', school: 'Hervorrufung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer'], description: 'Ein eisiger Strahl schießt auf eine Kreatur. Fernkampf-Zauberangriff. Bei Treffer: 1d8 Kälteschaden, Geschwindigkeit um 3m reduziert bis zum Start deines nächsten Zuges.' },
        { name: 'Feuerblitz', type: 'cantrip', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer'], description: 'Du schleuderst einen Funken Feuer auf eine Kreatur oder einen Gegenstand. Fernkampf-Zauberangriff. Bei Treffer: 1d10 Feuerschaden.' },
        { name: 'Heiliges Feuer', type: 'cantrip', school: 'Hervorrufung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V, G', classes: ['Kleriker'], description: 'Flammenartiges Strahlen steigt über einer Kreatur auf. GES-Rettung, bei Fehlschlag: 1d8 Strahlungsschaden. Keine Deckung möglich.' },
        { name: 'Magische Hand', type: 'cantrip', school: 'Beschwörung', castingTime: '1 Aktion', range: '9m', duration: '1 Minute', components: 'V, G', classes: ['Barde', 'Magier', 'Hexenmeister', 'Zauberer'], description: 'Eine geisterhafte Hand erscheint. Kann Gegenstände bis 5kg manipulieren, Türen öffnen, Behälter öffnen/schließen, aber nicht angreifen oder Zauber wirken.' },
        { name: 'Nachricht', type: 'cantrip', school: 'Verwandlung', castingTime: '1 Aktion', range: '36m', duration: '1 Runde', components: 'V, G, M', material: 'Ein kurzes Stück Kupferdraht', classes: ['Barde', 'Magier', 'Zauberer'], description: 'Du flüsterst eine Nachricht an eine Kreatur in Reichweite. Nur das Ziel hört sie und kann flüsternd antworten.' },
        { name: 'Prestidigitation', type: 'cantrip', school: 'Verwandlung', castingTime: '1 Aktion', range: '3m', duration: 'Bis 1 Stunde', components: 'V, G', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Kleiner magischer Trick: Sensorische Effekte, Kerze entzünden/löschen, säubern/verschmutzen, Gegenstand erwärmen/kühlen, Symbol erscheinen lassen, kleine Illusion.' },
        { name: 'Thaumaturgie', type: 'cantrip', school: 'Verwandlung', castingTime: '1 Aktion', range: '9m', duration: 'Bis 1 Minute', components: 'V', classes: ['Kleriker'], description: 'Kleine Wunder: Stimme 3x lauter, Flammen flackern, Erschütterung, Geräusch, Tür/Fenster öffnen, Augen verändern.' },
        { name: 'Druidenkunst', type: 'cantrip', school: 'Verwandlung', castingTime: '1 Aktion', range: '9m', duration: 'Sofort', components: 'V, G', classes: ['Druide'], description: 'Sensorischer Effekt (Naturgeräusch/Geruch), Blume blühen lassen, Samen öffnen, kleine Illusion von Tier oder Pflanze.' },
        { name: 'Eldritch Blast', type: 'cantrip', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Sofort', components: 'V, G', classes: ['Hexenmeister'], description: 'Ein Strahl knisternder Energie. Fernkampf-Zauberangriff. Bei Treffer: 1d10 Energieschaden. Bei höheren Stufen zusätzliche Strahlen.' },
        // GRAD 1
        { name: 'Magisches Geschoss', type: '1', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer'], description: 'Drei leuchtende Pfeile treffen automatisch je 1d4+1 Energieschaden. Pro höheren Grad ein zusätzlicher Pfeil.' },
        { name: 'Heilen', type: '1', school: 'Hervorrufung', castingTime: '1 Aktion', range: 'Berührung', duration: 'Sofort', components: 'V, G', classes: ['Barde', 'Kleriker', 'Druide', 'Paladin', 'Waldläufer'], description: 'Eine Kreatur erhält 1d8 + Modifikator Trefferpunkte. Kein Effekt auf Untote oder Konstrukte. +1d8 pro höheren Grad.' },
        { name: 'Schild', type: '1', school: 'Bannmagie', castingTime: '1 Reaktion', range: 'Selbst', duration: '1 Runde', components: 'V, G', classes: ['Magier', 'Zauberer'], description: '+5 auf RK bis Start deines nächsten Zuges. Kein Schaden von Magischem Geschoss.' },
        { name: 'Brennende Hände', type: '1', school: 'Hervorrufung', castingTime: '1 Aktion', range: 'Selbst (5m Kegel)', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer'], description: 'Feuerfächer aus deinen Fingern. GES-Rettung, 3d6 Feuerschaden (halb bei Erfolg). +1d6 pro höheren Grad.' },
        { name: 'Charme Person', type: '1', school: 'Verzauberung', castingTime: '1 Aktion', range: '9m', duration: '1 Stunde', components: 'V, G', classes: ['Barde', 'Druide', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'WEI-Rettung mit Vorteil bei Kampf. Bei Fehlschlag: Ziel betrachtet dich als freundlichen Bekannten. Weiß danach, dass es bezaubert wurde.' },
        { name: 'Erkennen Magie', type: '1', school: 'Erkenntnismagie', castingTime: '1 Aktion (Ritual)', range: 'Selbst', duration: 'Konz. 10 Min.', components: 'V, G', classes: ['Barde', 'Kleriker', 'Druide', 'Magier', 'Paladin', 'Waldläufer', 'Zauberer'], description: 'Du nimmst Magie in 9m Radius wahr. Du kannst deine Aktion verwenden um Aura und Schule eines magischen Gegenstands/Kreatur zu sehen.' },
        { name: 'Nebel', type: '1', school: 'Beschwörung', castingTime: '1 Aktion', range: '36m', duration: 'Konz. 1 Std.', components: 'V, G', classes: ['Druide', 'Waldläufer', 'Magier', 'Zauberer'], description: 'Eine 6m-Radius-Kugel aus dichtem Nebel. Stark verdeckt. Wind von 30km/h zerstreut ihn in 1 Runde.' },
        { name: 'Schlaf', type: '1', school: 'Verzauberung', castingTime: '1 Aktion', range: '27m', duration: '1 Minute', components: 'V, G, M', material: 'Eine Prise feiner Sand, Rosenblätter oder eine Grille', classes: ['Barde', 'Magier', 'Zauberer'], description: '5d8 HP an Kreaturen fallen in Schlaf, niedrigste HP zuerst. Untote und Immun gegen Bezaubert nicht betroffen. +2d8 HP pro höheren Grad.' },
        { name: 'Donnerwelle', type: '1', school: 'Hervorrufung', castingTime: '1 Aktion', range: 'Selbst (5m Würfel)', duration: 'Sofort', components: 'V, G', classes: ['Barde', 'Druide', 'Magier', 'Zauberer'], description: 'KON-Rettung. 2d8 Schallschaden und 3m weggestoßen (halb, nicht gestoßen bei Erfolg). 90m hörbar. +1d8 pro höheren Grad.' },
        { name: 'Feenfeuer', type: '1', school: 'Hervorrufung', castingTime: '1 Aktion', range: '18m', duration: 'Konz. 1 Min.', components: 'V', classes: ['Barde', 'Druide'], description: '6m Würfel. GES-Rettung. Betroffene leuchten dämmrig, können nicht unsichtbar sein, Angriffe haben Vorteil.' },
        { name: 'Segnen', type: '1', school: 'Verzauberung', castingTime: '1 Aktion', range: '9m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein Tropfen Weihwasser', classes: ['Kleriker', 'Paladin'], description: 'Bis zu 3 Kreaturen. Bei Angriffswurf oder Rettungswurf +1d4.' },
        { name: 'Verderben', type: '1', school: 'Verzauberung', castingTime: '1 Aktion', range: '9m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein Tropfen Blut', classes: ['Kleriker'], description: 'Bis zu 3 Kreaturen. CHA-Rettung. Bei Angriffswurf oder Rettungswurf -1d4.' },
        { name: 'Schutz vor Gut und Böse', type: '1', school: 'Bannmagie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 10 Min.', components: 'V, G, M', material: 'Weihwasser oder Silber-/Eisenpulver (verbraucht)', classes: ['Kleriker', 'Magier', 'Paladin', 'Hexenmeister'], description: 'Schutz vor Aberrationen, Himmlischen, Elementaren, Feenwesen, Unholden, Untoten. Nachteil auf Angriffe, keine Bezauberung/Verängstigung/Besessenheit.' },
        { name: 'Verstricken', type: '1', school: 'Beschwörung', castingTime: '1 Aktion', range: '27m', duration: 'Konz. 1 Min.', components: 'V, G', classes: ['Druide'], description: '6m Quadrat wird zu schwierigem Gelände. STÄ-Rettung oder festgehalten. Aktion zum erneuten Versuch.' },
        { name: 'Identifizieren', type: '1', school: 'Erkenntnismagie', castingTime: '1 Minute (Ritual)', range: 'Berührung', duration: 'Sofort', components: 'V, G, M', material: 'Eine Perle (100 GM) und eine Eulenfeder', classes: ['Barde', 'Magier'], description: 'Erfahre alle Eigenschaften eines magischen Gegenstands. Oder: Welche Zauber auf einer Kreatur/Objekt wirken.' },
        { name: 'Böses/Gutes Entdecken', type: '1', school: 'Erkenntnismagie', castingTime: '1 Aktion', range: 'Selbst', duration: 'Konz. 10 Min.', components: 'V, G', classes: ['Kleriker', 'Paladin'], description: 'Spüre Aberrationen, Himmlische, Elementare, Feenwesen, Unholde, Untote in 9m. Art und Richtung bekannt.' },
        { name: 'Tierfreundschaft', type: '1', school: 'Verzauberung', castingTime: '1 Aktion', range: '9m', duration: '24 Stunden', components: 'V, G, M', material: 'Ein Stück Futter', classes: ['Barde', 'Druide', 'Waldläufer'], description: 'WEI-Rettung. Tier mit INT 4 oder weniger ist bezaubert. Schaden beendet den Effekt.' },
        { name: 'Sprache Verstehen', type: '1', school: 'Erkenntnismagie', castingTime: '1 Aktion (Ritual)', range: 'Selbst', duration: '1 Stunde', components: 'V, G, M', material: 'Eine Prise Ruß und Salz', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Du verstehst die wörtliche Bedeutung jeder gesprochenen Sprache. Du kannst geschriebene Sprache lesen wenn du das Material berührst.' },
        // GRAD 2
        { name: 'Dunkelheit', type: '2', school: 'Hervorrufung', castingTime: '1 Aktion', range: '18m', duration: 'Konz. 10 Min.', components: 'V, M', material: 'Fledermausfell und ein Tropfen Pech oder Kohle', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: '5m Radius magische Dunkelheit. Breitet sich um Ecken aus. Dunkelsicht hilft nicht. Unterdrückt schwächere Lichtmagie.' },
        { name: 'Unsichtbarkeit', type: '2', school: 'Illusion', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Std.', components: 'V, G, M', material: 'Eine Wimper in Gummiarabikum eingehüllt', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Eine Kreatur und ihre Ausrüstung werden unsichtbar. Endet bei Angriff oder Zauber.' },
        { name: 'Klopfen', type: '2', school: 'Verwandlung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V', classes: ['Barde', 'Magier', 'Zauberer'], description: 'Öffnet ein Schloss, Riegel, Kette oder magische Versiegelung (unterdrückt Arkanes Schloss 10 Min.). Lautes Klopfen in 90m hörbar.' },
        { name: 'Festhalten Person', type: '2', school: 'Verzauberung', castingTime: '1 Aktion', range: '18m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein kleines gerades Stück Eisen', classes: ['Barde', 'Kleriker', 'Druide', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'WEI-Rettung. Humanoid ist paralysiert. Wiederholt Rettung am Ende jedes Zuges.' },
        { name: 'Magiewaffe', type: '2', school: 'Verwandlung', castingTime: '1 Bonusaktion', range: 'Berührung', duration: 'Konz. 1 Std.', components: 'V, G', classes: ['Magier', 'Paladin'], description: 'Nichtmagische Waffe wird magisch mit +1 auf Angriff und Schaden. +2 bei 4., +3 bei 6. Grad.' },
        { name: 'Mondstrahl', type: '2', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Mehrere Mondsteinsamenkörner und ein Stück opaleszierender Feldspat', classes: ['Druide'], description: '2m Radius, 12m hohe Lichtsäule. KON-Rettung, 2d10 Strahlungsschaden (halb bei Erfolg). Gestaltwandler haben Nachteil und kehren zurück.' },
        { name: 'Spinnenklettern', type: '2', school: 'Verwandlung', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Std.', components: 'V, G, M', material: 'Ein Tropfen Bitumen und eine Spinne', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'Ziel kann Wände und Decken klettern ohne Hände. Klettergeschwindigkeit = Bewegung.' },
        { name: 'Gebet der Heilung', type: '2', school: 'Hervorrufung', castingTime: '10 Minuten', range: '9m', duration: 'Sofort', components: 'V', classes: ['Kleriker'], description: 'Bis zu 6 Kreaturen heilen je 2d8 + Modifikator HP. Nicht für Untote/Konstrukte.' },
        { name: 'Geringere Wiederherstellung', type: '2', school: 'Bannmagie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Sofort', components: 'V, G', classes: ['Barde', 'Kleriker', 'Druide', 'Paladin', 'Waldläufer'], description: 'Beendet eine Krankheit oder einen Zustand: Blind, Taub, Gelähmt oder Vergiftet.' },
        { name: 'Spiegelbild', type: '2', school: 'Illusion', castingTime: '1 Aktion', range: 'Selbst', duration: '1 Minute', components: 'V, G', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'Drei illusorische Duplikate erscheinen. Angriffe treffen zufällig eines (RK 10+GES). Bei Treffer: Duplikat verschwindet.' },
        { name: 'Nebelschritt', type: '2', school: 'Beschwörung', castingTime: '1 Bonusaktion', range: 'Selbst', duration: 'Sofort', components: 'V', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'Teleportiere dich bis zu 9m zu einem sichtbaren, unbesetzten Punkt.' },
        // GRAD 3
        { name: 'Feuerball', type: '3', school: 'Hervorrufung', castingTime: '1 Aktion', range: '45m', duration: 'Sofort', components: 'V, G, M', material: 'Ein winziger Ball aus Fledermausguano und Schwefel', classes: ['Magier', 'Zauberer'], description: 'Leuchtender Punkt explodiert in 6m Radius. GES-Rettung, 8d6 Feuerschaden (halb bei Erfolg). Entzündet brennbare Objekte. +1d6 pro höheren Grad.' },
        { name: 'Blitzschlag', type: '3', school: 'Hervorrufung', castingTime: '1 Aktion', range: 'Selbst (30m Linie)', duration: 'Sofort', components: 'V, G, M', material: 'Ein Stück Fell und ein Stab aus Bernstein, Kristall oder Glas', classes: ['Magier', 'Zauberer'], description: '30m lange, 2m breite Linie. GES-Rettung, 8d6 Blitzschaden (halb bei Erfolg). +1d6 pro höheren Grad.' },
        { name: 'Magie Bannen', type: '3', school: 'Bannmagie', castingTime: '1 Aktion', range: '36m', duration: 'Sofort', components: 'V, G', classes: ['Barde', 'Kleriker', 'Druide', 'Magier', 'Paladin', 'Zauberer', 'Hexenmeister'], description: 'Beendet Zauber bis 3. Grad. Höhere: Zauberei-Probe gegen SG 10 + Zaubergrad.' },
        { name: 'Verzaubern', type: '3', school: 'Nekromantie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Min.', components: 'V, G', classes: ['Barde', 'Kleriker', 'Magier'], description: 'WEI-Rettung. Wähle: Nachteil auf Proben mit einem Attribut, Nachteil auf Angriffe, WEI-Rettung um Aktion zu nutzen, oder dein Schaden +1d8 nekrotisch.' },
        { name: 'Fliegen', type: '3', school: 'Verwandlung', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 10 Min.', components: 'V, G, M', material: 'Eine Flügelfeder eines beliebigen Vogels', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'Fluggeschwindigkeit 18m. Fällt bei Zauberende.' },
        { name: 'Hast', type: '3', school: 'Verwandlung', castingTime: '1 Aktion', range: '9m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein Stück Süßholzwurzel', classes: ['Magier', 'Zauberer'], description: '+2 RK, Vorteil GES-Rettung, Geschwindigkeit verdoppelt, zusätzliche Aktion (nur Angriff(1)/Rückzug/Verstecken/Gegenstand). Bei Ende: 1 Runde keine Bewegung/Aktion.' },
        { name: 'Schutz vor Energie', type: '3', school: 'Bannmagie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Std.', components: 'V, G', classes: ['Kleriker', 'Druide', 'Magier', 'Waldläufer', 'Zauberer'], description: 'Resistenz gegen eine Schadensart: Säure, Kälte, Feuer, Blitz oder Schall.' },
        { name: 'Gegenzauber', type: '3', school: 'Bannmagie', castingTime: '1 Reaktion', range: '18m', duration: 'Sofort', components: 'G', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'Unterbreche Zauber bis 3. Grad automatisch. Höher: Zauberei-Probe gegen SG 10 + Zaubergrad. Auf höherem Grad: automatisch bis zu dem Grad.' },
        { name: 'Wiederbelebung', type: '3', school: 'Nekromantie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Sofort', components: 'V, G, M', material: 'Diamanten im Wert von 300 GM (verbraucht)', classes: ['Kleriker', 'Paladin'], description: 'Kreatur die in letzter Minute starb kehrt mit 1 HP zurück. Nicht bei Altersschwäche oder fehlendem Körperteil.' },
        { name: 'Geisterhüter', type: '3', school: 'Beschwörung', castingTime: '1 Aktion', range: 'Selbst (5m Radius)', duration: 'Konz. 10 Min.', components: 'V, G, M', material: 'Ein heiliges Symbol', classes: ['Kleriker'], description: 'Geister umkreisen dich. Feinde die Bereich betreten/beginnen: WEI-Rettung, 3d8 Strahlung/Nekrotisch (halb bei Erfolg). Geschwindigkeit halbiert.' },
        { name: 'Vampirberührung', type: '3', school: 'Nekromantie', castingTime: '1 Aktion', range: 'Selbst', duration: 'Konz. 1 Min.', components: 'V, G', classes: ['Magier', 'Hexenmeister'], description: 'Nahkampf-Zauberangriff: 3d6 nekrotischer Schaden, du heilst die Hälfte. Wiederholbar jede Runde als Aktion.' },
        { name: 'Wasseratmung', type: '3', school: 'Verwandlung', castingTime: '1 Aktion (Ritual)', range: 'Berührung', duration: '24 Stunden', components: 'V, G, M', material: 'Ein kurzes Schilfrohr', classes: ['Druide', 'Magier', 'Waldläufer', 'Zauberer'], description: 'Bis zu 10 Kreaturen können unter Wasser atmen.' },
        // GRAD 4
        { name: 'Verwandlung', type: '4', school: 'Verwandlung', castingTime: '1 Aktion', range: '18m', duration: 'Konz. 1 Std.', components: 'V, G, M', material: 'Ein Kokon einer Raupe', classes: ['Barde', 'Druide', 'Magier', 'Zauberer'], description: 'WEI-Rettung (unfreiwillig). Verwandle Kreatur in Tier mit CR ≤ Stufe des Ziels. Neue HP, bei 0 Rückverwandlung.' },
        { name: 'Dimensionstür', type: '4', school: 'Beschwörung', castingTime: '1 Aktion', range: '150m', duration: 'Sofort', components: 'V', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Teleportiere dich und eine freiwillige Kreatur zu einem sichtbaren Punkt oder beschriebenen Ort in Reichweite.' },
        { name: 'Größere Unsichtbarkeit', type: '4', school: 'Illusion', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Min.', components: 'V, G', classes: ['Barde', 'Magier', 'Zauberer'], description: 'Ziel ist unsichtbar. Endet NICHT bei Angriff oder Zauber.' },
        { name: 'Steinhaut', type: '4', school: 'Bannmagie', castingTime: '1 Aktion', range: 'Berührung', duration: 'Konz. 1 Std.', components: 'V, G, M', material: 'Diamantstaub im Wert von 100 GM (verbraucht)', classes: ['Druide', 'Magier', 'Waldläufer', 'Zauberer'], description: 'Resistenz gegen nichtmagischen Wucht-, Stich- und Hiebschaden.' },
        { name: 'Todesschutz', type: '4', school: 'Bannmagie', castingTime: '1 Aktion', range: 'Berührung', duration: '8 Stunden', components: 'V, G', classes: ['Kleriker', 'Paladin'], description: 'Erstes Mal auf 0 HP stattdessen 1 HP. Dann endet der Zauber.' },
        { name: 'Verbannung', type: '4', school: 'Bannmagie', castingTime: '1 Aktion', range: '18m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein dem Ziel verhasster Gegenstand', classes: ['Kleriker', 'Magier', 'Paladin', 'Zauberer', 'Hexenmeister'], description: 'CHA-Rettung. Ziel wird in harmlose Halbebene verbannt. Bei Konzentration >1 Min. und nichtnativer Kreatur: permanent verbannt.' },
        { name: 'Eiswand', type: '4', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Konz. 10 Min.', components: 'V, G, M', material: 'Ein kleines Stück Quarz', classes: ['Magier'], description: 'Wand aus Eis (30m×3m×30cm oder Kuppel 3m). 10 HP/2,5cm Dicke, verwundbar gegen Feuer. Kälteschaden bei Erschaffung.' },
        { name: 'Feuerwand', type: '4', school: 'Hervorrufung', castingTime: '1 Aktion', range: '36m', duration: 'Konz. 1 Min.', components: 'V, G, M', material: 'Ein kleines Stück Phosphor', classes: ['Druide', 'Magier', 'Zauberer'], description: 'Feuerwand (18m lang, 6m hoch, 30cm dick). Eine Seite verursacht 5d8 Feuerschaden (GES halb).' },
        // GRAD 5
        { name: 'Erweckung', type: '5', school: 'Verwandlung', castingTime: '8 Stunden', range: 'Berührung', duration: 'Sofort', components: 'V, G, M', material: 'Einen Achat im Wert von 1000 GM (verbraucht)', classes: ['Barde', 'Druide'], description: 'Pflanze/Tier mit INT<10 erhält INT 10, Sprache, Bewegung. 30 Tage freundlich zu dir.' },
        { name: 'Massenheilen', type: '5', school: 'Hervorrufung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V, G', classes: ['Barde', 'Kleriker', 'Druide'], description: 'Bis zu 6 Kreaturen in Reichweite heilen je 3d8 + Modifikator HP.' },
        { name: 'Flammendes Schwert', type: '5', school: 'Hervorrufung', castingTime: '1 Bonusaktion', range: 'Selbst', duration: 'Konz. 10 Min.', components: 'V, G, M', material: 'Ein Blatt eines Sumachstrauchs', classes: ['Magier'], description: 'Feuriges Schwert: 3d6 Feuer, Finesse, Licht. Bonusaktion zum Entlassen und neu erschaffen.' },
        { name: 'Teleportationskreis', type: '5', school: 'Beschwörung', castingTime: '1 Minute', range: '3m', duration: '1 Runde', components: 'V, M', material: 'Seltene Kreiden und Tinten mit Edelsteinen im Wert von 50 GM (verbraucht)', classes: ['Barde', 'Magier', 'Zauberer'], description: 'Verbinde mit bekanntem permanentem Kreis. Bis Ende deines nächsten Zuges: Jeder der eintritt erscheint am Zielkreis.' },
        { name: 'Geas', type: '5', school: 'Verzauberung', castingTime: '1 Minute', range: '18m', duration: '30 Tage', components: 'V', classes: ['Barde', 'Kleriker', 'Druide', 'Magier', 'Paladin'], description: 'WEI-Rettung. Ziel muss Befehl befolgen oder 5d10 psychischen Schaden. Auf 7. Grad: 1 Jahr. Auf 9. Grad: permanent.' },
        { name: 'Auferstehung', type: '5', school: 'Nekromantie', castingTime: '1 Stunde', range: 'Berührung', duration: 'Sofort', components: 'V, G, M', material: 'Einen Diamant im Wert von 500 GM (verbraucht)', classes: ['Barde', 'Kleriker'], description: 'Tote Kreatur (max. 10 Tage tot) kehrt mit vollen HP zurück. -4 auf Würfe, +1 pro lange Rast. Nicht bei Altersschwäche.' },
        { name: 'Kontaktiere Andere Ebene', type: '5', school: 'Erkenntnismagie', castingTime: '1 Minute (Ritual)', range: 'Selbst', duration: '1 Minute', components: 'V', classes: ['Magier', 'Hexenmeister'], description: '5 Fragen an eine außerplanare Entität. INT-Rettung SG 15 oder 6d6 psychisch und wahnsinnig bis lange Rast.' },
        { name: 'Traumwandeln', type: '5', school: 'Illusion', castingTime: '1 Minute', range: 'Spezial', duration: '8 Stunden', components: 'V, G, M', material: 'Eine Handvoll Sand, ein Tropfen Tinte und eine Schreibfeder von einem schlafenden Vogel', classes: ['Barde', 'Magier', 'Hexenmeister'], description: 'Kontaktiere träumende Kreatur auf gleicher Ebene. Kann Nachricht übermitteln oder Albtraum (WEI-Rettung, 3d6 psychisch, keine Erholung).' },
        // GRAD 6-9
        { name: 'Wahre Gestalt', type: '9', school: 'Verwandlung', castingTime: '1 Aktion', range: 'Selbst', duration: 'Konz. 1 Std.', components: 'V, G', classes: ['Druide'], description: 'Verwandle dich in jede Kreatur mit CR ≤ deine Stufe. Behältst Persönlichkeit und Zauberfähigkeit.' },
        { name: 'Wunsch', type: '9', school: 'Beschwörung', castingTime: '1 Aktion', range: 'Selbst', duration: 'Sofort', components: 'V', classes: ['Magier', 'Zauberer'], description: 'Mächtigster Zauber. Kopiere jeden Zauber bis 8. Grad ohne Komponenten. Oder: Ein Wunsch mit DM-Ermessen. Risiko: 33% nie wieder Wunsch.' },
        { name: 'Meteor Schwarm', type: '9', school: 'Hervorrufung', castingTime: '1 Aktion', range: '1,5 km', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer'], description: '4 Einschläge, je 12m Radius. GES-Rettung, 20d6 Feuer + 20d6 Wucht (halb bei Erfolg). Entzündet alles.' },
        { name: 'Zeitstillstand', type: '9', school: 'Verwandlung', castingTime: '1 Aktion', range: 'Selbst', duration: 'Sofort', components: 'V', classes: ['Magier', 'Zauberer'], description: '1d4+1 Runden in denen nur du handelst. Endet bei Interaktion mit anderen Kreaturen/Gegenständen.' },
        { name: 'Machtwort Töten', type: '9', school: 'Verzauberung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Eine Kreatur mit 100 HP oder weniger stirbt sofort. Keine Rettung.' },
        { name: 'Entkräftung', type: '6', school: 'Nekromantie', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V, G', classes: ['Magier', 'Zauberer', 'Hexenmeister'], description: 'KON-Rettung. 2d8+40 nekrotischer Schaden (halb bei Erfolg). Kann nur durch Wunsch oder Größere Wiederherstellung geheilt werden.' },
        { name: 'Kettenbiltz', type: '6', school: 'Hervorrufung', castingTime: '1 Aktion', range: '45m', duration: 'Sofort', components: 'V, G, M', material: 'Ein Stück Fell, ein Bernsteinstab und drei Silbernadeln', classes: ['Magier', 'Zauberer'], description: 'Ein Blitz springt von Ziel zu Ziel (bis zu 4 Ziele). GES-Rettung, 10d8 Blitzschaden (halb bei Erfolg).' },
        { name: 'Wort der Macht Betäuben', type: '8', school: 'Verzauberung', castingTime: '1 Aktion', range: '18m', duration: 'Sofort', components: 'V', classes: ['Barde', 'Magier', 'Zauberer', 'Hexenmeister'], description: 'Eine Kreatur mit 150 HP oder weniger ist betäubt. KON-Rettung am Ende jedes Zuges zum Beenden.' }
    ];
    log('[Lazy] SRD_SPELLS geladen:', _srdSpellsCache.length, 'Zauber');
    return _srdSpellsCache;
}
// Legacy-Kompatibilität
const SRD_SPELLS = { get length() { return getSRDSpells().length; } };
function loadSRDSpells() {
    const spells = getSRDSpells();
    if (D.spells && D.spells.length > 0) {
        if (!confirm(`${D.spells.length} Zauber vorhanden. SRD-Zauber hinzufügen (keine Duplikate)?`))
            return;
    }
    let added = 0;
    const existingNames = new Set((D.spells || []).map((s) => s.name.toLowerCase()));
    spells.forEach(spell => {
        if (!existingNames.has(spell.name.toLowerCase())) {
            // Komponenten parsen (V, S/G, M)
            const comps = spell.components || 'V, G';
            const hasV = comps.includes('V');
            const hasG = comps.includes('G') || comps.includes('S');
            const hasM = comps.includes('M');
            // Ritual erkennen
            const isRitual = (spell.castingTime || '').toLowerCase().includes('ritual');
            // Level aus type extrahieren
            const level = spell.type === 'cantrip' ? 0 : parseInt(spell.type) || 0;
            D.spells.push({
                id: nextId('spells'),
                name: spell.name,
                type: spell.type,
                level: level,
                spellClasses: spell.classes || [],
                school: spell.school,
                time: spell.castingTime,
                range: spell.range,
                duration: spell.duration,
                ritual: isRitual,
                v: hasV,
                g: hasG,
                m: hasM,
                material: spell.material || '',
                description: spell.description,
                note: ''
            });
            added++;
        }
    });
    renderSpells();
    save();
    showToast(`${added} SRD-Zauber hinzugefügt`);
}
// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
window.getSRDSpells = getSRDSpells;
window.SRD_SPELLS = SRD_SPELLS;
window.loadSRDSpells = loadSRDSpells;
//# sourceMappingURL=srd-spells.js.map