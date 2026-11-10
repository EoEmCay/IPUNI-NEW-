"""
Generates the Hue Citadel DIAPLUS Showcase HTML.
"""

import os

HTML_PATH = r"d:\DIA+\diaplus_brand_identity\hue_concepts\index.html"
BASE_DIR = r"d:\DIA+\diaplus_brand_identity\hue_concepts"

svg_files = [
    "hue_concept_1_imperial_crest.svg",
    "hue_concept_2_golden_ratio.svg",
    "hue_concept_3_monogram_fusion.svg",
    "hue_concept_4_citadel_matrix.svg",
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
  <title>DIAPLUS | Cố Đô Huế Imperial Heritage Logo Suite</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --navy-900: #050f1d;
      --navy-800: #0a192f;
      --navy-700: #0f274a;
      --navy-600: #173d72;
      --gold-royal: #c5a059;
      --gold-light: #e6c888;
      --bg: #f8fafc;
      --border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      padding-bottom: 90px;
    }}

    /* HEADER */
    .hero {{
      background: linear-gradient(135deg, var(--navy-900) 0%, var(--navy-800) 60%, var(--navy-700) 100%);
      color: #ffffff;
      padding: 60px 24px;
      text-align: center;
      border-bottom: 2px solid var(--gold-royal);
    }}

    .badge-royal {{
      display: inline-block;
      padding: 6px 18px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      background: rgba(197, 160, 89, 0.15);
      border: 1px solid var(--gold-royal);
      border-radius: 999px;
      color: var(--gold-light);
      margin-bottom: 18px;
    }}

    .hero-title {{
      font-family: 'Cinzel', serif;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
    }}

    .hero-sub {{
      font-size: 16px;
      color: #94a3b8;
      max-width: 800px;
      margin: 0 auto 28px auto;
    }}

    .container {{
      max-width: 1240px;
      margin: 0 auto;
      padding: 40px 24px;
    }}

    /* INSPIRATION & COMPARISON */
    .heritage-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 48px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }}

    .sec-title {{
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }}

    .sec-desc {{
      color: var(--text-muted);
      margin-bottom: 24px;
      font-size: 15px;
    }}

    .compare-row {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: stretch;
    }}
    @media (max-width: 860px) {{
      .compare-row {{ grid-template-columns: 1fr; }}
    }}

    .box-card {{
      background: #fdfdfd;
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
    }}

    .box-preview {{
      width: 100%;
      height: 380px;
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #eef2f6;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 16px;
    }}
    .box-preview img, .box-preview svg {{
      max-width: 95%;
      max-height: 95%;
      object-fit: contain;
    }}

    .box-tag {{
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--navy-800);
      margin-bottom: 12px;
    }}

    .box-list {{
      font-size: 14px;
      color: #334155;
      padding-left: 20px;
    }}
    .box-list li {{ margin-bottom: 8px; }}

    /* CONCEPTS GRID */
    .grid-2x2 {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 32px;
      margin-bottom: 48px;
    }}

    .logo-card {{
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;
    }}
    .logo-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(10,25,47,0.08);
      border-color: #cbd5e1;
    }}

    .logo-preview-box {{
      width: 100%;
      height: 420px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      border-bottom: 1px solid var(--border);
    }}
    .logo-preview-box svg, .logo-preview-box img {{
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    }}

    .logo-details {{
      padding: 24px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }}

    .logo-title {{
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 4px;
    }}

    .logo-tagline {{
      font-size: 13px;
      font-weight: 600;
      color: var(--gold-royal);
      margin-bottom: 12px;
    }}

    .logo-desc {{
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin-bottom: 18px;
    }}

    .btn-download {{
      margin-top: auto;
      padding: 10px 18px;
      background: var(--navy-800);
      color: #ffffff;
      border-radius: 8px;
      text-align: center;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.2s;
    }}
    .btn-download:hover {{
      background: var(--navy-600);
    }}

    .footer {{
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
      padding: 40px;
    }}
  </style>
</head>
<body>

  <!-- HERO -->
  <header class="hero">
    <div class="badge-royal">Bản Sắc Di Sản Cung Đình | Imperial Heritage</div>
    <h1 class="hero-title">DIAPLUS x CỐ ĐÔ HUẾ</h1>
    <p class="hero-sub">
      Chuyển hóa góc nhìn trực diện trên cao (Bird's-eye view) của Hoàng Thành Cố Đô Huế thành biểu tượng 
      logo đẳng cấp quốc tế: Cấu trúc thành trì vuông vức đồng tâm, Trục Thần Đạo giao cắt tạo dấu (+) y tế tự nhiên, 
      kết hợp typography DIAPLUS sang trọng bên dưới.
    </p>
  </header>

  <main class="container">

    <!-- BEFORE / AFTER INSPIRATION -->
    <section class="heritage-card">
      <h2 class="sec-title">Phân Tích Giải Mã Hình Học: Từ Không Ảnh Cố Đô Sang Biểu Tượng Logo</h2>
      <p class="sec-desc">Sự kỳ diệu trong quy hoạch phong thủy của Cố Đô Huế và mối liên hệ với thương hiệu DIAPLUS:</p>

      <div class="compare-row">
        <!-- Photo -->
        <div class="box-card">
          <div class="box-tag">Ảnh Chụp Không Ảnh Cố Đô Huế Của Bạn</div>
          <div class="box-preview">
            <img src="hue_citadel_aerial.jpg" alt="Aerial Hue Citadel" />
          </div>
          <ul class="box-list">
            <li><strong>Hình học đồng tâm hoàn hảo:</strong> Hệ thống thành hào kép hình vuông bao bọc vững chắc.</li>
            <li><strong>Pháo đài lồi Vauban:</strong> Các góc tường thành nhô ra tạo nhịp điệu kiến trúc kỷ hà chuẩn mực.</li>
            <li><strong>Trục Thần Đạo & Trục Hoành:</strong> Giao lộ huyết mạch xuyên suốt từ Ngọ Môn qua Điện Thái Hòa, tạo thành một <strong>dấu (+) tự nhiên linh thiêng</strong> giữa lòng Hoàng thành!</li>
          </ul>
        </div>

        <!-- Render / Vector Concept -->
        <div class="box-card">
          <div class="box-tag">Biểu Tượng Logo DIAPLUS Hoàn Thiện</div>
          <div class="box-preview">
            <img src="hue_concept_render_1.jpg" alt="DIAPLUS Hue Citadel Logo" />
          </div>
          <ul class="box-list">
            <li><strong>Chắt lọc tinh hoa:</strong> Lược bỏ các chi tiết tán cây và nhà dân lộn xộn, chỉ giữ lại khung xương kỷ hà thanh lịch nhất.</li>
            <li><strong>Dấu (+) & Thương hiệu DIAPLUS:</strong> Dấu cộng y tế/sức khỏe nằm uy nghiêm tại tâm điểm, tôn vinh giá trị trường tồn.</li>
            <li><strong>Typography DIAPLUS:</strong> Được đặt ở vị trí chân đế vững chãi với tỷ lệ khoảng cách chữ (tracking) chuẩn Haute Couture.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- SECTION 2: VECTOR SVG SUITE -->
    <section>
      <h2 class="sec-title">Bộ 4 Thiết Kế Vector SVG Chuẩn Sản Xuất (Infinite Resolution)</h2>
      <p class="sec-desc">Được lập trình bằng tọa độ hình học chính xác, sắc nét ở mọi kích cỡ hiển thị và sẵn sàng gia công:</p>

      <div class="grid-2x2">
        
        <!-- SVG 1 -->
        <div class="logo-card">
          <div class="logo-preview-box">
            {svg_contents.get("hue_concept_1_imperial_crest.svg", "")}
          </div>
          <div class="logo-details">
            <h3 class="logo-title">Concept 01: The Imperial Citadel Crest</h3>
            <div class="logo-tagline">Tôn vinh kiến trúc Hoàng Thành & Cửa Ngọ Môn 5 Cửa</div>
            <p class="logo-desc">
              Tái hiện đầy đủ 3 vòng thành (Kinh Thành, Hoàng Thành, Tử Cấm Thành) với pháo đài lồi Vauban, hào nước bao quanh, cửa Ngọ Môn ở phía Nam và dấu (+) y tế vàng rực rỡ tại Điện Thái Hòa. Chữ DIAPLUS font Cinzel hoàng gia.
            </p>
            <a href="hue_concept_1_imperial_crest.svg" download class="btn-download">Tải File Vector SVG</a>
          </div>
        </div>

        <!-- SVG 2 -->
        <div class="logo-card">
          <div class="logo-preview-box">
            {svg_contents.get("hue_concept_2_golden_ratio.svg", "")}
          </div>
          <div class="logo-details">
            <h3 class="logo-title">Concept 02: Golden Ratio Citadel</h3>
            <div class="logo-tagline">Đường nét kiến trúc tối giản - Swiss Modernism</div>
            <p class="logo-desc">
              Khung thành trì vát góc 45° thanh thoát. Bốn cổng hoàng thành được mở bằng các rãnh âm bản tinh xảo, làm nổi bật dấu (+) y tế khối đặc uy quyền tại tâm điểm. Chữ DIAPLUS font Space Grotesk tân tiến.
            </p>
            <a href="hue_concept_2_golden_ratio.svg" download class="btn-download">Tải File Vector SVG</a>
          </div>
        </div>

        <!-- SVG 3 -->
        <div class="logo-card">
          <div class="logo-preview-box">
            {svg_contents.get("hue_concept_3_monogram_fusion.svg", "")}
          </div>
          <div class="logo-details">
            <h3 class="logo-title">Concept 03: The Citadel Monogram Fusion</h3>
            <div class="logo-tagline">Hợp nhất Cố Đô Huế và Monogram D - P - (+)</div>
            <p class="logo-desc">
              Dành cho bạn nếu muốn kết hợp cả 2 ý tưởng: Các tường thành và tháp canh được cách điệu uốn lượn khéo léo thành chữ D lớn, chữ P ở góc trên, và dấu (+) làm trái tim kết nối. Chữ DIAPLUS font Syne thời thượng.
            </p>
            <a href="hue_concept_3_monogram_fusion.svg" download class="btn-download">Tải File Vector SVG</a>
          </div>
        </div>

        <!-- SVG 4 -->
        <div class="logo-card">
          <div class="logo-preview-box">
            {svg_contents.get("hue_concept_4_citadel_matrix.svg", "")}
          </div>
          <div class="logo-details">
            <h3 class="logo-title">Concept 04: The Matrix Citadel</h3>
            <div class="logo-tagline">Giao thoa giữa Cố Đô và Ma trận 7x4 CalenDIA Plus</div>
            <p class="logo-desc">
              28 khoang sân cung đình được quy hoạch chuẩn xác tương ứng với 28 ngăn thuốc thông minh của thiết bị CalenDIA Plus, đối xứng quanh dấu (+) y tế trung tâm. Chữ DIAPLUS font Plus Jakarta Sans hiện đại.
            </p>
            <a href="hue_concept_4_citadel_matrix.svg" download class="btn-download">Tải File Vector SVG</a>
          </div>
        </div>

      </div>
    </section>

  </main>

  <footer class="footer">
    <p>Dự án Phát Triển Nhận Diện Thương Hiệu <strong>DIAPLUS</strong> | Bộ Sưu Tập Cố Đô Huế Heritage</p>
    <p style="margin-top:6px;font-size:12px;color:#94a3b8;">Được thiết kế độc quyền dựa trên dữ liệu không ảnh thực tế Đại Nội Kinh Thành Huế.</p>
  </footer>

</body>
</html>
'''

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_template.strip())

print(f"Hue Showcase HTML successfully written to: {HTML_PATH}")
