// [SECTION:SRD_MONSTERS]
// ============================================================
// SRD 5.1 DE Monster-Datenbank — CC-BY-4.0
// Quelle: Wizards of the Coast / openrpg.de/srd/5e/de/
// Attribution: "Dungeons & Dragons, SRD 5.1 DE" — CC BY 4.0
// Originalquelle: media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_DE.pdf
// Repository: codeberg.org/nesges/SRD-5.1-DE
// Generiert: 2026-06-13 via tools/build-srd-monsters.cjs
// Monster: 112 | Lizenz: Creative Commons Attribution 4.0 International
// Die Daten werden erst beim ersten Zugriff initialisiert (lazy-cache).
// NIEMALS D.* = getSRDMonsters() — SRD-Daten leben ausschliesslich im
// Closure-Cache, nie in D (Architektur-Constraint, Phase 3).
// ============================================================

let _srdMonstersCache = null;

function getSRDMonsters() {
    if (_srdMonstersCache) return _srdMonstersCache;
    _srdMonstersCache = [
    {
        "_id": "adler",
        "name": "Adler",
        "size": "Kleines",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 3,
        "hpFormula": "1W6",
        "speed": {
            "walk": "3 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 6,
        "dex": 15,
        "con": 10,
        "int": 2,
        "wis": 14,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfe Sicht",
                "desc": "Der Adler ist bei Weisheitswürfen (Wahrnehmung), die auf Sicht basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Krallen",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W4+2) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "eidechse",
        "name": "Eidechse",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 10,
        "acInfo": "",
        "hp": 2,
        "hpFormula": "1W4",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "6 m",
            "burrow": ""
        },
        "str": 2,
        "dex": 11,
        "con": 10,
        "int": 1,
        "wis": 8,
        "cha": 3,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 9 m",
            "Passive Wahrnehmung 9"
        ],
        "languages": [
            "-"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +0 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "fledermaus",
        "name": "Fledermaus",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 1,
        "hpFormula": "1W4-1",
        "speed": {
            "walk": "1",
            "fly": "9 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 2,
        "dex": 15,
        "con": 8,
        "int": 2,
        "wis": 12,
        "cha": 4,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 18 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Echolot",
                "desc": "Die Fledermaus kann ihre Blindsicht nicht verwenden, solange sie taub ist."
            },
            {
                "name": "Scharfes Gehör",
                "desc": "Die Fledermaus ist bei Weisheitswürfen (Wahrnehmung), die auf Gehör basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +0 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 1 Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "katze",
        "name": "Katze",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 2,
        "hpFormula": "1W4",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "9 m",
            "burrow": ""
        },
        "str": 3,
        "dex": 15,
        "con": 10,
        "int": 3,
        "wis": 12,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Die Katze ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +0 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "rabe",
        "name": "Rabe",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 1,
        "hpFormula": "1W4-1",
        "speed": {
            "walk": "3 m",
            "fly": "15 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 2,
        "dex": 14,
        "con": 8,
        "int": 2,
        "wis": 12,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Stimmen nachahmen",
                "desc": "Der Rabe kann einfache Geräusche imitieren, die er gehört hat, beispielsweise das Geflüster einer Person, Säuglingsgeschrei oder Tierlaute. Ein Kreatur, die diese Geräusche hört, erkennt sie als Imitation, sofern sie einen SG-10-Weisheitswurf (Motiv erkennen) besteht."
            }
        ],
        "actions": [
            {
                "name": "Schnabel",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ratte",
        "name": "Ratte",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 10,
        "acInfo": "",
        "hp": 1,
        "hpFormula": "1W4-1",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 2,
        "dex": 11,
        "con": 9,
        "int": 2,
        "wis": 10,
        "cha": 4,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 9 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Die Ratte ist bei Weisheitswürfen (Wahrnehmung) im Vorteil, die auf Geruchssinn basieren."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +0 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "schakal",
        "name": "Schakal",
        "size": "Kleines",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 3,
        "hpFormula": "1W6",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 8,
        "dex": 15,
        "con": 11,
        "int": 3,
        "wis": 12,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Der Schakal ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            },
            {
                "name": "Scharfes Gehör und scharfer Geruchssinn",
                "desc": "Der Schakal ist bei Weisheitswürfen (Wahrnehmung), die auf Gehör oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +1 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 (1W4-1) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "spinne",
        "name": "Spinne",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "0",
        "xp": 10,
        "ac": 12,
        "acInfo": "",
        "hp": 1,
        "hpFormula": "1W4-1",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "6 m",
            "burrow": ""
        },
        "str": 2,
        "dex": 14,
        "con": 8,
        "int": 1,
        "wis": 10,
        "cha": 2,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 9 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Netzsinn",
                "desc": "Solange die Spinne in Kontakt mit einem Spinnennetz ist, weiß sie genau, wo sich andere Kreaturen aufhalten, die in Kontakt mit demselben Netz sind."
            },
            {
                "name": "Netzwandler",
                "desc": "Die Spinne ignoriert Bewegungseinschränkungen, die durch Netze verursacht werden."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Die Spinne kann an schwierigen Oberflächen klettern, auch kopfüber an der Decke, ohne Attributswürfe ausführen zu müssen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 1 Stichschaden, und das Ziel muss einen SG-9-Konstitutionsrettungswurf bestehen, oder es erleidet 2 (1W4) Giftschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "adeliger",
        "name": "Adeliger",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "1/8",
        "xp": 25,
        "ac": 15,
        "acInfo": "(Brustplatte)",
        "hp": 9,
        "hpFormula": "2W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 12,
        "con": 11,
        "int": 12,
        "wis": 14,
        "cha": 16,
        "savingThrows": {},
        "skills": {
            "motiv_erkennen": "+4",
            "taeuschen": "+5",
            "ueberzeugen": "+5"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Zwei beliebige Sprachen"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Rapier",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W8+1) Stichschaden."
            }
        ],
        "reactions": [
            {
                "name": "Parieren",
                "desc": "Der Adelige erhöht seine RK gegen einen Nahkampfangriff, der treffen würde, um 2. Dazu muss der Adelige den Angreifer sehen können und eine Nahkampfwaffe führen."
            }
        ],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "bandit",
        "name": "Bandit",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede nicht-rechtschaffene Gesinnung",
        "cr": "1/8",
        "xp": 25,
        "ac": 12,
        "acInfo": "(Lederrüstung)",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 12,
        "con": 12,
        "int": 10,
        "wis": 10,
        "cha": 10,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Krummsäbel",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W6+1) Hiebschaden."
            },
            {
                "name": "Leichte Armbrust",
                "desc": "Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 24/96 m, ein Ziel. Treffer: 5 (1W8+1) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "giftschlange",
        "name": "Giftschlange",
        "size": "Winziges",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/8",
        "xp": 25,
        "ac": 13,
        "acInfo": "",
        "hp": 2,
        "hpFormula": "1W4",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "9 m",
            "climb": "",
            "burrow": ""
        },
        "str": 2,
        "dex": 16,
        "con": 11,
        "int": 1,
        "wis": 10,
        "cha": 3,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 3 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 1 Stichschaden, und das Ziel muss einen SG-10-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 5 (2W4) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "kobold",
        "name": "Kobold",
        "size": "Klein",
        "creatureType": "Humanoide (Kobold)",
        "alignment": "rechtschaffen böse",
        "cr": "1/8",
        "xp": 25,
        "ac": 12,
        "acInfo": "",
        "hp": 5,
        "hpFormula": "2W6-2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 7,
        "dex": 15,
        "con": 9,
        "int": 8,
        "wis": 7,
        "cha": 8,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 8"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Empfindlich gegenüber Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Kobold bei Angriffswürfen sowie bei Weisheitswürfen (Wahrnehmung), die Sicht erfordern, im Nachteil."
            },
            {
                "name": "Rudeltaktik",
                "desc": "Der Kobold ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            }
        ],
        "actions": [
            {
                "name": "Dolch",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W4+2) Stichschaden."
            },
            {
                "name": "Schleuder",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 9/36 m, ein Ziel. Treffer: 4 (1W4+2) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "kultist",
        "name": "Kultist",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede nichtgute Gesinnung",
        "cr": "1/8",
        "xp": 25,
        "ac": 12,
        "acInfo": "(Lederrüstung)",
        "hp": 9,
        "hpFormula": "2W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 12,
        "con": 10,
        "int": 10,
        "wis": 11,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "religion": "+2",
            "taeuschen": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [
            {
                "name": "Dunkle Hingabe",
                "desc": "Der Kultist ist bei Rettungswürfen gegen die Zustände Bezaubert und Verängstigt im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Krummsäbel",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 4 (1W6+1) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesenratte",
        "name": "Riesenratte Variante: Kranke Riesenratte",
        "size": "Kleines",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/8",
        "xp": 25,
        "ac": 12,
        "acInfo": "",
        "hp": 7,
        "hpFormula": "2W6",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 7,
        "dex": 15,
        "con": 11,
        "int": 2,
        "wis": 10,
        "cha": 4,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Die Ratte ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer ihrer Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            },
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Die Ratte ist bei Weisheitswürfen (Wahrnehmung) im Vorteil, die auf Geruchssinn basieren."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W4+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "stammeskrieger",
        "name": "Stammeskrieger",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "1/8",
        "xp": 25,
        "ac": 12,
        "acInfo": "(Fellrüstung)",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 13,
        "dex": 11,
        "con": 12,
        "int": 8,
        "wis": 11,
        "cha": 8,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Der Stammeskrieger ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            }
        ],
        "actions": [
            {
                "name": "Speer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 4 (1W6+1) Stichschaden oder 5 (1W8+1) Stichschaden, wenn beidhändig geführt, um einen Nahkampfangriff auszuführen."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "wache",
        "name": "Wache",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "1/8",
        "xp": 25,
        "ac": 16,
        "acInfo": "(Kettenhemd, Schild)",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 13,
        "dex": 12,
        "con": 12,
        "int": 10,
        "wis": 11,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Speer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 4 (1W6+1) Stichschaden oder 5 (1W8+1) Stichschaden, wenn beidhändig geführt, um einen Nahkampfangriff auszuführen."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "akolyth",
        "name": "Akolyth",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "1/4",
        "xp": 50,
        "ac": 10,
        "acInfo": "",
        "hp": 9,
        "hpFormula": "2W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 10,
        "con": 10,
        "int": 10,
        "wis": 14,
        "cha": 11,
        "savingThrows": {},
        "skills": {
            "heilkunde": "+4",
            "religion": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Knüppel",
                "desc": "Nahkampfwaffenangriff: +2 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 2 (1W4) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "drow-elf",
        "name": "Drow (Elf)",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Elf)",
        "alignment": "neutral böse",
        "cr": "1/4",
        "xp": 50,
        "ac": 15,
        "acInfo": "(Kettenhemd)",
        "hp": 13,
        "hpFormula": "3W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 14,
        "con": 10,
        "int": 11,
        "wis": 11,
        "cha": 12,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Elfisch",
            "Gemeinsprache der Unterreiche"
        ],
        "traits": [
            {
                "name": "Empfindlich gegenüber Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Drow bei Angriffswürfen sowie bei Weisheitswürfen (Wahrnehmung), die Sicht erfordern, im Nachteil."
            },
            {
                "name": "Feenblut",
                "desc": "Der Drow ist bei Rettungswürfen gegen den Zustand Bezaubert im Vorteil und kann nicht magisch zum Einschlafen gebracht werden."
            }
        ],
        "actions": [
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Handarmbrust",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 9/36 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden, und das Ziel muss einen SG-13-Konstitutionsrettungswurf bestehen, oder es ist eine Stunde lang vergiftet. Wenn der Rettungswurf um mindestens 5 Punkte scheitert, ist das Ziel außerdem bewusstlos, solange es auf diese Art vergiftet ist. Das Ziel erwacht, wenn es Schaden erleidet oder von einer anderen Kreatur als Aktion wachgerüttelt wird."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "goblin",
        "name": "Goblin",
        "size": "Klein",
        "creatureType": "Humanoide (Goblinoide)",
        "alignment": "neutral böse",
        "cr": "1/4",
        "xp": 50,
        "ac": 15,
        "acInfo": "(Lederrüstung, Schild)",
        "hp": 7,
        "hpFormula": "2W6",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 8,
        "dex": 14,
        "con": 10,
        "int": 10,
        "wis": 8,
        "cha": 8,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 9"
        ],
        "languages": [
            "Gemeinsprache",
            "Goblinisch"
        ],
        "traits": [
            {
                "name": "Behändes Entkommen",
                "desc": "Der Goblin kann in jedem seiner Züge die Rückzugs- oder die Verstecken-Aktion als Bonusaktion ausführen."
            }
        ],
        "actions": [
            {
                "name": "Krummsäbel",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Hiebschaden."
            },
            {
                "name": "Kurzbogen",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 24/96 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "panther",
        "name": "Panther",
        "size": "Mittelgroßes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/4",
        "xp": 50,
        "ac": 12,
        "acInfo": "",
        "hp": 13,
        "hpFormula": "3W8",
        "speed": {
            "walk": "15 m",
            "fly": "",
            "swim": "",
            "climb": "12 m",
            "burrow": ""
        },
        "str": 14,
        "dex": 15,
        "con": 10,
        "int": 3,
        "wis": 14,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6",
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Anspringen",
                "desc": "Wenn der Panther sich mindestens sechs Meter weit direkt auf eine Kreatur zubewegt und sie dann im selben Zug mit einem Klauenangriff trifft, muss das Ziel einen SG-12-Stärkerettungswurf bestehen, oder es wird umgestoßen. Wenn das Ziel liegt, kann der Panther als Bonusaktion einen Bissangriff gegen es ausführen."
            },
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Die Panther ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W4+2) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "pseudodrache",
        "name": "Pseudodrache",
        "size": "Winzig",
        "creatureType": "Drache",
        "alignment": "neutral gut",
        "cr": "1/4",
        "xp": 50,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 7,
        "hpFormula": "2W4+2",
        "speed": {
            "walk": "4",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 6,
        "dex": 15,
        "con": 13,
        "int": 10,
        "wis": 12,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 3 m",
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Versteht Drakonisch und Gemeinsprache",
            "aber kann nicht sprechen"
        ],
        "traits": [
            {
                "name": "Beschränkte Telepathie",
                "desc": "Der Pseudodrache kann magisch einfache Ideen, Emotionen und Bilder telepathisch an jede Kreatur, die eine Sprache versteht, im Abstand von bis zu 30 Metern von ihm übermitteln."
            },
            {
                "name": "Magieresistenz",
                "desc": "Der Pseudodrache ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Scharfe Sinne",
                "desc": "Der Pseudodrache ist bei Weisheitswürfen (Wahrnehmung), die auf Sicht, Gehör oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W4+2) Stichschaden."
            },
            {
                "name": "Stachel",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 4 (1W4+2) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf bestehen, oder es ist eine Stunde lang vergiftet. Wenn der Rettungswurf um mindestens 5 Punkte scheitert, wird das Ziel ebenso lange bewusstlos, oder bis es Schaden erleidet oder eine andere Kreatur eine Aktion verwendet, um es wachzurütteln."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesengiftschlange",
        "name": "Riesengiftschlange",
        "size": "Mittelgroßes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/4",
        "xp": 50,
        "ac": 14,
        "acInfo": "",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "9 m",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 18,
        "con": 13,
        "int": 2,
        "wis": 10,
        "cha": 3,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 3 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "-"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 6 (1W4+4) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 10 (3W6) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesenwolfsspinne",
        "name": "Riesenwolfsspinne",
        "size": "Mittelgroßes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/4",
        "xp": 50,
        "ac": 13,
        "acInfo": "",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "12 m",
            "burrow": ""
        },
        "str": 12,
        "dex": 16,
        "con": 13,
        "int": 3,
        "wis": 12,
        "cha": 4,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+7",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 3 m",
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Netzsinn",
                "desc": "Solange die Spinne in Kontakt mit einem Spinnennetz ist, weiß sie genau, wo sich andere Kreaturen aufhalten, die in Kontakt mit demselben Netz sind."
            },
            {
                "name": "Netzwandler",
                "desc": "Die Spinne ignoriert Bewegungseinschränkungen, die durch Netze verursacht werden."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Die Spinne kann an schwierigen Oberflächen klettern, auch kopfüber an der Decke, ohne Attributswürfe ausführen zu müssen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 4 (1W6+1) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 7 (2W6) Giftschaden, anderenfalls die Hälfte. Wenn die Trefferpunkte des Ziels durch den Giftschaden auf 0 sinken, ist das Ziel stabil, aber eine Stunde lang vergiftet sowie gelähmt, selbst wenn es Trefferpunkte zurückgewinnt."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "skelett",
        "name": "Skelett",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "rechtschaffen böse",
        "cr": "1/4",
        "xp": 50,
        "ac": 13,
        "acInfo": "(Rüstungsteile)",
        "hp": 13,
        "hpFormula": "2W8+4",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 14,
        "con": 15,
        "int": 6,
        "wis": 8,
        "cha": 5,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Erschöpft",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 9"
        ],
        "languages": [
            "Versteht alle zu Lebzeiten bekannten Sprachen",
            "kann aber nicht sprechen"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Kurzbogen",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 24/96 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "wolf",
        "name": "Wolf",
        "size": "Mittelgroßes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1/4",
        "xp": 50,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 12,
        "dex": 15,
        "con": 12,
        "int": 3,
        "wis": 12,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Der Wolf ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            },
            {
                "name": "Scharfes Gehör und scharfer Geruchssinn",
                "desc": "Der Wolf ist bei Weisheitswürfen (Wahrnehmung), die auf Gehör oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (2W4+2) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-11-Stärkerettungswurf bestehen, oder es wird umgestoßen."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "zombie",
        "name": "Zombie",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "neutral böse",
        "cr": "1/4",
        "xp": 50,
        "ac": 8,
        "acInfo": "",
        "hp": 22,
        "hpFormula": "3W8+9",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 13,
        "dex": 6,
        "con": 16,
        "int": 3,
        "wis": 6,
        "cha": 5,
        "savingThrows": {
            "wis": "+0"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 8"
        ],
        "languages": [
            "Versteht alle zu Lebzeiten bekannten Sprachen",
            "aber kann nicht sprechen"
        ],
        "traits": [
            {
                "name": "Untote Ausdauer",
                "desc": "Wenn die Trefferpunkte des Zombies durch Schaden auf 0 sinken, muss der Zombie einen Konstitutionsrettungswurf mit SG 5 + erlittenem Schaden ausführen, sofern der Schaden nicht gleißend ist oder von einem kritischen Treffer stammt. Bei einem Erfolg behält der Zombie 1 Trefferpunkt."
            }
        ],
        "actions": [
            {
                "name": "Hieb",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 4 (1W6+1) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gnoll",
        "name": "Gnoll",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Gnoll)",
        "alignment": "chaotisch böse",
        "cr": "1/2",
        "xp": 100,
        "ac": 15,
        "acInfo": "(Fellrüstung, Schild)",
        "hp": 22,
        "hpFormula": "5W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 14,
        "dex": 12,
        "con": 11,
        "int": 6,
        "wis": 10,
        "cha": 7,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gnollisch"
        ],
        "traits": [
            {
                "name": "Wüten",
                "desc": "Wenn der Gnoll in seinem Zug die Trefferpunkte einer Kreatur mit einem Nahkampfangriff auf 0 verringert hat, kann er eine Bonusaktion ausführen, um bis zur Hälfte seiner Bewegungsrate zurückzulegen und einen Bissangriff auszuführen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 4 (1W4+2) Stichschaden."
            },
            {
                "name": "Speer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden oder 6 (1W8+2) Stichschaden bei zweihändiger Führung und Nahkampfangriff."
            },
            {
                "name": "Langbogen",
                "desc": "Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 45/180 m, ein Ziel. Treffer: 5 (1W8+1) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "hobgoblin",
        "name": "Hobgoblin",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Goblinoide)",
        "alignment": "rechtschaffen böse",
        "cr": "1/2",
        "xp": 100,
        "ac": 18,
        "acInfo": "(Kettenpanzer, Schild)",
        "hp": 11,
        "hpFormula": "2W8+2",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 13,
        "dex": 12,
        "con": 12,
        "int": 10,
        "wis": 10,
        "cha": 9,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache",
            "Goblinisch"
        ],
        "traits": [
            {
                "name": "Kämpferischer Vorteil",
                "desc": "Einmal pro Zug kann der Hobgoblin einer Kreatur, die er mit einem Waffenangriff trifft, zusätzlich 7 (2W6) Schaden zufügen, sofern diese Kreatur sich im Abstand von bis zu 1,5 Metern von einem Verbündeten des Hobgoblins befindet, der nicht kampfunfähig ist."
            }
        ],
        "actions": [
            {
                "name": "Langschwert",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W8+1) Hiebschaden oder 6 (1W10+1) Hiebschaden bei zweihändiger Führung."
            },
            {
                "name": "Langbogen",
                "desc": "Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 45/180 m, ein Ziel. Treffer: 5 (1W8+1) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ork",
        "name": "Ork",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Ork)",
        "alignment": "chaotisch böse",
        "cr": "1/2",
        "xp": 100,
        "ac": 13,
        "acInfo": "(Fellrüstung)",
        "hp": 15,
        "hpFormula": "2W8+6",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 12,
        "con": 16,
        "int": 7,
        "wis": 11,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "einschuechtern": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache",
            "Orkisch"
        ],
        "traits": [
            {
                "name": "Aggressiv",
                "desc": "Als Bonusaktion kann sich der Ork bis zu seiner Bewegungsrate auf eine feindlich gesinnte Kreatur zubewegen, die er sehen kann."
            }
        ],
        "actions": [
            {
                "name": "Zweihandaxt",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 9 (1W12+3) Hiebschaden."
            },
            {
                "name": "Wurfspeer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m oder Reichweite 9/36 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "satyr",
        "name": "Satyr",
        "size": "Mittelgroßes",
        "creatureType": "Feenwesen",
        "alignment": "chaotisch neutral",
        "cr": "1/2",
        "xp": 100,
        "ac": 14,
        "acInfo": "(Lederrüstung)",
        "hp": 31,
        "hpFormula": "7W8",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 12,
        "dex": 16,
        "con": 11,
        "int": 12,
        "wis": 10,
        "cha": 14,
        "savingThrows": {},
        "skills": {
            "auftreten": "+6",
            "heimlichkeit": "+5",
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Elfisch",
            "Gemeinsprache",
            "Sylvanisch"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Satyr ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Kurzbogen",
                "desc": "Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 24/96 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden."
            },
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden."
            },
            {
                "name": "Rammbock",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (2W4+1) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "schatten",
        "name": "Schatten",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "chaotisch böse",
        "cr": "1/2",
        "xp": 100,
        "ac": 12,
        "acInfo": "",
        "hp": 16,
        "hpFormula": "3W8+3",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 6,
        "dex": 14,
        "con": 13,
        "int": 6,
        "wis": 10,
        "cha": 8,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Kälte",
            "Säure",
            "Schall",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift",
            "Nekrotisch"
        ],
        "conditionImmunities": [
            "Erschöpft",
            "Festgesetzt",
            "Gelähmt",
            "Gepackt",
            "Liegend",
            "Verängstigt",
            "Vergiftet",
            "Versteinert"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Amorph",
                "desc": "Der Schatten kann sich durch enge Bereiche mit einer Breite von nur 2,5 Zentimetern bewegen, ohne sich quetschen zu müssen."
            },
            {
                "name": "Heimlicher Schatten",
                "desc": "In dämmrigem Licht oder bei Dunkelheit kann der Schatten die Verstecken-Aktion als Bonusaktion ausführen."
            },
            {
                "name": "Schwach im Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Schatten bei Angriffswürfen, Attributswürfen und Rettungswürfen im Nachteil."
            }
        ],
        "actions": [
            {
                "name": "Stärkeentzug",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 9 (2W6+2) nekrotischer Schaden, und der Stärkewert des Ziels ist um 1W4 verringert. Wenn die Stärke dadurch auf 0 sinkt, stirbt das Ziel. Anderenfalls bleibt die Stärke verringert, bis das Ziel eine kurze oder lange Rast beendet. Wenn ein Humanoide, der keine böse Gesinnung hat, durch diesen Angriff stirbt, erhebt sich 1W4 Stunden später ein neuer Schatten aus der Leiche."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "schlaeger",
        "name": "Schläger",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede nichtgute Gesinnung",
        "cr": "1/2",
        "xp": 100,
        "ac": 11,
        "acInfo": "(Lederrüstung)",
        "hp": 32,
        "hpFormula": "5W8+10",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 11,
        "con": 14,
        "int": 10,
        "wis": 10,
        "cha": 11,
        "savingThrows": {},
        "skills": {
            "einschuechtern": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Der Schläger ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Schläger führt zwei Nahkampfangriffe aus."
            },
            {
                "name": "Streitkolben",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 5 (1W6+2) Wuchtschaden."
            },
            {
                "name": "Schwere Armbrust",
                "desc": "Fernkampfwaffenangriff: +2 auf Treffer, Reichweite 30/120 m, ein Ziel. Treffer: 5 (1W10) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "worg",
        "name": "Worg",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "neutral böse",
        "cr": "1/2",
        "xp": 100,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 26,
        "hpFormula": "4W10+4",
        "speed": {
            "walk": "15 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 13,
        "con": 13,
        "int": 7,
        "wis": 11,
        "cha": 8,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Goblinisch",
            "Worgisch"
        ],
        "traits": [
            {
                "name": "Scharfes Gehör und scharfer Geruchssinn",
                "desc": "Der Worg ist bei Weisheitswürfen (Wahrnehmung), die auf Gehör oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-13-Stärkerettungswurf bestehen, oder es wird umgestoßen."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "braunbaer",
        "name": "Braunbär",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1",
        "xp": 200,
        "ac": 11,
        "acInfo": "(natürliche Rüstung)",
        "hp": 34,
        "hpFormula": "4W10+12",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "9 m",
            "burrow": ""
        },
        "str": 19,
        "dex": 10,
        "con": 16,
        "int": 2,
        "wis": 13,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Der Bär ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Bär führt zwei Angriffe aus: einen Biss- und einen Klauenangriff."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 8 (1W8+4) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "duergar",
        "name": "Duergar",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Zwerg)",
        "alignment": "rechtschaffen böse",
        "cr": "1",
        "xp": 200,
        "ac": 16,
        "acInfo": "(Schuppenpanzer, Schild)",
        "hp": 26,
        "hpFormula": "4W8+8",
        "speed": {
            "walk": "7",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 14,
        "dex": 11,
        "con": 14,
        "int": 11,
        "wis": 10,
        "cha": 9,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Gift"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache der Unterreiche",
            "Zwergisch"
        ],
        "traits": [
            {
                "name": "Duergar-Widerstandskraft",
                "desc": "Der Duergar ist bei Rettungswürfen gegen den Zustand Vergiftet, gegen Zauber und Illusionen sowie beim Widerstehen gegen die Zustände Bezaubert und Gelähmt im Vorteil."
            },
            {
                "name": "Empfindlich gegenüber Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Duergar bei Angriffs-, und Weisheitswürfen (Wahrnehmung), die auf Sicht basieren, im Nachteil."
            }
        ],
        "actions": [
            {
                "name": "Vergrößern (wird nach kurzer oder langer Rast aufgeladen)",
                "desc": "Der Duergar wächst auf magische Art und bleibt eine Minute lang groß, ebenso alles, was er trägt oder hält. Vergrößert ist der Duergar groß, sein Schadenswürfel bei stärkebasierten Waffenangriffen wird verdoppelt (in Angriffe eingeschlossen), und er ist bei Stärkewürfen und Stärkerettungswürfen im Vorteil. Wenn der Duergar nicht genügend Platz hat, um groß zu werden, nimmt er die maximal mögliche Größe an."
            },
            {
                "name": "Kriegspicke",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W8+2) Stichschaden oder 11 (2W8+2) Stichschaden, wenn vergrößert."
            },
            {
                "name": "Wurfspeer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m oder Reichweite 9/36 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden oder 9 (2W6+2) Stichschaden, wenn vergrößert."
            },
            {
                "name": "Unsichtbarkeit (wird nach kurzer oder langer Rast aufgeladen)",
                "desc": "Der Duergar ist bis zu eine Stunde lang auf magische Art unsichtbar, bis er angreift, einen Zauber wirkt, Vergrößern einsetzt, oder bis seine Konzentration unterbrochen wird (wie bei einem Zauber). Ausrüstung, die der Duergar trägt oder hält, ist ebenfalls unsichtbar."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ghul",
        "name": "Ghul",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "chaotisch böse",
        "cr": "1",
        "xp": 200,
        "ac": 12,
        "acInfo": "",
        "hp": 22,
        "hpFormula": "5W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 13,
        "dex": 15,
        "con": 10,
        "int": 7,
        "wis": 10,
        "cha": 6,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +2 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 9 (2W6+2) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (2W4+2) Hiebschaden. Falls das Ziel eine Kreatur ist, aber kein Elf oder Untoter, muss es einen SG-10-Konstitutionsrettungswurf bestehen, um nicht eine Minute lang gelähmt zu werden. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "grottenschrat",
        "name": "Grottenschrat",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (Goblinoide)",
        "alignment": "chaotisch böse",
        "cr": "1",
        "xp": 200,
        "ac": 16,
        "acInfo": "(Fellrüstung, Schild)",
        "hp": 27,
        "hpFormula": "5W8+5",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 14,
        "con": 13,
        "int": 8,
        "wis": 11,
        "cha": 9,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6",
            "ueberlebenskunst": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache",
            "Goblinisch"
        ],
        "traits": [
            {
                "name": "Rohling",
                "desc": "Eine Nahkampfwaffe bewirkt einen zusätzlichen Würfel ihres Schadens, wenn der Grottenschrat damit trifft (im Angriff enthalten)."
            },
            {
                "name": "Überraschungsangriff",
                "desc": "Wenn der Grottenschrat in der ersten Kampfrunde eine Kreatur überrascht und mit einem Angriff trifft, erleidet das Ziel zusätzlich 7 (2W6) Schaden durch den Angriff."
            }
        ],
        "actions": [
            {
                "name": "Morgenstern",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W8+2) Stichschaden."
            },
            {
                "name": "Wurfspeer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m oder Reichweite 9/36 m, ein Ziel. Treffer: 9 (2W6+2) Stichschaden im Nahkampf oder 5 (1W6+2) Stichschaden im Fernkampf."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "harpyie",
        "name": "Harpyie",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität",
        "alignment": "chaotisch böse",
        "cr": "1",
        "xp": 200,
        "ac": 11,
        "acInfo": "",
        "hp": 38,
        "hpFormula": "7W8+7",
        "speed": {
            "walk": "6 m",
            "fly": "12 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 12,
        "dex": 13,
        "con": 12,
        "int": 7,
        "wis": 10,
        "cha": 13,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Gemeinsprache"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Die Harpyie führt zwei Angriffe aus: einen Klauenangriff und einen mit dem Knüppel."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (2W4+1) Hiebschaden."
            },
            {
                "name": "Knüppel",
                "desc": "Nahkampfwaffenangriff: +3 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 3 (1W4+1) Wuchtschaden."
            },
            {
                "name": "Verlockender Gesang",
                "desc": "Die Harpyie singt eine magische Melodie. Alle Humanoiden und Riesen im Abstand von bis zu 90 Metern um die Harpyie, die das Lied hören können, müssen einen SG-11-Weisheitsrettungswurf bestehen, um nicht bis zum Ende des Lieds bezaubert zu sein. Die Harpyie muss in folgenden Zügen eine Bonusaktion verwenden, um weiterzusingen. Sie kann den Gesang jederzeit beenden. Der Gesang endet, wenn die Harpyie kampfunfähig ist. Solange ein Ziel von der Harpyie bezaubert ist, ist es kampfunfähig und ignoriert die Lieder anderer Harpyien. Wenn das bezauberte Ziel mehr als 1,5 Meter von der Harpyie entfernt ist, muss es sich in seinem Zug auf dem direktesten Weg auf die Harpyie zubewegen, um in einen Radius von bis zu 1,5 Meter um die Kreatur zu kommen. Das Ziel vermeidet keine Gelegenheitsangriffe, aber bevor es sich in schädigendes Gelände wie Lava oder eine Grube bewegt und wenn es Schaden durch eine Quelle mit Ausnahme der Harpyie erleidet, kann das Ziel den Rettungswurf wiederholen. Das bezauberte Ziel kann den Rettungswurf am Ende eines jeden seiner Züge wiederholen. Wenn der Rettungswurf erfolgreich ist, endet der Effekt für das Ziel. Ein Ziel, dem ein Rettungswurf gelingt, ist 24 Stunden lang gegen den Gesang der Harpyie immun."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "loewe",
        "name": "Löwe",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1",
        "xp": 200,
        "ac": 12,
        "acInfo": "",
        "hp": 26,
        "hpFormula": "4W10+4",
        "speed": {
            "walk": "15 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 17,
        "dex": 15,
        "con": 13,
        "int": 3,
        "wis": 12,
        "cha": 8,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Anspringen",
                "desc": "Wenn der Löwe sich mindestens sechs Meter weit direkt auf eine Kreatur zubewegt und sie dann im selben Zug mit einem Klauenangriff trifft, muss das Ziel einen SG-13-Stärkerettungswurf bestehen, oder es wird umgestoßen. Wenn das Ziel liegt, kann der Löwe als Bonusaktion einen Bissangriff gegen es ausführen."
            },
            {
                "name": "Rudeltaktik",
                "desc": "Der Löwe ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            },
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Der Löwe ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            },
            {
                "name": "Sprung aus dem Lauf",
                "desc": "Nach drei Metern Anlauf kann der Löwe bis zu 7,5 Meter weit springen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W8+3) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "quasit",
        "name": "Quasit",
        "size": "Winzig",
        "creatureType": "Unhold (Dämon",
        "alignment": "Gestaltwandler), chaotisch böse",
        "cr": "1",
        "xp": 200,
        "ac": 13,
        "acInfo": "",
        "hp": 7,
        "hpFormula": "3W4",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 5,
        "dex": 17,
        "con": 10,
        "int": 7,
        "wis": 10,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+5"
        },
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Kälte",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Abyssisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Der Quasit kann seine Aktion verwenden, um sich in eine Tiergestalt wie eine Fledermaus (Bewegungsrate 3 m, Fliegen 12 m), eine Kröte (12 m, Schwimmen 12 m), einen Tausendfüßler (12 m, Klettern 12 m) oder zurück in seine wahre Gestalt zu verwandeln. Seine Spielwerte sind in allen Gestalten bis auf die angegebenen Bewegungsraten gleich. Ausrüstung, die er trägt oder hält, wird nicht verwandelt. Wenn er stirbt, nimmt er seine wahre Gestalt an."
            },
            {
                "name": "Magieresistenz",
                "desc": "Der Quasit ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Klauen (Biss in Tiergestalt)",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W4+3) Stichschaden, und das Ziel muss einen SG-10-Konstitutionsrettungswurf bestehen, oder es erleidet 5 (2W4) Giftschaden und ist eine Minute lang vergiftet. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            },
            {
                "name": "Unsichtbarkeit",
                "desc": "Der Quasit wird magisch unsichtbar, bis er angreift, Verängstigen einsetzt, oder bis seine Konzentration endet (wie bei einem Zauber). Ausrüstung, die der Quasit trägt oder hält, ist ebenfalls unsichtbar."
            },
            {
                "name": "Verängstigen (1-mal täglich)",
                "desc": "Eine Kreatur nach Wahl des Quasiten im Abstand von bis zu sechs Metern von ihm muss einen SG-10-Weisheitsrettungswurf bestehen, oder sie ist eine Minute lang verängstigt. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen. Wenn der Quasit in Sichtlinie ist, so ist der Rettungswurf im Nachteil. Bei einem Erfolg endet der Effekt."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesenadler",
        "name": "Riesenadler",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "neutral gut",
        "cr": "1",
        "xp": 200,
        "ac": 13,
        "acInfo": "",
        "hp": 26,
        "hpFormula": "4W10+4",
        "speed": {
            "walk": "3 m",
            "fly": "24 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 17,
        "con": 13,
        "int": 8,
        "wis": 14,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Riesenadlerisch",
            "versteht Aural und Gemeinsprache",
            "aber kann sie nicht sprechen"
        ],
        "traits": [
            {
                "name": "Scharfe Sicht",
                "desc": "Der Adler ist bei Weisheitswürfen (Wahrnehmung), die auf Sicht basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Adler führt zwei Angriffe aus: einen Schnabel- und einen Klauenangriff."
            },
            {
                "name": "Krallen",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Hiebschaden."
            },
            {
                "name": "Schnabel",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesenkroete",
        "name": "Riesenkröte",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1",
        "xp": 200,
        "ac": 11,
        "acInfo": "",
        "hp": 39,
        "hpFormula": "6W10+6",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "12 m",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 13,
        "con": 13,
        "int": 2,
        "wis": 10,
        "cha": 3,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 9 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Die Kröte kann Luft und Wasser atmen."
            },
            {
                "name": "Stehender Sprung",
                "desc": "Die Kröte kann mit oder ohne Anlauf bis zu sechs Meter weit und bis zu drei Meter hoch springen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W10+2) Stichschaden plus 5 (1W10) Giftschaden, und das Ziel wird gepackt (Rettungswurf-SG 13). Ein gepacktes Ziel ist festgesetzt. Die Kröte kann solange kein weiteres Ziel beißen."
            },
            {
                "name": "Verschlucken",
                "desc": "Die Kröte führt einen Bissangriff gegen ein höchstens mittelgroßes Ziel aus, das sie gepackt hält. Wenn der Angriff trifft, wird das Ziel verschluckt, und der Haltegriff endet. Ein verschlucktes Ziel ist blind und festgesetzt, hat vollständige Deckung gegen Angriffe und andere Effekte von außerhalb der Kröte und erleidet zu Beginn jedes Zugs der Kröte 10 (3W6) Säureschaden. Die Kröte kann jeweils nur ein Ziel verschlucken. Stirbt die Kröte, so ist die verschluckte Kreatur nicht mehr festgesetzt und kann aus dem Kadaver entkommen, indem sie 1,5 Meter ihrer Bewegungsrate verwendet. Anschließend ist sie liegend."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "riesenspinne",
        "name": "Riesenspinne",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1",
        "xp": 200,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 26,
        "hpFormula": "4W10+4",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "9 m",
            "burrow": ""
        },
        "str": 14,
        "dex": 16,
        "con": 12,
        "int": 2,
        "wis": 11,
        "cha": 4,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+7"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 3 m",
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Netzsinn",
                "desc": "Solange die Spinne in Kontakt mit einem Spinnennetz ist, weiß sie genau, wo sich andere Kreaturen aufhalten, die in Kontakt mit demselben Netz sind."
            },
            {
                "name": "Netzwandler",
                "desc": "Die Spinne ignoriert Bewegungseinschränkungen, die durch Netze verursacht werden."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Die Spinne kann an schwierigen Oberflächen klettern, auch kopfüber an der Decke, ohne Attributswürfe ausführen zu müssen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 7 (1W8+3) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 9 (2W8) Giftschaden, anderenfalls die Hälfte. Wenn die Trefferpunkte des Ziels durch den Giftschaden auf 0 sinken, ist das Ziel stabil, aber eine Stunde lang vergiftet sowie gelähmt, selbst wenn es Trefferpunkte zurückgewinnt."
            },
            {
                "name": "Netz (Aufladung 5–6)",
                "desc": "Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 9/18 m, eine Kreatur. Treffer: Das Ziel ist durch das Netz festgesetzt. Als Aktion kann das festgesetzte Ziel einen SG-12-Stärkewurf ausführen. Bei einem Erfolg befreit es sich aus den Netzen. Das Netz kann auch angegriffen und zerstört werden (RK 10, 5 Trefferpunkte, anfällig für Feuerschaden, immun gegen Gift-, psychischen und Wuchtschaden)."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "schreckenswolf",
        "name": "Schreckenswolf",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "1",
        "xp": 200,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 37,
        "hpFormula": "5W10+10",
        "speed": {
            "walk": "15 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 17,
        "dex": 15,
        "con": 15,
        "int": 3,
        "wis": 12,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Rudeltaktik",
                "desc": "Der Wolf ist bei Angriffswürfen gegen eine Kreatur im Vorteil, wenn sich mindestens einer seiner Verbündeten, der nicht kampfunfähig ist, im Abstand von bis zu 1,5 Metern von der Kreatur befindet."
            },
            {
                "name": "Scharfes Gehör und scharfer Geruchssinn",
                "desc": "Der Wolf ist bei Weisheitswürfen (Wahrnehmung), die auf Gehör oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-13-Stärkerettungswurf bestehen, oder es wird umgestoßen."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "spion",
        "name": "Spion",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "1",
        "xp": 200,
        "ac": 12,
        "acInfo": "",
        "hp": 27,
        "hpFormula": "6W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 15,
        "con": 10,
        "int": 12,
        "wis": 14,
        "cha": 16,
        "savingThrows": {},
        "skills": {
            "fingerfertigkeit": "+4",
            "heimlichkeit": "+4",
            "motiv_erkennen": "+4",
            "nachforschungen": "+5",
            "taeuschen": "+5",
            "ueberzeugen": "+5",
            "wahrnehmung": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 16"
        ],
        "languages": [
            "Zwei beliebige Sprachen"
        ],
        "traits": [
            {
                "name": "Hinterhältiger Angriff (1-mal pro Zug)",
                "desc": "Der Spion bewirkt zusätzlich 7 (2W6) Schaden, wenn er ein Ziel mit einem Waffenangriff trifft und beim Angriffswurf im Vorteil ist, oder wenn das Ziel sich im Abstand von bis zu 1,5 Metern von einem Verbündeten des Spions befindet, der nicht kampfunfähig ist, und der Spion beim Angriffswurf nicht im Nachteil ist."
            },
            {
                "name": "Raffinierte Aktion",
                "desc": "Der Spion kann in jedem seiner Züge die Rückzugs-, Spurt- oder die Verstecken-Aktion als Bonusaktion ausführen."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Spion führt zwei Nahkampfangriffe aus."
            },
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Handarmbrust",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 9/36 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "teufelchen",
        "name": "Teufelchen",
        "size": "Winzig",
        "creatureType": "Unhold (Teufel",
        "alignment": "Gestaltwandler), rechtschaffen böse",
        "cr": "1",
        "xp": 200,
        "ac": 13,
        "acInfo": "",
        "hp": 10,
        "hpFormula": "3W4+3",
        "speed": {
            "walk": "6 m",
            "fly": "12 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 6,
        "dex": 17,
        "con": 13,
        "int": 11,
        "wis": 12,
        "cha": 14,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+5",
            "motiv_erkennen": "+3",
            "taeuschen": "+4",
            "ueberzeugen": "+4"
        },
        "damageResistances": [
            "Kälte ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Feuer",
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Gemeinsprache",
            "Infernalisch"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Das Teufelchen kann seine Aktion verwenden, um sich in eine Tiergestalt wie einen Raben (6 m, Fliegen 18 m), eine Ratte (Bewegungsrate 6 m), eine Spinne (6 m, Klettern 6 m) oder zurück in seine wahre Gestalt zu verwandeln. Seine Spielwerte sind in allen Gestalten bis auf die angegebenen Bewegungsraten gleich. Ausrüstung, die er trägt oder hält, wird nicht verwandelt. Wenn er stirbt, nimmt er seine wahre Gestalt an."
            },
            {
                "name": "Magieresistenz",
                "desc": "Das Teufelchen ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Teufelssicht",
                "desc": "Die Dunkelsicht des Teufelchens wird nicht durch magische Dunkelheit beeinträchtigt."
            }
        ],
        "actions": [
            {
                "name": "Stachel (Biss in Tiergestalt)",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W4+3) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 10 (3W6) Giftschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Unsichtbarkeit",
                "desc": "Das Teufelchen wird magisch unsichtbar, bis es angreift oder seine Konzentration endet (wie bei einem Zauber). Ausrüstung, die das Teufelchen trägt oder hält, ist ebenfalls unsichtbar."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "todeshund",
        "name": "Todeshund",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität",
        "alignment": "neutral böse",
        "cr": "1",
        "xp": 200,
        "ac": 12,
        "acInfo": "",
        "hp": 39,
        "hpFormula": "6W8+12",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 14,
        "con": 14,
        "int": 3,
        "wis": 13,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+5"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 15"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Zweiköpfig",
                "desc": "Der Hund ist bei Weisheitswürfen (Wahrnehmung) und bei Rettungswürfen gegen die Zustände Betäubt, Bewusstlos, Bezaubert, Blind, Taub und Verängstigt im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Hund führt zwei Bissangriffe aus."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-12-Konstitutionsrettungswurf gegen die Krankheit bestehen, oder es ist vergiftet, bis die Krankheit geheilt wird. Nach jeweils 24 Stunden muss die Kreatur den Rettungswurf wiederholen. Scheitert der Wurf, wird ihr Trefferpunktemaximum um 5 (1W10) verringert. Es bleibt verringert, bis die Krankheit geheilt ist. Wenn das Trefferpunktemaximum durch die Krankheit auf 0 sinkt, stirbt die Kreatur."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ankheg",
        "name": "Ankheg",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "2",
        "xp": 450,
        "ac": 14,
        "acInfo": "(natürliche Rüstung), 11 in liegender Position",
        "hp": 39,
        "hpFormula": "6W10+6",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": "3 m"
        },
        "str": 17,
        "dex": 11,
        "con": 13,
        "int": 1,
        "wis": 13,
        "cha": 6,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Erschütterungssinn 18 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "-"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Hiebschaden plus 3 (1W6) Säureschaden. Ist das Ziel eine höchstens große Kreatur, so wird sie gepackt (Rettungswurf-SG 13). Solange der Ankheg eine Kreatur gepackt hält, kann er nur diese Kreatur beißen und ist bei entsprechenden Angriffswürfen im Vorteil."
            },
            {
                "name": "Säure versprühen (Aufladung 6)",
                "desc": "Der Ankheg versprüht Säure in einem neun Meter langen und 1,5 Meter breiten Bereich, sofern er gerade keine Kreatur gepackt hat. Jede Kreatur in dieser Linie muss einen SG-13-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 10 (3W6) Säureschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "berserker",
        "name": "Berserker",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede chaotische Gesinnung",
        "cr": "2",
        "xp": 450,
        "ac": 13,
        "acInfo": "(Fellrüstung)",
        "hp": 67,
        "hpFormula": "9W8+27",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 12,
        "con": 17,
        "int": 9,
        "wis": 11,
        "cha": 9,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [
            {
                "name": "Unvorsichtig",
                "desc": "Ab Beginn seines Zugs ist der Berserker bei allen Nahkampfwaffenangriffswürfen im Vorteil, doch Angriffswürfe gegen ihn sind ebenfalls im Vorteil. Dies gilt bis zum Beginn seines nächsten Zugs."
            }
        ],
        "actions": [
            {
                "name": "Zweihandaxt",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 9 (1W12+3) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "eisbaer",
        "name": "Eisbär",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "2",
        "xp": 450,
        "ac": 12,
        "acInfo": "(natürliche Rüstung)",
        "hp": 42,
        "hpFormula": "5W10+15",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "9 m",
            "climb": "",
            "burrow": ""
        },
        "str": 20,
        "dex": 10,
        "con": 16,
        "int": 2,
        "wis": 13,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Der Bär ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Bär führt zwei Angriffe aus: einen Biss- und einen Klauenangriff."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 9 (1W8+5) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 12 (2W6+5) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gallertwuerfel",
        "name": "Gallertwürfel",
        "size": "Groß",
        "creatureType": "Schlick",
        "alignment": "gesinnungslos",
        "cr": "2",
        "xp": 450,
        "ac": 6,
        "acInfo": "",
        "hp": 84,
        "hpFormula": "8W10+40",
        "speed": {
            "walk": "4",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 14,
        "dex": 3,
        "con": 20,
        "int": 1,
        "wis": 6,
        "cha": 1,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [
            "Bezaubert",
            "Blind",
            "Erschöpft",
            "Liegend",
            "Taub",
            "Verängstigt"
        ],
        "senses": [
            "Blindsicht 18 m (blind außerhalb des Radius)",
            "Passive Wahrnehmung 8"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Schlickwürfel",
                "desc": "Der Würfel nimmt seinen gesamten Bereich ein. Andere Kreaturen können in den Bereich gelangen, werden dabei jedoch vom Würfel eingehüllt und sind beim Rettungswurf im Nachteil. Kreaturen im Würfel sind sichtbar, haben jedoch vollständige Deckung. Eine Kreatur im Abstand von bis zu 1,5 Metern vom Würfel kann eine Aktion verwenden, um eine Kreatur oder ein Objekt aus dem Würfel herauszuziehen. Dazu muss sie einen SG-12-Stärkewurf bestehen. Die Kreatur, die den Versuch wagt, erleidet 10 (3W6) Säureschaden. Der Würfel kann nur entweder eine große Kreatur oder bis zu vier höchstens mittelgroße Kreaturen zugleich enthalten."
            },
            {
                "name": "Transparent",
                "desc": "Auch ein nicht getarnter Würfel kann nur mit einem erfolgreichen SG-15 Weisheitswurf (Wahrnehmung) entdeckt werden, sofern er sich weder bewegt noch angreift. Eine Kreatur, die in den Bereich des Würfels gelangt, ohne diesen zu bemerken, wird vom Würfel überrascht."
            }
        ],
        "actions": [
            {
                "name": "Scheinfuß",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 10 (3W6) Säureschaden."
            },
            {
                "name": "Einhüllen",
                "desc": "Der Würfel nutzt seine Bewegungsrate. Dabei kann er in den Bereich von höchstens großen Kreaturen gelangen. In diesem Fall muss die betroffene Kreatur einen SG-12-Geschicklichkeitsrettungswurf ausführen. Bei einem erfolgreichen Rettungswurf kann die Kreatur wählen, 1,5 Meter zurück oder neben den Würfel geschoben zu werden. Wählt sie, nicht geschoben zu werden, gilt der Rettungswurf als gescheitert. Scheitert der Wurf, so gelangt der Würfel in den Bereich der Kreatur. Diese erleidet 10 (3W6) Säureschaden und wird eingehüllt. Die eingehüllte Kreatur kann nicht atmen, ist festgesetzt und erleidet zu Beginn jedes Zugs des Würfels 21 (6W6) Säureschaden. Bewegt sich der Würfel, so bewegt die eingehüllte Kreatur sich mit ihm. Eine eingehüllte Kreatur kann sich mit einer Aktion und einem SG-12-Stärkewurf zu befreien versuchen. Bei einem Erfolg entkommt die Kreatur und gelangt in einen Bereich ihrer Wahl im Abstand von bis zu 1,5 Metern vom Würfel."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gargyl",
        "name": "Gargyl",
        "size": "Mittelgroß",
        "creatureType": "Elementar",
        "alignment": "chaotisch böse",
        "cr": "2",
        "xp": 450,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 52,
        "hpFormula": "7W8+21",
        "speed": {
            "walk": "9 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 11,
        "con": 16,
        "int": 6,
        "wis": 11,
        "cha": 7,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Hieb",
            "Stich und Wucht durch nichtmagische Angriffe ohne Adamant"
        ],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Erschöpft",
            "Vergiftet",
            "Versteinert"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Terral"
        ],
        "traits": [
            {
                "name": "Falsches Erscheinungsbild",
                "desc": "Solange der Gargyl sich nicht bewegt, ist er nicht von einer leblosen Statue zu unterscheiden."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Gargyl führt zwei Angriffe aus: einen Biss- und einen Klauenangriff."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "grick",
        "name": "Grick",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität",
        "alignment": "neutral",
        "cr": "2",
        "xp": 450,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 27,
        "hpFormula": "6W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "9 m",
            "burrow": ""
        },
        "str": 14,
        "dex": 14,
        "con": 11,
        "int": 3,
        "wis": 14,
        "cha": 5,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Hieb",
            "Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Steintarnung",
                "desc": "Der Grick ist bei Geschicklichkeitswürfen (Heimlichkeit), die er ausführt, um sich in steinigem Gelände zu verstecken, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Grick führt einen Tentakelangriff aus. Wenn dieser Angriff trifft, kann der Grick einen Angriff mit dem Schnabel gegen dasselbe Ziel ausführen."
            },
            {
                "name": "Schnabel",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Tentakel",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 9 (2W6+2) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "irrlicht",
        "name": "Irrlicht",
        "size": "Winzig",
        "creatureType": "Untoter",
        "alignment": "chaotisch böse",
        "cr": "2",
        "xp": 450,
        "ac": 19,
        "acInfo": "",
        "hp": 22,
        "hpFormula": "9W4",
        "speed": {
            "walk": "0 m",
            "fly": "15 m (Schweben)",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 1,
        "dex": 28,
        "con": 10,
        "int": 13,
        "wis": 14,
        "cha": 11,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Feuer",
            "Kälte",
            "Nekrotisch",
            "Säure",
            "Schall; Wucht-",
            "Stich- und Hiebschaden durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Blitz",
            "Gift"
        ],
        "conditionImmunities": [
            "Bewusstlos",
            "Erschöpft",
            "Festgesetzt",
            "Gelähmt",
            "Gepackt",
            "Liegend",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Die zu Lebzeiten bekannten Sprachen"
        ],
        "traits": [
            {
                "name": "Flüchtig",
                "desc": "Der Irrlicht kann nichts tragen oder halten."
            },
            {
                "name": "Körperlose Bewegung",
                "desc": "Das Irrlicht kann sich durch andere Kreaturen und Gegenstände bewegen, als wären sie schwieriges Gelände. Es erleidet 5 (1W10) Energieschaden, wenn es seinen Zug in einem Gegenstand beendet."
            },
            {
                "name": "Leben verzehren",
                "desc": "Das Irrlicht kann als Bonusaktion eine Kreatur im Abstand von bis zu 1,5 Metern von ihm auswählen, die es sehen kann, solange die Kreatur zwar 0 Trefferpunkte hat, aber noch am Leben ist. Das Ziel muss gegen diese Magie einen SG-10-Konstitutionsrettungswurf bestehen, um nicht zu sterben. Wenn das Ziel stirbt, erhält das Irrlicht 10 (3W6) Trefferpunkte zurück."
            },
            {
                "name": "Variable Beleuchtung",
                "desc": "Das Irrlicht spendet in einem Radius zwischen 1,5 und sechs Metern helles Licht und in einer weiteren Spanne gleich dem gewählten Radius dämmriges Licht. Das Irrlicht kann den Radius als Bonusaktion anpassen."
            }
        ],
        "actions": [
            {
                "name": "Schock",
                "desc": "Nahkampf-Zauberangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 9 (2W8) Blitzschaden."
            },
            {
                "name": "Unsichtbarkeit",
                "desc": "Das Irrlicht und sein Licht werden auf magische Weise unsichtbar, bis es angreift oder Leben verzehren nutzt oder bis seine Konzentration endet (wie bei einem Zauber)."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "mimik",
        "name": "Mimik",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität (Gestaltwandler)",
        "alignment": "neutral",
        "cr": "2",
        "xp": 450,
        "ac": 12,
        "acInfo": "(natürliche Rüstung)",
        "hp": 58,
        "hpFormula": "9W8+18",
        "speed": {
            "walk": "4",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 17,
        "dex": 12,
        "con": 15,
        "int": 5,
        "wis": 13,
        "cha": 8,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+5"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Säure"
        ],
        "conditionImmunities": [
            "Liegend"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Der Mimik kann seine Aktion verwenden, um sich in einen Gegenstand oder zurück in seine wahre, amorphe Gestalt zu verwandeln. Seine Spielwerte sind in beiden Formen gleich. Ausrüstung, die er trägt oder hält, wird nicht verwandelt. Wenn er stirbt, nimmt er seine wahre Gestalt an."
            },
            {
                "name": "Falsches Erscheinungsbild (nur in Objektgestalt)",
                "desc": "Solange der Mimik sich nicht bewegt, ist er nicht von einem gewöhnlichen Objekt zu unterscheiden."
            },
            {
                "name": "Greifer",
                "desc": "Der Mimik ist bei Angriffswürfen gegen jede Kreatur, die er gepackt hält, im Vorteil."
            },
            {
                "name": "Haftend (nur in Objektgestalt)",
                "desc": "Der Mimik bleibt an allem haften, was ihn berührt. Eine höchstens riesige Kreatur, die am Mimik haftet, wird auch von ihm gepackt (Rettungswurf-SG 13). Attributswürfe, um diesem Haltegriff zu entkommen, sind im Nachteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W8+3) Stichschaden plus 4 (1W8) Säureschaden."
            },
            {
                "name": "Scheinfuß",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W8+3) Wuchtschaden. Wenn der Mimik sich in Objektgestalt befindet, wird das Ziel Opfer seines Haftend-Merkmals."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "oger",
        "name": "Oger",
        "size": "Groß",
        "creatureType": "Riese",
        "alignment": "chaotisch böse",
        "cr": "2",
        "xp": 450,
        "ac": 11,
        "acInfo": "(Fellrüstung)",
        "hp": 59,
        "hpFormula": "7W10+21",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 8,
        "con": 16,
        "int": 5,
        "wis": 7,
        "cha": 7,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 8"
        ],
        "languages": [
            "Gemeinsprache",
            "Riesisch"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Zweihandknüppel",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Wuchtschaden."
            },
            {
                "name": "Wurfspeer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m oder Reichweite 9/36 m, ein Ziel. Treffer: 11 (2W6+4) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "priester",
        "name": "Priester",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "2",
        "xp": 450,
        "ac": 13,
        "acInfo": "(Kettenhemd)",
        "hp": 27,
        "hpFormula": "5W8+5",
        "speed": {
            "walk": "7",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 10,
        "con": 12,
        "int": 13,
        "wis": 16,
        "cha": 13,
        "savingThrows": {},
        "skills": {
            "heilkunde": "+7",
            "religion": "+4",
            "ueberzeugen": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Zwei beliebige Sprachen"
        ],
        "traits": [
            {
                "name": "Göttliche Eminenz",
                "desc": "Als Bonusaktion kann der Priester einen Zauberplatz verwenden, um seine Nahkampf-Waffenangriffe bei einem Treffer magisch mit zusätzlich 10 (3W6) gleißendem Schaden zu versehen. Dieser Vorzug bleibt bis zum Ende des Zugs erhalten. Wenn der Priester einen Zauberplatz mindestens des 2. Grades verwendet, wird der Extraschaden für jeden Grad über dem ersten um 1W6 erhöht."
            }
        ],
        "actions": [
            {
                "name": "Streitkolben",
                "desc": "Nahkampfwaffenangriff: +2 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 3 (1W6) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "saebelzahntiger",
        "name": "Säbelzahntiger",
        "size": "Großes",
        "creatureType": "Tier",
        "alignment": "gesinnungslos",
        "cr": "2",
        "xp": 450,
        "ac": 12,
        "acInfo": "",
        "hp": 52,
        "hpFormula": "7W10+14",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 14,
        "con": 15,
        "int": 3,
        "wis": 12,
        "cha": 8,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Anspringen",
                "desc": "Wenn der Tiger sich mindestens sechs Meter weit direkt auf eine Kreatur zubewegt und sie dann im selben Zug mit einem Klauenangriff trifft, muss das Ziel einen SG-14-Stärkerettungswurf bestehen, oder es wird umgestoßen. Wenn das Ziel liegt, kann der Tiger als Bonusaktion einen Bissangriff gegen es ausführen."
            },
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Die Tiger ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (1W10+5) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 12 (2W6+5) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "bartteufel",
        "name": "Bartteufel",
        "size": "Mittelgroß",
        "creatureType": "Unhold (Teufel)",
        "alignment": "rechtschaffen böse",
        "cr": "3",
        "xp": 700,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 52,
        "hpFormula": "8W8+16",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 15,
        "con": 15,
        "int": 9,
        "wis": 11,
        "cha": 11,
        "savingThrows": {
            "str": "+5",
            "con": "+4",
            "wis": "+2"
        },
        "skills": {},
        "damageResistances": [
            "Kälte ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Feuer",
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Infernalisch",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Teufel ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Standfest",
                "desc": "Der Teufel kann nicht verängstigt werden, solange er eine verbündete Kreatur im Abstand von bis zu neun Metern von ihm sehen kann."
            },
            {
                "name": "Teufelssicht",
                "desc": "Die Dunkelsicht des Teufels wird nicht durch magische Dunkelheit beeinträchtigt."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Teufel führt zwei Angriffe aus: einen mit seinem Bart und einen mit seiner Glefe."
            },
            {
                "name": "Bart",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 6 (1W8+2) Stichschaden, und das Ziel muss einen SG-12-Konstitutionsrettungswurf bestehen, oder es ist eine Minute lang vergiftet. Auf diese Art vergiftete Ziele können außerdem keine Trefferpunkte zurückerhalten. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            },
            {
                "name": "Glefe",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 8 (1W10+3) Hiebschaden. Wenn das Ziel kein Untoter und kein Konstrukt ist, muss es einen SG-12-Konstitutionsrettungswurf bestehen, oder es verliert zu Beginn jedes seiner Züge aufgrund einer infernalischen Wunde 5 (1W10) Trefferpunkte. Wann immer der Teufel das verwundete Ziel erneut mit diesem Angriff trifft, erhöht sich der Schaden durch die Wunde um 5 (1W10). Kreaturen können als Aktion versuchen, die Wunde mit einem erfolgreichen SG-12-Weisheitswurf (Heilkunde) zu verschließen. Die Wunde schließt sich auch, wenn das Ziel magisch geheilt wird."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "basilisk",
        "name": "Basilisk",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "3",
        "xp": 700,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 52,
        "hpFormula": "8W8+16",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 8,
        "con": 15,
        "int": 2,
        "wis": 8,
        "cha": 7,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 9"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Versteinernder Blick",
                "desc": "Wenn eine Kreatur ihren Zug im Abstand von bis zu neun Metern vom Basilisken beginnt und die beiden einander sehen können, kann der Basilisk die Kreatur zu einem SG-12-Konstitutionsrettungswurf zwingen, sofern er nicht kampfunfähig ist. Scheitert der Wurf, so beginnt die Kreatur, magisch zu versteinern, und ist festgesetzt. Sie muss den Rettungswurf am Ende ihres nächsten Zugs wiederholen. Bei einem Erfolg endet der Effekt. Scheitert der Wurf, so bleibt die Kreatur versteinert, bis sie durch den Zauber Vollständige Genesung oder andere Magie befreit wird. Wenn die Kreatur nicht überrascht wird, kann sie die Augen abwenden, um den Rettungswurf zu Beginn ihres Zugs zu vermeiden. In diesem Fall kann sie den Basilisken bis zum Beginn ihres nächsten Zugs, wenn sie die Augen erneut abwenden kann, nicht sehen. Schaut sie den Basilisken in der Zwischenzeit an, so muss sie den Rettungswurf sofort ausführen.  Wenn der Basilisk im Abstand von bis zu neun Metern von sich in hellem Licht sein Spiegelbild sieht, hält er sich selbst für einen Rivalen und zielt mit seinem Blick auf sich."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Stichschaden plus 7 (2W6) Giftschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "doppelgaenger",
        "name": "Doppelgänger",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität (Gestaltwandler)",
        "alignment": "neutral",
        "cr": "3",
        "xp": 700,
        "ac": 14,
        "acInfo": "",
        "hp": 52,
        "hpFormula": "8W8+16",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 18,
        "con": 14,
        "int": 11,
        "wis": 12,
        "cha": 14,
        "savingThrows": {},
        "skills": {
            "motiv_erkennen": "+3",
            "taeuschen": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [
            "Bezaubert"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Der Doppelgänger kann seine Aktion verwenden, um sich in einen kleinen oder mittelgroßen Humanoiden, den er gesehen hat, oder zurück in seine wahre Gestalt zu verwandeln. Seine Spielwerte sind abgesehen von der Größe in beiden Gestalten gleich. Ausrüstung, die er trägt oder hält, wird nicht verwandelt. Wenn er stirbt, nimmt er seine wahre Gestalt an."
            },
            {
                "name": "Lauerjäger",
                "desc": "Der Doppelgänger ist in der ersten Kampfrunde bei Angriffswürfen gegen jede Kreatur im Vorteil, die er überrascht hat."
            },
            {
                "name": "Überraschungsangriff",
                "desc": "Wenn der Doppelgänger in der ersten Kampfrunde eine Kreatur überrascht und mit einem Angriff trifft, erleidet das Ziel zusätzlich 10 (3W6) Schaden durch den Angriff."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Doppelgänger führt zwei Nahkampfangriffe aus."
            },
            {
                "name": "Hieb",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W6+4) Wuchtschaden."
            },
            {
                "name": "Gedanken lesen",
                "desc": "Der Doppelgänger liest magisch die oberflächlichen Gedanken einer Kreatur im Abstand von bis zu 18 Metern von ihm. Der Zauber kann Barrieren durchdringen, wird aber von 90 Zentimetern Holz oder Erde, 60 Zentimetern Stein, fünf Zentimetern Metall (außer Blei) oder von einer dünnen Bleischicht blockiert. Solange das Ziel sich in Reichweite befindet, kann der Doppelgänger dessen Gedanken fortlaufend lesen, sofern seine Konzentration nicht unterbrochen wird (wie bei einem Zauber). Solange der Doppelgänger die Gedanken des Ziels liest, ist er bei Weisheits- (Motiv erkennen) und Charismawürfen (Täuschen, Einschüchtern und Überzeugen) gegen das Ziel im Vorteil."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "eulenbaer",
        "name": "Eulenbär",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "3",
        "xp": 700,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 59,
        "hpFormula": "7W10+21",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 20,
        "dex": 12,
        "con": 17,
        "int": 3,
        "wis": 12,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Scharfe Sicht und scharfer Geruchssinn",
                "desc": "Der Eulenbär ist bei Weisheitswürfen (Wahrnehmung), die auf Sicht oder Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Eulenbär führt zwei Angriffe aus: einen Schnabel- und einen Klauenangriff."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 14 (2W8+5) Hiebschaden."
            },
            {
                "name": "Schnabel",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 10 (1W10+5) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gruftschrecken",
        "name": "Gruftschrecken",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "neutral böse",
        "cr": "3",
        "xp": 700,
        "ac": 14,
        "acInfo": "(beschlagenes Leder)",
        "hp": 45,
        "hpFormula": "6W8+18",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 15,
        "dex": 14,
        "con": 16,
        "int": 10,
        "wis": 13,
        "cha": 15,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+3"
        },
        "damageResistances": [
            "Nekrotisch ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Erschöpft",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Die zu Lebzeiten bekannten Sprachen"
        ],
        "traits": [
            {
                "name": "Empfindlich gegenüber Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Gruftschrecken bei Angriffswürfen sowie bei Weisheitswürfen (Wahrnehmung), die Sicht erfordern, im Nachteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Gruftschrecken führt zwei Langschwert- oder zwei Langbogenangriffe aus. Anstelle eines Langschwertangriffs kann er Lebensentzug einsetzen."
            },
            {
                "name": "Langschwert",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W8+2) Hiebschaden oder 7 (1W10+2) Hiebschaden bei zweihändiger Führung."
            },
            {
                "name": "Lebensentzug",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 5 (1W6+2) nekrotischer Schaden. Das Ziel muss einen SG-13-Konstitutionsrettungswurf bestehen, oder sein Trefferpunktemaximum wird um den Betrag des erlittenen Schadens verringert. Es bleibt verringert, bis das Ziel eine lange Rast beendet. Wenn das Trefferpunktemaximum durch diesen Effekt auf 0 sinkt, stirbt das Ziel. Humanoide, die durch diesen Angriff getötet werden, erheben sich 24 Stunden später als Zombies unter Kontrolle des Gruftschreckens, sofern sie nicht zuvor wiederbelebt oder ihre Leichen zerstört werden. Der Gruftschrecken kann höchstens zwölf Zombies zugleich unter seiner Kontrolle haben."
            },
            {
                "name": "Langbogen",
                "desc": "Fernkampfwaffenangriff: +4 auf Treffer, Reichweite 45/180 m, ein Ziel. Treffer: 6 (1W8+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gruene-vettel",
        "name": "Grüne Vettel",
        "size": "Mittelgroßes",
        "creatureType": "Feenwesen",
        "alignment": "neutral böse",
        "cr": "3",
        "xp": 700,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 82,
        "hpFormula": "11W8+33",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 12,
        "con": 16,
        "int": 13,
        "wis": 14,
        "cha": 14,
        "savingThrows": {},
        "skills": {
            "arkane_kunde": "+3",
            "heimlichkeit": "+3",
            "taeuschen": "+4",
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache",
            "Sylvanisch"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Die Vettel kann Luft und Wasser atmen."
            },
            {
                "name": "Stimmen nachahmen",
                "desc": "Die Vettel kann Tierlaute und menschliche Stimmen nachahmen. Ein Kreatur, die diese Geräusche hört, erkennt sie als Imitation, sofern sie einen SG-14-Weisheitswurf (Motiv erkennen) besteht."
            }
        ],
        "actions": [
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Hiebschaden."
            },
            {
                "name": "Illusionäres Erscheinungsbild",
                "desc": "Die Vettel hüllt sich und alles, was sie trägt oder hält, in eine magische Illusion, die sie wie eine andere Kreatur von ihrer ungefähren Größe sowie von humanoider Gestalt erscheinen lässt. Die Illusion endet, wenn die Vettel sie mit einer Bonusaktion beendet oder ihre Trefferpunkte auf 0 sinken. Die Veränderungen durch diese Illusion halten einer genauen körperlichen Untersuchung nicht stand. Beispiel: Die Vettel könnte sich illusionär glatte Haut verleihen, doch jemand, der sie berührt, würde ihre Falten spüren. Anderenfalls muss eine Kreatur eine Aktion ausführen, um die Illusion visuell zu untersuchen und einen SG-20-Intelligenzwurf (Nachforschungen) auszuführen. Bei einem Erfolg bemerkt die Kreatur die Tarnung der Vettel."
            },
            {
                "name": "Unsichtbare Passage",
                "desc": "Die Vettel wird magisch unsichtbar, bis sie angreift oder ihre Konzentration endet (wie bei einem Zauber). Solange sie unsichtbar ist, hinterlässt sie keine physischen Spuren und kann nur durch Magie gefunden werden. Ausrüstung, die sie trägt oder hält, ist ebenfalls unsichtbar."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "mantikor",
        "name": "Mantikor",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "rechtschaffen böse",
        "cr": "3",
        "xp": 700,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 68,
        "hpFormula": "8W10+24",
        "speed": {
            "walk": "9 m",
            "fly": "15 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 17,
        "dex": 16,
        "con": 17,
        "int": 7,
        "wis": 12,
        "cha": 8,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Schwanzstachel-Wachstum",
                "desc": "Der Mantikor hat 24 Schwanzstacheln. Verbrauchte Stacheln wachsen nach, wenn der Mantikor eine lange Rast abschließt."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Mantikor führt drei Angriffe aus: einen mit seinem Biss und zwei mit seinen Klauen oder drei mit seinen Schwanzstacheln."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W8+3) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Hiebschaden."
            },
            {
                "name": "Schwanzstacheln",
                "desc": "Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 30/60 m, ein Ziel. Treffer: 7 (1W8+3) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "minotaurus",
        "name": "Minotaurus",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "chaotisch böse",
        "cr": "3",
        "xp": 700,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 76,
        "hpFormula": "9W10+27",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 11,
        "con": 16,
        "int": 6,
        "wis": 16,
        "cha": 9,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+7"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 17"
        ],
        "languages": [
            "Abyssisch"
        ],
        "traits": [
            {
                "name": "Erinnerung des Labyrinths",
                "desc": "Der Minotaurus kann sich perfekt an jeden Weg erinnern, den er zurückgelegt hat."
            },
            {
                "name": "Sturmangriff",
                "desc": "Wenn der Minotaurus sich mindestens drei Meter weit direkt auf ein Ziel zubewegt und es dann im selben Zug mit einem Zerfleischen-Angriff trifft, erleidet das Ziel zusätzlich 9 (2W8) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-14-Stärkerettungswurf bestehen, oder es wird bis zu drei Meter weit weg- und umgestoßen."
            },
            {
                "name": "Unvorsichtig",
                "desc": "Zu Beginn seines Zugs kann der Minotaurus entscheiden, bei allen Nahkampfwaffen-Angriffswürfen im Vorteil zu sein, die er in diesem Zug ausführt, doch dann sind Angriffswürfe gegen ihn bis zum Beginn seines nächsten Zugs ebenfalls im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Zerfleischen",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Stichschaden."
            },
            {
                "name": "Zweihandaxt",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 17 (2W12+4) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "phasenspinne",
        "name": "Phasenspinne",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "3",
        "xp": 700,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 32,
        "hpFormula": "5W10+5",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "9 m",
            "burrow": ""
        },
        "str": 15,
        "dex": 15,
        "con": 12,
        "int": 6,
        "wis": 10,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Ätherische Bewegung",
                "desc": "Als Bonusaktion kann die Spinne sich von der materiellen Ebene aus auf die Ätherebene oder umgekehrt begeben."
            },
            {
                "name": "Netzwandler",
                "desc": "Die Spinne ignoriert Bewegungseinschränkungen, die durch Netze verursacht werden."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Die Spinne kann an schwierigen Oberflächen klettern, auch kopfüber an der Decke, ohne Attributswürfe ausführen zu müssen."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +4 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 7 (1W10+2) Stichschaden, und das Ziel muss einen SG-11-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 18 (4W8) Giftschaden, anderenfalls die Hälfte. Wenn die Trefferpunkte des Ziels durch den Giftschaden auf 0 sinken, ist das Ziel stabil, aber eine Stunde lang vergiftet sowie gelähmt, selbst wenn es Trefferpunkte zurückgewinnt."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ritter",
        "name": "Ritter",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "3",
        "xp": 700,
        "ac": 18,
        "acInfo": "(Ritterrüstung)",
        "hp": 52,
        "hpFormula": "8W8+16",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 11,
        "con": 14,
        "int": 11,
        "wis": 11,
        "cha": 15,
        "savingThrows": {
            "con": "+4",
            "wis": "+2"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [
            {
                "name": "Tapferkeit",
                "desc": "Der Ritter ist bei Rettungswürfen gegen den Zustand Verängstigt im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Ritter führt zwei Nahkampfangriffe aus."
            },
            {
                "name": "Zweihandschwert",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Hiebschaden."
            },
            {
                "name": "Schwere Armbrust",
                "desc": "Fernkampfwaffenangriff: +2 auf Treffer, Reichweite 30/120 m, ein Ziel. Treffer: 5 (1W10) Stichschaden."
            },
            {
                "name": "Führungsqualitäten (wird nach kurzer oder langer Rast aufgeladen)",
                "desc": "Der Ritter kann eine Minute lang einen speziellen Befehl oder eine Warnung aussprechen, wann immer eine Kreatur im Abstand von bis zu neun Metern von ihm, die er sehen kann und die ihm nicht feindlich gesinnt ist, einen Angriffs- oder Rettungswurf ausführt. Diese Kreatur kann ihrem Wurf dann einen W4 hinzufügen, sofern sie den Ritter hören und verstehen kann. Eine Kreatur kann nur von jeweils einem Führungsqualitäten-Würfel profitieren. Dieser Effekt endet, wenn der Ritter kampfunfähig ist."
            }
        ],
        "reactions": [
            {
                "name": "Parieren",
                "desc": "Der Ritter erhöht seine RK gegen einen Nahkampfangriff, der ihn treffen würde, um 2. Dazu muss der Ritter den Angreifer sehen können und eine Nahkampfwaffe führen."
            }
        ],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "veteran",
        "name": "Veteran",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "3",
        "xp": 700,
        "ac": 17,
        "acInfo": "(Schienenpanzer)",
        "hp": 58,
        "hpFormula": "9W8+18",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 13,
        "con": 14,
        "int": 10,
        "wis": 11,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "athletik": "+5",
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Veteran führt zwei Langschwertangriffe durch. Wenn er ein Kurzschwert gezogen hat, kann er auch einen Kurzschwertangriff ausführen."
            },
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden."
            },
            {
                "name": "Langschwert",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W8+3) Hiebschaden oder 8 (1W10+3) Hiebschaden bei zweihändiger Führung."
            },
            {
                "name": "Schwere Armbrust",
                "desc": "Fernkampfwaffenangriff: +3 auf Treffer, Reichweite 30/120 m, ein Ziel. Treffer: 6 (1W10+1) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "chuul",
        "name": "Chuul",
        "size": "Groß",
        "creatureType": "Aberration",
        "alignment": "chaotisch böse",
        "cr": "4",
        "xp": 1100,
        "ac": 16,
        "acInfo": "(natürliche Rüstung)",
        "hp": 93,
        "hpFormula": "11W10+33",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "9 m",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 10,
        "con": 16,
        "int": 5,
        "wis": 11,
        "cha": 5,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Versteht Tiefensprache",
            "aber kann nicht sprechen"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Chuul kann Luft und Wasser atmen."
            },
            {
                "name": "Magie spüren",
                "desc": "Der Chuul spürt beliebig oft Magie im Abstand von bis zu 36 Metern von sich. Ansonsten funktioniert dieses Merkmal wie der Zauber Magie entdecken, aber ist selbst nicht magisch."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Chuul führt zwei Zangenangriffe aus. Wenn der Chuul eine Kreatur gepackt hält, kann er auch einmal seine Tentakel einsetzen."
            },
            {
                "name": "Zange",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 11 (2W6+4) Wuchtschaden. Das Ziel wird gepackt (Rettungswurf-SG 14), sofern es sich um eine höchstens große Kreatur handelt und der Chuul nicht schon zwei andere Kreaturen gepackt hält."
            },
            {
                "name": "Tentakel",
                "desc": "Eine vom Chuul gepackte Kreatur muss einen SG-13-Konstitutionsrettungswurf bestehen, oder sie ist eine Minute lang vergiftet. Bis zum Ende der Vergiftung ist das Ziel gelähmt. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "lamia",
        "name": "Lamia",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "chaotisch böse",
        "cr": "4",
        "xp": 1100,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 97,
        "hpFormula": "13W10+26",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 13,
        "con": 15,
        "int": 14,
        "wis": 15,
        "cha": 16,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+3",
            "motiv_erkennen": "+4",
            "taeuschen": "+7"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Abyssisch",
            "Gemeinsprache"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Die Lamia führt zwei Angriffe aus: einen Klauenangriff und einen mit ihrem Dolch, oder Vergiftende Berührung."
            },
            {
                "name": "Dolch",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W4+3) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 14 (2W10+3) Hiebschaden."
            },
            {
                "name": "Vergiftende Berührung",
                "desc": "Nahkampf-Zauberangriff: +5 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: Das Ziel ist eine Stunde lang magisch verflucht. Bis der Fluch endet, ist das Ziel bei Weisheitsrettungswürfen und allen Attributswürfen im Nachteil."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "schwarzer-blob",
        "name": "Schwarzer Blob",
        "size": "Groß",
        "creatureType": "Schlick",
        "alignment": "gesinnungslos",
        "cr": "4",
        "xp": 1100,
        "ac": 7,
        "acInfo": "",
        "hp": 85,
        "hpFormula": "10W10+30",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "",
            "climb": "6 m",
            "burrow": ""
        },
        "str": 16,
        "dex": 5,
        "con": 16,
        "int": 1,
        "wis": 6,
        "cha": 1,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Blitz",
            "Hieb",
            "Kälte",
            "Säure"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Blind",
            "Erschöpft",
            "Liegend",
            "Taub",
            "Verängstigt"
        ],
        "senses": [
            "Blindsicht 18 m (blind außerhalb des Radius)",
            "Passive Wahrnehmung 8"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Amorph",
                "desc": "Der Blob kann sich durch enge Bereiche mit einer Breite von nur 2,5 Zentimetern bewegen, ohne sich quetschen zu müssen."
            },
            {
                "name": "Korrosive Form",
                "desc": "Eine Kreatur, die den Blob berührt oder mit einem Nahkampfangriff trifft, während sie sich im Abstand von bis zu 1,5 Metern von ihm befindet, erleidet 4 (1W8) Säureschaden. Jede nichtmagische Waffe aus Metall oder Holz, die den Blob trifft, wird verätzt. Wenn die Waffe Schaden bewirkt hat, erhält sie einen permanenten und kumulativen Malus von -1 auf Schadenswürfe. Sinkt ihr Malus auf -5, wird die Waffe zerstört. Nichtmagische Munition aus Metall oder Holz, die den Blob trifft, wird zerstört, nachdem sie Schaden bewirkt hat. Der Blob kann sich in einer Runde durch fünf Zentimeter starkes nichtmagisches Holz oder Metall fressen."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Der Blob kann ohne Attributswürfe schwierige Oberflächen erklimmen und sich kopfüber an Decken entlang bewegen."
            }
        ],
        "actions": [
            {
                "name": "Scheinfuß",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Wuchtschaden plus 18 (4W8) Säureschaden. Außerdem wird nichtmagische Rüstung, die vom Ziel getragen wird, teilweise zersetzt und erleidet einen permanenten und kumulativen Malus von -1 auf die RK, die sie gewährt. Die Rüstung wird zerstört, wenn der Malus ihre RK auf 10 verringert.  Reaktionen"
            },
            {
                "name": "Teilen",
                "desc": "Wenn ein mindestens mittelgroßer Blob Blitz- oder Hiebschaden erleidet, teilt er sich in zwei neue Blobs, sofern er mindestens 10 Trefferpunkte hat. Jeder neue Blob hat halb so viele Trefferpunkte wie der ursprüngliche Blob (abgerundet). Neue Blobs sind eine Größenkategorie kleiner als der ursprüngliche Blob."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "sukkubus-inkubus",
        "name": "Sukkubus/Inkubus",
        "size": "Mittelgroß",
        "creatureType": "Unhold (Gestaltwandler)",
        "alignment": "neutral böse",
        "cr": "4",
        "xp": 1100,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 66,
        "hpFormula": "12W8+12",
        "speed": {
            "walk": "9 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 8,
        "dex": 17,
        "con": 13,
        "int": 15,
        "wis": 12,
        "cha": 20,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+7",
            "motiv_erkennen": "+5",
            "taeuschen": "+9",
            "ueberzeugen": "+9",
            "wahrnehmung": "+5"
        },
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Gift",
            "Kälte",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 15"
        ],
        "languages": [
            "Abyssisch",
            "Gemeinsprache",
            "Infernalisch",
            "Telepathie auf 18 m"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Der Unhold kann seine Aktion verwenden, um sich in einen kleinen oder mittelgroßen Humanoiden oder zurück in seine wahre Gestalt zu verwandeln. Ohne Flügel verliert der Unhold seine Flugbewegungsrate. Seine Spielwerte sind im Gegensatz zur Größe und Bewegungsrate in beiden Gestalten gleich. Ausrüstung, die er trägt oder hält, wird nicht verwandelt. Wenn er stirbt, nimmt er seine wahre Gestalt an."
            },
            {
                "name": "Telepathische Bindung",
                "desc": "Der Unhold ignoriert die Reichweiteneinschränkung seiner Telepathie, wenn er mit einer Kreatur kommuniziert, die er bezaubert hat. Die beiden müssen sich dazu nicht einmal auf derselben Existenzebene befinden."
            }
        ],
        "actions": [
            {
                "name": "Klauen (nur Unhold-Gestalt)",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Hiebschaden."
            },
            {
                "name": "Ätherische Gestalten",
                "desc": "Der Unhold begibt sich von der materiellen Ebene aus magisch auf die Ätherebene oder umgekehrt."
            },
            {
                "name": "Bezaubern",
                "desc": "Ein Humanoide im Abstand von bis zu neun Metern vom Unhold, den er sehen kann, muss einen SG-15-Weisheitsrettungswurf bestehen, oder er ist einen Tag lang magisch bezaubert. Das bezauberte Ziel gehorcht den verbal oder telepathisch übermittelten Befehlen des Unholds. Wenn das Ziel Schaden erleidet oder einen selbstmörderischen Befehl erhält, kann es den Rettungswurf wiederholen und den Effekt bei einem Erfolg beenden. Wenn der Rettungswurf des Ziels gegen den Effekt erfolgreich ist oder der Effekt auf es endet, ist das Ziel 24 Stunden lang gegen die Bezauberung des Unholds immun. Der Unhold kann nur jeweils ein Ziel bezaubern. Bezaubert er ein anderes Ziel, so endet der Effekt auf das vorige Ziel."
            },
            {
                "name": "Schwächender Kuss",
                "desc": "Der Unhold küsst eine Kreatur, die bereitwillig ist oder von ihm bezaubert wurde. Das Ziel muss einen SG-15-Konstitutionsrettungswurf gegen diese Magie ausführen. Scheitert der Wurf, erleidet es 32 (5W10+5) psychischen Schaden, anderenfalls die Hälfte. Das Trefferpunktemaximum des Ziels ist um den Betrag des erlittenen Schadens verringert. Es bleibt verringert, bis das Ziel eine lange Rast beendet. Wenn das Trefferpunktemaximum durch diesen Effekt auf 0 sinkt, stirbt das Ziel."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "fleischgolem",
        "name": "Fleischgolem",
        "size": "Mittelgroßes",
        "creatureType": "Konstrukt",
        "alignment": "neutral",
        "cr": "5",
        "xp": 1800,
        "ac": 9,
        "acInfo": "",
        "hp": 93,
        "hpFormula": "11W8+44",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 9,
        "con": 18,
        "int": 6,
        "wis": 10,
        "cha": 5,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Blitz",
            "Gift ohne Adamant",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Gelähmt",
            "Verängstigt",
            "Vergiftet",
            "Versteinert"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Versteht die Sprache seines Schöpfers",
            "aber kann nicht sprechen"
        ],
        "traits": [
            {
                "name": "Abneigung gegen Feuer",
                "desc": "Wenn der Golem Feuerschaden erleidet, ist er bis zum Ende seines nächsten Zugs bei Angriffswürfen und Attributswürfen im Nachteil."
            },
            {
                "name": "Berserker",
                "desc": "Wenn der Golem seinen Zug mit höchstens 40 Trefferpunkten beginnt, würfle mit einem W6. Bei einer 6 gerät der Golem in Kampfrausch. Im Kampfrausch greift der Golem die Kreatur an, die ihm am nächsten ist und die er sehen kann. Befindet sich keine Kreatur in Angriffsreichweite, greift der Golem ein Objekt an, vorzugsweise eines, das kleiner ist als er selbst. Der Kampfrausch hält an, bis der Golem zerstört wird oder alle Trefferpunkte zurückgewinnt. Der Schöpfer des Golems kann versuchen, ihn durch strenges, überzeugendes Zureden aus dem Kampfrausch zu holen, sofern er sich höchstens 18 Meter vom Golem entfernt befindet. Der Golem muss seinen Schöpfer dazu hören können, und dieser muss eine Aktion einen SG-15-Charismawurf (Überzeugen) ausführen. Bei einem Erfolg ist der Kampfrausch des Golems beendet. Erleidet der Golem Schaden, solange er höchstens 40 Trefferpunkte hat, kann er wieder in Kampfrausch geraten."
            },
            {
                "name": "Blitzabsorption",
                "desc": "Der Golem erleidet durch Blitze keinen Schaden, sondern gewinnt Trefferpunkte in Höhe des Blitzschadens zurück."
            },
            {
                "name": "Magieresistenz",
                "desc": "Der Golem ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Magische Waffen",
                "desc": "Die Waffenangriffe des Golems sind magisch."
            },
            {
                "name": "Unveränderliche Form",
                "desc": "Der Golem ist gegen alle Zauber und Effekte, die seine Gestalt ändern würden, immun."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Golem führt zwei Hiebangriffe aus."
            },
            {
                "name": "Hieb",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "gladiator",
        "name": "Gladiator",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "5",
        "xp": 1800,
        "ac": 16,
        "acInfo": "(beschlagenes Leder, Schild)",
        "hp": 112,
        "hpFormula": "15W8+45",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 15,
        "con": 16,
        "int": 10,
        "wis": 12,
        "cha": 15,
        "savingThrows": {
            "str": "+7",
            "dex": "+5",
            "con": "+6"
        },
        "skills": {
            "athletik": "+10",
            "einschuechtern": "+5"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Eine beliebige Sprache (normalerweise Gemeinsprache)"
        ],
        "traits": [
            {
                "name": "Rohling",
                "desc": "Eine Nahkampfwaffe bewirkt einen zusätzlichen Würfel ihres Schadens, wenn der Gladiator damit trifft (im Angriff enthalten)."
            },
            {
                "name": "Tapferkeit",
                "desc": "Der Gladiator ist bei Rettungswürfen gegen den Zustand Verängstigt im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Gladiator führt drei Nahkampfangriffe oder zwei Fernkampfangriffe aus."
            },
            {
                "name": "Schildstoß",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 9 (2W4+4) Wuchtschaden. Wenn das Ziel eine höchstens mittelgroße Kreatur ist, muss es einen SG-15-Stärkerettungswurf bestehen, oder es wird umgestoßen."
            },
            {
                "name": "Speer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m und Reichweite 6/18 m, ein Ziel. Treffer: 11 (2W6+4) Stichschaden oder 13 (2W8+4) Stichschaden bei zweihändiger Führung und Nahkampfangriff."
            }
        ],
        "reactions": [
            {
                "name": "Parieren",
                "desc": "Der Gladiator erhöht seine RK gegen einen Nahkampfangriff, der ihn treffen würde, um 3. Dazu muss der Gladiator den Angreifer sehen können und eine Nahkampfwaffe führen."
            }
        ],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "huegelriese",
        "name": "Hügelriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "chaotisch böse",
        "cr": "5",
        "xp": 1800,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 105,
        "hpFormula": "10W12+40",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 21,
        "dex": 8,
        "con": 19,
        "int": 5,
        "wis": 9,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Riesisch"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit dem Zweihandknüppel aus."
            },
            {
                "name": "Zweihandknüppel",
                "desc": "Nahkampfwaffenangriff: +8 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 18 (3W8+5) Wuchtschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +8 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 21 (3W10+5) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "nachtvettel",
        "name": "Nachtvettel",
        "size": "Mittelgroß",
        "creatureType": "Unhold",
        "alignment": "neutral böse",
        "cr": "5",
        "xp": 1800,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 112,
        "hpFormula": "15W8+45",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 15,
        "con": 16,
        "int": 16,
        "wis": 14,
        "cha": 16,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+6",
            "motiv_erkennen": "+6",
            "taeuschen": "+7",
            "wahrnehmung": "+6"
        },
        "damageResistances": [
            "Feuer",
            "Kälte ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [
            "Bezaubert"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 16"
        ],
        "languages": [
            "Abyssisch",
            "Gemeinsprache",
            "Infernalisch",
            "Urtümlich"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Die Vettel ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Klauen (nur Vettel-Gestalt)",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Hiebschaden."
            },
            {
                "name": "Albtraumspuk (1-mal täglich)",
                "desc": "Von der Ätherebene aus berührt die Vettel magisch einen schlafenden Humanoiden auf der materiellen Ebene. Der Zauber Schutz vor Gut und Böse, der auf das Ziel gewirkt wurde, verhindert diesen Kontakt ebenso wie ein Schutzkreis. Solange der Kontakt fortbesteht, hat das Ziel grässliche Visionen. Wenn diese Visionen mindestens eine Stunde lang anhalten, hat das Ziel durch seine Rast keine Vorzüge, und sein Trefferpunktemaximum ist um 5 (1W10) verringert. Verringert dieser Effekt das Trefferpunktemaximum des Ziels auf 0, so stirbt das Ziel, und sofern es böser Gesinnung war, ist seine Seele im Seelenbeutel der Vettel gefangen. Das Trefferpunktemaximum des Ziels bleibt verringert, bis der Zauber Vollständige Genesung oder ähnliche Magie auf das Ziel gewirkt wird."
            },
            {
                "name": "Ätherische Gestalten",
                "desc": "Die Vettel begibt sich von der materiellen Ebene aus magisch auf die Ätherebene oder umgekehrt. Sie muss dazu einen Herzstein besitzen."
            },
            {
                "name": "Gestalt ändern",
                "desc": "Die Vettel verwandelt sich magisch in einen höchstens mittelgroßen weiblichen Humanoiden oder zurück in ihre wahre Gestalt. Ihre Spielwerte sind in jeder Gestalt gleich. Ausrüstung, die sie trägt oder hält, wird nicht verwandelt. Wenn sie stirbt, nimmt sie wieder ihre wahre Gestalt an."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "otyugh",
        "name": "Otyugh",
        "size": "Groß",
        "creatureType": "Aberration",
        "alignment": "neutral",
        "cr": "5",
        "xp": 1800,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 114,
        "hpFormula": "12W10+48",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 16,
        "dex": 11,
        "con": 19,
        "int": 6,
        "wis": 13,
        "cha": 6,
        "savingThrows": {
            "con": "+7"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Otyughisch"
        ],
        "traits": [
            {
                "name": "Beschränkte Telepathie",
                "desc": "Der Otyugh kann einfache Botschaften und Bilder magisch an jede Kreatur, die eine Sprache versteht, im Abstand von bis zu 36 Metern von ihm übertragen. Diese Telepathieform ermöglicht nicht, dass die empfangende Kreatur telepathisch antwortet."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Otyugh führt drei Angriffe aus: einen Biss- und zwei Tentakelangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 12 (2W8+3) Stichschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-15-Konstitutionsrettungswurf gegen die Krankheit bestehen, oder es ist vergiftet, bis die Krankheit geheilt wird. Nach jeweils 24 Stunden muss das Ziel den Rettungswurf wiederholen. Scheitert der Wurf, wird sein Trefferpunktemaximum um 5 (1W10) verringert. Bei einem Erfolg wird die Krankheit geheilt. Wenn das Trefferpunktemaximum durch die Krankheit auf 0 sinkt, stirbt das Ziel. Das Trefferpunktemaximum des Ziels bleibt verringert, bis die Krankheit geheilt wird."
            },
            {
                "name": "Tentakel",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 7 (1W8+3) Wuchtschaden plus 4 (1W8) Stichschaden. Wenn das Ziel höchstens mittelgroß ist, wird es gepackt (Rettungswurf-SG 13) und ist festgesetzt, bis es befreit wird. Der Otyugh hat zwei Tentakel, die jeweils ein Ziel packen können."
            },
            {
                "name": "Tentakelhieb",
                "desc": "Der Otyugh schmettert gepackte Kreaturen gegeneinander oder gegen eine feste Oberfläche. Jede Kreatur muss einen SG-14-Konstitutionsrettungswurf bestehen, oder sie erleidet 10 (2W6+3) Wuchtschaden und ist bis zum Ende des nächsten Zugs des Otyughs betäubt. Bei einem erfolgreichen Rettungswurf erleidet das Ziel den halben Wuchtschaden und ist nicht betäubt."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "salamander",
        "name": "Salamander",
        "size": "Groß",
        "creatureType": "Elementar",
        "alignment": "neutral böse",
        "cr": "5",
        "xp": 1800,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 90,
        "hpFormula": "12W10+24",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 14,
        "con": 15,
        "int": 11,
        "wis": 10,
        "cha": 12,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Hieb",
            "Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Feuer"
        ],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Ignal"
        ],
        "traits": [
            {
                "name": "Heiße Waffen",
                "desc": "Jede Nahkampfwaffe aus Metall, die der Salamander führt, bewirkt bei einem Treffer zusätzlich 3 (1W6) Feuerschaden (im Angriff enthalten)."
            },
            {
                "name": "Heißer Körper",
                "desc": "Eine Kreatur, die den Salamander berührt oder mit einem Nahkampfangriff trifft, während sie sich im Abstand von bis zu 1,5 Metern von ihm befindet, erleidet 7 (2W6) Feuerschaden."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Salamander führt zwei Angriffe aus: einen Speer- und einen Schwanzangriff."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 11 (2W6+4) Wuchtschaden plus 7 (2W6) Feuerschaden, und das Ziel wird gepackt (Rettungswurf-SG 14). Solange es gepackt bleibt, ist es festgesetzt. Der Salamander kann es automatisch mit dem Schwanz treffen, jedoch keine Schwanzangriffe gegen andere Ziele ausführen."
            },
            {
                "name": "Speer",
                "desc": "Nah- oder Fernkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 11 (2W6+4) Stichschaden oder 13 (2W8+4) Stichschaden bei zweihändiger Führung und Nahkampfangriff, plus 3 (1W6) Feuerschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "todesalb",
        "name": "Todesalb",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "neutral böse",
        "cr": "5",
        "xp": 1800,
        "ac": 13,
        "acInfo": "",
        "hp": 67,
        "hpFormula": "9W8+27",
        "speed": {
            "walk": "0 m",
            "fly": "18 m (Schweben)",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 6,
        "dex": 16,
        "con": 16,
        "int": 12,
        "wis": 14,
        "cha": 15,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Kälte",
            "Säure",
            "Schall ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift",
            "Nekrotisch"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Festgesetzt",
            "Gelähmt",
            "Gepackt",
            "Liegend",
            "Vergiftet",
            "Versteinert"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Die zu Lebzeiten bekannten Sprachen"
        ],
        "traits": [
            {
                "name": "Empfindlich gegenüber Sonnenlicht",
                "desc": "Im Sonnenlicht ist der Todesalb bei Angriffswürfen sowie bei Weisheitswürfen (Wahrnehmung), die Sicht erfordern, im Nachteil."
            },
            {
                "name": "Körperlose Bewegung",
                "desc": "Der Todesalb kann sich durch andere Kreaturen und Gegenstände bewegen, als wären sie schwieriges Gelände. Er erleidet 5 (1W10) Energieschaden, wenn er seinen Zug in einem Gegenstand beendet."
            }
        ],
        "actions": [
            {
                "name": "Lebensentzug",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 21 (4W8+3) nekrotischer Schaden. Das Ziel muss einen SG-14-Konstitutionsrettungswurf bestehen, oder sein Trefferpunktemaximum wird um den Betrag des erlittenen Schadens verringert. Es bleibt verringert, bis das Ziel eine lange Rast beendet. Wenn das Trefferpunktemaximum durch diesen Effekt auf 0 sinkt, stirbt das Ziel."
            },
            {
                "name": "Schreckgespenst erschaffen",
                "desc": "Der Todesalb zielt auf einen Humanoiden im Abstand von bis zu drei Metern von ihm, der höchstens seit einer Minute tot und gewaltsam gestorben ist. Der Geist des Ziels erhebt sich im Bereich seiner Leiche oder an der nächsten freien Stelle als Schreckgespenst. Das Schreckgespenst steht unter der Kontrolle des Todesalbs. Der Todesalb kann höchstens zwölf Schreckgespenster zugleich unter seiner Kontrolle haben."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "troll",
        "name": "Troll",
        "size": "Groß",
        "creatureType": "Riese",
        "alignment": "chaotisch böse",
        "cr": "5",
        "xp": 1800,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 84,
        "hpFormula": "8W10+40",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 13,
        "con": 20,
        "int": 7,
        "wis": 9,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+2"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Riesisch"
        ],
        "traits": [
            {
                "name": "Regeneration",
                "desc": "Der Troll erhält zu Beginn seines Zugs 10 Trefferpunkte zurück. Wenn der Troll Feuer- oder Säureschaden erleidet, wirkt dieses Merkmal zu Beginn seines nächsten Zugs nicht. Der Troll stirbt nur, wenn er seinen Zug mit 0 Trefferpunkten beginnt und keine Trefferpunkte regeneriert."
            },
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Der Troll ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Troll führt drei Angriffe aus: einen Biss- und zwei Klauenangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W6+4) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "chimaere",
        "name": "Chimäre",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "chaotisch böse",
        "cr": "6",
        "xp": 2300,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 114,
        "hpFormula": "12W10+48",
        "speed": {
            "walk": "9 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 11,
        "con": 19,
        "int": 3,
        "wis": 14,
        "cha": 10,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+8"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 18"
        ],
        "languages": [
            "Versteht Drakonisch",
            "aber kann nicht sprechen"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Die Chimäre führt drei Angriffe aus: einen Biss-, einen Hörner- und einen Klauenangriff. Ist ihr Feuerodem-Angriff verfügbar, kann sie den Odem anstatt Biss oder Hörner einsetzen."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Stichschaden."
            },
            {
                "name": "Hörner",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (1W12+4) Wuchtschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Hiebschaden."
            },
            {
                "name": "Feuerodem (Aufladung 5–6)",
                "desc": "Der Drachenkopf atmet Feuer in einem Kegel von 4,5 Metern aus. Jede Kreatur in diesem Bereich muss einen SG-15-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 31 (7W8) Feuerschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "magier",
        "name": "Magier",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "6",
        "xp": 2300,
        "ac": 12,
        "acInfo": "(15 mit Magierrüstung)",
        "hp": 40,
        "hpFormula": "9W8",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 9,
        "dex": 14,
        "con": 11,
        "int": 17,
        "wis": 12,
        "cha": 11,
        "savingThrows": {
            "int": "+6",
            "wis": "+4"
        },
        "skills": {
            "arkane_kunde": "+6",
            "geschichte": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Vier beliebige Sprachen"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Dolch",
                "desc": "Nah- oder Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 4 (1W4+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "medusa",
        "name": "Medusa",
        "size": "Mittelgroß",
        "creatureType": "Monstrosität",
        "alignment": "rechtschaffen böse",
        "cr": "6",
        "xp": 2300,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 127,
        "hpFormula": "17W8+51",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 15,
        "con": 16,
        "int": 12,
        "wis": 13,
        "cha": 15,
        "savingThrows": {},
        "skills": {
            "heimlichkeit": "+5",
            "motiv_erkennen": "+4",
            "taeuschen": "+5",
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Versteinernder Blick",
                "desc": "Die Medusa kann Kreaturen, die ihre Augen sehen können und den Zug im Abstand von bis zu neun Metern von ihr beginnen, zu einem SG-14-Konstitutionsrettungswurf zwingen, sofern die Medusa die Kreatur sehen kann und nicht kampfunfähig ist. Wenn der Rettungswurf um mindestens 5 Punkte scheitert, wird die Kreatur sofort versteinert. Anderenfalls beginnt die Kreatur nach einem gescheiterten Rettungswurf zu versteinern und ist festgesetzt. Die festgesetzte Kreatur muss den Rettungswurf am Ende ihres nächsten Zugs wiederholen. Scheitert der Wurf, wird sie versteinert. Bei einem Erfolg endet der Effekt. Die Versteinerung bleibt bestehen, bis die Kreatur durch den Zauber Vollständige Genesung oder andere Magie befreit wird.  Wenn die Kreatur nicht überrascht wird, kann sie zu Beginn ihres Zugs die Augen abwenden, um den Rettungswurf zu vermeiden. In diesem Fall kann sie die Medusa bis zum Beginn ihres nächsten Zugs, wenn sie die Augen erneut abwenden kann, nicht sehen. Schaut sie die Medusa in der Zwischenzeit an, so muss sie den Rettungswurf sofort ausführen.  Wenn die Medusa sich in einem Bereich mit hellem Licht auf einer polierten Oberfläche im Abstand von bis zu neun Metern von ihr reflektiert sieht, erleidet sie aufgrund ihres Fluchs den Effekt ihres eigenen Blicks."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Die Medusa führt entweder drei Nahkampfangriffe - einen mit ihrem Schlangenhaar und zwei mit ihrem Kurzschwert - oder zwei Fernkampfangriffe mit ihrem Langbogen aus."
            },
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 5 (1W6+2) Stichschaden."
            },
            {
                "name": "Schlangenhaar",
                "desc": "Nahkampfwaffenangriff: +5 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 4 (1W4+2) Stichschaden plus 14 (4W6) Giftschaden."
            },
            {
                "name": "Langbogen",
                "desc": "Fernkampfwaffenangriff: +5 auf Treffer, Reichweite 45/180 m, ein Ziel. Treffer: 6 (1W8+2) Stichschaden plus 7 (2W6) Giftschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "vrock",
        "name": "Vrock",
        "size": "Groß",
        "creatureType": "Unhold (Dämon)",
        "alignment": "chaotisch böse",
        "cr": "6",
        "xp": 2300,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 104,
        "hpFormula": "11W10+44",
        "speed": {
            "walk": "12 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 17,
        "dex": 15,
        "con": 18,
        "int": 8,
        "wis": 13,
        "cha": 8,
        "savingThrows": {
            "dex": "+5",
            "wis": "+4",
            "cha": "+2"
        },
        "skills": {},
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Kälte",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Abyssisch",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Vrock ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Vrock führt zwei Angriffe aus: einen Schnabel- und einen Klauenangriff."
            },
            {
                "name": "Krallen",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 14 (2W10+3) Hiebschaden."
            },
            {
                "name": "Schnabel",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W6+3) Stichschaden."
            },
            {
                "name": "Betäubendes Kreischen (1-mal täglich)",
                "desc": "Der Vrock stößt ein entsetzliches Kreischen aus. Jede Kreatur im Abstand von bis zu sechs Metern von ihm, die ihn hören kann und kein Dämon ist, muss einen SG-14-Konstitutionsrettungswurf bestehen, oder sie ist bis zum Ende des nächsten Zugs des Vrocks betäubt."
            },
            {
                "name": "Sporen (Aufladung 6)",
                "desc": "Eine Wolke giftiger Sporen breitet sich im Radius von 4,5 m um den Vrock aus. Die Sporen breiten sich um Ecken aus. Jede Kreatur in diesem Bereich muss einen SG-14-Konstitutionsrettungswurf bestehen, oder sie ist vergiftet. Auf diese Art vergiftete Kreaturen erleiden zu Beginn jedes ihrer Züge 5 (1W10) Giftschaden. Ein Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden. Der Effekt wird auch durch den Konsum einer Phiole mit Weihwasser beendet."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "wyvern",
        "name": "Wyvern",
        "size": "Groß",
        "creatureType": "Drache",
        "alignment": "gesinnungslos",
        "cr": "6",
        "xp": 2300,
        "ac": 13,
        "acInfo": "(natürliche Rüstung)",
        "hp": 110,
        "hpFormula": "13W10+39",
        "speed": {
            "walk": "6 m",
            "fly": "24 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 10,
        "con": 16,
        "int": 5,
        "wis": 12,
        "cha": 6,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "-"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Wyvern führt zwei Angriffe aus: einen Biss- und einen Stachelangriff. Fliegend kann er anstelle eines anderen Angriffs seine Klauen einsetzen."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, eine Kreatur. Treffer: 11 (2W6+4) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W8+4) Hiebschaden."
            },
            {
                "name": "Stachel",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, eine Kreatur. Treffer: 11 (2W6+4) Stichschaden. Das Ziel muss einen SG-15-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 24 (7W6) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "oni",
        "name": "Oni",
        "size": "Groß",
        "creatureType": "Riese",
        "alignment": "rechtschaffen böse",
        "cr": "7",
        "xp": 2900,
        "ac": 16,
        "acInfo": "(Kettenpanzer)",
        "hp": 110,
        "hpFormula": "13W10+39",
        "speed": {
            "walk": "9 m",
            "fly": "9 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 11,
        "con": 16,
        "int": 14,
        "wis": 12,
        "cha": 15,
        "savingThrows": {
            "dex": "+3",
            "con": "+6",
            "wis": "+4",
            "cha": "+5"
        },
        "skills": {
            "arkane_kunde": "+5",
            "taeuschen": "+8",
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Gemeinsprache",
            "Riesisch"
        ],
        "traits": [
            {
                "name": "Magische Waffen",
                "desc": "Die Waffenangriffe des Onis sind magisch."
            },
            {
                "name": "Regeneration",
                "desc": "Der Oni erhält zu Beginn seines Zugs 10 Trefferpunkte zurück, wenn er noch mindestens 1 Trefferpunkt hat."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Oni führt zwei Angriffe aus, entweder mit seinen Klauen oder mit seiner Glefe."
            },
            {
                "name": "Klauen (nur Oni-Gestalt)",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 8 (1W8+4) Hiebschaden."
            },
            {
                "name": "Glefe",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 15 (2W10+4) Hiebschaden oder 9 (1W10+4) Hiebschaden in kleiner oder mittelgroßer Gestalt."
            },
            {
                "name": "Gestalt ändern",
                "desc": "Der Oni verwandelt sich magisch in einen kleinen oder mittelgroßen Humanoiden oder zurück in seine wahre Gestalt. Seine Spielwerte sind abgesehen von der Größe in allen Gestalten gleich. Die einzige Ausrüstung, die sich ebenfalls verwandelt, ist seine Glefe. Sie schrumpft, sodass sie auch in humanoider Gestalt geführt werden kann. Wenn der Oni stirbt, nimmt er wieder seine wahre Gestalt an, und seine Glefe nimmt wieder ihre normale Größe an."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "steinriese",
        "name": "Steinriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "neutral",
        "cr": "7",
        "xp": 2900,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 126,
        "hpFormula": "11W12+55",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 23,
        "dex": 15,
        "con": 20,
        "int": 10,
        "wis": 12,
        "cha": 9,
        "savingThrows": {
            "dex": "+5",
            "con": "+8",
            "wis": "+4"
        },
        "skills": {
            "athletik": "+12",
            "wahrnehmung": "+4"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Riesisch"
        ],
        "traits": [
            {
                "name": "Steintarnung",
                "desc": "Der Riese ist bei Geschicklichkeitswürfen (Heimlichkeit), die er ausführt, um sich in steinigem Gelände zu verstecken, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit dem Zweihandknüppel aus."
            },
            {
                "name": "Zweihandknüppel",
                "desc": "Nahkampfwaffenangriff: +9 auf Treffer, Reichweite 4,5 m, ein Ziel. Treffer: 19 (3W8+6) Wuchtschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +9 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 28 (4W10+6) Wuchtschaden. Wenn das Ziel eine Kreatur ist, muss es einen SG-17-Stärkerettungswurf bestehen, oder es wird umgestoßen.  Reaktionen"
            },
            {
                "name": "Felsen fangen",
                "desc": "Wenn ein Fels oder ein ähnliches Objekt auf den Riesen geschleudert wird, kann dieser mit einem erfolgreichen SG-10-Geschicklichkeitsrettungswurf das Geschoss fangen, ohne Wuchtschaden zu erleiden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "assassine",
        "name": "Assassine",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede nichtgute Gesinnung",
        "cr": "8",
        "xp": 3900,
        "ac": 15,
        "acInfo": "(beschlagenes Leder)",
        "hp": 78,
        "hpFormula": "12W8+24",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 16,
        "con": 14,
        "int": 13,
        "wis": 11,
        "cha": 10,
        "savingThrows": {
            "dex": "+6",
            "int": "+4"
        },
        "skills": {
            "akrobatik": "+6",
            "heimlichkeit": "+9",
            "taeuschen": "+3",
            "wahrnehmung": "+3"
        },
        "damageResistances": [
            "Gift"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Diebessprache und zwei weitere beliebige Sprachen"
        ],
        "traits": [
            {
                "name": "Attentat",
                "desc": "Während seines ersten Zugs ist der Assassine bei Angriffswürfen gegen jede Kreatur, die noch keinen Zug ausgeführt hat, im Vorteil. Jeder Treffer des Assassinen gegen eine überraschte Kreatur ist kritisch."
            },
            {
                "name": "Entrinnen",
                "desc": "Wenn der Assassine von einem Effekt profitiert, der es ihm ermöglicht, einen Geschicklichkeitsrettungswurf auszuführen, damit er nur den halben Schaden erleidet, so erleidet er stattdessen bei einem Erfolg gar keinen Schaden und bei Misserfolg nur den halben Schaden."
            },
            {
                "name": "Hinterhältiger Angriff",
                "desc": "Einmal pro Zug bewirkt der Assassine zusätzlich 14 (4W6) Schaden, wenn er ein Ziel mit einem Waffenangriff trifft und beim Angriffswurf im Vorteil ist, oder wenn das Ziel sich im Abstand von bis zu 1,5 Metern von einem Verbündeten des Assassinen befindet, der nicht kampfunfähig ist, und der Assassine beim Angriffswurf nicht im Nachteil ist."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Assassine führt zwei Angriffe mit dem Kurzschwert aus."
            },
            {
                "name": "Kurzschwert",
                "desc": "Nahkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 6 (1W6+3) Stichschaden, und das Ziel muss einen SG-15-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 24 (7W6) Giftschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Leichte Armbrust",
                "desc": "Fernkampfwaffenangriff: +6 auf Treffer, Reichweite 24/96 m, ein Ziel. Treffer: 7 (1W8+3) Stichschaden, und das Ziel muss einen SG-15-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 24 (7W6) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "frostriese",
        "name": "Frostriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "neutral böse",
        "cr": "8",
        "xp": 3900,
        "ac": 15,
        "acInfo": "(zusammengewürfelte Rüstung)",
        "hp": 138,
        "hpFormula": "12W12+60",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 23,
        "dex": 9,
        "con": 21,
        "int": 9,
        "wis": 10,
        "cha": 12,
        "savingThrows": {
            "con": "+8",
            "wis": "+3",
            "cha": "+4"
        },
        "skills": {
            "athletik": "+9",
            "wahrnehmung": "+3"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Kälte"
        ],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Riesisch"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit der Zweihandaxt aus."
            },
            {
                "name": "Zweihandaxt",
                "desc": "Nahkampfwaffenangriff: +9 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 25 (3W12+6) Hiebschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +9 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 28 (4W10+6) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "geisternaga",
        "name": "Geisternaga",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "chaotisch böse",
        "cr": "8",
        "xp": 3900,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 75,
        "hpFormula": "10W10+20",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 17,
        "con": 14,
        "int": 16,
        "wis": 15,
        "cha": 16,
        "savingThrows": {
            "dex": "+6",
            "con": "+5",
            "wis": "+5",
            "cha": "+6"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Abyssisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Wiederbelebung",
                "desc": "Wenn der Naga stirbt, wird er nach 1W6 Tagen wieder lebendig und erhält all seine Trefferpunkte zurück. Nur der Zauber Wunsch kann verhindern, dass dieses Merkmal wirkt."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, eine Kreatur. Treffer: 7 (1W6+4) Stichschaden, und das Ziel muss einen SG-13-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 31 (7W8) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "hezrou",
        "name": "Hezrou",
        "size": "Groß",
        "creatureType": "Unhold (Dämon)",
        "alignment": "chaotisch böse",
        "cr": "8",
        "xp": 3900,
        "ac": 16,
        "acInfo": "(natürliche Rüstung)",
        "hp": 136,
        "hpFormula": "13W10+65",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 17,
        "con": 20,
        "int": 5,
        "wis": 12,
        "cha": 13,
        "savingThrows": {
            "str": "+7",
            "con": "+8",
            "wis": "+4"
        },
        "skills": {},
        "damageResistances": [
            "Blitz",
            "Feuer",
            "Kälte",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 11"
        ],
        "languages": [
            "Abyssisch",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Gestank",
                "desc": "Jede Kreatur, die ihren Zug im Abstand von bis zu drei Metern vom Hezrou beginnt, muss einen SG-14-Konstitutionsrettungswurf bestehen, oder sie ist bis zum Beginn ihres nächsten Zugs vergiftet. Bei einem erfolgreichen Rettungswurf ist die Kreatur 24 Stunden lang gegen den Gestank des Hezrou immun."
            },
            {
                "name": "Magieresistenz",
                "desc": "Der Hezrou ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Hezrou führt drei Angriffe aus: einen Biss- und zwei Klauenangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 15 (2W10+4) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Hiebschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "hydra",
        "name": "Hydra",
        "size": "Riesig",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "8",
        "xp": 3900,
        "ac": 15,
        "acInfo": "(natürliche Rüstung)",
        "hp": 172,
        "hpFormula": "15W12+75",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "9 m",
            "climb": "",
            "burrow": ""
        },
        "str": 20,
        "dex": 12,
        "con": 20,
        "int": 2,
        "wis": 10,
        "cha": 7,
        "savingThrows": {},
        "skills": {
            "wahrnehmung": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 16"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Atem anhalten",
                "desc": "Die Hydra kann eine Stunde lang den Atem anhalten."
            },
            {
                "name": "Mehrere Köpfe",
                "desc": "Die Hydra hat fünf Köpfe. Solange sie mehr als einen Kopf hat, ist die Hydra bei Rettungswürfen gegen die Zustände Betäubt, Bewusstlos, Bezaubert, Blind, Taub und Verängstigt im Vorteil. Wann immer die Hydra mindestens 25 Schaden in einem einzigen Zug erleidet, stirbt einer ihrer Köpfe. Sind alle Köpfe tot, so stirbt die Hydra. Am Ende ihres Zugs wachsen der Hydra für jeden Kopf, der seit ihrem letzten Zug zerstört wurde, jeweils zwei Köpfe nach, sofern die Hydra seitdem keinen Feuerschaden erlitten hat. Die Hydra erhält 10 Trefferpunkte für jeden Kopf zurück, der auf diese Art nachgewachsen ist."
            },
            {
                "name": "Reaktive Köpfe",
                "desc": "Für jeden Kopf der Hydra über einen hinaus bekommt sie eine zusätzliche Reaktion, die sie nur zu Gelegenheitsangriffen einsetzen kann."
            },
            {
                "name": "Wachsam",
                "desc": "Wenn die Hydra schläft, ist mindestens einer ihrer Köpfe wach."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Die Hydra führt so viele Bissangriffe aus, wie sie Köpfe hat"
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +8 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 10 (1W10+5) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "junger-gruener-drache",
        "name": "Junger grüner Drache",
        "size": "Groß",
        "creatureType": "Drache",
        "alignment": "rechtschaffen böse",
        "cr": "8",
        "xp": 3900,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 136,
        "hpFormula": "16W10+48",
        "speed": {
            "walk": "12 m",
            "fly": "24 m",
            "swim": "12 m",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 12,
        "con": 17,
        "int": 16,
        "wis": 13,
        "cha": 15,
        "savingThrows": {
            "dex": "+4",
            "con": "+6",
            "wis": "+4",
            "cha": "+5"
        },
        "skills": {
            "heimlichkeit": "+4",
            "taeuschen": "+5",
            "wahrnehmung": "+7"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Blindsicht 9 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 17"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Drache kann Luft und Wasser atmen."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Drache führt drei Angriffe aus: einen mit seinem Biss und zwei mit seinen Klauen."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 15 (2W10+4) Stichschaden plus 7 (2W6) Giftschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 11 (2W6+4) Hiebschaden."
            },
            {
                "name": "Giftodem (Aufladung 5–6)",
                "desc": "Der Drache atmet giftiges Gas in einem Kegel von neun Metern aus. Jede Kreatur in diesem Bereich muss einen SG-14-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 42 (12W6) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "feuerriese",
        "name": "Feuerriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "rechtschaffen böse",
        "cr": "9",
        "xp": 5000,
        "ac": 18,
        "acInfo": "(Ritterrüstung)",
        "hp": 162,
        "hpFormula": "13W12+78",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 25,
        "dex": 9,
        "con": 23,
        "int": 10,
        "wis": 14,
        "cha": 13,
        "savingThrows": {
            "dex": "+3",
            "con": "+10",
            "cha": "+5"
        },
        "skills": {
            "athletik": "+11",
            "wahrnehmung": "+6"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Feuer"
        ],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 16"
        ],
        "languages": [
            "Riesisch"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit dem Großschwert aus."
            },
            {
                "name": "Zweihandschwert",
                "desc": "Nahkampfwaffenangriff: +11 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 28 (6W6+7) Hiebschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +11 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 29 (4W10+7) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "wolkenriese",
        "name": "Wolkenriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "neutral gut (50 %) oder neutral böse (50 %)",
        "cr": "9",
        "xp": 5000,
        "ac": 14,
        "acInfo": "(natürliche Rüstung)",
        "hp": 200,
        "hpFormula": "16W12+96",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 27,
        "dex": 10,
        "con": 22,
        "int": 12,
        "wis": 16,
        "cha": 16,
        "savingThrows": {
            "con": "+10",
            "wis": "+7",
            "cha": "+7"
        },
        "skills": {
            "motiv_erkennen": "+7",
            "wahrnehmung": "+7"
        },
        "damageResistances": [],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 17"
        ],
        "languages": [
            "Gemeinsprache",
            "Riesisch"
        ],
        "traits": [
            {
                "name": "Scharfer Geruchssinn",
                "desc": "Der Riese ist bei Weisheitswürfen (Wahrnehmung), die auf Geruchssinn basieren, im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit dem Morgenstern aus."
            },
            {
                "name": "Morgenstern",
                "desc": "Nahkampfwaffenangriff: +12 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 21 (3W8+8) Stichschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +12 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 30 (4W10+8) Wuchtschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "deva",
        "name": "Deva",
        "size": "Mittelgroßes",
        "creatureType": "celestisches Wesen",
        "alignment": "rechtschaffen gut",
        "cr": "10",
        "xp": 5900,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 136,
        "hpFormula": "16W8+64",
        "speed": {
            "walk": "9 m",
            "fly": "27 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 18,
        "con": 18,
        "int": 17,
        "wis": 20,
        "cha": 20,
        "savingThrows": {
            "wis": "+9",
            "cha": "+9"
        },
        "skills": {
            "motiv_erkennen": "+9",
            "wahrnehmung": "+9"
        },
        "damageResistances": [
            "Gleißend",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Verängstigt"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 19"
        ],
        "languages": [
            "Alle",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Engelswaffen",
                "desc": "Die Waffenangriffe des Devas sind magisch. Wenn der Deva mit einer Waffe trifft, bewirkt die Waffe zusätzlich 4W8 gleißenden Schaden (im Angriff enthalten)."
            },
            {
                "name": "Magieresistenz",
                "desc": "Der Deva ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Deva führt zwei Nahkampfangriffe aus."
            },
            {
                "name": "Streitkolben",
                "desc": "Nahkampfwaffenangriff: +8 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 7 (1W6+4) Wuchtschaden plus 18 (4W8) gleißender Schaden."
            },
            {
                "name": "Gestalt ändern",
                "desc": "Der Deva nimmt magisch die Gestalt eines Humanoiden eines oder Tieres an, dessen Herausforderungsgrad seinen eigenen nicht überschreitet, oder er verwandelt sich wieder in seine wahre Gestalt. Wenn er stirbt, nimmt er seine wahre Gestalt an. Ausrüstung, die er trägt oder hält, wird von der neuen Gestalt absorbiert oder getragen (nach Wahl des Devas). In anderer Gestalt behält der Deva seine Spielwerte und seine Sprechfähigkeit bei, seine RK, Bewegungsmodi, Stärke, Geschicklichkeit und Spezialsinne werden durch die der neuen Gestalt ersetzt, und der Deva erhält alle Spielwerte und Fähigkeiten (außer Klassenmerkmalen, legendären Aktionen und Hortaktionen), welche die neue Gestalt besitzt, der Deva aber nicht."
            },
            {
                "name": "Heilende Berührung (3-mal täglich)",
                "desc": "Der Deva berührt eine andere Kreatur. Das Ziel erhält magisch 20 (4W8+2) Trefferpunkte zurück und wird von allen Flüchen, Krankheiten, Giften, von Blindheit und Taubheit befreit."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "junger-roter-drache",
        "name": "Junger roter Drache",
        "size": "Groß",
        "creatureType": "Drache",
        "alignment": "chaotisch böse",
        "cr": "10",
        "xp": 5900,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 178,
        "hpFormula": "17W10+85",
        "speed": {
            "walk": "12 m",
            "fly": "24 m",
            "swim": "",
            "climb": "12 m",
            "burrow": ""
        },
        "str": 23,
        "dex": 10,
        "con": 21,
        "int": 14,
        "wis": 11,
        "cha": 19,
        "savingThrows": {
            "dex": "+4",
            "con": "+9",
            "wis": "+4",
            "cha": "+8"
        },
        "skills": {
            "heimlichkeit": "+4",
            "wahrnehmung": "+8"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Feuer"
        ],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 9 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 18"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Drache führt drei Angriffe aus: einen mit seinem Biss und zwei mit seinen Klauen."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 17 (2W10+6) Stichschaden plus 3 (1W6) Feuerschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W6+6) Hiebschaden."
            },
            {
                "name": "Feuerodem (Aufladung 5–6)",
                "desc": "Der Drache atmet Feuer in einem Kegel von neun Metern aus. Jede Kreatur in diesem Bereich muss einen SG-17-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 56 (16W6) Feuerschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "steingolem",
        "name": "Steingolem",
        "size": "Großes",
        "creatureType": "Konstrukt",
        "alignment": "gesinnungslos",
        "cr": "10",
        "xp": 5900,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 178,
        "hpFormula": "17W10+85",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 22,
        "dex": 9,
        "con": 20,
        "int": 3,
        "wis": 11,
        "cha": 1,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift",
            "Psychisch ohne Adamant",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Gelähmt",
            "Verängstigt",
            "Vergiftet",
            "Versteinert"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "Versteht die Sprache seines Schöpfers",
            "aber kann nicht sprechen"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Golem ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Magische Waffen",
                "desc": "Die Waffenangriffe des Golems sind magisch."
            },
            {
                "name": "Unveränderliche Form",
                "desc": "Der Golem ist gegen alle Zauber und Effekte, die seine Gestalt ändern würden, immun."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Golem führt zwei Hiebangriffe aus."
            },
            {
                "name": "Hieb",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 19 (3W8+6) Wuchtschaden."
            },
            {
                "name": "Verlangsamen (Aufladung 5–6)",
                "desc": "Der Golem zielt auf mindestens eine Kreatur im Abstand von bis zu drei Metern von ihm, die er sehen kann. Jedes Ziel muss einen SG-17-Weisheitsrettungswurf gegen diese Magie ausführen. Scheitert der Wurf, so kann das Ziel keine Reaktionen einsetzen, seine Bewegungsrate ist halbiert, und es kann in seinem Zug höchstens einen Angriff ausführen. Außerdem kann das Ziel in seinem Zug entweder eine Aktion oder eine Bonusaktion, aber nicht beides ausführen. Diese Effekte halten eine Minute lang an. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "waechternaga",
        "name": "Wächternaga",
        "size": "Groß",
        "creatureType": "Monstrosität",
        "alignment": "rechtschaffen gut",
        "cr": "10",
        "xp": 5900,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 127,
        "hpFormula": "15W10+45",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 19,
        "dex": 18,
        "con": 16,
        "int": 16,
        "wis": 19,
        "cha": 18,
        "savingThrows": {
            "dex": "+8",
            "con": "+7",
            "int": "+7",
            "wis": "+8",
            "cha": "+8"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Gift"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Celestisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Wiederbelebung",
                "desc": "Wenn der Naga stirbt, wird er nach 1W6 Tagen wieder lebendig und erhält all seine Trefferpunkte zurück. Nur der Zauber Wunsch kann verhindern, dass dieses Merkmal wirkt."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +8 auf Treffer, Reichweite 3 m, eine Kreatur. Treffer: 8 (1W8+4) Stichschaden, und das Ziel muss einen SG-15-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 45 (10W8) Giftschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Gift spucken",
                "desc": "Fernkampfwaffenangriff: +8 auf Treffer, Reichweite 4,5/9 m, eine Kreatur. Treffer: Das Ziel muss einen SG-15-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet es 45 (10W8) Giftschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "hornteufel",
        "name": "Hornteufel",
        "size": "Groß",
        "creatureType": "Unhold (Teufel)",
        "alignment": "rechtschaffen böse",
        "cr": "11",
        "xp": 7200,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 178,
        "hpFormula": "17W10+85",
        "speed": {
            "walk": "6 m",
            "fly": "18 m",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 22,
        "dex": 17,
        "con": 21,
        "int": 12,
        "wis": 16,
        "cha": 17,
        "savingThrows": {
            "str": "+10",
            "dex": "+7",
            "wis": "+7",
            "cha": "+7"
        },
        "skills": {},
        "damageResistances": [
            "Kälte ohne Silber",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [
            "Feuer",
            "Gift"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Infernalisch",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Teufel ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Teufelssicht",
                "desc": "Die Dunkelsicht des Teufels wird nicht durch magische Dunkelheit beeinträchtigt."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Teufel führt drei Nahkampfangriffe aus: zwei mit seiner Gabel und einen Schwanzangriff. Statt der Nahkampfangriffe kann er nach Belieben Flamme schleudern einsetzen."
            },
            {
                "name": "Gabel",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 15 (2W8+6) Stichschaden."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 10 (1W8+6) Stichschaden. Wenn das Ziel kein Untoter und kein Konstrukt ist, muss es einen SG-17-Konstitutionsrettungswurf bestehen, oder es verliert zu Beginn jedes seiner Züge aufgrund einer infernalischen Wunde 10 (3W6) Trefferpunkte. Wann immer der Teufel das verwundete Ziel erneut mit diesem Angriff trifft, erhöht sich der Schaden durch die Wunde um 10 (3W6). Kreaturen können als Aktion versuchen, die Wunde mit einem erfolgreichen SG-12-Weisheitswurf (Heilkunde) zu verschließen. Die Wunde schließt sich auch, wenn das Ziel magisch geheilt wird."
            },
            {
                "name": "Flamme schleudern",
                "desc": "Fernkampf-Zauberangriff: +7 auf Treffer, Reichweite 45 m, ein Ziel. Treffer: 14 (4W6) Feuerschaden. Wenn das Ziel ein brennbares Objekt ist, das nicht getragen oder gehalten wird, fängt es Feuer."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "remorhaz",
        "name": "Remorhaz",
        "size": "Riesig",
        "creatureType": "Monstrosität",
        "alignment": "gesinnungslos",
        "cr": "11",
        "xp": 7200,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 195,
        "hpFormula": "17W12+85",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": "6 m"
        },
        "str": 24,
        "dex": 13,
        "con": 21,
        "int": 4,
        "wis": 10,
        "cha": 5,
        "savingThrows": {},
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Feuer",
            "Kälte"
        ],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Erschütterungssinn 18 m",
            "Passive Wahrnehmung 10"
        ],
        "languages": [
            "-"
        ],
        "traits": [
            {
                "name": "Heißer Körper",
                "desc": "Eine Kreatur, die den Remorhaz berührt oder mit einem Nahkampfangriff trifft, während sie sich im Abstand von bis zu 1,5 Metern von ihm befindet, erleidet 10 (3W6) Feuerschaden."
            }
        ],
        "actions": [
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +11 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 40 (6W10+7) Stichschaden plus 10 (3W6) Feuerschaden. Wenn das Ziel eine Kreatur ist, wird es gepackt (Rettungswurf-SG 17). Ein gepacktes Ziel ist festgesetzt. Der Remorhaz kann solange kein weiteres Ziel beißen."
            },
            {
                "name": "Verschlucken",
                "desc": "Der Remorhaz führt einen Bissangriff gegen eine höchstens mittelgroße Kreatur aus, die er gepackt hält. Wenn der Angriff trifft, erleidet die Kreatur den Bissschaden und wird außerdem verschluckt, und der Haltegriff endet. Verschluckte Kreaturen sind blind und festgesetzt, haben vollständige Deckung gegen Angriffe und andere Effekte von außerhalb des Remorhaz und erleiden zu Beginn jedes Zugs des Remorhaz 21 (6W6) Säureschaden. Erleidet der Remorhaz durch eine verschluckte Kreatur in einem einzigen Zug mindestens 30 Schaden, so muss er am Ende des Zugs einen SG-15-Konstitutionsrettungswurf bestehen, oder er würgt alle verschluckten Kreaturen wieder hoch. Diese befinden sich dann im Bereich von drei Metern um den Remorhaz und sind liegend. Stirbt der Remorhaz, so ist die verschluckte Kreatur nicht mehr festgesetzt und kann aus dem Kadaver entkommen, indem sie 4,5 Meter ihrer Bewegungsrate verwendet. Anschließend ist sie liegend."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "erzmagier",
        "name": "Erzmagier",
        "size": "Mittelgroß",
        "creatureType": "Humanoide (jedes Volk)",
        "alignment": "jede Gesinnung",
        "cr": "12",
        "xp": 8400,
        "ac": 12,
        "acInfo": "(15 mit Magierrüstung)",
        "hp": 99,
        "hpFormula": "18W8+18",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 20,
        "wis": 15,
        "cha": 16,
        "savingThrows": {
            "int": "+9",
            "wis": "+6"
        },
        "skills": {
            "arkane_kunde": "+13",
            "geschichte": "+13"
        },
        "damageResistances": [
            "Schaden durch Zauber (durch Steinhaut)",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Sechs beliebige Sprachen"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Erzmagier ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Dolch",
                "desc": "Nah- oder Fernkampfwaffenangriff: +6 auf Treffer, Reichweite 1,5 m oder Reichweite 6/18 m, ein Ziel. Treffer: 4 (1W4+2) Stichschaden."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "rakshasa",
        "name": "Rakshasa",
        "size": "Mittelgroß",
        "creatureType": "Unhold",
        "alignment": "rechtschaffen böse",
        "cr": "13",
        "xp": 10000,
        "ac": 16,
        "acInfo": "(natürliche Rüstung)",
        "hp": 110,
        "hpFormula": "13W8+52",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 14,
        "dex": 17,
        "con": 18,
        "int": 13,
        "wis": 16,
        "cha": 20,
        "savingThrows": {},
        "skills": {
            "motiv_erkennen": "+8",
            "taeuschen": "+10"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Hieb",
            "Stich und Wucht durch nichtmagische Angriffe"
        ],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 18 m",
            "Passive Wahrnehmung 13"
        ],
        "languages": [
            "Gemeinsprache",
            "Infernalisch"
        ],
        "traits": [
            {
                "name": "Beschränkte Magieimmunität",
                "desc": "Der Rakshasa kann nicht von Zaubern bis einschließlich des 6. Grades beeinflusst oder erkannt werden, sofern er dies nicht wünscht. Er ist bei Rettungswürfen gegen alle anderen Zauber und magischen Effekte im Vorteil."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Rakshasa führt zwei Klauenangriffe aus."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +7 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 9 (2W6+2) Hiebschaden, und das Ziel ist verflucht, wenn es sich um eine Kreatur handelt. Der magische Fluch wirkt, wann immer das Ziel eine kurze oder lange Rast einlegt, und plagt es mit grauenhaften Bildern und Träumen. Das verfluchte Ziel erhält durch kurze oder lange Rasten keinen Vorzug. Dieser Fluch hält an, bis er durch den Zauber Fluch brechen oder ähnliche Magie entfernt wird."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "sturmriese",
        "name": "Sturmriese",
        "size": "Riesig",
        "creatureType": "Riese",
        "alignment": "chaotisch gut",
        "cr": "13",
        "xp": 10000,
        "ac": 16,
        "acInfo": "(Schuppenpanzer)",
        "hp": 230,
        "hpFormula": "20W12+100",
        "speed": {
            "walk": "15 m",
            "fly": "",
            "swim": "15 m",
            "climb": "",
            "burrow": ""
        },
        "str": 29,
        "dex": 14,
        "con": 20,
        "int": 16,
        "wis": 18,
        "cha": 18,
        "savingThrows": {
            "str": "+14",
            "con": "+10",
            "wis": "+9",
            "cha": "+9"
        },
        "skills": {
            "arkane_kunde": "+8",
            "athletik": "+14",
            "geschichte": "+8",
            "wahrnehmung": "+9"
        },
        "damageResistances": [
            "Kälte"
        ],
        "damageImmunities": [
            "Blitz",
            "Schall"
        ],
        "conditionImmunities": [],
        "senses": [
            "Passive Wahrnehmung 19"
        ],
        "languages": [
            "Gemeinsprache",
            "Riesisch"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Riese kann Luft und Wasser atmen."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Riese führt zwei Angriffe mit dem Großschwert aus."
            },
            {
                "name": "Zweihandschwert",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 30 (6W6+9) Hiebschaden."
            },
            {
                "name": "Felsblock",
                "desc": "Fernkampfwaffenangriff: +14 auf Treffer, Reichweite 18/72 m, ein Ziel. Treffer: 35 (4W12+9) Wuchtschaden."
            },
            {
                "name": "Blitzschlag (Aufladung 5–6)",
                "desc": "Der Riese schleudert einen magischen Blitz auf einen Punkt im Abstand von bis zu 150 Metern von ihm, den er sehen kann. Jede Kreatur im Abstand von bis zu drei Metern um diesen Punkt muss einen SG-17-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 54 (12W8) Blitzschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "vampir",
        "name": "Vampir",
        "size": "Mittelgroß",
        "creatureType": "Untoter (Gestaltwandler)",
        "alignment": "rechtschaffen böse",
        "cr": "13",
        "xp": 10000,
        "ac": 16,
        "acInfo": "(natürliche Rüstung)",
        "hp": 144,
        "hpFormula": "17W8+68",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 18,
        "dex": 18,
        "con": 18,
        "int": 17,
        "wis": 15,
        "cha": 18,
        "savingThrows": {
            "dex": "+9",
            "wis": "+7",
            "cha": "+9"
        },
        "skills": {
            "heimlichkeit": "+9",
            "wahrnehmung": "+7"
        },
        "damageResistances": [
            "Nekrotisch",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "damageImmunities": [],
        "conditionImmunities": [],
        "senses": [
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 17"
        ],
        "languages": [
            "Die zu Lebzeiten bekannten Sprachen"
        ],
        "traits": [
            {
                "name": "Gestaltwandler",
                "desc": "Wenn der Vampir sich nicht im Sonnenlicht oder in fließendem Wasser befindet, kann er seine Aktion verwenden, um sich in eine winzige Fledermaus, eine mittelgroße Nebelwolke oder zurück in seine wahre Gestalt zu verwandeln. In Fledermausgestalt kann der Vampir nicht sprechen, seine Schrittbewegungsrate beträgt 1,5 Meter, und er hat eine Flugbewegungsrate von neun Metern. Seine Spielwerte sind abgesehen von Größe und Bewegungsrate unverändert. Alles, was er trägt, verwandelt sich mit ihm, jedoch nichts, was er hält. Wenn er stirbt, nimmt er seine wahre Gestalt an. In Nebelgestalt kann der Vampir keine Aktionen ausführen, nicht sprechen und nicht mit Objekten interagieren. Er hat kein Gewicht, eine Flugbewegungsrate von sechs Metern, kann schweben, in den Bereich einer feindlich gesinnten Kreatur eindringen und dort stoppen. Sofern Luft durch einen Bereich strömen kann, kann der Nebel diesen Bereich ebenfalls passieren, ohne sich zu quetschen. Er kann nicht durch Wasser gelangen. Er ist bei Rettungswürfen auf Stärke, Geschicklichkeit und Konstitution im Vorteil und gegen alle nichtmagischen Schadensarten außer Schaden durch Sonnenlicht immun."
            },
            {
                "name": "Legendäre Resistenz (3-mal täglich)",
                "desc": "Wenn sein Rettungswurf scheitert, kann der Vampir den Wurf in einen Erfolg verwandeln."
            },
            {
                "name": "Neblige Flucht",
                "desc": "Wenn seine Trefferpunkte außerhalb seines Ruheplatzes auf 0 sinken, verwandelt sich der Vampir in eine Nebelwolke (wie beim Gestaltwandler-Merkmal), anstatt bewusstlos zu werden, sofern er sich weder im Sonnenlicht noch in fließendem Wasser befindet. Wenn er sich nicht verwandeln kann, wird er zerstört. Mit 0 Trefferpunkten in Nebelgestalt kann er sich nicht in seine Vampirgestalt zurückverwandeln und muss im Abstand von zwei Stunden seinen Ruheplatz erreichen, oder er wird zerstört. Erreicht er seinen Ruheplatz, so verwandelt er sich in seine Vampirgestalt zurück. Dann ist er gelähmt, bis er mindestens einen Trefferpunkt zurückerhält. Wenn er eine Stunde mit 0 Trefferpunkten an seinem Ruheplatz verbracht hat, erhält er 1 Trefferpunkt zurück."
            },
            {
                "name": "Regeneration",
                "desc": "Der Vampir erhält zu Beginn seines Zugs 20 Trefferpunkte zurück, wenn er mindestens 1 Trefferpunkt hat und sich weder im Sonnenlicht noch in fließendem Wasser befindet. Wenn der Vampir gleißenden Schaden oder Schaden durch Weihwasser erleidet, wirkt dieses Merkmal zu Beginn seines nächsten Zugs nicht."
            },
            {
                "name": "Spinnenklettern",
                "desc": "Der Vampir kann ohne Attributswürfe schwierige Oberflächen erklimmen und sich kopfüber an Decken entlang bewegen."
            },
            {
                "name": "Vampirschwächen",
                "desc": "Der Vampir hat folgende Makel: Holzpflock ins Herz: Wenn dem Vampir eine Stichwaffe aus Holz ins Herz getrieben wird, während er sich kampfunfähig an seinem Ruheplatz befindet, ist der Vampir gelähmt, bis die Waffe entfernt wird. Hyperempfindlich gegenüber Sonnenlicht: Der Vampir erleidet 20 gleißenden Schaden, wenn er seinen Zug im Sonnenlicht beginnt. Im Sonnenlicht ist er bei Angriffs- und Attributswürfen im Nachteil."
            },
            {
                "name": "Schaden durch fließendes Wasser",
                "desc": "Der Vampir erleidet 20 Säureschaden, wenn er seinen Zug in fließendem Wasser beendet."
            },
            {
                "name": "Zutritt verwehren",
                "desc": "Der Vampir kann keine Wohnstätte ohne die Einladung eines der Bewohner betreten."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff (nur in Vampirgestalt)",
                "desc": "Der Vampir führt zwei Angriffe aus, von denen nur einer ein Bissangriff sein kann."
            },
            {
                "name": "Biss (nur in Fledermaus- oder Vampirgestalt)",
                "desc": "Nahkampfwaffenangriff: +9 auf Treffer, Reichweite 1,5 m, eine bereitwillige oder vom Vampir gepackte oder kampfunfähige oder festgesetzte Kreatur. Treffer: 7 (1W6+4) Stichschaden plus 10 (3W6) nekrotischer Schaden. Das Trefferpunktemaximum des Ziels wird um den Betrag des erlittenen nekrotischen Schadens verringert, und der Vampir erhält Trefferpunkte in Höhe dieses Betrags. Das Trefferpunktemaximum bleibt verringert, bis das Ziel eine lange Rast beendet. Wenn das Trefferpunktemaximum durch diesen Effekt auf 0 sinkt, stirbt das Ziel. Ein Humanoide, der auf diese Art stirbt und dann in der Erde begraben wird, erhebt sich in der folgenden Nacht als Vampirbrut unter der Kontrolle des Vampirs."
            },
            {
                "name": "Waffenloser Angriff (nur in Vampirgestalt)",
                "desc": "Nahkampfwaffenangriff: +9 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 8 (1W8+4) Wuchtschaden. Anstatt Schaden zu bewirken, kann der Vampir das Ziel packen (Rettungswurf-SG 18)."
            },
            {
                "name": "Bezaubern",
                "desc": "Der Vampir zielt auf einen Humanoiden im Abstand von bis zu neun Metern von ihm, den er sehen kann. Wenn das Ziel den Vampir sehen kann, muss es einen SG-17-Weisheitsrettungswurf gegen diese Magie bestehen, oder es ist vom Vampir bezaubert. Das bezauberte Ziel betrachtet den Vampir als vertrauenswürdigen Freund, den es beschützt und auf dessen Rat es hört. Obwohl das Ziel nicht vom Vampir kontrolliert wird, steht es dessen Forderungen und Aktionen so entgegenkommend wie möglich gegenüber und ist ein bereitwilliges Ziel für den Bissangriff des Vampirs. Jedes Mal, wenn der Vampir oder seine Verbündeten dem Ziel Schaden zufügen, kann es den Rettungswurf wiederholen und den Effekt bei einem Erfolg beenden. Anderenfalls hält der Effekt 24 Stunden lang an, oder bis der Vampir stirbt, sich auf eine andere Existenzebene als die des Ziels begibt oder den Effekt als Bonusaktion beendet."
            },
            {
                "name": "Kinder der Nacht (1-mal täglich)",
                "desc": "Der Vampir ruft magisch 2W4 Schwärme von Fledermäusen oder Ratten herbei, sofern die Sonne noch nicht aufgegangen ist. Wenn er sich im Freien befindet, kann der Vampir stattdessen 3W6 Wölfe herbeirufen. Die herbeigerufenen Kreaturen treffen 1W4 Runden später ein. Sie handeln als Verbündete des Vampirs und gehorchen seinen gesprochenen Befehlen. Die Tiere bleiben eine Stunde lang bestehen, bis sie sterben oder der Vampir stirbt, oder bis der Vampir sie als Bonusaktion entlässt."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Biss (kostet 2 Aktionen)",
                "desc": "Der Vampir führt einen Bissangriff aus.",
                "cost": 2
            },
            {
                "name": "Bewegung",
                "desc": "Der Vampir nutzt seine Bewegungsrate, ohne Gelegenheitsangriffe zu provozieren.",
                "cost": 1
            },
            {
                "name": "Waffenloser Angriff",
                "desc": "Der Vampir führt einen waffenlosen Angriff aus.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    },
    {
        "_id": "ausgewachsener-schwarzer-drache",
        "name": "Ausgewachsener schwarzer Drache",
        "size": "Riesig",
        "creatureType": "Drache",
        "alignment": "chaotisch böse",
        "cr": "14",
        "xp": 11500,
        "ac": 19,
        "acInfo": "(natürliche Rüstung)",
        "hp": 195,
        "hpFormula": "17W12+85",
        "speed": {
            "walk": "12 m",
            "fly": "24 m",
            "swim": "12 m",
            "climb": "",
            "burrow": ""
        },
        "str": 23,
        "dex": 14,
        "con": 21,
        "int": 14,
        "wis": 13,
        "cha": 17,
        "savingThrows": {
            "dex": "+7",
            "con": "+10",
            "wis": "+6",
            "cha": "+8"
        },
        "skills": {
            "heimlichkeit": "+7",
            "wahrnehmung": "+11"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Säure"
        ],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 18 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 21"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Drache kann Luft und Wasser atmen."
            },
            {
                "name": "Legendäre Resistenz (3-mal täglich)",
                "desc": "Wenn der Rettungswurf des Drachen scheitert, kann dieser den Wurf in einen Erfolg verwandeln."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Drache kann seine Furchterregende Präsenz einsetzen. Dann führt er drei Angriffe aus: einen Biss- und zwei Klauenangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +11 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 17 (2W10+6) Stichschaden plus 4 (1W8) Säureschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +11 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 13 (2W6+6) Hiebschaden."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +11 auf Treffer, Reichweite 4,5 m, ein Ziel. Treffer: 15 (2W8+6) Wuchtschaden."
            },
            {
                "name": "Furchterregende Präsenz",
                "desc": "Jede Kreatur nach Wahl des Drachen, die sich im Abstand von bis zu 36 Metern von ihm befindet und ihn bemerkt, muss einen SG-16-Weisheitsrettungswurf bestehen, oder sie ist eine Minute lang verängstigt. Eine Kreatur kann den Rettungswurf am Ende jedes ihrer Züge wiederholen und den Effekt bei einem Erfolg beenden. Wenn eine Kreatur ihren Rettungswurf besteht oder der Effekt auf sie endet, ist sie 24 Stunden lang gegen die Furchterregende Präsenz des Drachen immun."
            },
            {
                "name": "Säureodem (Aufladung 5–6)",
                "desc": "Der Drache atmet Säure in einer 18 Meter langen, 1,5 Meter breiten Linie aus. Jede Kreatur in dieser Linie muss einen SG-18-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 54 (12W8) Säureschaden, anderenfalls die Hälfte."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Flügelangriff (kostet 2 Aktionen)",
                "desc": "Der Drache schlägt mit den Flügeln. Jede Kreatur im Abstand von bis zu drei Metern vom Drachen muss einen SG-19-Geschicklichkeitsrettungswurf bestehen, oder sie erleidet 13 (2W6+6) Wuchtschaden und wird umgestoßen. Der Drache kann dann bis zur Hälfte seiner Flugbewegungsrate fliegend zurücklegen.",
                "cost": 2
            },
            {
                "name": "Entdecken",
                "desc": "Der Drache führt einen Weisheitswurf (Wahrnehmung) aus.",
                "cost": 1
            },
            {
                "name": "Schwanzangriff",
                "desc": "Der Drache führt einen Schwanzangriff aus.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    },
    {
        "_id": "eisteufel",
        "name": "Eisteufel",
        "size": "Groß",
        "creatureType": "Unhold (Teufel)",
        "alignment": "rechtschaffen böse",
        "cr": "14",
        "xp": 11500,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 180,
        "hpFormula": "19W10+76",
        "speed": {
            "walk": "12 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 21,
        "dex": 14,
        "con": 18,
        "int": 18,
        "wis": 15,
        "cha": 18,
        "savingThrows": {
            "dex": "+7",
            "con": "+9",
            "wis": "+7",
            "cha": "+9"
        },
        "skills": {},
        "damageResistances": [
            "Hieb",
            "Stich und Wucht durch nichtmagische Angriffe ohne Silber"
        ],
        "damageImmunities": [
            "Feuer",
            "Gift",
            "Kälte"
        ],
        "conditionImmunities": [
            "Vergiftet"
        ],
        "senses": [
            "Blindsicht 18 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 12"
        ],
        "languages": [
            "Infernalisch",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Magieresistenz",
                "desc": "Der Teufel ist bei Rettungswürfen gegen Zauber und andere magische Effekte im Vorteil."
            },
            {
                "name": "Teufelssicht",
                "desc": "Die Dunkelsicht des Teufels wird nicht durch magische Dunkelheit beeinträchtigt."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Teufel führt drei Angriffe aus: einen Biss-, einen Klauen- und einen Schwanzangriff."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 12 (2W6+5) Stichschaden plus 10 (3W6) Kälteschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 10 (2W4+5) Hiebschaden plus 10 (3W6) Kälteschaden."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +10 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 12 (2W6+5) Wuchtschaden plus 10 (3W6) Kälteschaden."
            },
            {
                "name": "Eiswand (Aufladung 6)",
                "desc": "Der Teufel bildet auf einer festen Oberfläche im Abstand von bis zu 18 Metern, die er sehen kann, magisch eine undurchsichtige Eiswand. Die Wand ist 30 Zentimeter dick, bis zu neun Meter lang und drei Meter hoch, oder sie bildet eine halbkugelförmige Glocke von bis zu sechs Metern Durchmesser. Wenn die Wand erscheint, wird jede Kreatur in ihrem Bereich auf dem kürzesten Weg aus ihr herausgeschoben. Die Kreatur kann auswählen, auf welche Seite der Wand sie gelangen möchte, sofern sie nicht kampfunfähig ist. Dann führt die Kreatur einen SG-17-Geschicklichkeitsrettungswurf aus. Scheitert der Wurf, erleidet sie 35 (10W6) Kälteschaden, anderenfalls die Hälfte. Die Wand bleibt eine Minute lang bestehen, oder bis der Teufel kampfunfähig wird oder stirbt. Sie kann beschädigt und durchbrochen werden. Jeder Abschnitt von drei Metern besitzt eine RK von 5, 30 Trefferpunkte, ist anfällig für Feuerschaden und gegen Gift-, Kälte-, nekrotischen und psychischen Schaden sowie Säureschaden immun. Wenn ein Abschnitt zerstört wird, hinterlässt er in seinem Bereich eine eisige Luftschicht. Wann immer eine Kreatur in ihrem Zug bereitwillig oder unfreiwillig eine Bewegung durch die eisige Luft beendet, muss sie einen SG-17-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 17 (5W6) Kälteschaden, anderenfalls die Hälfte. Die eisige Luft löst sich auf, wenn der letzte Rest der Eiswand verschwindet."
            }
        ],
        "reactions": [],
        "legendaryActions": [],
        "legendaryActionsPerRound": 0
    },
    {
        "_id": "ausgewachsener-golddrache",
        "name": "Ausgewachsener Golddrache",
        "size": "Riesig",
        "creatureType": "Drache",
        "alignment": "rechtschaffen gut",
        "cr": "17",
        "xp": 18000,
        "ac": 19,
        "acInfo": "(natürliche Rüstung)",
        "hp": 256,
        "hpFormula": "19W12+133",
        "speed": {
            "walk": "12 m",
            "fly": "24 m",
            "swim": "12 m",
            "climb": "",
            "burrow": ""
        },
        "str": 27,
        "dex": 14,
        "con": 25,
        "int": 16,
        "wis": 15,
        "cha": 24,
        "savingThrows": {
            "dex": "+8",
            "con": "+13",
            "wis": "+8",
            "cha": "+13"
        },
        "skills": {
            "heimlichkeit": "+8",
            "motiv_erkennen": "+8",
            "ueberzeugen": "+13",
            "wahrnehmung": "+14"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Feuer"
        ],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 18 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 24"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Drache kann Luft und Wasser atmen."
            },
            {
                "name": "Legendäre Resistenz (3-mal täglich)",
                "desc": "Wenn der Rettungswurf des Drachen scheitert, kann dieser den Wurf in einen Erfolg verwandeln."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Drache kann seine Furchterregende Präsenz einsetzen. Dann führt er drei Angriffe aus: einen Biss- und zwei Klauenangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 19 (2W10+8) Stichschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 15 (2W6+8) Hiebschaden."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 4,5 m, ein Ziel. Treffer: 17 (2W8+8) Wuchtschaden."
            },
            {
                "name": "Furchterregende Präsenz",
                "desc": "Jede Kreatur nach Wahl des Drachen, die sich im Abstand von bis zu 36 Metern von ihm befindet und ihn bemerkt, muss einen SG-21-Weisheitsrettungswurf bestehen, oder sie ist eine Minute lang verängstigt. Eine Kreatur kann den Rettungswurf am Ende jedes ihrer Züge wiederholen und den Effekt bei einem Erfolg beenden. Wenn eine Kreatur ihren Rettungswurf besteht oder der Effekt auf sie endet, ist sie 24 Stunden lang gegen die Furchterregende Präsenz des Drachen immun."
            },
            {
                "name": "Gestalt ändern",
                "desc": "Der Drache nimmt magisch die Gestalt eines Humanoiden oder Tieres an, dessen Herausforderungsgrad nicht höher ist als sein eigener, oder er verwandelt sich wieder in seine wahre Gestalt. Wenn er stirbt, nimmt er seine wahre Gestalt an. Ausrüstung, die er trägt oder hält, wird von der neuen Gestalt absorbiert oder getragen (nach Wahl des Drachen). In der neuen Gestalt behält der Drache Gesinnung, Trefferpunkte, Trefferwürfel, Sprechfähigkeit, Übung, legendäre Resistenzen, Hortaktionen, Intelligenz-, Weisheits- und Charismawerte sowie diese Aktion bei. Abgesehen davon werden Spielwerte und Fähigkeiten durch die der neuen Gestalt ersetzt. Klassenmerkmale oder legendäre Aktionen der neuen Gestalt sind davon ausgenommen."
            },
            {
                "name": "Odemwaffen (Aufladung 5–6)",
                "desc": "Der Drache setzt eine der folgenden Odemwaffen ein:"
            },
            {
                "name": "Feuerodem",
                "desc": "Der Drache atmet Feuer in einem Kegel von 18 Metern aus. Jede Kreatur in diesem Bereich muss einen SG-21-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 66 (12W10) Feuerschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Schwächender Odem",
                "desc": "Der Drache atmet Gas in einem Kegel von 18 Metern aus. Jede Kreatur in diesem Bereich muss einen SG-21-Stärkerettungswurf bestehen, oder sie ist eine Minute lang bei stärkebasierten Angriffswürfen, bei Stärkewürfen und Stärkerettungswürfen im Nachteil. Eine Kreatur kann den Rettungswurf am Ende jedes ihrer Züge wiederholen und den Effekt bei einem Erfolg beenden."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Flügelangriff (kostet 2 Aktionen)",
                "desc": "Der Drache schlägt mit den Flügeln. Jede Kreatur im Abstand von bis zu drei Metern vom Drachen muss einen SG-22-Geschicklichkeitsrettungswurf bestehen, oder sie erleidet 15 (2W6+8) Wuchtschaden und wird umgestoßen. Der Drache kann dann bis zur Hälfte seiner Flugbewegungsrate fliegend zurücklegen.",
                "cost": 2
            },
            {
                "name": "Entdecken",
                "desc": "Der Drache führt einen Weisheitswurf (Wahrnehmung) aus.",
                "cost": 1
            },
            {
                "name": "Schwanzangriff",
                "desc": "Der Drache führt einen Schwanzangriff aus.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    },
    {
        "_id": "ausgewachsener-roter-drache",
        "name": "Ausgewachsener roter Drache",
        "size": "Riesig",
        "creatureType": "Drache",
        "alignment": "chaotisch böse",
        "cr": "17",
        "xp": 18000,
        "ac": 19,
        "acInfo": "(natürliche Rüstung)",
        "hp": 256,
        "hpFormula": "19W12+133",
        "speed": {
            "walk": "12 m",
            "fly": "24 m",
            "swim": "",
            "climb": "12 m",
            "burrow": ""
        },
        "str": 27,
        "dex": 10,
        "con": 25,
        "int": 16,
        "wis": 13,
        "cha": 21,
        "savingThrows": {
            "dex": "+6",
            "con": "+13",
            "wis": "+7",
            "cha": "+11"
        },
        "skills": {
            "heimlichkeit": "+6",
            "wahrnehmung": "+13"
        },
        "damageResistances": [],
        "damageImmunities": [
            "Feuer"
        ],
        "conditionImmunities": [],
        "senses": [
            "Blindsicht 18 m",
            "Dunkelsicht 36 m",
            "Passive Wahrnehmung 23"
        ],
        "languages": [
            "Drakonisch",
            "Gemeinsprache"
        ],
        "traits": [
            {
                "name": "Legendäre Resistenz (3-mal täglich)",
                "desc": "Wenn der Rettungswurf des Drachen scheitert, kann dieser den Wurf in einen Erfolg verwandeln."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Drache kann seine Furchterregende Präsenz einsetzen. Dann führt er drei Angriffe aus: einen Biss- und zwei Klauenangriffe."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 3 m, ein Ziel. Treffer: 19 (2W10+8) Stichschaden plus 7 (2W6) Feuerschaden."
            },
            {
                "name": "Klauen",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 15 (2W6+8) Hiebschaden."
            },
            {
                "name": "Schwanz",
                "desc": "Nahkampfwaffenangriff: +14 auf Treffer, Reichweite 4,5 m, ein Ziel. Treffer: 17 (2W8+8) Wuchtschaden."
            },
            {
                "name": "Feuerodem (Aufladung 5–6)",
                "desc": "Der Drache atmet Feuer in einem Kegel von 18 Metern aus. Jede Kreatur in diesem Bereich muss einen SG-21-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 63 (18W6) Feuerschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Furchterregende Präsenz",
                "desc": "Jede Kreatur nach Wahl des Drachen, die sich im Abstand von bis zu 36 Metern von ihm befindet und ihn bemerkt, muss einen SG-19-Weisheitsrettungswurf bestehen, oder sie ist eine Minute lang verängstigt. Eine Kreatur kann den Rettungswurf am Ende jedes ihrer Züge wiederholen und den Effekt bei einem Erfolg beenden. Wenn eine Kreatur ihren Rettungswurf besteht oder der Effekt auf sie endet, ist sie 24 Stunden lang gegen die Furchterregende Präsenz des Drachen immun."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Flügelangriff (kostet 2 Aktionen)",
                "desc": "Der Drache schlägt mit den Flügeln. Jede Kreatur im Abstand von bis zu drei Metern vom Drachen muss einen SG-22-Geschicklichkeitsrettungswurf bestehen, oder sie erleidet 15 (2W6+8) Wuchtschaden und wird umgestoßen. Der Drache kann dann bis zur Hälfte seiner Flugbewegungsrate fliegend zurücklegen.",
                "cost": 2
            },
            {
                "name": "Entdecken",
                "desc": "Der Drache führt einen Weisheitswurf (Wahrnehmung) aus.",
                "cost": 1
            },
            {
                "name": "Schwanzangriff",
                "desc": "Der Drache führt einen Schwanzangriff aus.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    },
    {
        "_id": "lich",
        "name": "Lich",
        "size": "Mittelgroß",
        "creatureType": "Untoter",
        "alignment": "jede böse Gesinnung",
        "cr": "21",
        "xp": 33000,
        "ac": 17,
        "acInfo": "(natürliche Rüstung)",
        "hp": 135,
        "hpFormula": "18W8+54",
        "speed": {
            "walk": "9 m",
            "fly": "",
            "swim": "",
            "climb": "",
            "burrow": ""
        },
        "str": 11,
        "dex": 16,
        "con": 16,
        "int": 20,
        "wis": 14,
        "cha": 16,
        "savingThrows": {
            "con": "+10",
            "int": "+12",
            "wis": "+9"
        },
        "skills": {
            "arkane_kunde": "+18",
            "geschichte": "+12",
            "motiv_erkennen": "+9",
            "wahrnehmung": "+9"
        },
        "damageResistances": [
            "Blitz",
            "Kälte",
            "Nekrotisch"
        ],
        "damageImmunities": [
            "Gift",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "conditionImmunities": [
            "Bezaubert",
            "Erschöpft",
            "Gelähmt",
            "Verängstigt",
            "Vergiftet"
        ],
        "senses": [
            "Wahrer Blick 36 m",
            "Passive Wahrnehmung 19"
        ],
        "languages": [
            "Gemeinsprache und bis zu fünf weitere Sprachen"
        ],
        "traits": [
            {
                "name": "Legendäre Resistenz (3-mal täglich)",
                "desc": "Wenn der Rettungswurf des Lichs scheitert, kann dieser den Wurf in einen Erfolg verwandeln."
            },
            {
                "name": "Resistenz gegen Wandeln",
                "desc": "Der Lich ist bei Rettungswürfen gegen Effekte, die Untote vertreiben, im Vorteil."
            },
            {
                "name": "Wiederbelebung",
                "desc": "Wenn der Lich zerstört wird, jedoch über ein Seelengefäß verfügt, erhält er in 1W10 Tagen einen neuen Körper mit allen Trefferpunkten und wird wieder aktiv. Der neue Körper erscheint im Abstand von bis zu 1,5 Metern vom Seelengefäß."
            }
        ],
        "actions": [
            {
                "name": "Lähmende Berührung",
                "desc": "Nahkampf-Zauberangriff: +12 auf Treffer, Reichweite 1,5 m, eine Kreatur. Treffer: 10 (3W6) Kälteschaden. Das Ziel muss einen SG-18-Konstitutionsrettungswurf bestehen, oder es ist eine Minute lang gelähmt. Das Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Furchteinflößender Blick (kostet 2 Aktionen)",
                "desc": "Der Lich blickt eine Kreatur im Abstand von bis zu drei Metern von ihm an, die er sehen kann. Das Ziel muss einen SG-18-Weisheitsrettungswurf gegen diese Magie bestehen, oder es ist eine Minute lang verängstigt. Ein verängstigtes Ziel kann den Rettungswurf am Ende jedes seiner Züge wiederholen und den Effekt bei einem Erfolg beenden. Wenn der Rettungswurf erfolgreich ist oder der Effekt endet, ist das Ziel 24 Stunden lang gegen den Blick des Lichs immun.",
                "cost": 2
            },
            {
                "name": "Lähmende Berührung (kostet 2 Aktionen)",
                "desc": "Der Lich setzt seine Lähmende Berührung ein.",
                "cost": 2
            },
            {
                "name": "Lebensunterbrechung (kostet 3 Aktionen)",
                "desc": "Jede Kreatur im Abstand von bis zu sechs Metern vom Lich, die kein Untoter ist, muss einen SG-18-Konstitutionsrettungswurf gegen diese Magie ausführen. Scheitert der Wurf, erleidet sie 21 (6W6) nekrotischen Schaden, anderenfalls die Hälfte.",
                "cost": 3
            },
            {
                "name": "Zaubertrick",
                "desc": "Der Lich wirkt einen Zaubertrick.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    },
    {
        "_id": "kraken",
        "name": "Kraken",
        "size": "Gigantisch",
        "creatureType": "Monstrosität (Titan)",
        "alignment": "chaotisch böse",
        "cr": "23",
        "xp": 50000,
        "ac": 18,
        "acInfo": "(natürliche Rüstung)",
        "hp": 472,
        "hpFormula": "27W20+189",
        "speed": {
            "walk": "6 m",
            "fly": "",
            "swim": "18 m",
            "climb": "",
            "burrow": ""
        },
        "str": 30,
        "dex": 11,
        "con": 25,
        "int": 22,
        "wis": 18,
        "cha": 20,
        "savingThrows": {
            "str": "+17",
            "dex": "+7",
            "con": "+14",
            "int": "+13",
            "wis": "+11"
        },
        "skills": {},
        "damageResistances": [],
        "damageImmunities": [
            "Blitz",
            "Hieb, Stich und Wucht durch nichtmagische Angriffe"
        ],
        "conditionImmunities": [
            "Verängstigt",
            "Gelähmt"
        ],
        "senses": [
            "Wahrer Blick 36 m",
            "Passive Wahrnehmung 14"
        ],
        "languages": [
            "Versteht Abyssisch",
            "Celestisch",
            "Infernalisch und Urtümlich",
            "aber kann nicht sprechen",
            "Telepathie auf 36 m"
        ],
        "traits": [
            {
                "name": "Amphibisch",
                "desc": "Der Kraken kann Luft und Wasser atmen."
            },
            {
                "name": "Belagerungsmonster",
                "desc": "Der Kraken fügt Gegenständen und Gebäuden doppelten Schaden zu."
            },
            {
                "name": "Bewegungsfreiheit",
                "desc": "Der Kraken ignoriert schwieriges Gelände, und magische Effekte können seine Bewegungsrate nicht verringern und ihn nicht festsetzen. Er kann 1,5 Meter seiner Bewegungsrate verwenden, um aus nichtmagischen Fesseln zu entkommen oder sich zu befreien, falls er gepackt wurde."
            }
        ],
        "actions": [
            {
                "name": "Mehrfachangriff",
                "desc": "Der Kraken führt drei Tentakelangriffe aus, die er jeweils durch einen Einsatz von Schleudern ersetzen kann."
            },
            {
                "name": "Biss",
                "desc": "Nahkampfwaffenangriff: +17 auf Treffer, Reichweite 1,5 m, ein Ziel. Treffer: 23 (3W8+10) Stichschaden. Wenn das Ziel eine höchstens große Kreatur ist, die vom Kraken gepackt wurde, wird sie von ihm verschluckt und ist nicht mehr gepackt. Verschluckte Kreaturen sind blind und festgesetzt, haben vollständige Deckung gegen Angriffe und andere Effekte von außerhalb des Kraken und erleiden zu Beginn jedes Zugs des Kraken 42 (12W6) Säureschaden. Erleidet der Kraken durch eine verschluckte Kreatur in einem einzigen Zug mindestens 50 Schaden, so muss er am Ende des Zugs einen SG-25-Konstitutionsrettungswurf bestehen, oder er würgt alle verschluckten Kreaturen wieder hoch. Diese befinden sich dann im Bereich von drei Metern um den Kraken und sind liegend. Stirbt der Kraken, so ist die verschluckte Kreatur nicht mehr festgesetzt und kann aus dem Kadaver entkommen, indem sie 4,5 Meter ihrer Bewegungsrate verwendet. Anschließend ist sie liegend."
            },
            {
                "name": "Tentakel",
                "desc": "Nahkampfwaffenangriff: +17 auf Treffer, Reichweite 9 m, ein Ziel. Treffer: 20 (3W6+10) Wuchtschaden, und das Ziel wird gepackt (Rettungswurf-SG 18). Solange das Ziel gepackt bleibt, ist es festgesetzt. Der Kraken hat zehn Tentakel, die jeweils ein Ziel packen können."
            },
            {
                "name": "Gewittersturm",
                "desc": "Der Kraken erzeugt magisch drei Blitzschläge, die jeweils ein Ziel im Abstand von bis zu 36 Metern vom Kraken treffen können, das der Kraken sehen kann. Ein Ziel muss einen SG-23-Geschicklichkeitsrettungswurf ausführen. Scheitert der Wurf, erleidet es 22 (4W10) Blitzschaden, anderenfalls die Hälfte."
            },
            {
                "name": "Schleudern",
                "desc": "Ein höchstens großes Objekt, das der Kraken hält, oder eine höchstens große Kreatur, die er gepackt hält, wird bis zu 18 Meter weit in eine zufällige Richtung geschleudert und umgestoßen. Wenn ein geschleudertes Ziel mit einer festen Oberfläche kollidiert, erleidet es 3 (1W6) Wuchtschaden je drei Meter, die es geschleudert wurde. Kollidiert das Ziel mit einer anderen Kreatur, muss diese einen SG-18-Geschicklichkeitsrettungswurf bestehen, oder sie erleidet den gleichen Schaden und wird umgestoßen."
            }
        ],
        "reactions": [],
        "legendaryActions": [
            {
                "name": "Gewittersturm (kostet 2 Aktionen)",
                "desc": "Der Kraken setzt Gewittersturm ein.",
                "cost": 2
            },
            {
                "name": "Tintenwolke (kostet 3 Aktionen)",
                "desc": "Unter Wasser stößt der Kraken eine Tintenwolke mit einem Radius von 18 Metern aus. Die Wolke breitet sich um Ecken aus und verschleiert den Bereich für Kreaturen außer dem Kraken komplett. Jede Kreatur außer dem Kraken, die ihren Zug dort beendet, muss einen SG-23-Konstitutionsrettungswurf ausführen. Scheitert der Wurf, erleidet sie 16 (3W10) Giftschaden, anderenfalls die Hälfte. Eine starke Strömung kann die Wolke auflösen. Anderenfalls verschwindet sie am Ende des nächsten Zugs des Kraken.",
                "cost": 3
            },
            {
                "name": "Tentakelangriff oder Schleudern",
                "desc": "Der Kraken führt einen Tentakelangriff aus oder setzt Schleudern ein.",
                "cost": 1
            }
        ],
        "legendaryActionsPerRound": 3
    }
];
    return _srdMonstersCache;
}

window.getSRDMonsters = getSRDMonsters;
