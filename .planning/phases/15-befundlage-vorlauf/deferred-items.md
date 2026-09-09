# Deferred Items — Phase 15 (Befundlage & Vorlauf)

Out-of-scope discoveries found during plan execution, logged per the executor's
scope-boundary rule instead of auto-fixed (not directly caused by the task at hand).

## 1. [ERLEDIGT 2026-09-09] ROADMAP.md Erfolgskriterium 5 beschrieb eine bereits abgelehnte GATE-05-Reduktion

**Found during:** Plan 15-05, Task 3 (read_first las `.planning/PROJECT.md` § GATE-05)

**Issue:** `.planning/ROADMAP.md` Phase-15-Erfolgskriterium 5 (Zeile ~110) beschreibt die
Abnahmeform noch als "Stufe 3 menschlich — volle Runde nach den Phasen 16/17/18, gezielte
Stellenliste nach 15 und 19" (die von D-53 vorgeschlagene, reduzierte dreistufige Form).
`PROJECT.md` § GATE-05 dokumentiert jedoch, dass der Nutzer genau diese Reduktion per
Checkpoint-Entscheidung am 2026-09-09 **ABGELEHNT** hat — die verbindliche Form ist eine
volle Vier-Themes-Runde nach JEDER der fünf Phasen 15-19, ohne Verkürzung auf eine gezielte
Stellenliste. `ROADMAP.md` wurde dabei nicht nachgezogen.

**Warum nicht in diesem Plan behoben:** Plan 15-05 betrifft FIX-02/FIX-03 (Zauberplatz-Pips,
Würfelfarbe); die ROADMAP-Korrektur des Erfolgskriteriums 4 (Selektor-Konflikt) wurde vom
Orchestrator explizit als Teil dieses Plans benannt, Kriterium 5 nicht — die Diskrepanz wurde
nicht durch eine Änderung dieses Plans verursacht (Scope-Boundary-Regel: nur direkt vom
aktuellen Task verursachte Probleme werden automatisch behoben).

**Erledigt:** Der Orchestrator hat Erfolgskriterium 5 direkt nach Welle 3 auf die verbindliche
Form nachgezogen (fünf volle Vier-Themes-Runden, keine Reduktion), mit der D-53-Ablehnung als
sichtbarer Korrekturnotiz daneben. Ursache war die Reihenfolge: 15-03 schrieb das Kriterium,
bevor die Checkpoint-Antwort zu 15-02 vorlag.

**Ursprüngliche Empfehlung:** `.planning/ROADMAP.md` Phase-15-Erfolgskriterium 5 auf die in `PROJECT.md` §
GATE-05 dokumentierte, verbindliche Form (fünf volle Runden, eine nach jeder Phase, keine
Reduktion) nachziehen — z. B. als kleiner Dokumentations-Task in einem der verbleibenden
Phase-15-Pläne (15-06/15-07/15-08) oder vor `/gsd-verify-work 15`.
