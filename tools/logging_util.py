# -*- coding: utf-8 -*-
"""
Zentrales Logging-Modul für D&D Tracker Build-Tools
====================================================

Verwendung:
    from tools.logging_util import log, LogLevel

    log.info("Build gestartet")
    log.success("Datei erstellt")
    log.warning("Deprecated Feature")
    log.error("Fehler aufgetreten")
    log.debug("Debug-Info")  # Nur bei verbose=True
"""

import sys
from datetime import datetime
from enum import IntEnum
from typing import Optional
from pathlib import Path


class LogLevel(IntEnum):
    """Log-Level Definitionen"""
    DEBUG = 0
    INFO = 1
    SUCCESS = 2
    WARNING = 3
    ERROR = 4
    CRITICAL = 5


class Logger:
    """
    Einfacher Logger mit Emoji-Support und Farbausgabe.

    Features:
    - Konsistentes Format für alle Build-Tools
    - Emoji-Prefix für visuelle Unterscheidung
    - Optional: Datei-Logging
    - Optional: Timestamps
    """

    # Emoji-Mapping für Log-Level
    EMOJI = {
        LogLevel.DEBUG:    "🔍",
        LogLevel.INFO:     "📝",
        LogLevel.SUCCESS:  "✅",
        LogLevel.WARNING:  "⚠️",
        LogLevel.ERROR:    "❌",
        LogLevel.CRITICAL: "🚨",
    }

    # ANSI Farben (für Terminals die es unterstützen)
    COLORS = {
        LogLevel.DEBUG:    "\033[90m",    # Grau
        LogLevel.INFO:     "\033[0m",     # Normal
        LogLevel.SUCCESS:  "\033[92m",    # Grün
        LogLevel.WARNING:  "\033[93m",    # Gelb
        LogLevel.ERROR:    "\033[91m",    # Rot
        LogLevel.CRITICAL: "\033[95m",    # Magenta
    }
    RESET = "\033[0m"

    def __init__(
        self,
        name: str = "app",
        level: LogLevel = LogLevel.INFO,
        use_colors: bool = True,
        use_emoji: bool = True,
        show_timestamp: bool = False,
        log_file: Optional[Path] = None
    ):
        self.name = name
        self.level = level
        self.use_colors = use_colors and sys.stdout.isatty()
        self.use_emoji = use_emoji
        self.show_timestamp = show_timestamp
        self.log_file = log_file
        self._file_handle = None

        if log_file:
            self._file_handle = open(log_file, 'a', encoding='utf-8')

    def __del__(self):
        if self._file_handle:
            self._file_handle.close()

    def _format_message(self, level: LogLevel, message: str) -> str:
        """Formatiert eine Log-Nachricht"""
        parts = []

        # Timestamp (optional)
        if self.show_timestamp:
            parts.append(f"[{datetime.now().strftime('%H:%M:%S')}]")

        # Emoji
        if self.use_emoji:
            parts.append(self.EMOJI.get(level, ""))

        # Message
        parts.append(message)

        return " ".join(parts)

    def _log(self, level: LogLevel, message: str):
        """Interne Log-Funktion"""
        if level < self.level:
            return

        formatted = self._format_message(level, message)

        # Console Output (mit Fallback für Windows Encoding-Probleme)
        try:
            if self.use_colors:
                color = self.COLORS.get(level, "")
                print(f"{color}{formatted}{self.RESET}")
            else:
                print(formatted)
        except UnicodeEncodeError:
            # Fallback: Emojis entfernen wenn Terminal sie nicht unterstützt
            safe_msg = formatted.encode('ascii', 'replace').decode('ascii')
            print(safe_msg)

        # File Output (ohne Farben/Emojis)
        if self._file_handle:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            level_name = level.name.ljust(8)
            self._file_handle.write(f"{timestamp} | {level_name} | {message}\n")
            self._file_handle.flush()

    # Convenience Methods
    def debug(self, message: str):
        """Debug-Nachricht (nur bei verbose)"""
        self._log(LogLevel.DEBUG, message)

    def info(self, message: str):
        """Info-Nachricht"""
        self._log(LogLevel.INFO, message)

    def success(self, message: str):
        """Erfolgs-Nachricht"""
        self._log(LogLevel.SUCCESS, message)

    def warning(self, message: str):
        """Warnung"""
        self._log(LogLevel.WARNING, message)

    def error(self, message: str):
        """Fehler"""
        self._log(LogLevel.ERROR, message)

    def critical(self, message: str):
        """Kritischer Fehler"""
        self._log(LogLevel.CRITICAL, message)

    # Aliase
    warn = warning
    err = error

    # Spezielle Methoden
    def header(self, title: str, char: str = "="):
        """Gibt eine Überschrift aus"""
        line = char * 60
        self._log(LogLevel.INFO, line)
        self._log(LogLevel.INFO, f"  {title}")
        self._log(LogLevel.INFO, line)

    def section(self, title: str):
        """Gibt eine Sektion aus"""
        self._log(LogLevel.INFO, f"\n{'─' * 40}")
        self._log(LogLevel.INFO, f"📂 {title}")
        self._log(LogLevel.INFO, "─" * 40)

    def progress(self, current: int, total: int, item: str = ""):
        """Fortschrittsanzeige"""
        percent = (current / total) * 100 if total > 0 else 0
        bar_width = 20
        filled = int(bar_width * current / total) if total > 0 else 0
        bar = "█" * filled + "░" * (bar_width - filled)

        if item:
            self._log(LogLevel.INFO, f"[{bar}] {percent:5.1f}% ({current}/{total}) {item}")
        else:
            self._log(LogLevel.INFO, f"[{bar}] {percent:5.1f}% ({current}/{total})")

    def table(self, headers: list, rows: list):
        """Gibt eine einfache Tabelle aus"""
        # Spaltenbreiten berechnen
        widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                widths[i] = max(widths[i], len(str(cell)))

        # Header
        header_line = " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers))
        separator = "-+-".join("-" * w for w in widths)

        self._log(LogLevel.INFO, header_line)
        self._log(LogLevel.INFO, separator)

        # Rows
        for row in rows:
            row_line = " | ".join(str(cell).ljust(widths[i]) for i, cell in enumerate(row))
            self._log(LogLevel.INFO, row_line)

    def set_verbose(self, verbose: bool = True):
        """Aktiviert/Deaktiviert Debug-Output"""
        self.level = LogLevel.DEBUG if verbose else LogLevel.INFO


# Globale Logger-Instanz
log = Logger(name="dnd-tracker", use_emoji=True)


# Factory-Funktion für benannte Logger
def get_logger(name: str, **kwargs) -> Logger:
    """Erstellt einen neuen Logger mit eigenem Namen"""
    return Logger(name=name, **kwargs)


# Beispiel-Verwendung
if __name__ == "__main__":
    # Demo
    log.header("D&D Tracker Build Tools - Logging Demo")

    log.info("Info-Nachricht")
    log.success("Erfolgs-Nachricht")
    log.warning("Warnung")
    log.error("Fehler")

    log.section("Fortschritt Demo")
    for i in range(1, 6):
        log.progress(i, 5, f"Datei {i}.js")

    log.section("Tabellen Demo")
    log.table(
        ["Datei", "Zeilen", "Status"],
        [
            ["maps.js", "1773", "OK"],
            ["initiative.js", "1380", "OK"],
            ["spell-editor.js", "1411", "Warnung"],
        ]
    )

    # Verbose Mode
    log.set_verbose(True)
    log.debug("Debug-Info (nur bei verbose)")
