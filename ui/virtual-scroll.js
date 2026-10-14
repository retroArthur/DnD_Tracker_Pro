// [SECTION:VIRTUAL_SCROLL]
// VIRTUAL SCROLLING HELPER (für große Listen) - @virtual @scroll @list
// Mit Memory Leak Fix: Event-Listener werden ordentlich verwaltet
// ============================================================
const VirtualScroll = {
    // WeakMap speichert Handler-Referenzen zur späteren Entfernung
    _listeners: new WeakMap(),

    // Konfiguration
    config: {
        threshold: 50, // Aktiviere ab 50+ Items
        bufferSize: 5, // Extra Items vor/nach sichtbarem Bereich
        defaultHeight: 60 // Standard Item-Höhe
    },

    /**
     * Erstellt virtuelles Scrolling für große Listen
     * @param {HTMLElement} container - Container-Element
     * @param {Array} items - Liste der Items
     * @param {Function} renderItem - Render-Funktion für einzelne Items
     * @param {number} itemHeight - Höhe eines Items in px
     */
    create(container, items, renderItem, itemHeight = this.config.defaultHeight) {
        if (!container || !items) return;

        // Entferne alten Listener falls vorhanden (Memory Leak Prevention)
        this.destroy(container);

        if (items.length < this.config.threshold) {
            // Für kleine Listen normales Rendering
            container.innerHTML = items.map(renderItem).join('');
            return;
        }

        const totalHeight = items.length * itemHeight;

        // Viewport-Höhe bestimmen. Die eigene clientHeight des Containers kann
        // inhaltsgetrieben und winzig sein, wenn er (noch) leer ist (z. B. nur
        // padding-bottom) — das würde das virtuelle Fenster auf ~1 Zeile
        // schrumpfen. In dem Fall die verfügbare Höhe aus dem Content-Bereich
        // des Eltern-Elements (Scroll-Container) ableiten.
        let viewportHeight = container.clientHeight;
        if (!viewportHeight || viewportHeight < itemHeight * 2) {
            const parent = container.parentElement;
            if (parent) {
                const pcs = getComputedStyle(parent);
                const padY = (parseFloat(pcs.paddingTop) || 0) + (parseFloat(pcs.paddingBottom) || 0);
                viewportHeight = parent.clientHeight - padY;
            }
            if (!viewportHeight || viewportHeight < itemHeight * 2) viewportHeight = 400;
        }
        const bufferSize = this.config.bufferSize;

        // Scroll-Container Setup
        container.style.boxSizing = 'border-box';
        container.style.height = viewportHeight + 'px';
        container.style.overflow = 'auto';
        container.style.position = 'relative';

        // Content-Wrapper
        const wrapper = document.createElement('div');
        wrapper.style.height = totalHeight + 'px';
        wrapper.style.position = 'relative';

        const visibleContainer = document.createElement('div');
        visibleContainer.style.position = 'absolute';
        visibleContainer.style.left = '0';
        visibleContainer.style.right = '0';

        wrapper.appendChild(visibleContainer);
        container.innerHTML = '';
        container.appendChild(wrapper);

        // ============================================================
        // DER FOKUS MUSS DAS NEUZEICHNEN UEBERLEBEN  (TASV/E-2)
        // ============================================================
        //
        // DER FEHLER, UM DEN ES GEHT. `render()` ersetzt bei jedem Rollen
        // `visibleContainer.innerHTML` und wirft damit ALLE Zeilen des
        // Fensters weg — auch die, auf der gerade der Fokus liegt. Gemessen
        // am gebauten Buendel (gefuellte Kampagne, 1440 px, echte
        // Tastendruecke, 150 ms Pause): tabuliert der Spielleiter im
        // Bestiarium auf einen Favoritenknopf unterhalb der Kante, rollt
        // der Browser den Behaelter, dieser Lauscher feuert, der eben
        // fokussierte Knoten ist `isConnected === false` und
        // `document.activeElement` faellt auf `BODY`. Der naechste
        // Tabulator setzt INNERHALB der frisch gebauten Zeilen wieder auf,
        // nicht dahinter — eine Dauerschleife: in 400 Spruengen 34
        // BODY-Halte, 329 Halte auf frisch erzeugten Knoten, 860 entfernte
        // Knoten. Alles, was in der Dokumentreihenfolge HINTER der Liste
        // steht, wurde dadurch unerreichbar: die sechs
        // `button.bestiary-fav`, `div.qref-fab`,
        // `button#floating-dice-trigger` und die zwei Knoepfe des
        // Umzugs-Hinweises. Zur Gegenprobe gemessen: mit entferntem
        // Scroll-Lauscher fiel die Zahl der unerreichbaren Stellen von 27
        // auf 17, und alle zehn wurden erreicht.
        //
        // WARUM DIE REPARATUR HIER STEHT UND NICHT IN DER
        // GRUPPENMECHANIK. Die Ursache ist nicht die Tastatur, sondern das
        // Neuzeichnen — und `VirtualScroll.create()` hat GENAU EINEN
        // Aufrufer im ganzen Baum (`features/bestiary/bestiary-render.js`).
        // Eine Nachbesserung in `ui/keyboard-group.js` haette das
        // Haltgedaechtnis gebraucht, dessen Schluessel am ERSTEN Glied
        // haengt: nach dem Rollen ist das ein anderes Monster, der
        // Schluessel also ein anderer, und der Anspruch auf Rueckkehr
        // findet seine Gruppe nicht mehr. Die Reparatur an der Ursache ist
        // kleiner UND deckt den Mausfall mit (Rad rollen, waehrend der
        // Fokus in der Liste steht).
        //
        // ZWEI TEILE, und der erste traegt den grossen Teil der Last:
        //
        //  1. KEIN NEUZEICHNEN BEI UNVERAENDERTEM FENSTER. Ein Rollen um
        //     wenige Pixel laesst `startIdx`/`endIdx` unberuehrt; der alte
        //     Stand baute die Zeilen trotzdem neu. Das war Arbeit ohne
        //     Wirkung und zugleich der haeufigste Fokusverlust.
        //  2. FOKUSUEBERTRAGUNG, wenn das Fenster sich WIRKLICH
        //     verschiebt. Gemerkt wird der ABSOLUTE Index der Zeile (nicht
        //     der Knoten — er ist genau das, was verloren geht) und die
        //     Stelle des fokussierten Elements INNERHALB der Zeile. Steht
        //     dieselbe Zeile im neuen Fenster, bekommt ihr frischer Knoten
        //     den Fokus zurueck.
        //
        // `preventScroll: true` ist nicht Kosmetik, sondern die Bedingung
        // dafuer, dass das Ganze terminiert: ein `focus()` ohne diese
        // Angabe rollt sein Ziel in den sichtbaren Bereich, das erzeugt ein
        // `scroll`, das diesen Lauscher erneut weckt — Rueckkopplung.

        /** Fenstergrenzen des letzten Durchlaufs. -1 = noch keiner. */
        let letzterStart = -1;
        let letztesEnde = -1;

        /** Selektor der Elemente, die in einer Zeile den Fokus tragen koennen. */
        const FOKUSTRAEGER =
            '[data-action],button,a[href],input,select,textarea,[tabindex],[contenteditable="true"]';

        /**
         * Was der Browser von sich aus fokussiert — darauf wirkt `focus()`
         * sofort, auch im frisch gebauten Markup. Nur fuer alles andere muss
         * die Kehrschleife erst gelaufen sein. Das ist der Grund, warum die
         * NATIVEN `button.bestiary-fav` schon ohne diesen Zweig wieder den
         * Fokus bekamen und die nicht-nativen Zeilen nicht.
         */
        const NATIV_FOKUSSIERBAR_VS =
            'a[href],area[href],button,input:not([type="hidden"]),select,textarea,summary,' +
            'details,iframe,[contenteditable=""],[contenteditable="true"]';

        /**
         * Wo steht der Fokus gerade — als Anspruch, der ein Neuzeichnen
         * ueberlebt? `null`, wenn er nicht in dieser Liste liegt.
         * @returns {{zeile: number, stelle: number}|null}
         */
        const fokusAnspruch = () => {
            const aktiv = document.activeElement;
            if (!aktiv || aktiv === document.body || !visibleContainer.contains(aktiv)) return null;
            const kinder = Array.from(visibleContainer.children);
            const zeile = kinder.findIndex(k => k === aktiv || k.contains(aktiv));
            if (zeile < 0) return null;
            // -1 bedeutet "die Zeile selbst traegt den Fokus".
            const stelle =
                kinder[zeile] === aktiv
                    ? -1
                    : Array.from(kinder[zeile].querySelectorAll(FOKUSTRAEGER)).indexOf(aktiv);
            return { zeile: letzterStart + zeile, stelle };
        };

        /**
         * Gibt den Fokus an den frischen Knoten derselben Zeile zurueck.
         * Steht die Zeile nicht mehr im Fenster, bleibt es beim Verlust —
         * dann ist der Spielleiter ueber sie hinausgerollt, und ihm den
         * Fokus nachzuziehen waere ein Griff in die Bedienung.
         * @param {{zeile: number, stelle: number}} anspruch
         * @param {number} startIdx
         */
        const fokusZurueck = (anspruch, startIdx) => {
            const i = anspruch.zeile - startIdx;
            const zeile = visibleContainer.children[i];
            if (!zeile) return;
            const ziel =
                anspruch.stelle < 0 ? zeile : zeile.querySelectorAll(FOKUSTRAEGER)[anspruch.stelle];
            if (!ziel || typeof ziel.focus !== 'function') return;

            // DER FRISCHE KNOTEN MUSS ERST FOKUSSIERBAR SEIN. Das ist die
            // Stelle, an der das Naheliegende nicht funktioniert, und sie
            // ist gemessen: ein `div.focus()` auf einem `div` OHNE
            // `tabindex` ist ein Nichts — kein Fehler, keine Wirkung. Die
            // Zeilen dieser Liste sind `div`, und ihre Fokussierbarkeit
            // entsteht erst in der Kehrschleife
            // (`ui/keyboard-reach.js`), die auf einem
            // `requestAnimationFrame` nach dem `MutationObserver` laeuft —
            // also einen Bildwechsel SPAETER als dieses Neuzeichnen.
            // Spur des ersten Versuchs (ArrowDown in der Monsterspalte,
            // 150 ms Pause, Zeile 11):
            //     render  startIdx 0->1, endIdx 17->24, aktiv DIV/kobold,
            //             drin true, anspruch {zeile: 11, stelle: -1}
            //     zurueck i 10, kinder 23, danach BODY   <-- focus() wirkungslos
            // Danach blieb der Fokus auf `BODY` und die Fahrt brach bei
            // Monster 11 von 112 ab.
            //
            // WARUM DIE KEHRSCHLEIFE HIER UND JETZT ANGESTOSSEN WIRD und
            // nicht auf ihren eigenen Durchlauf gewartet wird: ein
            // Bildwechsel mit `activeElement === BODY` ist nicht nur
            // haesslich, er ist eine Luecke mit Verhalten — in ihr gehoert
            // ein Tastendruck dem globalen Einzeltasten-Lauscher, und eine
            // festgehaltene Pfeiltaste (Tastenwiederholung) faellt genau
            // dort hinein. Darum geschieht die Reparatur in DERSELBEN
            // Aufgabe wie der Verlust.
            //
            // Bevorzugt ueber `KeyboardGroup.aktualisieren()`, nicht ueber
            // die Kehrschleife allein: die Gruppenmechanik stoesst die
            // Kehrschleife selbst an und legt danach den wandernden
            // Tabindex wieder richtig. Nur die Kehrschleife zu rufen
            // liesse alle 23 frischen Zeilen fuer einen Bildwechsel als
            // eigenen Tabulatorhalt stehen. Beide Aufrufe sind
            // ausdruecklich idempotent und kosten in einer unveraenderten
            // Ansicht nichts.
            if (!ziel.hasAttribute('tabindex') && !ziel.matches(NATIV_FOKUSSIERBAR_VS)) {
                if (
                    window.KeyboardGroup &&
                    typeof window.KeyboardGroup.aktualisieren === 'function'
                ) {
                    window.KeyboardGroup.aktualisieren();
                } else if (
                    window.KeyboardReach &&
                    typeof window.KeyboardReach.aktualisieren === 'function'
                ) {
                    window.KeyboardReach.aktualisieren();
                }
            }
            ziel.focus({ preventScroll: true });
        };

        const render = () => {
            const scrollTop = container.scrollTop;
            const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const endIdx = Math.min(
                items.length,
                Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize
            );

            // Teil 1: unveraendertes Fenster = nichts zu tun.
            if (startIdx === letzterStart && endIdx === letztesEnde) return;

            // Teil 2: Fokus merken, BEVOR die Zeilen verschwinden.
            const anspruch = fokusAnspruch();

            letzterStart = startIdx;
            letztesEnde = endIdx;
            visibleContainer.style.top = startIdx * itemHeight + 'px';
            visibleContainer.innerHTML = items.slice(startIdx, endIdx).map(renderItem).join('');

            if (anspruch) fokusZurueck(anspruch, startIdx);
        };

        render();

        // Speichere Handler-Referenz für späteren Cleanup
        const scrollHandler = throttle(render, 16);
        this._listeners.set(container, scrollHandler);
        container.addEventListener('scroll', scrollHandler, { passive: true });
    },

    /**
     * Entfernt Event-Listener und bereinigt Container
     * @param {HTMLElement} container - Container-Element
     */
    destroy(container) {
        if (!container) return;

        if (this._listeners.has(container)) {
            container.removeEventListener('scroll', this._listeners.get(container));
            this._listeners.delete(container);
        }
    },

    /**
     * Prüft ob Virtual Scroll für Item-Anzahl verwendet werden sollte
     * @param {number} itemCount - Anzahl der Items
     * @returns {boolean}
     */
    shouldUse(itemCount) {
        return itemCount >= this.config.threshold;
    }
};

// Initialize Event Delegation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EventDelegation.init();
        initLazyObserver();
    });
} else {
    EventDelegation.init();
    initLazyObserver();
}
