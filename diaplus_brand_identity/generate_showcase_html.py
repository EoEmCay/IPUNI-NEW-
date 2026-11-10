"""
Generates the comprehensive luxury showcase HTML for DIA+ D+P+(+) Logo Suite.
"""

import os

HTML_PATH = r"d:\DIA+\diaplus_brand_identity\new_logo_concepts\index.html"
BASE_DIR = r"d:\DIA+\diaplus_brand_identity\new_logo_concepts"

# Read SVGs
svg_files = [
    "concept_1_dynamic_ribbon.svg",
    "concept_2_gestalt_aperture.svg",
    "concept_3_monoline_infinity.svg",
    "concept_4_architectural_cut.svg",
    "concept_5_embedded_biocross.svg",
]

svg_contents = {}
for sf in svg_files:
    p = os.path.join(BASE_DIR, sf)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            svg_contents[sf] = f.read()
    else:
        svg_contents[sf] = ""

html_template = f'''<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIA+ Logo Suite | D + P + (+) Monogram Redesign</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --navy-900: #061121;
      --navy-800: #0a192f;
      --navy-700: #0d254c;
      --navy-600: #143a6e;
      --navy-500: #1e5296;
      --navy-100: #eef3f9;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --accent: #2563eb;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      padding: 0 0 100px 0;
    }}

    /* HEADER */
    .hero-header {{
      background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 100%);
      color: #ffffff;
      padding: 60px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }}

    .badge {{
      display: inline-block;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 999px;
      margin-bottom: 20px;
      color: #93c5fd;
    }}

    .hero-title {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }}

    .hero-subtitle {{
      font-size: 17px;
      color: #94a3b8;
      max-width: 740px;
      margin: 0 auto 30px auto;
    }}

    .brief-checklist {{
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      max-width: 900px;
      margin: 0 auto;
    }}

    .brief-tag {{
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.06);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      border: 1px solid rgba(255,255,255,0.12);
    }}
    .brief-tag svg {{
      color: #38bdf8;
    }}

    /* CONTAINER */
    .container {{
      max-width: 1280px;
      margin: 0 auto;
      padding: 40px 24px;
    }}

    /* COMPARISON SECTION */
    .comparison-panel {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 50px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }}

    .section-title {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .section-desc {{
      color: var(--text-muted);
      margin-bottom: 28px;
      font-size: 15px;
    }}

    .compare-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: stretch;
    }}
    @media (max-width: 860px) {{
      .compare-grid {{ grid-template-columns: 1fr; }}
    }}

    .compare-card {{
      background: #fdfdfd;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
    }}
    .compare-card.before {{
      border-left: 4px solid #ef4444;
    }}
    .compare-card.after {{
      border-left: 4px solid #10b981;
      background: #f8fafc;
    }}

    .compare-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }}
    .compare-label {{
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }}
    .compare-card.before .compare-label {{ color: #dc2626; }}
    .compare-card.after .compare-label {{ color: #059669; }}

    .compare-img-box {{
      width: 100%;
      height: 240px;
      background: #ffffff;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 16px;
    }}
    .compare-img-box img {{
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }}

    .compare-analysis {{
      font-size: 14px;
      color: #334155;
    }}
    .compare-analysis ul {{
      margin-left: 20px;
      margin-top: 8px;
    }}
    .compare-analysis li {{
      margin-bottom: 6px;
    }}

    /* TABS */
    .tabs-nav {{
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 12px;
    }}
    .tab-btn {{
      padding: 10px 22px;
      background: none;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }}
    .tab-btn:hover {{
      color: var(--navy-800);
      background: #e2e8f0;
    }}
    .tab-btn.active {{
      background: var(--navy-800);
      color: #ffffff;
    }}

    /* CONCEPT CARDS GRID */
    .concept-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 32px;
      margin-bottom: 50px;
    }}

    .concept-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }}
    .concept-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(10,25,47,0.08);
      border-color: #cbd5e1;
    }}

    .concept-preview {{
      width: 100%;
      height: 340px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
      border-bottom: 1px solid var(--border);
    }}
    .concept-preview svg, .concept-preview img {{
      max-width: 80%;
      max-height: 80%;
      object-fit: contain;
    }}

    .concept-badge {{
      position: absolute;
      top: 16px;
      left: 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--navy-100);
      color: var(--navy-800);
      border: 1px solid #cbd5e1;
    }}

    .concept-body {{
      padding: 28px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }}

    .concept-title {{
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 6px;
    }}

    .concept-tagline {{
      font-size: 13px;
      color: var(--accent);
      font-weight: 600;
      margin-bottom: 14px;
    }}

    .concept-desc {{
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 20px;
    }}

    .concept-points {{
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px dashed var(--border);
      font-size: 13px;
      color: #334155;
    }}
    .point-item {{
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }}
    .point-icon {{
      font-weight: 700;
      color: #059669;
      line-height: 1.2;
    }}

    .download-row {{
      margin-top: 16px;
      display: flex;
      gap: 8px;
    }}
    .btn-download {{
      flex: 1;
      padding: 8px 14px;
      background: var(--navy-800);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: background 0.2s;
    }}
    .btn-download:hover {{
      background: var(--navy-600);
    }}

    /* FOOTER */
    .footer {{
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 14px;
    }}
  </style>
</head>
<body>

  <!-- HERO HEADER -->
  <header class="hero-header">
    <div class="badge">Bản Nâng Cấp Bộ Nhận Diện Thương Hiệu DIA+</div>
    <h1 class="hero-title">D + P + (+) Monogram Luxury Suite</h1>
    <p class="hero-subtitle">
      Giải pháp thiết kế biểu tượng độc quyền: Lồng ghép chữ <strong>D</strong>, chữ <strong>P</strong> và dấu <strong>+</strong> 
      trong một khối tinh xảo, tối giản, sang trọng tuyệt đối, không dùng chữ và không chi tiết thừa.
    </p>

    <div class="brief-checklist">
      <div class="brief-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Lồng ghép D & P & (+)
      </div>
      <div class="brief-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Xanh Navy trên nền Trắng
      </div>
      <div class="brief-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Sang trọng, Tinh tế, Gọn gàng
      </div>
      <div class="brief-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Không vẽ vời rối mắt
      </div>
      <div class="brief-tag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Không Typography (Chỉ Monogram)
      </div>
    </div>
  </header>

  <main class="container">

    <!-- COMPARISON SECTION -->
    <section class="comparison-panel">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
        Phân Tích So Sánh: Logo Hiện Tại vs. Giải Pháp Đột Phá Mới
      </h2>
      <p class="section-desc">Tại sao cần sửa đổi và phương pháp giải quyết triệt để yêu cầu của bạn:</p>

      <div class="compare-grid">
        <!-- Before -->
        <div class="compare-card before">
          <div class="compare-header">
            <span class="compare-label">Logo Nguyên Bản Của Bạn</span>
            <span style="font-size:12px;color:#ef4444;font-weight:600;">Còn khuyết thiếu</span>
          </div>
          <div class="compare-img-box">
            <img src="original_logo.jpg" alt="Original Logo" />
          </div>
          <div class="compare-analysis">
            <strong>Những hạn chế của thiết kế cũ:</strong>
            <ul>
              <li><strong>Thiếu chữ P:</strong> Biểu tượng hiện tại chỉ là chữ D nghiêng đơn độc, không đại diện được trọn vẹn cho từ <em>DIA+</em> hay <em>P (Plus)</em>.</li>
              <li><strong>Dấu (+) bị rời rạc:</strong> Dấu cộng chỉ bay lơ lửng ngoài rìa góc phải trên, trông như một ký tự add-on phụ, chưa có sự lồng ghép hữu cơ.</li>
              <li><strong>Chưa toát lên chiều sâu:</strong> Nhìn khá giống các logo ribbon thể thao thông thường, chưa đạt đến độ sang trọng đẳng cấp công nghệ y tế chuẩn quốc tế.</li>
            </ul>
          </div>
        </div>

        <!-- After -->
        <div class="compare-card after">
          <div class="compare-header">
            <span class="compare-label">Bộ Concept Mới: D + P + (+) Interlock</span>
            <span style="font-size:12px;color:#059669;font-weight:600;">Chuẩn hóa cao cấp</span>
          </div>
          <div class="compare-img-box">
            <img src="concept_render_1_smart_glyph.jpg" alt="Concept New" />
          </div>
          <div class="compare-analysis">
            <strong>Điểm đột phá vượt trội:</strong>
            <ul>
              <li><strong>Hợp nhất 3 trong 1:</strong> Khung viền ngoài là chữ <strong>D</strong> uy quyền, khoang bụng trên là chữ <strong>P</strong> thanh thoát, và tại giao điểm eo là dấu <strong>+</strong> y tế tinh tế.</li>
              <li><strong>Nhận diện tức thì:</strong> Nhìn từ xa thấy chữ D, nhìn kỹ thấy chữ P, khám phá ra dấu (+) hài hòa làm điểm nhấn phong thủy và thương hiệu.</li>
              <li><strong>Màu Xanh Navy hoàng gia trên nền trắng:</strong> Đậm chất Haute MedTech & Swiss Precision, cực kỳ gọn gàng để dập khuôn trên máy CalenDIA Plus, màn hình OLED hay in ấn.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 1: VECTOR SVG CONCEPTS (READY FOR PRODUCTION) -->
    <section style="margin-bottom: 60px;">
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m10 15 5-3-5-3v6z"/></svg>
        Bộ Thiết Kế Vector SVG Chuẩn Sản Xuất (Infinite Resolution)
      </h2>
      <p class="section-desc">Được tính toán bằng toán học Bezier chính xác, mở rộng vô hạn, sẵn sàng cho sản xuất công nghiệp, khắc laser trên máy và in ấn:</p>

      <div class="concept-grid">
        
        <!-- Concept 1 SVG -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Kế thừa Logo Gốc</span>
            {svg_contents.get("concept_1_dynamic_ribbon.svg", "")}
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Concept 01: The Dynamic Ribbon</h3>
            <div class="concept-tagline">Kế thừa dáng nghiêng 12° thể thao, nâng cấp sang trọng</div>
            <p class="concept-desc">
              Dành cho bạn nếu bạn yêu thích dòng chảy khí động học của logo gốc. Vòm cong ngoài là D, vòng cung trên tạo thành P rõ nét, và dấu (+) được lồng ghép tại giao điểm eo trung tâm.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Nhận diện:</strong> Rõ chữ D lớn, chữ P nửa trên, dấu (+) cân xứng.</span></div>
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Cảm xúc:</strong> Năng động, tốc độ, công nghệ cao, hiện đại.</span></div>
            </div>
            <div class="download-row">
              <a href="concept_1_dynamic_ribbon.svg" download class="btn-download">Tải File Vector SVG</a>
            </div>
          </div>
        </div>

        <!-- Concept 2 SVG -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Không Gian Âm (Gestalt)</span>
            {svg_contents.get("concept_2_gestalt_aperture.svg", "")}
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Concept 02: The Gestalt Aperture</h3>
            <div class="concept-tagline">Đỉnh cao nghệ thuật không gian âm tối giản Thụy Sĩ</div>
            <p class="concept-desc">
              Một khối điêu khắc chữ D nguyên khối màu Navy sâu thẳm. Khoang rỗng trên điêu khắc chữ P tinh xảo, và ngay tại đường thắt eo là một dấu (+) y tế màu trắng tinh khôi kết nối cấu trúc.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Nhận diện:</strong> Cực kỳ gọn gàng, nhận diện D và P tức thì ở mọi kích thước.</span></div>
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Cảm xúc:</strong> Uy quyền, vững chãi, tiêu chuẩn y tế xa xỉ hàng đầu.</span></div>
            </div>
            <div class="download-row">
              <a href="concept_2_gestalt_aperture.svg" download class="btn-download">Tải File Vector SVG</a>
            </div>
          </div>
        </div>

        <!-- Concept 3 SVG -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Monoline Couture</span>
            {svg_contents.get("concept_3_monoline_infinity.svg", "")}
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Concept 03: Monoline Infinity</h3>
            <div class="concept-tagline">Nét đơn vô cực - Đẳng cấp chế tác đồng hồ cao cấp</div>
            <p class="concept-desc">
              Sử dụng nét line dày 32px đồng nhất uốn lượn liên hoàn: đi lên trục trái -> uốn thành vòng P -> mở rộng xuống đáy thành D -> dấu (+) đóng vai trò mắt xích giao cắt trung tâm.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Nhận diện:</strong> Tinh tế vượt trội, phá cách hoàn toàn khỏi lối mòn thông thường.</span></div>
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Cảm xúc:</strong> Tinh hoa, nghệ thuật, tối giản đỉnh cao (Haute Horlogerie).</span></div>
            </div>
            <div class="download-row">
              <a href="concept_3_monoline_infinity.svg" download class="btn-download">Tải File Vector SVG</a>
            </div>
          </div>
        </div>

        <!-- Concept 4 SVG -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Architectural Blade</span>
            {svg_contents.get("concept_4_architectural_cut.svg", "")}
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Concept 04: The Architectural Cut</h3>
            <div class="concept-tagline">Lát cắt kiến trúc vát 45° - Phong cách Smart Tech</div>
            <p class="concept-desc">
              Các đường cắt hình học chuẩn xác tạo sự bứt phá thị giác. Chữ P nằm lồng ở nửa trên của D với nét khoét thanh mảnh, dấu (+) y tế nằm ở vị trí nâng đỡ chân vòng lặp.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Nhận diện:</strong> Sắc sảo, góc cạnh nam tính, mạnh mẽ.</span></div>
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Cảm xúc:</strong> Độ tin cậy cao, công nghệ chính xác, chuyên nghiệp.</span></div>
            </div>
            <div class="download-row">
              <a href="concept_4_architectural_cut.svg" download class="btn-download">Tải File Vector SVG</a>
            </div>
          </div>
        </div>

        <!-- Concept 5 SVG -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Biotech Interlock</span>
            {svg_contents.get("concept_5_embedded_biocross.svg", "")}
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Concept 05: The Embedded Bio-Cross</h3>
            <div class="concept-tagline">Huy hiệu Y sinh học hiện đại - Dấu (+) làm xương sống</div>
            <p class="concept-desc">
              Trục sống lưng bên trái được liên kết bởi một dấu (+) sắc nét làm hạt nhân. Từ hạt nhân đó, vòm ngoài nở rộng tạo chữ D và vòm trong thu gọn định vị chữ P.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Nhận diện:</strong> Tính y tế và chăm sóc sức khỏe rõ rệt nhất.</span></div>
              <div class="point-item"><span class="point-icon">✓</span> <span><strong>Cảm xúc:</strong> Chăm sóc, an tâm, cao cấp và nhân văn.</span></div>
            </div>
            <div class="download-row">
              <a href="concept_5_embedded_biocross.svg" download class="btn-download">Tải File Vector SVG</a>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- SECTION 2: LUXURY VISUAL RENDERS (HIGH-END INSPIRATION) -->
    <section>
      <h2 class="section-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        Bản Render Cao Cấp (Luxury Photorealistic Visuals)
      </h2>
      <p class="section-desc">Hình ảnh trực quan hóa với độ hoàn thiện cao, màu xanh Navy chuyên biệt trên nền trắng tinh khiết:</p>

      <div class="concept-grid">
        
        <!-- Render 1 -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">High Recommendation</span>
            <img src="concept_render_1_smart_glyph.jpg" alt="Precision Smart Glyph" />
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Visual 01: Precision Smart Glyph</h3>
            <div class="concept-tagline">Đề cử cao nhất cho thiết bị thông minh CalenDIA</div>
            <p class="concept-desc">
              Một biểu tượng phẳng hoàn hảo: Vòm ngoài chữ D uyển chuyển, vòm trong chữ P tròn trịa, và dấu (+) được tích hợp ngay tại chân trục giữa. Cực kỳ tối giản, sang trọng và không vẽ vời.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">★</span> <span><strong>Ưu điểm lớn nhất:</strong> Dễ nhận biết nhất, dễ khắc lên vỏ nhôm/nhựa của thiết bị.</span></div>
            </div>
          </div>
        </div>

        <!-- Render 2 -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Swiss Clean</span>
            <img src="concept_render_2_swiss_monoline.jpg" alt="Swiss Monoline" />
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Visual 02: Swiss Monoline Loop</h3>
            <div class="concept-tagline">Phong cách Tối giản Bắc Âu & Thụy Sĩ</div>
            <p class="concept-desc">
              Đường nét thanh thoát với độ dày đồng đều. Vòng lặp chữ P được ôm trọn bởi đường viền chữ D, với một dấu (+) đối xứng tỏa sáng ở tâm điểm.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">★</span> <span><strong>Ưu điểm lớn nhất:</strong> Tinh tế, nhẹ nhàng, không gây cảm giác nặng nề.</span></div>
            </div>
          </div>
        </div>

        <!-- Render 3 -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Interlocking Focal</span>
            <img src="concept_render_3_interlocking_ribbon.jpg" alt="Interlocking Ribbon" />
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Visual 03: Continuous Ribbon Core</h3>
            <div class="concept-tagline">Dải băng lồng ghép với tâm điểm dấu (+)</div>
            <p class="concept-desc">
              Dải ruy băng Navy uốn lượn liên hoàn tạo chữ D và P, với tâm điểm là dấu (+) y tế được bao bọc trong một đĩa tròn tinh xảo.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">★</span> <span><strong>Ưu điểm lớn nhất:</strong> Tính biểu tượng cực cao, ghi nhớ sâu sắc trong tâm trí khách hàng.</span></div>
            </div>
          </div>
        </div>

        <!-- Render 4 -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Architectural Dual</span>
            <img src="concept_render_4_architectural_interlock.jpg" alt="Architectural Interlock" />
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Visual 04: Dual Contour Architectural</h3>
            <div class="concept-tagline">Đường nét kép công nghệ - High-Tech Med</div>
            <p class="concept-desc">
              Đường nét kép tinh xảo thể hiện độ chính xác của cảm biến và vi mạch y tế, dấu (+) được cắt gọt chuẩn mực giữa các rãnh dẫn.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">★</span> <span><strong>Ưu điểm lớn nhất:</strong> Phù hợp đặc biệt với sản phẩm IoT / phần cứng công nghệ.</span></div>
            </div>
          </div>
        </div>

        <!-- Render 5 -->
        <div class="concept-card">
          <div class="concept-preview">
            <span class="concept-badge">Balanced Nexus</span>
            <img src="concept_render_5_balanced_inner_cross.jpg" alt="Balanced Inner Cross" />
          </div>
          <div class="concept-body">
            <h3 class="concept-title">Visual 05: Balanced Inner Cross</h3>
            <div class="concept-tagline">Cân bằng hoàn hảo giữa Khối học và Điểm nhấn</div>
            <p class="concept-desc">
              Chữ D vững vàng nâng đỡ vòng lặp chữ P, với dấu (+) y tế nổi bật ở góc trong, tạo thế kiềng ba chân vững chãi và an tâm.
            </p>
            <div class="concept-points">
              <div class="point-item"><span class="point-icon">★</span> <span><strong>Ưu điểm lớn nhất:</strong> Tính đối xứng thị giác tuyệt vời, tỷ lệ vàng chuẩn mực.</span></div>
            </div>
          </div>
        </div>

      </div>
    </section>

  </main>

  <footer class="footer">
    <p>Dự án Phát Triển Nhận Diện Thương Hiệu <strong>DIA+</strong> & Thiết Bị Thông Minh CalenDIA Plus</p>
    <p style="margin-top:6px;font-size:12px;color:#94a3b8;">Được thiết kế chuyên biệt theo tiêu chuẩn Luxury MedTech & Minimalist Swiss Design.</p>
  </footer>

</body>
</html>
'''

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_template.strip())

print(f"Showcase HTML successfully generated at: {HTML_PATH}")
