# 🔧 Hotfix #6: Shop-Items nicht klickbar

**Datum**: 2024-12-25  
**Version**: 2.1.3 (Updated)  
**Status**: ✅ Behoben

---

## ❌ Problem

Shop-Items konnten nicht durch direktes Klicken auf-/zugeklappt werden.

**Symptome**:
- ✅ "Bearbeiten" Button funktioniert
- ✅ "Speichern" klappt Item auf
- ❌ Direkter Click auf Item-Zeile macht nichts

---

## 🔍 Root Cause

**Zwei Probleme nacheinander**:

### Problem 1: Event-Delegation blockiert (v2.1.2)

Event-Delegation wurde durch `data-stop-propagation="true"` blockiert.

**Fix**: onclick-Handler implementiert ✅

### Problem 2: Falscher CSS-Selektor (v2.1.3)

Die `toggleShopItem` Funktion suchte nach dem **falschen DOM-Element**!

**HTML generiert**:
```html
<div class="si-item" data-shop="1" data-idx="0">
```

**Funktion suchte nach**:
```javascript
document.querySelector('.shop-item-row[data-shop-id="..."][data-item-idx="..."]')
```

**Resultat**: Element wurde nie gefunden → `item` war `null` → classList.toggle machte nichts

---

## ✅ Lösung

### Fix 1: onclick-Handler (v2.1.2)

```html
<div class="si-main" onclick="toggleShopItem(${shopId}, ${idx})">
```

### Fix 2: Korrekter Selektor (v2.1.3)

**Vorher** (falsch):
```javascript
const item = document.querySelector(`.shop-item-row[data-shop-id="${shopId}"][data-item-idx="${idx}"]`);
```

**Nachher** (korrekt):
```javascript
const item = document.querySelector(`.si-item[data-shop="${shopId}"][data-idx="${idx}"]`);
```

---

## 📊 Änderungen

**Datei**: `features/shops.js`

**Zeile 528** (v2.1.2):
- data-action → onclick

**Zeile 581** (v2.1.3):
- `.shop-item-row` → `.si-item`
- `data-shop-id` → `data-shop`
- `data-item-idx` → `data-idx`

---

## 🧪 Verifikation

**Test im Browser-Inspektor**:

```javascript
// Vorher (v2.1.2):
document.querySelector('.shop-item-row[data-shop-id="1"][data-item-idx="0"]')
// → null ❌

// Nachher (v2.1.3):
document.querySelector('.si-item[data-shop="1"][data-idx="0"]')
// → <div class="si-item">...</div> ✅
```

---

## 📝 Lessons Learned

### 1. HTML und JavaScript müssen synchron sein

**Problem**: 
- HTML generiert: `<div class="si-item" data-shop="1">`
- JavaScript sucht: `.shop-item-row[data-shop-id="1"]`
- Ergebnis: **Nicht gefunden**

**Lesson**: Immer gleiche Selektoren in HTML-Generierung und JavaScript verwenden

### 2. onclick funktioniert, aber...

**onclick ist nur die halbe Lösung**:
- ✅ Event wird gefeuert
- ✅ Funktion wird aufgerufen
- ❌ Aber wenn Funktion Element nicht findet → nichts passiert

**Lesson**: onclick + korrekter Selektor = funktioniert

### 3. Debug-Strategie

**Falsche Annahme**: "onclick funktioniert nicht"  
**Richtige Diagnose**: "onclick funktioniert, aber Funktion findet Element nicht"

**Lesson**: Bei "nichts passiert" → Console öffnen → Funktion manuell aufrufen → sehen was null ist

---

## 🎯 Impact

| Version | onclick | Selektor | Funktioniert |
|---------|---------|----------|--------------|
| v2.1.1 | data-action | falsch | ❌ |
| v2.1.2 | onclick | falsch | ❌ |
| **v2.1.3** | **onclick** | **korrekt** | **✅** |

---

**Version**: 2.1.3  
**Status**: ✅ Production Ready  
**Shop-Items**: ✅ Vollständig funktional
