Status: ready-for-agent

# Specification: Live Care Timeline & Family Caregiver Insights

## Problem Statement

Hiện nay, bệnh nhân đái tháo đường lớn tuổi (các cụ) thường gặp khó khăn khi phải trực tiếp thao tác trên ứng dụng di động (thị lực kém, ngại công nghệ, quên mở app). Trong khi đó, người trả tiền và lo lắng nhất là con cháu (thường ở xa hoặc bận rộn) lại không có cách nào biết được cha mẹ mình hôm nay đã uống thuốc chưa, đường huyết đo lúc nào và có ổn định không, ngoại trừ việc phải liên tục gọi điện thoại hỏi thăm (khiến các cụ cảm thấy bị phiền và mất tự chủ). Người chăm sóc / hộ lý trực tiếp cũng thiếu một công cụ nhật ký trực quan để ghi nhận và bàn giao công việc minh bạch cho gia đình.

## Solution

Chuyển đổi trọng tâm của DIA+ sang mô hình chăm sóc gia đình toàn diện ("Cụ tự lo được – Con yên tâm – Người chăm làm đúng"):
1. **Dòng thời gian trực tiếp (Live Care Timeline kiểu Grab):** Màn hình dành cho con cháu và người chăm sóc hiển thị tiến trình trong ngày theo thứ tự thời gian từ trên xuống dưới (Đến giờ cữ -> Đã uống thuốc lúc mấy giờ -> Đã đo đường huyết -> Chỉ số an toàn/cảnh báo), tạo cảm giác an tâm tức thì.
2. **Ba luồng trải nghiệm (3 ngã rẽ):**
   - *Ngã rẽ 1 (Cụ tự chủ):* Cụ chỉ nhận cuộc gọi/chuông báo âm thanh, xác nhận đơn giản; hệ thống tự đồng bộ lên timeline.
   - *Ngã rẽ 2 (Cụ có người chăm/hộ lý):* Người chăm thao tác checklist nhanh trong ngày, ghi chú bàn giao ca, chứng minh trách nhiệm với gia đình.
   - *Ngã rẽ 3 (Con theo dõi âm thầm):* Con chỉ mở app xem timeline 1-2 lần/ngày và nhận thông báo khẩn khi bỏ thuốc hoặc chỉ số chạm ngưỡng nguy hiểm (< 3.9 hoặc > 13.9 mmol/L).
3. **AI vòng chăm sóc & Bản tin tuần:** Phân tích thói quen bỏ thuốc lặp lại (Pattern mining) và tổng hợp bản tin tuần mộc mạc gửi người thân.
4. **Báo cáo 1 trang cho Bác sĩ (Doctor's Brief):** Chuẩn bị sẵn phiếu tóm tắt in A4/xem nhanh trên di động cho kỳ tái khám.

## User Stories

1. As a child living far away, I want to see a live timeline of my parent's medication and glucose events today, so that I immediately know they are safe without having to call and bother them.
2. As a child, I want the timeline to clearly distinguish between past events (completed), current/upcoming events (in progress/waiting), and missed events (alert), so that I have complete situational awareness like tracking a delivery.
3. As a caregiver/hộ lý, I want a 1-tap confirmation button on the live timeline to mark a medication dose as given, so that the family instantly sees proof of care.
4. As a caregiver/hộ lý, I want to record blood glucose measurements and optional shift handover notes directly into the timeline, so that care history is transparent.
5. As an elderly parent who is self-sufficient, I want to use a minimal voice or simple 1-touch confirmation, so that I don't have to navigate complex menus.
6. As a family member, I want to receive a weekly summary text written in natural, friendly Vietnamese, so that I understand my parent's weekly progress in 15 seconds.
7. As a family member, I want the system to alert me if my parent repeatedly misses the same dose (e.g. Saturday evening dose 3 weeks in a row), so that I can remind them at the right time.
8. As a doctor during an appointment, I want to view a concise 1-page summary showing adherence rates, recurrent miss patterns, and glucose distribution, so that I can adjust the prescription in under 60 seconds without operating an app.

## Implementation Decisions

### 1. Backend Architecture
- **Module `insights` & `care`:**
  - Leverage existing pure logic in `backend/src/modules/insights/insights.logic.js` (`adherence`, `findMissPatterns`, `glucoseStats`, `buildWeeklyText`).
  - Create `care.controller.js` and `care.routes.js` (or integrate into `insights.routes.js`):
    - `GET /api/v1/care/timeline?date=YYYY-MM-DD`: Returns chronologically ordered items for the target date combining scheduled medication doses, intake logs, glucose logs, and caregiver notes.
    - `POST /api/v1/care/log-dose`: Allows caregiver/patient to confirm dose intake with timestamp and optional photo/note.
    - `GET /api/v1/insights/weekly-summary`: Returns weekly digest metrics and human-readable text.
    - `GET /api/v1/insights/doctor-report`: Aggregates 30-day data formatted for 1-page presentation.

### 2. Frontend Architecture
- **Component `CareTimeline` (Grab-like Live Timeline):**
  - Integrated into the Home/Family experience.
  - Visual status line with nodes (Completed [Green], Current/Pending [Orange/Teal], Missed [Red]).
  - Supports role switching: Family viewer vs Caregiver operator (showing quick-action buttons).
- **Page/Modal `DoctorReportPage`:**
  - Clean A4 layout with print styles (`@media print`), displaying key stats, chart, adherence, and warnings for doctor consultations.

## Testing Decisions

- Test pure logic (`insights.logic.js`) with unit tests covering edge cases (leap year, miss patterns across weeks, glucose boundary values < 3.9 and > 13.9).
- Test API endpoints using Supertest/HTTP tests with demo user credentials.
- Verify frontend timeline rendering with empty data, partial day data, and multi-dose days.

## Out of Scope

- Direct carrier automated voice calling integration (deferred to pilot phase with Twilio/Stringee).
- B2B clinic contract management system.
- Replacing official VNeID electronic health books.

## Further Notes

- Maintains complete backward compatibility with existing medication schedules, scanner logic, and Telegram bot notifications.
