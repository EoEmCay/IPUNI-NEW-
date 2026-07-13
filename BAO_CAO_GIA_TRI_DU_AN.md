# Báo Cáo Giá Trị Dự Án DIA+ (IPUNI)

## 1. Mở Đầu
Dự án **DIA+ (IPUNI)** là một Progressive Web App (PWA) hỗ trợ bệnh nhân đái tháo đường (tiểu đường) tự quản lý sức khỏe một cách thông minh, hiện đại và chính xác. Dự án này đánh trực tiếp vào một trong những "nỗi đau" y tế lớn nhất của xã hội hiện đại tại Việt Nam.

## 2. Các Nỗi Đau Của Xã Hội & Số Liệu Chứng Minh (2024 - 2026)

Theo các báo cáo y tế và thống kê trong giai đoạn 2024 - 2026, đái tháo đường đang trở thành một "đại dịch" không lây nhiễm tại Việt Nam với những con số đáng báo động:

### 2.1. Số lượng người mắc bùng nổ và tình trạng "trẻ hóa"
- **Số liệu:** Có khoảng gần **8 triệu người Việt Nam** đang sống chung với bệnh đái tháo đường, là nguyên nhân gây tử vong đứng hàng thứ 3.
- **Nỗi đau:** Bệnh đang có xu hướng **trẻ hóa** mạnh mẽ (đặc biệt ở dân văn phòng do lối sống tĩnh tại).

### 2.2. Hơn 60% người bệnh chưa được chẩn đoán
- **Số liệu:** Có tới **hơn 62,6%** người mắc bệnh nhưng chưa được chẩn đoán (Bệnh viện Nội tiết Trung ương). Khoảng **17,8%** dân số ở giai đoạn tiền đái tháo đường.
- **Nỗi đau:** Sự thiếu hiểu biết và khó khăn trong việc tự theo dõi dẫn đến việc phát hiện bệnh quá trễ.

### 2.3. Tỷ lệ biến chứng cao do tuân thủ điều trị kém
- **Số liệu:** Khoảng **54%** người bệnh gặp phải các biến chứng nặng (tim mạch, suy thận, đoạn chi, mù lòa).
- **Nỗi đau:** Đơn thuốc phức tạp, khó đọc, bệnh nhân dễ quên uống thuốc hoặc uống sai liều, không kiểm soát được đường huyết ổn định.

### 2.4. Gánh nặng kinh tế
- **Số liệu:** Tổng chi phí y tế trực tiếp cho đái tháo đường tại Việt Nam ước tính lên tới hơn **435 triệu USD** mỗi năm.
- **Nỗi đau:** Bệnh nhân phải gánh chịu chi phí khổng lồ để điều trị các biến chứng thay vì phòng ngừa từ sớm.

## 3. Cách DIA+ Giải Quyết Các Nỗi Đau Này

Dự án DIA+ thiết kế các tính năng chuyên biệt để "khớp" và giải quyết trực tiếp từng nỗi đau trên:

### 3.1. Hệ thống Nhập liệu & Cảnh báo màu sắc (Giải quyết sự phức tạp)
- **Vấn đề:** Người bệnh bối rối không biết chỉ số đường huyết bao nhiêu là an toàn tại các thời điểm khác nhau.
- **Giải pháp:** Hệ thống tự động đối chiếu chỉ số nhập vào và hiển thị màu sắc cảnh báo: Xanh (Bình thường), Vàng (Cảnh báo), Đỏ (Nguy hiểm hoặc Hạ đường huyết). Kết hợp với biểu đồ xu hướng (Recharts) giúp trực quan hóa tình trạng bệnh.

### 3.2. AI Quét Đơn Thuốc & Nhắc nhở (Giải quyết tỷ lệ biến chứng 54%)
- **Vấn đề:** Đọc sai toa thuốc hoặc quên uống thuốc.
- **Giải pháp:** Bệnh nhân chụp ảnh đơn thuốc, AI (Gemini/Anthropic) tự động đọc và bóc tách thông tin (tên thuốc, liều lượng, giờ uống). Tính năng "Thuốc hôm nay" trên Dashboard giúp đánh dấu "Đã uống", ngăn chặn tình trạng quên hoặc uống đúp.

### 3.3. Chế độ Cute Mode & PWA (Giải quyết áp lực tâm lý và Trẻ hóa bệnh nhân)
- **Vấn đề:** Giao diện y tế khô khan gây stress; bệnh nhân trẻ tuổi cần trải nghiệm hiện đại.
- **Giải pháp:** Giao diện Cute Mode với màu tím Lavender, font chữ Quicksand, các widget hoạt hình (mèo phi hành gia) giúp việc theo dõi sức khỏe trở nên nhẹ nhàng như chăm sóc thú cưng ảo, giảm bớt áp lực tâm lý.

### 3.4. Kho Lời Khuyên Sức Khỏe (Giải quyết tình trạng thiếu kiến thức)
- **Vấn đề:** 62,6% người bệnh chưa chẩn đoán và thiếu kiến thức xử lý.
- **Giải pháp:** Cung cấp các bài viết y khoa thiết thực về Dinh dưỡng, Luyện tập và Xử lý khẩn cấp (như cách sơ cứu khi tụt đường huyết), giúp người dùng (kể cả tiền tiểu đường) tự phòng vệ.

### 3.5. Quản lý Lịch Hẹn & Gói Pro Plan (Giải quyết gánh nặng kinh tế)
- **Vấn đề:** Bỏ lỡ lịch khám và gánh nặng chi phí chữa biến chứng.
- **Giải pháp:** Quản lý lịch khám và lưu lại ghi chú của bác sĩ. Gói Pro Plan (49.000đ/tháng) cung cấp giải pháp theo dõi sức khỏe thông minh và tiết kiệm, giúp phòng ngừa các biến chứng đắt đỏ.

---
**Tổng kết:** DIA+ không chỉ là một ứng dụng ghi chép đơn thuần, mà là một giải pháp y tế số toàn diện, kết hợp công nghệ AI và thiết kế tâm lý học để bảo vệ người bệnh khỏi những rủi ro và biến chứng nguy hiểm của bệnh đái tháo đường.
