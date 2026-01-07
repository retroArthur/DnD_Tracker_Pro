#!/usr/bin/env python3
"""Build wrapper with UTF-8 output handling"""
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Now run the actual build script
exec(open('build.py', encoding='utf-8').read())
