#!/usr/bin/env python3
"""
CSS-Purging für D&D Tracker
Entfernt ungenutzte CSS-Selektoren basierend auf HTML und JavaScript.
"""

import re
import os
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.dirname(SCRIPT_DIR)

CSS_FILE = os.path.join(SOURCE_DIR, 'assets', 'styles.css')
HTML_FILE = os.path.join(SOURCE_DIR, 'assets', 'body.html')
JS_DIRS = [
    os.path.join(SOURCE_DIR, 'core'),
    os.path.join(SOURCE_DIR, 'systems'),
    os.path.join(SOURCE_DIR, 'features'),
    os.path.join(SOURCE_DIR, 'render'),
    os.path.join(SOURCE_DIR, 'ui'),
]

# Selektoren die immer behalten werden (dynamisch generiert)
ALWAYS_KEEP = {
    # Basis-Elemente
    'body', 'html', 'main', 'header', 'footer', 'nav', 'section', 'article',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'span', 'div',
    'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'form', 'input', 'button', 'select', 'option', 'textarea', 'label',
    'img', 'svg', 'path', 'canvas',
    # Pseudo-Elemente und States
    ':root', ':hover', ':focus', ':active', ':disabled', ':checked',
    ':first-child', ':last-child', ':nth-child', '::before', '::after',
    '::placeholder', '::selection',
    # Wichtige Animationen
    '@keyframes',
}

# Klassen-Präfixe die dynamisch generiert werden
DYNAMIC_PREFIXES = [
    'char-', 'npc-', 'loc-', 'quest-', 'enc-', 'loot-', 'spell-', 'shop-',
    'init-', 'timer-', 'map-', 'wiki-', 'node-', 'link-', 'session-',
    'theme-', 'difficulty-', 'rarity-', 'status-', 'type-', 'category-',
    'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100',
]

def extract_used_selectors(content):
    """Extrahiert alle verwendeten Klassen und IDs aus Content"""
    classes = set()
    ids = set()
    
    # HTML class="..." und class='...'
    for match in re.findall(r'class=["\']([^"\']+)["\']', content):
        for cls in match.split():
            classes.add(cls)
    
    # JavaScript classList.add/remove/toggle/contains
    for match in re.findall(r'classList\.(add|remove|toggle|contains)\(["\']([^"\']+)["\']', content):
        classes.add(match[1])
    
    # JavaScript className = "..."
    for match in re.findall(r'className\s*[+=]\s*["\']([^"\']+)["\']', content):
        for cls in match.split():
            classes.add(cls)
    
    # Template literals mit Klassen
    for match in re.findall(r'class(?:Name)?=(?:["\']|`\$\{[^}]+\}\s*)([a-zA-Z][a-zA-Z0-9_-]*)', content):
        classes.add(match)
    
    # HTML id="..." und id='...'
    for match in re.findall(r'id=["\']([^"\']+)["\']', content):
        ids.add(match)
    
    # JavaScript getElementById, $()
    for match in re.findall(r'(?:getElementById|querySelector|querySelectorAll|\$)\(["\']#?([a-zA-Z][a-zA-Z0-9_-]*)["\']', content):
        ids.add(match)
    
    return classes, ids

def parse_css_rules(css_content):
    """Parst CSS und gibt Liste von (Selektor, Regel) zurück"""
    rules = []
    
    # Entferne Kommentare
    css_clean = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Finde alle Regeln (auch @media, @keyframes etc.)
    current_pos = 0
    brace_depth = 0
    rule_start = 0
    
    i = 0
    while i < len(css_clean):
        char = css_clean[i]
        
        if char == '{':
            if brace_depth == 0:
                rule_start = i
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
            if brace_depth == 0:
                # Finde den Selektor
                selector_end = rule_start
                selector_start = current_pos
                selector = css_clean[selector_start:selector_end].strip()
                rule_body = css_clean[rule_start:i+1]
                
                if selector:
                    rules.append((selector, selector + rule_body))
                
                current_pos = i + 1
        
        i += 1
    
    return rules

def is_selector_used(selector, used_classes, used_ids):
    """Prüft ob ein Selektor verwendet wird"""
    # Immer behalten
    for keep in ALWAYS_KEEP:
        if keep in selector:
            return True
    
    # @-Regeln immer behalten
    if selector.startswith('@'):
        return True
    
    # Extrahiere Klassen und IDs aus Selektor
    selector_classes = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', selector)
    selector_ids = re.findall(r'#([a-zA-Z][a-zA-Z0-9_-]*)', selector)
    
    # Dynamische Präfixe
    for cls in selector_classes:
        for prefix in DYNAMIC_PREFIXES:
            if cls.startswith(prefix):
                return True
    
    # Prüfe ob Klassen verwendet werden
    for cls in selector_classes:
        if cls in used_classes:
            return True
        # Partial matches für dynamische Klassen
        for used in used_classes:
            if cls in used or used in cls:
                return True
    
    # Prüfe ob IDs verwendet werden
    for id_ in selector_ids:
        if id_ in used_ids:
            return True
    
    # Element-Selektoren ohne Klasse/ID behalten
    if not selector_classes and not selector_ids:
        return True
    
    return False

def purge_css():
    print("🔍 CSS-Purging für D&D Tracker\n")
    
    # 1. Lade CSS
    print(f"📖 Lade CSS: {CSS_FILE}")
    with open(CSS_FILE, 'r', encoding='utf-8') as f:
        css_content = f.read()
    original_size = len(css_content)
    print(f"   Original: {original_size:,} Bytes ({original_size/1024:.1f} KB)")
    
    # 2. Sammle verwendete Selektoren aus HTML
    print(f"\n📖 Analysiere HTML: {HTML_FILE}")
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    html_classes, html_ids = extract_used_selectors(html_content)
    print(f"   {len(html_classes)} Klassen, {len(html_ids)} IDs gefunden")
    
    # 3. Sammle verwendete Selektoren aus JavaScript
    print(f"\n📖 Analysiere JavaScript...")
    js_classes = set()
    js_ids = set()
    js_files = 0
    
    for js_dir in JS_DIRS:
        if not os.path.exists(js_dir):
            continue
        for root, dirs, files in os.walk(js_dir):
            # Skip dice-split und andere temporäre Ordner
            dirs[:] = [d for d in dirs if d not in ['dice-split', 'shops-split', 'node_modules']]
            for file in files:
                if file.endswith('.js'):
                    js_path = os.path.join(root, file)
                    with open(js_path, 'r', encoding='utf-8') as f:
                        js_content = f.read()
                    classes, ids = extract_used_selectors(js_content)
                    js_classes.update(classes)
                    js_ids.update(ids)
                    js_files += 1
    
    print(f"   {js_files} JS-Dateien analysiert")
    print(f"   {len(js_classes)} Klassen, {len(js_ids)} IDs gefunden")
    
    # 4. Kombiniere alle verwendeten Selektoren
    all_classes = html_classes | js_classes
    all_ids = html_ids | js_ids
    print(f"\n📊 Gesamt: {len(all_classes)} Klassen, {len(all_ids)} IDs verwendet")
    
    # 5. Parse CSS-Regeln
    print(f"\n🔧 Parse CSS-Regeln...")
    rules = parse_css_rules(css_content)
    print(f"   {len(rules)} Regeln gefunden")
    
    # 6. Filtere ungenutzte Regeln
    print(f"\n🗑️  Filtere ungenutzte Regeln...")
    kept_rules = []
    removed_rules = []
    
    for selector, rule in rules:
        if is_selector_used(selector, all_classes, all_ids):
            kept_rules.append(rule)
        else:
            removed_rules.append(selector)
    
    print(f"   ✅ Behalten: {len(kept_rules)} Regeln")
    print(f"   ❌ Entfernt: {len(removed_rules)} Regeln")
    
    # 7. Erstelle gepurgtes CSS
    purged_css = '\n\n'.join(kept_rules)
    purged_size = len(purged_css)
    
    # 8. Speichere
    output_file = os.path.join(SOURCE_DIR, 'assets', 'styles-purged.css')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"/* CSS-Purged: {len(removed_rules)} Regeln entfernt */\n\n")
        f.write(purged_css)
    
    savings = original_size - purged_size
    savings_pct = (savings / original_size) * 100
    
    print(f"\n📊 Ergebnis:")
    print(f"   Original:  {original_size:,} Bytes ({original_size/1024:.1f} KB)")
    print(f"   Gepurged:  {purged_size:,} Bytes ({purged_size/1024:.1f} KB)")
    print(f"   Ersparnis: {savings:,} Bytes ({savings_pct:.1f}%)")
    print(f"\n✅ Gespeichert: {output_file}")
    
    # 9. Zeige entfernte Selektoren (erste 20)
    if removed_rules:
        print(f"\n🔍 Beispiele entfernter Selektoren:")
        for sel in removed_rules[:20]:
            print(f"   - {sel[:60]}{'...' if len(sel) > 60 else ''}")
        if len(removed_rules) > 20:
            print(f"   ... und {len(removed_rules) - 20} weitere")
    
    return purged_size, savings

if __name__ == '__main__':
    purge_css()
