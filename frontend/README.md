# FaceID frontend

Giao diện HTML/CSS/JavaScript độc lập, không cần Node hay npm.
Chạy từ thư mục dự án: `python -m backend.server`, rồi mở
http://127.0.0.1:8000. Dữ liệu đọc từ SQLite qua API, không có dữ liệu mẫu giả.

Các file frontend không import code Python. Có thể chuyển folder này sang repo
riêng; khi đó cần phục vụ frontend và proxy `/api` đến backend cùng origin.
Hiện mới tách folder, chưa tạo repo Git riêng.

API: `GET /api/events?student_id=...&room_id=...&limit=1000` trả `{events: [...]}`.
`POST /api/events` nhận JSON `{student_id, room_id, direction, event_key}`,
trả `{event: ...}`. Hướng là `in` hoặc `out`. Form ghi sự kiện có nguồn `manual`.
Giới hạn danh sách 1.000 dòng; thống kê và CSV tính trên các dòng đang hiển thị.
