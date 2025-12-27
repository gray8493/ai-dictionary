# Hướng dẫn Cải tiến Hệ thống Từ vựng

## Tổng quan các cải tiến

1. **Trạng thái từ vựng**: Thêm cột `status` để theo dõi tiến độ học (learning, mastered, review)
2. **Tránh trùng lặp**: Sử dụng upsert để không lưu từ trùng lặp
3. **Phân trang**: Tối ưu hiệu suất với phân trang 20 từ/trang
4. **Lọc từ vựng**: Lọc theo trạng thái từ giao diện

## Bước triển khai

### 1. Chạy Migration Database

Chạy file SQL `migration_add_status.sql` trong Supabase SQL Editor hoặc CLI:

```sql
-- Thêm cột status
ALTER TABLE vocabularies
ADD COLUMN status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'mastered', 'review'));

-- Tạo ràng buộc unique để tránh trùng lặp
ALTER TABLE vocabularies
ADD CONSTRAINT unique_user_word UNIQUE (user_id, word);

-- Cập nhật dữ liệu cũ
UPDATE vocabularies SET status = 'learning' WHERE status IS NULL;
```

### 2. Kiểm tra API

Các API endpoint mới:
- `GET /api/my-vocabulary?status=all&page=1&limit=20` - Lấy từ vựng với filter và phân trang
- `PATCH /api/my-vocabulary` - Cập nhật trạng thái từ vựng

### 3. Chạy ứng dụng

```bash
npm run dev
```

## Tính năng mới

### Trên trang My Vocabulary:
- **Lọc theo trạng thái**: Dropdown để lọc từ đang học, đã thuộc, cần ôn tập
- **Tìm kiếm**: Tìm từ trong danh sách (client-side)
- **Phân trang**: Điều hướng giữa các trang
- **Cập nhật trạng thái**: Dropdown trực tiếp trong bảng để thay đổi trạng thái từ