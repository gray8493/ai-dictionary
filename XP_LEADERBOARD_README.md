# Hệ thống XP và Bảng Xếp Hạng

## Tổng quan

Hệ thống XP và cấp bậc tạo động lực cạnh tranh cho người dùng học tiếng Anh, với bảng xếp hạng theo tuần và tổng thể.

## Các tính năng

### 1. **Hệ thống XP và Cấp bậc**
- **XP**: Điểm kinh nghiệm tích lũy từ việc học
- **Cấp bậc**: Tự động tính từ XP (Level = floor(sqrt(XP / 100)) + 1)
- **Hiển thị**: Level và XP hiển thị trên header khi đăng nhập

### 2. **Bảng Xếp Hạng**
- **Tuần này**: Xếp hạng theo XP và từ vựng thuộc trong tuần
- **Tất cả thời gian**: Xếp hạng theo tổng XP và từ đã thuộc
- **Top 3**: Hiển thị huy chương 🥇🥈🥉

## Cách nhận XP

- **Thuộc từ vựng**: 10 XP mỗi từ đánh dấu "Đã thuộc"
- **Hoàn thành bài tập**: Có thể mở rộng để thưởng XP (chưa triển khai)

## Cấu trúc Database

### Bảng `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  total_vocabularies INTEGER DEFAULT 0,
  mastered_vocabularies INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  weekly_mastered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Hàm tính cấp
```sql
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(SQRT(xp_amount::FLOAT / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

## API Endpoints

### 1. **User Profile API** (`/api/user-profile`)
- `GET`: Lấy thông tin profile người dùng (XP, level, etc.)
- `POST`: Cập nhật XP hoặc thống kê
  ```json
  {
    "action": "add_xp",
    "xp": 10
  }
  ```

### 2. **Leaderboard API** (`/api/leaderboard`)
- `GET`: Lấy bảng xếp hạng
- Query params: `type=weekly|all_time`, `limit=50`

## Triển khai

1. **Chạy migration**: `migration_add_user_profiles.sql`
2. **Kiểm tra**: Hệ thống tự động tạo profile khi user đăng ký
3. **Tích hợp**: XP tự động cập nhật khi đánh dấu từ "Đã thuộc"

## Lộ trình phát triển

### Tính năng bổ sung có thể
- XP từ bài tập thực hành
- Achievement/badges
- Reset weekly stats tự động
- Thông báo level up
- Chi tiết XP (breakdown theo hoạt động)

### Tối ưu
- Cache leaderboard cho performance
- WebSocket cho real-time updates
- Push notifications cho top rankings