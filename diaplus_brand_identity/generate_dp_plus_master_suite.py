"""
Master Suite of D + P + (+) Monogram Logos for DIA+
Requirements:
- Seamlessly interlocks D, P, and +
- High-end luxury, subtle, refined, compact ("Đủ sang trọng, đủ tinh tế, đủ gọn")
- Not overly ornate or cluttered ("Không quá vẽ vời rối mắt")
- Unique, distinctive, breaking conventions ("Độc đáo, đặc biệt, sang trọng, phá cách")
- Navy Blue on White background
- Clearly legible D and P, subtly integrated +
- Standalone emblem mark only: NO typography
"""

import os

OUTPUT_DIR = r"d:\DIA+\diaplus_brand_identity\new_logo_concepts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# CONCEPT 1: THE DYNAMIC AERODYNAMIC RIBBON (Kế thừa & Nâng cấp Khí động học từ Logo Gốc)
# Slanted 12deg, forward momentum, sleek curved ribbon.
# Outer loop = D. Upper inner loop = P. Integrated precision '+' cut at junction.
# -----------------------------------------------------------------------------
svg_1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="navyGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081830" />
      <stop offset="50%" stop-color="#0D274D" />
      <stop offset="100%" stop-color="#143A6E" />
    </linearGradient>
    <linearGradient id="navyAccent1" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#061324" />
      <stop offset="100%" stop-color="#0E2F5C" />
    </linearGradient>
  </defs>

  <!-- Pure White Background -->
  <rect width="800" height="800" fill="#ffffff" />

  <!-- Monogram Group (Centered at 400, 400 with a sleek 10-degree dynamic slant) -->
  <g transform="translate(400, 400) skewX(-10)">
    
    <!-- LEFT PILLAR (Shared Spine of D & P) -->
    <!-- Slanted aerodynamic pillar with beveled cuts -->
    <path d="M -150 -180 
             L -95 -180 
             L -125 180 
             L -180 180 
             Z" 
          fill="url(#navyGrad1)" />

    <!-- UPPER LOOP OF 'P' (Bold, rounded, unmistakably clear P) -->
    <!-- Connects to left pillar at top, loops out to x=40, sweeps back to stem at y=10 -->
    <path d="M -90 -180 
             C 20 -180, 100 -140, 100 -75 
             C 100 -10, 20 20, -74 20 
             L -80 -25 
             C -10 -25, 48 -10, 48 -75 
             C 48 -130, -10 -135, -83 -135 
             Z" 
          fill="url(#navyGrad1)" />

    <!-- OUTER SWEEPING BOWL OF 'D' (Expansive, aerodynamic arch) -->
    <!-- Sweeps around the P from top right down to the base -->
    <path d="M -70 -180 
             C 120 -180, 215 -80, 215 35 
             C 215 140, 120 180, -110 180 
             L -100 135 
             C 80 135, 162 100, 162 35 
             C 162 -55, 85 -135, -65 -135 
             Z" 
          fill="url(#navyAccent1)" />

    <!-- SUBTLY INTEGRATED PLUS SIGN (+) -->
    <!-- Positioned elegantly at the optical focal center (the junction where P returns and D meets the base) -->
    <g transform="translate(-15, 60)">
      <!-- Horizontal bar of + -->
      <rect x="-32" y="-9" width="64" height="18" rx="4" fill="#0A1E3F" />
      <!-- Vertical bar of + -->
      <rect x="-9" y="-32" width="18" height="64" rx="4" fill="#0A1E3F" />
    </g>

    <!-- Micro-aperture negative cuts that give the logo high-tech depth -->
    <circle cx="-15" cy="60" r="3.5" fill="#ffffff" />
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 2: THE GESTALT APERTURE (Không Gian Âm Tinh Xảo - Khối Vững Chắc Y Tế Sang Trọng)
# Upright, solid monumental architecture.
# Big D encompasses everything. Upper cavity clearly sculpts P.
# Center waistline reveals a precision white medical plus (+) carved from negative space.
# -----------------------------------------------------------------------------
svg_2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="navySolid2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0A192F" />
      <stop offset="100%" stop-color="#0B203E" />
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#ffffff" />

  <!-- Monogram Centered -->
  <g transform="translate(400, 400)">
    
    <!-- MASTER SOLID 'D' FORM with precision cutouts -->
    <!-- Outer perimeter of majestic D -->
    <path d="M -140 -200 
             L 0 -200 
             C 140 -200, 210 -100, 210 0 
             C 210 100, 140 200, 0 200 
             L -140 200 
             Z" 
          fill="url(#navySolid2)" />

    <!-- INNER COUNTER 1: THE BOWL OF 'P' (Negative Space Cavity) -->
    <!-- Carved out of the upper section to sculpt the unmistakable P loop -->
    <path d="M -70 -140 
             L -10 -140 
             C 70 -140, 120 -105, 120 -45 
             C 120 15, 70 50, -10 50 
             L -70 50 
             Z" 
          fill="#ffffff" />

    <!-- INNER COUNTER 2: LOWER APERTURE OF 'D' -->
    <!-- Carved out of the lower section, leaving the bottom arch of D intact -->
    <path d="M -70 95 
             L 0 95 
             C 70 95, 125 120, 125 140 
             L -70 140 
             Z" 
          fill="#ffffff" opacity="0.96" />

    <!-- THE PLUS SIGN (+) EMBEDDED AT THE WAISTLINE -->
    <!-- Seamlessly bridge between P's lower loop and D's interior -->
    <!-- Positive Navy Plus floating inside the P cavity OR bridging the junction -->
    <g transform="translate(-10, 50)">
      <!-- Outer circular halo cut -->
      <circle cx="0" cy="0" r="32" fill="#ffffff" />
      <!-- Crisp Navy Plus Sign -->
      <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#0A192F" />
      <rect x="-7" y="-24" width="14" height="48" rx="3" fill="#0A192F" />
    </g>

    <!-- Refined Vertical Spine Slit -->
    <rect x="-155" y="-180" width="6" height="360" rx="3" fill="#0A192F" />
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 3: THE MONOLINE INFINITY (Nét Đơn Vô Cực Lồng Ghép - Haute Horlogerie & MedTech)
# Continuous 28px luxury line.
# Left stem rises -> curves into P bowl -> intersects horizontally to form '+' bar ->
# curves down into D base -> anchors at root.
# Plus sign is the geometric nexus where line weaves across.
# -----------------------------------------------------------------------------
svg_3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <style>
      .mono-path {
        fill: none;
        stroke: #0A1E3F;
        stroke-width: 32;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .mono-plus {
        fill: #0A1E3F;
      }
    </style>
  </defs>

  <rect width="800" height="800" fill="#ffffff" />

  <g transform="translate(400, 400)">
    
    <!-- MAIN STEM & P-LOOP & D-ARCH CONTINUOUS FLOW -->
    <!-- Left Stem of D & P -->
    <line x1="-120" y1="-190" x2="-120" y2="190" class="mono-path" />

    <!-- UPPER BOWL OF 'P' -->
    <!-- Curves out gracefully from top, returns to stem at y=0 -->
    <path d="M -120 -190 
             C 40 -190, 110 -130, 110 -65 
             C 110 0, 40 20, -120 20" 
          class="mono-path" />

    <!-- OUTER SWEEPING BOWL OF 'D' -->
    <!-- Starts from top of stem, sweeps wide (radius 220), anchors at bottom -->
    <path d="M -120 -190 
             C 120 -190, 200 -70, 200 20 
             C 200 110, 110 190, -120 190" 
          class="mono-path" />

    <!-- THE INTEGRATED PLUS SIGN (+) -->
    <!-- Placed cleanly at the right terminal / nexus where P's baseline anchors -->
    <g transform="translate(0, 20)">
      <!-- Horizontal crossbar -->
      <rect x="-38" y="-12" width="76" height="24" rx="6" class="mono-plus" />
      <!-- Vertical crossbar -->
      <rect x="-12" y="-38" width="24" height="76" rx="6" class="mono-plus" />
      <!-- Inner crisp medical core dot -->
      <circle cx="0" cy="0" r="4" fill="#ffffff" />
    </g>

    <!-- Subtle accent anchor dots on stem ends for balance -->
    <circle cx="-120" cy="-190" r="16" fill="#0A1E3F" />
    <circle cx="-120" cy="190" r="16" fill="#0A1E3F" />
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 4: THE ARCHITECTURAL CUT (Khối Kiến Trúc Tương Phản - Vát Góc 45 Độ Siêu Sang)
# Deep Navy architectural geometric segments.
# Bold D boundary with an inner P loop and a precision crossbar '+' formed by geometry.
# Clean, crisp, instantly legible, memorable.
# -----------------------------------------------------------------------------
svg_4 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="navyBevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081A36" />
      <stop offset="100%" stop-color="#0E2E5B" />
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#ffffff" />

  <g transform="translate(400, 400)">
    
    <!-- LEFT PILLAR (Shared Stem) -->
    <path d="M -130 -190 
             L -80 -190 
             L -80 190 
             L -130 190 
             Z" 
          fill="url(#navyBevel)" />

    <!-- UPPER 'P' LOOP -->
    <!-- Clearly visible, elegant arc with internal counter -->
    <path d="M -70 -190 
             L 10 -190 
             C 85 -190, 130 -140, 130 -80 
             C 130 -20, 85 15, 10 15 
             L -70 15 
             L -70 -25 
             L 5 -25 
             C 50 -25, 80 -48, 80 -80 
             C 80 -115, 50 -150, 5 -150 
             L -70 -150 
             Z" 
          fill="url(#navyBevel)" />

    <!-- LOWER 'D' EXTENSION LOOP -->
    <!-- Completes the D envelope while preserving the distinction of P -->
    <path d="M -70 45 
             L 25 45 
             C 105 45, 175 10, 175 -60 
             C 175 -75, 170 -90, 162 -105 
             L 198 -125 
             C 215 -95, 225 -65, 225 -30 
             C 225 75, 140 190, -70 190 
             Z" 
          fill="#0A1E3F" opacity="0.95" />

    <!-- INTEGRATED PLUS SIGN (+) -->
    <!-- Precision medical plus seamlessly nestled between the stem and the P loop termination -->
    <g transform="translate(-25, 105)">
      <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0A1E3F" />
      <rect x="-8" y="-30" width="16" height="60" rx="4" fill="#0A1E3F" />
      <circle cx="0" cy="0" r="3" fill="#ffffff" />
    </g>

    <!-- Top and bottom anchor accents -->
    <rect x="-142" y="-190" width="12" height="12" rx="2" fill="#0A1E3F" />
    <rect x="-142" y="178" width="12" height="12" rx="2" fill="#0A1E3F" />
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 5: THE EMBEDDED BIO-CROSS (Lồng Ghép Y Sinh Học - D và P Tinh Tế)
# Inspired by ultra-high-end medical biotech logos.
# The letter P is inside the letter D. The vertical stem contains an embedded Plus sign
# that connects both shapes together.
# -----------------------------------------------------------------------------
svg_5 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="navyBio" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1B38" />
      <stop offset="100%" stop-color="#10366D" />
    </linearGradient>
  </defs>

  <rect width="800" height="800" fill="#ffffff" />

  <g transform="translate(400, 400)">
    <!-- OUTER D SILHOUETTE (Smooth, modern, authoritative) -->
    <path d="M -110 -200 
             C 60 -200, 190 -110, 190 0 
             C 190 110, 60 200, -110 200 
             L -110 155 
             C 30 155, 138 85, 138 0 
             C 138 -85, 30 -155, -110 -155 
             Z" 
          fill="url(#navyBio)" />

    <!-- INNER P LOOP (Sculpted in the upper chamber) -->
    <path d="M -110 -155 
             C -20 -155, 60 -115, 60 -50 
             C 60 15, -20 40, -110 40 
             L -110 -5 
             C -40 -5, 15 -20, 15 -50 
             C 15 -80, -40 -115, -110 -115 
             Z" 
          fill="url(#navyBio)" />

    <!-- VERTICAL SHARED STEM WITH EMBEDDED PLUS SIGN -->
    <!-- Upper stem segment -->
    <rect x="-145" y="-200" width="30" height="150" rx="6" fill="#0A1B38" />
    
    <!-- Lower stem segment -->
    <rect x="-145" y="50" width="30" height="150" rx="6" fill="#0A1B38" />

    <!-- PLUS SIGN INTERLOCK (+) connecting upper and lower stem at the waistline -->
    <g transform="translate(-130, 0)">
      <!-- Horizontal arm -->
      <rect x="-35" y="-12" width="70" height="24" rx="6" fill="#0A1B38" />
      <!-- Vertical arm bridging stems -->
      <rect x="-15" y="-35" width="30" height="70" rx="6" fill="#0A1B38" />
      <!-- Center jewel cut -->
      <circle cx="0" cy="0" r="5" fill="#ffffff" />
    </g>

    <!-- Visual Echo of Plus on the right horizon -->
    <g transform="translate(45, 0)">
      <rect x="-16" y="-5" width="32" height="10" rx="3" fill="#10366D" opacity="0.6" />
      <rect x="-5" y="-16" width="10" height="32" rx="3" fill="#10366D" opacity="0.6" />
    </g>
  </g>
</svg>
'''

files = {
    "concept_1_dynamic_ribbon.svg": svg_1,
    "concept_2_gestalt_aperture.svg": svg_2,
    "concept_3_monoline_infinity.svg": svg_3,
    "concept_4_architectural_cut.svg": svg_4,
    "concept_5_embedded_biocross.svg": svg_5,
}

for filename, content in files.items():
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Created SVG: {filepath}")

print("All 5 vector SVGs generated successfully!")
