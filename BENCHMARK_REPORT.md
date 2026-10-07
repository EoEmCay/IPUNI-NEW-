# Báo cáo nghiệm thu: Nhận diện đơn thuốc viết tay (cập nhật 07/10/2026, lượt 3)

**Kết luận:** cấu hình hiện tại (chỉ Gemini, prompt suy luận lâm sàng 2 tầng) đạt **70,0% ở cấp Khó**, vượt mốc > 50%. **Đơn thật duy nhất** trong bộ test (đơn BHYT có chữ bác sĩ viết tay) được đọc đúng toàn bộ các trường được chấm. Cần đọc kèm phần *Giới hạn*: bộ test nhỏ và hầu hết là ảnh tổng hợp.

## Lượt 3: suy luận lâm sàng 2 tầng + đơn thật

Lệnh chạy: `cd backend && node test_prescriptions/evaluate_benchmark.js`. Kết quả thô: `test_prescriptions/results/`. Cả 16 ảnh đều do model `gemini-flash-lite-latest` trả lời, vì `gemini-flash-latest` và `gemini-2.5-flash` đã hết quota miễn phí trong ngày (lỗi 429).

| Cấp độ | Số đơn | Số thuốc | Tên thuốc | Liều & đơn vị | Cách dùng & giờ | **Field Accuracy** | Đơn đúng trọn vẹn | **Thời gian/ảnh** |
|---|---|---|---|---|---|---|---|---|
| Dễ | 5 | 9 | 100% | 100% | 100% | **100%** | 100% | 7,3 s |
| Trung bình | 5 | 15 | 100% | 93,3% | 100% | **97,8%** | 80% | 8,1 s |
| Khó | 6 | 21 | 81,0% | 63,2% | 65,0% | **70,0%** ✅ > 50% | 50% | 4,7 s |

Thời gian/ảnh tính cả thời gian chờ khi model đầu danh sách lỗi và phải lùi sang model khác.

### Đơn thật (`level_3_hard/real_doctor_prescription.jpg`)
Đáp án theo xác nhận của người dùng: chữ tay là "Insulin 30/70 · sáng 28 · chiều 26", cộng dòng "gluo…" là Glucophage, đơn không ghi liều cho Glucophage.

| Thuốc | App đọc | Chấm |
|---|---|---|
| Ebitac 25 (in) | Uống 1 viên buổi sáng, 07:00, đường uống | ✅ (ô liều ghi "25mg", xem mục rủi ro) |
| Insulin 30/70 (viết tay) | Tiêm dưới da **sáng 28 đơn vị, chiều 26 đơn vị**, 07:00 + 15:00 | ✅ |
| Glucophage (viết tay "gluo…") | Tên đúng; cách dùng "Chưa ghi liều, hỏi lại bác sĩ/dược sĩ" | ✅ |

Bản yêu cầu ghi liều chiều là "20 đv". Báo cáo dùng **26** theo lời người dùng đã xác nhận trước đó và theo nét chữ trên ảnh. Tên bác sĩ trên ảnh đã bị che nên không chấm.

### So sánh A/B: prompt cũ và prompt 2 tầng (chạy song song, cùng model)
| | Prompt cũ | Prompt 2 tầng |
|---|---|---|
| Field Accuracy cấp Khó | 70,0% | 65,0% |
| Đơn thật: Insulin 30/70 | Đọc thành "Mixtard 30", **mất liều 28/26**, chỉ 1 cữ | **Đúng liều 28/26, đủ 2 cữ** |

- Trên ảnh tổng hợp, prompt mới thấp hơn 5 điểm. Mức này đến từ 2 ảnh (rx_00030, rx_00071), tương đương 1–2 trường, nằm trong biên dao động. Lượt chạy cuối với prompt hoàn chỉnh đạt 70%.
- Trên đơn thật, prompt mới đọc đúng chỗ prompt cũ đọc sai. Ảnh tổng hợp không có chẩn đoán in sẵn nên suy luận lâm sàng không có tác dụng ở đó; nó chỉ có tác dụng ở đơn thật.
- Kết quả thô: `results_ab_prompt_cu/`, `results_ab_prompt_moi/`.

### Thay đổi trong lượt này (`backend/src/modules/scan/scan.service.js`)
1. **Prompt suy luận 2 tầng:**
   - Bước A: đọc phần in (chẩn đoán/ICD, tuổi, xét nghiệm, thuốc in) để lập danh sách thuốc khả dĩ theo phác đồ.
   - Bước B: so nét chữ (chữ đầu/cuối, độ dài, con số như 30/70) với danh sách đó.
   - **Có giới hạn cứng:** bối cảnh lâm sàng chỉ dùng để chọn giữa các cách đọc mà nét chữ cho phép. Không được thêm thuốc không có trên giấy. Không tự giả định tiểu đường khi đơn không có chẩn đoán. Lượt trước đã đo thấy danh mục thuốc tiểu đường làm AI bịa thêm thuốc.
2. **Tốc ký:**
   - "dr"/"đr" sau con số là đv (IU).
   - "Sá"/"Sán" là sáng, "Ch" là chiều.
   - Insulin có liều sáng/chiều khác nhau thì ghi đủ cả hai liều.
3. **Không được bịa liều:**
   - Prompt cấm điền liều "thường gặp" khi đơn không ghi.
   - Code có thêm chốt chặn: AI ghi "chưa ghi liều" thì ô liều bị xoá trống.
   - Lý do: đã đo thấy AI tự điền "Glucophage 850mg, 2 lần/ngày" dù đơn không ghi.
4. **Trường `route` (đường dùng):** AI trả về sẵn; nếu thiếu thì code tự suy: insulin/GLP-1 hoặc có chữ "tiêm" là "tiêm dưới da", còn lại là "uống".
5. **Thứ tự model:** `gemini-flash-latest`, `gemini-2.5-flash`, rồi `GEMINI_MODEL`, rồi bản lite. **Đổi thứ tự không tránh được lỗi 429:** quota miễn phí tính riêng cho từng model, và hôm nay cả 2 model chính đều đã hết. Muốn hết 429 thì cần key trả phí.
6. **Bộ chấm:**
   - Trường nào đơn không ghi (đáp án để trống) thì không chấm.
   - Insulin nhiều liều theo cữ thì phải đọc đủ mọi liều.
   - Có thêm cột thời gian/ảnh.
7. `build_dataset.js` không còn xoá ảnh `real_*` và giữ đáp án của chúng khi chạy lại.

### Rủi ro còn lại
- **Số trong tên biệt dược bị hiểu thành hàm lượng:** "Ebitac 25" bị ghi thành "25mg" dù prompt đã dặn. Trường này không được chấm vì đơn không ghi mg. Người dùng cần kiểm tra ở màn xác nhận.
- **Kết quả đơn thật dao động giữa các lần chạy.** Chạy 3 lần: cả 3 lần đúng liều 28/26, nhưng 1 lần thiếu cữ chiều và 1 lần bỏ sót dòng Glucophage. Với 1 đơn thật thì chưa kết luận được độ chính xác trên đơn thật.
- **Prompt có nhắc "insulin trộn sẵn 30/70" và "Glucophage"** như ví dụ thuốc tiểu đường theo phác đồ. Đây là kiến thức chuyên môn đúng và yêu cầu có đề ra, nhưng có lợi cho đơn thật trong bộ test. Các con số ví dụ (liều, đv) đã được đổi để không trùng với đáp án.

---

# Lượt 2: TrOCR (`microsoft/trocr-base-handwritten`), đo sáng 07/10/2026

3 cấu hình chạy trên cùng 15 ảnh, cùng cách chấm. "Chỉ Gemini" và "TrOCR + Gemini" chạy **song song cùng lúc**, nên tình trạng quá tải/503 của Gemini ảnh hưởng hai bên như nhau. Ở cấp Khó, cả hai đều do model `gemini-flash-lite-latest` trả lời.

Field Accuracy (Tên thuốc + Liều + Cách dùng):

| Cấp độ | Chỉ TrOCR | Chỉ Gemini | **TrOCR + Gemini** |
|---|---|---|---|
| Dễ | 51,9% | 88,9% | **100%** |
| Trung bình | 22,2% | 100% | **100%** |
| Khó | **0%** | 61,1% | **64,8%** ✅ > 50% |

Chi tiết cấp Khó:

| | Tên thuốc | Liều | Cách dùng | Đơn đúng trọn vẹn |
|---|---|---|---|---|
| Chỉ Gemini | 66,7% | 55,6% | 61,1% | 40% |
| TrOCR + Gemini | **77,8%** | 55,6% | 61,1% | 40% |

Kết quả thô: `test_prescriptions/results_trocr/`, `results_llm_0710/`, `results_ensemble/`.

### Nhận xét (nói thẳng)
- **Một mình TrOCR không dùng được cho chữ khó.** Ở cấp Khó, TrOCR bịa hẳn câu tiếng Anh, ví dụ "personal health care and the establishment of the Government…". Model này được train trên chữ viết tay tiếng Anh (bộ IAM), nên khi nét chữ mờ nó "đoán" theo câu tiếng Anh quen thuộc.
- **Cái lợi thật của TrOCR là giảm bịa tên thuốc khi dùng kèm Gemini.**
  - Ảnh `rx_00071`: chỉ Gemini thì bịa ra 4 thuốc tiểu đường (Amaryl, Glucophage, Januvia, Jardiance). Nhiều khả năng do danh mục biệt dược tiểu đường trong prompt kéo model về phía thuốc tiểu đường.
  - Có thêm các dòng chữ của TrOCR làm gợi ý, Gemini đọc đúng Omeprazole và Ibuprofen.
  - Toàn bộ mức tăng 3,7 điểm ở cấp Khó đến từ đúng ảnh này.
- **Mức tăng nhỏ và cỡ mẫu nhỏ:** 18 thuốc, mỗi cấu hình chạy 1 lần. Hướng tăng là thật (giảm bịa tên thuốc), nhưng con số +3,7 điểm nằm trong biên dao động.
- 2 ảnh `vn_01` và `vn_02` bị TrOCR quá thời gian chờ 180 giây, do máy 8GB bị quá tải khi chạy thử song song. Ở 2 ảnh đó, cấu hình kết hợp thực chất chỉ dùng Gemini.
- **Đơn thật (ảnh chụp đơn BHYT của người dùng):**
  - Sau khi sửa phần tách dòng (xoá đường kẻ, ngưỡng tương đối), TrOCR tách được 10 dòng.
  - Nhưng chữ tiếng Việt viết tay bị đọc thành câu tiếng Anh vô nghĩa. Dòng duy nhất có ích là "In Sullivan 30 ) 70", tức "Insulin 30/70".
  - Gemini một mình đã đọc đúng đơn này.
- **Chi phí:** mỗi lần quét chậm thêm khoảng 10–15 giây (nạp model và đọc từng dòng trên MPS của M3), cần khoảng 400MB RAM cùng PyTorch.

### Khuyến nghị
1. **Chưa đưa TrOCR lên production.** Gói Render hiện tại không chạy nổi, và mức lợi (+3,7 điểm, 1 ảnh) chưa đủ bù việc chậm thêm khoảng 15 giây mỗi lần quét. Engine được giữ ở chế độ tắt (`TROCR_ENABLED=1` để bật).
2. Lợi ích "giảm bịa tên thuốc" có thể lấy rẻ hơn: thu hẹp danh mục biệt dược tiểu đường trong prompt, hoặc đọc ảnh 2 lần rồi so kết quả. Cả hai đều không cần thêm model.
3. Muốn TrOCR thật sự đọc được chữ bác sĩ Việt Nam thì phải **fine-tune trên ảnh từng dòng chữ thật đã gõ lại** (vài nghìn dòng), có dấu tiếng Việt. Đây là dữ liệu mà luồng thu thập từ màn xác nhận (đã đề xuất trước đó) sẽ cung cấp.

### Cách chạy
```bash
cd backend/src/ai_ocr && python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt   # 1 lần
cd backend
node test_prescriptions/evaluate_benchmark.js --engine trocr     --out /tmp/r_trocr   # chỉ TrOCR, không tốn quota
node test_prescriptions/evaluate_benchmark.js --engine ensemble  --out /tmp/r_ens     # TrOCR + Gemini
node test_prescriptions/evaluate_benchmark.js --engine llm       --out /tmp/r_llm     # chỉ Gemini
node test_prescriptions/evaluate_benchmark.js --resume ...   # chỉ chạy lại ảnh bị lỗi API (Gemini 503/429)
node test_prescriptions/evaluate_benchmark.js --selftest      # kiểm tra hàm chấm điểm
```
Bộ chấm dùng chung một file `evaluate_benchmark.js` cho cả 3 cấu hình (không viết thêm bản Python), để mọi cấu hình được chấm cùng một cách.

---

# Lượt 1: nâng cấp prompt và fuzzy matching (rạng sáng 07/10/2026)

## 1. Kết quả

Lệnh chạy: `cd backend && node test_prescriptions/evaluate_benchmark.js`. Kết quả thô của từng ảnh được lưu ở `test_prescriptions/results/`.

### Sau khi nâng cấp

| Cấp độ | Số đơn | Số thuốc | Drug Name Match | Dosage & Amount | Instructions & Timing | **Field Accuracy (3 trường)** | Total Prescription Success |
|---|---|---|---|---|---|---|---|
| Dễ | 5 | 9 | 100,0% | 100,0% | 100,0% | **100,0%** | 100,0% |
| Trung bình | 5 | 15 | 93,3% | 73,3% | 86,7% | **84,4%** | 40,0% |
| Khó | 5 | 18 | 66,7% | 50,0% | 61,1% | **59,3%** ✅ > 50% | 20,0% |

### Trước khi nâng cấp (baseline: prompt và so khớp cũ, cùng bộ ảnh, cùng cách chấm)

Kết quả thô ở `test_prescriptions/results_baseline/`.

| Cấp độ | Drug Name Match | Dosage & Amount | Instructions & Timing | **Field Accuracy** | Total Prescription Success |
|---|---|---|---|---|---|
| Dễ | 88,9% | 88,9% | 66,7% | **81,5%** | 40,0% |
| Trung bình | 100,0% | 93,3% | 53,3% | **82,2%** | 0,0% |
| Khó | 77,8% | 55,6% | 38,9% | **57,4%** | 0,0% |

### Cách đọc số liệu (nói thẳng)

- **Bản cũ cũng đã vượt 50% ở cấp Khó (57,4%).** Ở cấp Khó, bản mới chỉ hơn khoảng 2 điểm. Với 18 thuốc và mỗi bản chạy 1 lần, mức chênh này nằm trong biên dao động ngẫu nhiên. Vì vậy chưa thể khẳng định bản mới đọc chữ Khó tốt hơn.
- **Cải thiện rõ nhất nằm ở trường Cách dùng & giờ uống:** Khó tăng từ 38,9% lên 61,1%, Trung bình từ 53,3% lên 86,7%, Dễ từ 66,7% lên 100%. Tỷ lệ đơn đúng trọn vẹn cũng tăng: Dễ từ 40% lên 100%, Trung bình từ 0% lên 40%. Nguyên nhân là bảng tốc ký (`s-c`, `u.s.a`, `u.t.n`...) và yêu cầu ghi đủ chi tiết cách dùng.
- **Tên thuốc ở cấp Khó giảm từ 77,8% xuống 66,7%.** Thất thoát gần như dồn hết vào ảnh `rx_00071`: ở lượt này model đọc sai cả 4 thuốc và bịa ra Januvia, Jorveza. Bản cũ cũng bịa tên ở ảnh này ("Jorlatan").
- Model trả lời không cố định. Chuỗi fallback Gemini tự đổi model khi gặp lỗi 503. Ở cấp Khó, cả hai bản đều do `gemini-flash-lite-latest` trả lời nên so sánh được với nhau. Model của từng ảnh được ghi trong trường `_model` của file kết quả.

## 2. Bộ dữ liệu kiểm thử (`backend/test_prescriptions/`)

Có 15 ảnh, mỗi cấp độ 5 ảnh. Đáp án nằm trong `ground_truth.json`. Bộ dữ liệu được dựng lại bằng `build_dataset.js`.

| Nguồn | Số ảnh | Đáp án |
|---|---|---|
| HF `chinmays18/medical-prescription-dataset` (split test) | 9 | Lấy nguyên từ annotation của dataset |
| Đơn ĐTĐ tiếng Việt tự tạo, render bằng font viết tay | 6 | Tự soạn (vì tự tạo nên chắc chắn đúng) |

- **Dễ:** ảnh gốc sạch, mỗi đơn 1–2 thuốc.
- **Trung bình:** ảnh nghiêng 2,5°, nhoè nhẹ, mỗi đơn 3 thuốc. Các đơn tiếng Việt có tốc ký như `1v x 2l/ng`, `s-c`, `u.s.a`, `TDD 14 đv`.
- **Khó:** ảnh nghiêng −4°, nhoè mạnh, mực bị làm mờ 35%, có nhiễu, độ phân giải còn 60% và nén JPEG ở chất lượng 40. Các đơn HF có 4 thuốc. Có thêm bẫy `18U`, dễ bị đọc nhầm thành 180, và bẫy `0.5mg`, dễ bị đọc nhầm thành 5mg.

**Cách chấm** (`evaluate_benchmark.js`, tự kiểm tra bằng `--selftest`):
- **Tên thuốc:** khớp tên gốc hoặc biệt dược trong đáp án.
- **Liều:** số và đơn vị phải bằng nhau tuyệt đối. Các cách viết `đv`, `U`, `UI` đều quy về IU.
- **Cách dùng:** quy về các nhãn chuẩn (sau ăn, trước ăn, trước ngủ, mỗi 8 hoặc 12 giờ, x lần/ngày, khi cần, tiêm...) bằng cả tiếng Anh và tiếng Việt. Nếu đáp án có giờ uống thì số cữ phải bằng nhau và mỗi cữ lệch không quá 2 giờ.
- **Field Accuracy:** số trường đúng chia cho (3 × số thuốc).
- **Total Prescription Success:** mọi thuốc đúng cả 3 trường và không thừa thuốc nào.

## 3. Những gì đã thay đổi (`backend/src/modules/scan/scan.service.js`)

1. **Prompt (`getPrompt`)**, thêm 7 mục:
   - bố cục đơn thuốc;
   - bảng tốc ký y khoa Việt Nam (`v`, `g`, `đv`, `l/ng`, `s/tr/c/t`, `u.s.a`, `u.t.a`, `u.t.n`, `TDD`...);
   - quy tắc phân biệt ký tự dễ nhầm (`1/l/I`, `0/O`, `5/S`, `7/1`, dấu thập phân, `U` sau số trông như `0`);
   - quy tắc chọn tên thuốc thật gần nhất với nét chữ;
   - danh mục biệt dược ĐTĐ phổ biến ở Việt Nam;
   - 4 ví dụ giải mã mẫu;
   - yêu cầu giữ đủ chi tiết cách dùng.

   Các ví dụ mẫu cố ý dùng thuốc không có trong bộ test (Trajenta, Galvus Met, Levemir, Naproxen) để tránh làm lộ đáp án.
2. **So khớp mờ (`fuzzyMatchDrug`, `findMedicationInDatabase`):**
   - Thay `.includes()` bằng độ tương đồng Levenshtein ≥ 70%, so theo từng từ.
   - Từ điển ưu tiên theo thứ tự: DB nội bộ, rồi danh sách biệt dược và hoạt chất ĐTĐ, rồi khoảng 60 hoạt chất phổ thông. Nhóm phổ thông đóng vai trò "mỏ neo" để thuốc khác không bị kéo nhầm về thuốc ĐTĐ (ví dụ Rosuvastatin không bị kéo thành Atorvastatin).
   - Không tự sửa tên khi hai thuốc khác nhau có điểm sát nhau (chênh dưới 0,1), ví dụ Glipizide và Gliclazide.
   - Tên bị đọc méo được chuẩn hoá: `Glimpirid` thành `Glimepiride`, `Glicazid` thành `Gliclazide`. Tên gốc AI đọc được giữ ở trường `nameAsRead`.
3. **An toàn insulin (`checkInsulinDose`):** cảnh báo khi:
   - liều insulin ghi bằng mg;
   - liều lớn hơn 50 IU/lần (dấu hiệu `10U` bị đọc thành `100`);
   - AI ghi nồng độ `100 IU/ml` thay cho liều.

   Trong benchmark, cảnh báo này đã bắt đúng ca Lantus ở `vn_05`.
4. Test không cần gọi AI nằm ở `src/modules/scan/scanFuzzy.test.js` và đã được thêm vào `npm test`. Toàn bộ test đều pass.

## 4. Lỗi đọc sai phổ biến còn lại

| Lỗi | Ví dụ | Đã xử lý | Còn lại |
|---|---|---|---|
| Không viết rõ giờ uống, AI tự gán giờ lệch | `s-c` thành 07:00 và 19:00 | Bảng tốc ký, ví dụ mẫu | Đã hết lỗi này trong bộ test |
| Bỏ sót chi tiết cách dùng | "Uống 1 viên mỗi ngày" mà mất chữ "sáng", "trước ăn" | Mục 7 của prompt | Còn 1 ca ở rx_00127 ("mỗi 72 giờ" thay vì "mỗi 12 giờ") |
| Nhầm số trong liều | 50mg thành 500mg, 25mg thành 20mg, 10mg thành 70mg | Quy tắc ký tự, kiểm tra liều so với DB | **Đây là lỗi lớn nhất ở cấp Trung bình và Khó**, chưa giải quyết được |
| Ghi nồng độ thay cho liều insulin | Lantus "100 IU/ml" | Prompt và cảnh báo ở backend | AI vẫn ghi sai, nhưng người dùng giờ được cảnh báo |
| Bịa tên thuốc khi ảnh quá mờ | rx_00071: Januvia, Jorveza | Prompt cấm bịa tên | **Chưa giải quyết.** Danh mục biệt dược ĐTĐ trong prompt có thể khiến model nghiêng về đoán thuốc ĐTĐ |
| Bỏ sót dòng thuốc trong ảnh mờ | Gabapentin, Amoxicillin ở cấp Khó | — | Chưa giải quyết |

## 5. Giới hạn (đọc trước khi trình bày con số)

- **Ảnh tổng hợp, không phải đơn thật.** Ảnh HF dùng một font chữ viết tay tiếng Anh duy nhất. Đơn tiếng Việt do script render từ font. Cấp Khó được tạo bằng cách làm suy giảm ảnh, không phải chữ "giun dế" thật của bác sĩ. Con số 59,3% vì vậy **chưa chứng minh** độ chính xác trên đơn thật. Bước tiếp theo nên là thu thập 20–30 ảnh đơn thật (đã che thông tin bệnh nhân) và dùng lại nguyên `evaluate_benchmark.js`.
- **Mẫu nhỏ, mỗi bản chạy 1 lần:** 15 đơn, 42 thuốc. Dao động giữa các lượt chạy có thể lên vài điểm phần trăm.
- **Một phần danh mục biệt dược trong prompt trùng với thuốc trong bộ test** (Diamicron, Amaryl, Lantus...). Đây là kiến thức chuyên ngành mà Bước 2 yêu cầu, nhưng nó có lợi cho bộ test.
- `medications-db.json` hiện chỉ có **15 thuốc**, không phải hơn 100 như mô tả. Các thuốc ĐTĐ khác chỉ được nhận diện tên qua danh sách `DIABETES_KEYWORDS`, chưa có thông tin lâm sàng. Bổ sung DB cần dược sĩ kiểm duyệt nội dung.
- Mốc an toàn insulin 50 IU/lần là ngưỡng thô (`ponytail:` trong code).
- Fallback Claude trong `analyzePrescription` đang dùng model `claude-3-5-sonnet-latest` đã ngừng hoạt động. Phần này nằm ngoài phạm vi và chưa sửa.
