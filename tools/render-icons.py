#!/usr/bin/env python3
"""
tools/render-icons.py — D-04: d20-App-Icon als PNG rendern
Rendert icons/icon.svg -> icons/icon-192.png und icons/icon-512.png.

Methode: Python-Stdlib (struct, zlib) + Wu-Antialiasing-Linienalgorithmus.
Kein cairosvg/rsvg nötig — reine Python-Stdlib.

Verwendung:
  python tools/render-icons.py
  python tools/render-icons.py --sizes 192 512 1024
"""

import struct, zlib, math, argparse, os

# Goldfarbe und Hintergrund (D-04 SVG-Icon-Spezifikation)
GOLD = (212, 175, 55)
BG   = (13, 13, 13)


def create_d20_png(size: int, filename: str) -> None:
    """Rendert ein d20-Icon als PNG der gegebenen Größe."""
    pixels = [[BG] * size for _ in range(size)]

    def setpx(x: int, y: int, color: tuple, alpha: float = 1.0) -> None:
        if 0 <= x < size and 0 <= y < size:
            if alpha >= 1.0:
                pixels[y][x] = color
            else:
                bg = pixels[y][x]
                pixels[y][x] = tuple(int(b * (1 - alpha) + f * alpha)
                                     for b, f in zip(bg, color))

    def draw_line_wu(x0: float, y0: float, x1: float, y1: float,
                     color: tuple, width: float = 1.0) -> None:
        """Wu-Antialiased-Line mit konfigurierbarer Breite."""
        steep = abs(y1 - y0) > abs(x1 - x0)
        if steep:
            x0, y0 = y0, x0
            x1, y1 = y1, x1
        if x0 > x1:
            x0, x1 = x1, x0
            y0, y1 = y1, y0
        dx = x1 - x0
        if dx == 0:
            return
        dy = y1 - y0
        gradient = dy / dx
        half_w = width / 2.0

        def plot_x(xi: int, yi: float, xgap: float) -> None:
            y_int = int(yi)
            frac = yi - y_int
            for yw in range(int(-half_w) - 1, int(half_w) + 2):
                a = max(0.0, 1.0 - abs(yw - frac + 0.5)) * xgap
                if steep:
                    setpx(y_int + yw, xi, color, a)
                else:
                    setpx(xi, y_int + yw, color, a)

        xend = round(x0)
        yend = y0 + gradient * (xend - x0)
        xgap = 1.0 - (x0 + 0.5) % 1
        plot_x(int(xend), yend, xgap)
        intery = yend + gradient

        for xi in range(int(xend) + 1, round(x1)):
            plot_x(xi, intery, 1.0)
            intery += gradient

    # Skalierungsfaktor: viewBox 100x100 -> size x size
    s = size / 100.0

    def sc(x: float, y: float) -> tuple:
        return x * s, y * s

    # d20-Außenpentagon (oben zeigend): 50,14  83,36  71,74  29,74  17,36
    pts = [(50, 14), (83, 36), (71, 74), (29, 74), (17, 36)]
    lw_outer = max(1.5, size / 50.0)
    for i in range(len(pts)):
        draw_line_wu(*sc(*pts[i]), *sc(*pts[(i + 1) % len(pts)]), GOLD, lw_outer)

    # Interne Kanten (vereinfachtes Ikosaeder-Netz)
    internals = [
        (50, 14, 29, 74),
        (50, 14, 71, 74),
        (17, 36, 83, 36),
        (17, 36, 50, 74),
        (83, 36, 50, 74),
    ]
    lw_inner = max(1.2, size / 65.0)
    for x0, y0, x1, y1 in internals:
        draw_line_wu(*sc(x0, y0), *sc(x1, y1), GOLD, lw_inner)

    # "20" Pixel-Segmentanzeige, zentriert bei (50, 54) in viewBox-Koordinaten
    char_w = max(6, int(size * 0.14))
    char_h = max(8, int(size * 0.18))
    sw_seg = max(1, size // 70)

    segs = {
        '2': [
            (0, 0, 1, 0),       # oben
            (1, 0, 1, 0.5),     # oben-rechts
            (0, 0.5, 1, 0.5),   # mitte
            (0, 0.5, 0, 1),     # unten-links
            (0, 1, 1, 1),       # unten
        ],
        '0': [
            (0, 0, 1, 0),       # oben
            (1, 0, 1, 1),       # rechts
            (0, 1, 1, 1),       # unten
            (0, 0, 0, 1),       # links
        ],
    }

    total_w = char_w * 2 + char_w // 3
    start_x = int(50 * s - total_w / 2)
    start_y = int(54 * s - char_h / 2)

    for ci, ch in enumerate('20'):
        cx = start_x + ci * (char_w + char_w // 3)
        cy = start_y
        for sx0, sy0, sx1, sy1 in segs[ch]:
            px0 = cx + int(sx0 * (char_w - sw_seg))
            py0 = cy + int(sy0 * (char_h - sw_seg))
            px1 = cx + int(sx1 * (char_w - sw_seg)) + sw_seg
            py1 = cy + int(sy1 * (char_h - sw_seg)) + sw_seg
            for py in range(py0, py1):
                for px in range(px0, px1):
                    setpx(px, py, GOLD)

    # PNG schreiben (RGB, 8-bit)
    sig = b'\x89PNG\r\n\x1a\n'

    def chunk(t: bytes, d: bytes) -> bytes:
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    raw = b''.join(
        b'\x00' + b''.join(bytes(px) for px in row)
        for row in pixels
    )
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(sig + ihdr + idat + iend)
    print(f'Erstellt: {filename} ({size}x{size}, {os.path.getsize(filename):,} Bytes)')


def main() -> None:
    parser = argparse.ArgumentParser(description='Rendert d20-App-Icons als PNG (D-04)')
    parser.add_argument('--sizes', nargs='+', type=int, default=[192, 512],
                        help='Icon-Größen in Pixeln (Standard: 192 512)')
    parser.add_argument('--output-dir', default=None,
                        help='Zielverzeichnis (Standard: icons/ neben diesem Skript)')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = args.output_dir or os.path.join(script_dir, 'icons')
    os.makedirs(out_dir, exist_ok=True)

    print(f'Rendere d20-Icons nach {out_dir} ...')
    for size in args.sizes:
        filename = os.path.join(out_dir, f'icon-{size}.png')
        create_d20_png(size, filename)
    print('Fertig.')


if __name__ == '__main__':
    main()
