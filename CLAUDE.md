# CLAUDE.md — Hướng dẫn dự án IPUNI

## Tổng quan
IPUNI là PWA y tế dành cho bệnh nhân tiểu đường.
Giao diện tiếng Việt, mobile-first (max-width: 430px).

## Cài đặt và chạy

### Backend
```
cd backend && npm install
npm run migrate
npm run seed
npm run dev    # Port 3001
```

### Frontend
```
cd frontend && npm install
npm run dev    # Port 5173
```

## Tài khoản mẫu
- Email: khoi@example.com
- Mật khẩu: 123456

## Quy tắc code

### CSS
- Luôn dùng CSS Modules (*.module.css) per component
- CSS variables định nghĩa trong src/styles/global.css
- KHÔNG dùng inline styles, KHÔNG dùng Tailwind
- Mobile-first: max-width container = 430px

### API Base URL
http://localhost:3001/api/v1

### Ngưỡng đường huyết (mmol/L)
- Đường huyết lúc đói: Bình thường <7, Nguy hiểm >10
- Đường huyết sau ăn 2h: Bình thường <7.8, Nguy hiểm >11.1
- Hạ đường huyết nguy hiểm: <3.9 mmol/L

## Màu sắc chính
- Primary: #1B5FA6
- Success: #22C55E
- Danger: #EF4444
- Warning: #F59E0B
