# TrOCR — đọc chữ viết tay theo dòng

Engine **tuỳ chọn**, tắt mặc định. Model `microsoft/trocr-base-handwritten` nặng khoảng 1,3GB và cần PyTorch, nên không chạy trên gói Render hiện tại.

## Cài (một lần, Python 3.11)
```bash
cd backend/src/ai_ocr
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python medical_matcher.py          # self-check, không cần model
.venv/bin/python trocr_engine.py anh.jpg     # lần đầu tự tải model về ~/.cache/huggingface
```

## Bật trong backend
Thêm vào `backend/.env`:
- `TROCR_ENABLED=1`: TrOCR đọc trước, các dòng chữ được gửi kèm prompt Gemini làm gợi ý.
- `SCAN_ENGINE=trocr`: chỉ dùng TrOCR, không gọi Gemini. Chỉ dùng để đo, vì TrOCR không đọc được tiếng Việt có dấu.

## Đo
```bash
cd backend
node test_prescriptions/evaluate_benchmark.js --engine trocr    --out /tmp/r_trocr
node test_prescriptions/evaluate_benchmark.js --engine ensemble --out /tmp/r_ens
node test_prescriptions/evaluate_benchmark.js                   # chỉ Gemini (mặc định)
```

## Files
- `trocr_engine.py`: tiền xử lý (khử nhiễu, CLAHE, ngưỡng thích nghi), chỉnh nghiêng, tách dòng theo hình chiếu ngang, TrOCR đọc từng dòng.
- `medical_matcher.py`: Levenshtein ≥ 70% so với `database/medications-db.json` và `database/drug-names.json` (cùng nguồn với `scan.service.js`), giải mã tốc ký (`1v x 2`, `s-c`, `u.s.a`, `đv`...), tách thuốc từ các dòng.
