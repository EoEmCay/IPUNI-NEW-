"""
Bespoke Logo Suite: Hue Imperial Citadel (Cố Đô Huế) transformed into Luxury DIAPLUS Identity
Features:
1. Concept 1: The Imperial Fortress Crest (Bản sắc Cố Đô tối giản - Vauban Bastions + Central Royal Cross)
2. Concept 2: The Sacred Golden Ratio Citadel (Tỷ lệ vàng Cung đình Huế & Dấu + Trung tâm)
3. Concept 3: The Minimalist Line-Art Blueprint (Bản vẽ kiến trúc Cố Đô đường nét thanh lịch)
4. Concept 4: The Imperial Monogram Fusion (Giao thoa giữa Cố Đô Huế và Monogram D+P+)
"""

import os

OUTPUT_DIR = r"d:\DIA+\diaplus_brand_identity\hue_concepts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -----------------------------------------------------------------------------
# CONCEPT 1: THE IMPERIAL CITADEL CREST (Huy Hiệu Cố Đô Huế Tối Giản)
# Dimensions: 1000 x 1100
# Emblem Center: (500, 420)
# Wordmark Center: (500, 840)
# -----------------------------------------------------------------------------
svg_hue_1 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1100" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap');
      .navy-fill { fill: #0A192F; }
      .navy-stroke { stroke: #0A192F; fill: none; }
      .gold-accent { fill: #C5A059; }
      .white-cut { fill: #FFFFFF; }
      .brand-title {
        font-family: 'Cinzel', 'Bodoni MT', 'Times New Roman', serif;
        font-size: 56px;
        font-weight: 700;
        letter-spacing: 0.38em;
        text-anchor: middle;
        fill: #0A192F;
      }
      .brand-sub {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.55em;
        text-anchor: middle;
        fill: #64748B;
      }
    </style>
    <linearGradient id="imperialNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061224" />
      <stop offset="50%" stop-color="#0A192F" />
      <stop offset="100%" stop-color="#0E2A52" />
    </linearGradient>
  </defs>

  <!-- Crisp White Background -->
  <rect width="1000" height="1100" fill="#FFFFFF" />

  <!-- MAIN EMBLEM: HUE IMPERIAL CITADEL ORTHOGONAL GEOMETRY -->
  <g id="citadel-emblem" transform="translate(500, 410)">
    
    <!-- LAYER 1: OUTER MOAT & VAUBAN BASTION PERIMETER (Kinh Thành Hào) -->
    <!-- Distinctive protruding bastions on corners and edges -->
    <path d="M -230 -230 
             L -80 -230 
             L -70 -245 L 70 -245 L 80 -230 
             L 230 -230 
             L 230 -80 
             L 245 -70 L 245 70 L 230 80 
             L 230 230 
             L 80 230 
             L 70 245 L -70 245 L -80 230 
             L -230 230 
             L -230 80 
             L -245 70 L -245 -70 L -230 -80 
             Z" 
          fill="none" stroke="#0A192F" stroke-width="6" stroke-linejoin="round" />

    <!-- Outer moat inner hairline -->
    <rect x="-215" y="-215" width="430" height="430" rx="4" fill="none" stroke="#0A192F" stroke-width="2" opacity="0.35" />

    <!-- LAYER 2: THE SECOND ENCLOSURE (Hoàng Thành Wall) -->
    <!-- Solid Navy perimeter with entrance portals -->
    <rect x="-185" y="-185" width="370" height="370" rx="2" fill="url(#imperialNavy)" />

    <!-- LAYER 3: THE WATER COURTYARD / GREEN BELT (Khoảng Sân Thở & Hào Trong) -->
    <rect x="-165" y="-165" width="330" height="330" rx="2" fill="#FFFFFF" />

    <!-- LAYER 4: THE INNER QUADRANTS (Tứ Cung Cố Đô) -->
    <!-- 4 balanced square palace quadrants -->
    <!-- Top-Left Quadrant -->
    <rect x="-150" y="-150" width="118" height="118" rx="2" fill="url(#imperialNavy)" opacity="0.9" />
    <rect x="-136" y="-136" width="90" height="90" fill="#FFFFFF" opacity="0.9" />
    <rect x="-124" y="-124" width="66" height="66" fill="url(#imperialNavy)" opacity="0.3" />

    <!-- Top-Right Quadrant -->
    <rect x="32" y="-150" width="118" height="118" rx="2" fill="url(#imperialNavy)" opacity="0.9" />
    <rect x="46" y="-136" width="90" height="90" fill="#FFFFFF" opacity="0.9" />
    <rect x="58" y="-124" width="66" height="66" fill="url(#imperialNavy)" opacity="0.3" />

    <!-- Bottom-Left Quadrant -->
    <rect x="-150" y="32" width="118" height="118" rx="2" fill="url(#imperialNavy)" opacity="0.9" />
    <rect x="-136" y="46" width="90" height="90" fill="#FFFFFF" opacity="0.9" />
    <rect x="-124" y="58" width="66" height="66" fill="url(#imperialNavy)" opacity="0.3" />

    <!-- Bottom-Right Quadrant -->
    <rect x="32" y="32" width="118" height="118" rx="2" fill="url(#imperialNavy)" opacity="0.9" />
    <rect x="46" y="46" width="90" height="90" fill="#FFFFFF" opacity="0.9" />
    <rect x="58" y="58" width="66" height="66" fill="url(#imperialNavy)" opacity="0.3" />

    <!-- LAYER 5: THE IMPERIAL AXIS & SACRED PLUS (+) NEXUS (Trục Thần Đạo & Trục Hoành) -->
    <!-- The vertical Meridian & horizontal avenue form a glorious PLUS SIGN (+) at the center -->
    <!-- Central Crossbar Background -->
    <g id="sacred-plus">
      <!-- The Center Pavilion Base (Tử Cấm Thành - Điện Thái Hòa) -->
      <rect x="-26" y="-26" width="52" height="52" rx="2" fill="url(#imperialNavy)" />
      
      <!-- The Radiant Plus Sign (+) carved in White & Gold -->
      <rect x="-18" y="-5" width="36" height="10" rx="1.5" fill="#FFFFFF" />
      <rect x="-5" y="-18" width="10" height="36" rx="1.5" fill="#FFFFFF" />
      
      <!-- Inner micro-jewel -->
      <circle cx="0" cy="0" r="2.5" fill="#C5A059" />

      <!-- North-South Meridian Path Indicator (Trục Thần Đạo) -->
      <line x1="0" y1="-165" x2="0" y2="-26" stroke="#0A192F" stroke-width="4" stroke-dasharray="8 4" />
      <line x1="0" y1="26" x2="0" y2="165" stroke="#0A192F" stroke-width="4" stroke-dasharray="8 4" />

      <!-- East-West Transverse Path Indicator -->
      <line x1="-165" y1="0" x2="-26" y2="0" stroke="#0A192F" stroke-width="4" stroke-dasharray="8 4" />
      <line x1="26" y1="0" x2="165" y2="0" stroke="#0A192F" stroke-width="4" stroke-dasharray="8 4" />
    </g>

    <!-- SOUTH GATE: CỬA NGỌ MÔN (Stylized 5-Portal Crown) -->
    <g transform="translate(0, 185)">
      <polygon points="-38,0 38,0 28,-14 -28,-14" fill="#0A192F" />
      <!-- 5 Archway slits -->
      <rect x="-24" y="-8" width="4" height="8" rx="1" fill="#FFFFFF" />
      <rect x="-13" y="-10" width="5" height="10" rx="1" fill="#FFFFFF" />
      <rect x="-3" y="-12" width="6" height="12" rx="1" fill="#FFFFFF" />
      <rect x="8" y="-10" width="5" height="10" rx="1" fill="#FFFFFF" />
      <rect x="20" y="-8" width="4" height="8" rx="1" fill="#FFFFFF" />
    </g>
  </g>

  <!-- REFINED LUXURY DIVIDER -->
  <line x1="430" y1="740" x2="570" y2="740" stroke="#0A192F" stroke-width="1.5" opacity="0.3" />
  <circle cx="500" cy="740" r="3" fill="#C5A059" />

  <!-- TYPOGRAPHY WORDMARK: DIAPLUS -->
  <!-- Pure Haute Couture serif typography with balanced tracking -->
  <g transform="translate(500, 835)">
    <text x="0" y="0" class="brand-title">DIAPLUS</text>
    <text x="0" y="44" class="brand-sub">HUE HERITAGE EDITION</text>
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 2: THE GOLDEN RATIO CITADEL (Kiến Trúc Tối Giản Tỷ Lệ Vàng)
# High-end Swiss MedTech & Heritage fusion.
# Pure clean linework, pristine geometric symmetry, prominent central Plus.
# -----------------------------------------------------------------------------
svg_hue_2 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1100" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&amp;family=Plus+Jakarta+Sans:wght@500;600;700&amp;display=swap');
      .title-sans {{
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 58px;
        font-weight: 700;
        letter-spacing: 0.32em;
        text-anchor: middle;
        fill: #0A192F;
      }}
      .sub-sans {{
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.6em;
        text-anchor: middle;
        fill: #64748B;
      }}
    </style>
  </defs>

  <rect width="1000" height="1100" fill="#FFFFFF" />

  <!-- EMBLEM: THE MINIMALIST ARCHITECTURAL CITADEL -->
  <g transform="translate(500, 410)">
    
    <!-- Concentric Square Frames (Geometric Vauban fortress) -->
    <!-- Frame 1: Outermost boundary with 45-degree chamfered fortress corners -->
    <path d="M -220 -180 L -180 -220 
             L 180 -220 L 220 -180 
             L 220 180 L 180 220 
             L -180 220 L -220 180 Z" 
          fill="none" stroke="#0A192F" stroke-width="8" stroke-linejoin="round" />

    <!-- Corner Bastion Pins -->
    <circle cx="-190" cy="-190" r="5" fill="#0A192F" />
    <circle cx="190" cy="-190" r="5" fill="#0A192F" />
    <circle cx="190" cy="190" r="5" fill="#0A192F" />
    <circle cx="-190" cy="190" r="5" fill="#0A192F" />

    <!-- Frame 2: Secondary moat barrier -->
    <rect x="-160" y="-160" width="320" height="320" rx="4" fill="none" stroke="#0A192F" stroke-width="3" opacity="0.4" />

    <!-- Frame 3: The Imperial City Walls (Hoàng Thành) -->
    <rect x="-130" y="-130" width="260" height="260" rx="2" fill="none" stroke="#0A192F" stroke-width="14" />

    <!-- The 4 Imperial Gates (North, South, East, West Apertures) -->
    <rect x="-24" y="-138" width="48" height="16" fill="#FFFFFF" />
    <rect x="-24" y="122" width="48" height="16" fill="#FFFFFF" />
    <rect x="-138" y="-24" width="16" height="48" fill="#FFFFFF" />
    <rect x="122" y="-24" width="16" height="48" fill="#FFFFFF" />

    <!-- INNER SANCTUM: THE PROMINENT PLUS CROSS (+) -->
    <!-- Formed by the intersection of Trục Thần Đạo & Trục Hoành -->
    <g id="central-cross">
      <!-- Outer diamond halo -->
      <polygon points="0,-75 75,0 0,75 -75,0" fill="none" stroke="#0A192F" stroke-width="2" opacity="0.3" />
      
      <!-- Solid Navy Bold Medical/Heritage Plus Sign -->
      <rect x="-56" y="-16" width="112" height="32" rx="4" fill="#0A192F" />
      <rect x="-16" y="-56" width="32" height="112" rx="4" fill="#0A192F" />

      <!-- Center pure white aperture dot -->
      <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
    </g>

    <!-- 4 Inner Palace Quad Pavilions -->
    <rect x="-85" y="-85" width="24" height="24" rx="2" fill="#0A192F" opacity="0.75" />
    <rect x="61" y="-85" width="24" height="24" rx="2" fill="#0A192F" opacity="0.75" />
    <rect x="-85" y="61" width="24" height="24" rx="2" fill="#0A192F" opacity="0.75" />
    <rect x="61" y="61" width="24" height="24" rx="2" fill="#0A192F" opacity="0.75" />
  </g>

  <!-- Wordmark -->
  <g transform="translate(500, 835)">
    <text x="0" y="0" class="title-sans">DIAPLUS</text>
    <text x="0" y="44" class="sub-sans">IMPERIAL ARCHITECTURE</text>
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 3: THE DECONSTRUCTED CITADEL MONOGRAM (Giao Thoa Cố Đô & Chữ D + P + +)
# The outer citadel walls trace the contour of D and P seamlessly!
# -----------------------------------------------------------------------------
svg_hue_3 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1100" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&amp;family=Plus+Jakarta+Sans:wght@600;700&amp;display=swap');
      .title-syne {{
        font-family: 'Syne', sans-serif;
        font-size: 54px;
        font-weight: 800;
        letter-spacing: 0.35em;
        text-anchor: middle;
        fill: #0A192F;
      }}
      .sub-syne {{
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.55em;
        text-anchor: middle;
        fill: #64748B;
      }}
    </style>
  </defs>

  <rect width="1000" height="1100" fill="#FFFFFF" />

  <g transform="translate(500, 410)">
    
    <!-- Outer Bastion Perimeter Line -->
    <rect x="-210" y="-210" width="420" height="420" rx="16" fill="none" stroke="#0A192F" stroke-width="4" stroke-dasharray="14 8" />

    <!-- Left Master Fortress Tower (Left Spine of D & P) -->
    <path d="M -160 -170 L -100 -170 L -100 170 L -160 170 Z" fill="#0A192F" />
    
    <!-- Upper Fortress Loop: Forms 'P' and Top Courtyard of Citadel -->
    <path d="M -85 -170 
             L 60 -170 
             C 120 -170, 160 -130, 160 -70 
             C 160 -10, 120 30, 60 30 
             L -85 30 
             L -85 -15 
             L 50 -15 
             C 85 -15, 110 -35, 110 -70 
             C 110 -105, 85 -125, 50 -125 
             L -85 -125 
             Z" 
          fill="#0A192F" />

    <!-- Lower Citadel Enclosure: Forms Base of 'D' -->
    <path d="M -85 75 
             L 50 75 
             C 115 75, 160 115, 160 170 
             L -85 170 
             Z" 
          fill="#0A192F" opacity="0.85" />

    <!-- THE IMPERIAL PLUS CROSS (+) NESTLED AT CENTER -->
    <g transform="translate(0, 30)">
      <rect x="-28" y="-8" width="56" height="16" rx="3" fill="#0A192F" />
      <rect x="-8" y="-28" width="16" height="56" rx="3" fill="#0A192F" />
      <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
    </g>

    <!-- 4 Bastion Gates -->
    <circle cx="-130" cy="-190" r="4" fill="#0A192F" />
    <circle cx="130" cy="-190" r="4" fill="#0A192F" />
    <circle cx="130" cy="190" r="4" fill="#0A192F" />
    <circle cx="-130" cy="190" r="4" fill="#0A192F" />
  </g>

  <!-- Typography -->
  <g transform="translate(500, 835)">
    <text x="0" y="0" class="title-syne">DIAPLUS</text>
    <text x="0" y="44" class="sub-syne">ROYAL MONOGRAM EDITION</text>
  </g>
</svg>
'''

# -----------------------------------------------------------------------------
# CONCEPT 4: THE MATRIX CITADEL (Ma Trận Cố Đô & Smart IoT Device)
# Reflects the 7x4 matrix of CalenDIA Plus mapped into the imperial courtyards!
# -----------------------------------------------------------------------------
svg_hue_4 = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1100" width="100%" height="100%">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&amp;display=swap');
      .title-matrix {{
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 54px;
        font-weight: 800;
        letter-spacing: 0.38em;
        text-anchor: middle;
        fill: #0A192F;
      }}
      .sub-matrix {{
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.55em;
        text-anchor: middle;
        fill: #64748B;
      }}
    </style>
  </defs>

  <rect width="1000" height="1100" fill="#FFFFFF" />

  <g transform="translate(500, 410)">
    
    <!-- Outer Fortress Ring -->
    <rect x="-210" y="-210" width="420" height="420" rx="8" fill="none" stroke="#0A192F" stroke-width="4" />
    
    <!-- Inner Concentric Enclosure -->
    <rect x="-180" y="-180" width="360" height="360" rx="4" fill="none" stroke="#0A192F" stroke-width="2" opacity="0.4" />

    <!-- 7x4 MATRIX COURTYARD TILES (Echoing CalenDIA Plus smart compartments) -->
    <!-- 28 Pill Compartments / Courtyard Pavilions arranged symmetrically around the central cross -->
    <g opacity="0.85">
      <!-- Left Wing Matrix (12 blocks) -->
      <rect x="-150" y="-150" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="-150" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-150" y="-105" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="-105" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-150" y="-60" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="-60" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-150" y="24" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="24" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-150" y="69" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="69" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-150" y="114" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="-105" y="114" width="36" height="36" rx="3" fill="#0A192F" />

      <!-- Right Wing Matrix (12 blocks) -->
      <rect x="69" y="-150" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="-150" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="69" y="-105" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="-105" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="69" y="-60" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="-60" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="69" y="24" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="24" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="69" y="69" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="69" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="69" y="114" width="36" height="36" rx="3" fill="#0A192F" />
      <rect x="114" y="114" width="36" height="36" rx="3" fill="#0A192F" />
    </g>

    <!-- THE SACRED IMPERIAL CROSS (+) AT CENTER -->
    <!-- Illuminated central chamber -->
    <rect x="-45" y="-45" width="90" height="90" rx="6" fill="#0A192F" />
    <rect x="-35" y="-10" width="70" height="20" rx="3" fill="#FFFFFF" />
    <rect x="-10" y="-35" width="20" height="70" rx="3" fill="#FFFFFF" />
  </g>

  <!-- Typography -->
  <g transform="translate(500, 835)">
    <text x="0" y="0" class="title-matrix">DIAPLUS</text>
    <text x="0" y="44" class="sub-matrix">SMART HEALTHCARE ARCHITECTURE</text>
  </g>
</svg>
'''

files = {
    "hue_concept_1_imperial_crest.svg": svg_hue_1,
    "hue_concept_2_golden_ratio.svg": svg_hue_2,
    "hue_concept_3_monogram_fusion.svg": svg_hue_3,
    "hue_concept_4_citadel_matrix.svg": svg_hue_4,
}

for filename, content in files.items():
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Created SVG: {filepath}")

print("All Hue Citadel Vector SVGs generated successfully!")
