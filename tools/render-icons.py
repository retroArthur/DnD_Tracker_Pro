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
        """Antialiased thick line.
        For width > 1: solid interior pixels + anti-aliased 1px border on each side.
        For width <= 1: standard Wu single-pixel anti-aliasing.
        """
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
            y_center = yi  # center of the line at this x
            y_low = y_center - half_w
            y_high = y_center + half_w
            y_start = int(math.floor(y_low))
            y_end = int(math.ceil(y_high))
            for yw in range(y_start, y_end + 1):
                # Distance from pixel center (yw+0.5) to line center
                dist_low  = (yw + 0.5) - y_low   # > 0 inside
                dist_high = y_high - (yw + 0.5)  # > 0 inside
                # Clamp to [0,1] for anti-aliasing at edges
                a = min(1.0, max(0.0, min(dist_low, dist_high, 1.0))) * xgap
                if a <= 0:
                    continue
                if steep:
                    setpx(yw, xi, color, a)
                else:
                    setpx(xi, yw, color, a)

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

    # d20 kanonische Frontansicht: regulaeres Hexagon (Spitze oben), Radius 40, Zentrum (50,50)
    # Ecken (im Uhrzeigersinn von oben):
    #   H0=(50,10)  H1=(84.64,30)  H2=(84.64,70)
    #   H3=(50,90)  H4=(15.36,70)  H5=(15.36,30)
    hex_pts = [
        (50.00, 10.00),   # H0 oben
        (84.64, 30.00),   # H1 oben-rechts
        (84.64, 70.00),   # H2 unten-rechts
        (50.00, 90.00),   # H3 unten
        (15.36, 70.00),   # H4 unten-links
        (15.36, 30.00),   # H5 oben-links
    ]
    # Aussenlinie: ~18px bei 512px-Canvas -> lw = size / 28
    lw_outer = max(2.5, size / 28.0)
    for i in range(len(hex_pts)):
        draw_line_wu(*sc(*hex_pts[i]), *sc(*hex_pts[(i + 1) % len(hex_pts)]), GOLD, lw_outer)

    # Inneres Dreieck (H0 -> H2 -> H4): alternierende Ecken = kanonisches W20-Muster
    # ~9px bei 512px-Canvas -> lw = size / 57
    inner_triangle = [
        (50.00, 10.00, 84.64, 70.00),   # H0 -> H2
        (84.64, 70.00, 15.36, 70.00),   # H2 -> H4
        (15.36, 70.00, 50.00, 10.00),   # H4 -> H0
    ]
    lw_inner = max(2.0, size / 57.0)
    for x0, y0, x1, y1 in inner_triangle:
        draw_line_wu(*sc(x0, y0), *sc(x1, y1), GOLD, lw_inner)

    # "20" Pixel-Segmentanzeige, zentriert bei (50, 50) in viewBox-Koordinaten
    # (Dreieck-Zentroid: (50+84.64+15.36)/3=50, (10+70+70)/3=50)
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
    start_y = int(50 * s - char_h / 2)

    # Dunkler Halo hinter den Ziffern (damit Wireframe-Linien lesbar bleiben)
    halo_pad = max(2, size // 80)
    for ci, ch in enumerate('20'):
        cx = start_x + ci * (char_w + char_w // 3)
        for py in range(start_y - halo_pad, start_y + char_h + halo_pad):
            for px in range(cx - halo_pad, cx + char_w + halo_pad):
                setpx(px, py, BG)

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
