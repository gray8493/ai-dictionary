# Hướng Dẫn Sửa Lỗi 500 API và Chạy XP System

## 🔧 **Sửa Lỗi 500: GET /api/user-profile**

**Nguyên nhân:** Database table `user_profiles` chưa được tạo.

### **Bước 1: Chạy Migration SQL**

1. Mở Supabase Dashboard → SQL Editor
2. Copy toàn bộ nội dung file `migration_add_user_profiles.sql`
3. Paste vào SQL Editor và chạy

```sql
-- Nội dung migration từ file migration_add_user_profiles.sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  total_vocabularies INTEGER DEFAULT 0 CHECK (total_vocabularies >= 0),
  mastered_vocabularies INTEGER DEFAULT 0 CHECK (mastered_vocabularies >= 0),
  weekly_xp INTEGER DEFAULT 0 CHECK (weekly_xp >= 0),
  weekly_mastered INTEGER DEFAULT 0 CHECK (weekly_mastered >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate level from XP (based on rank thresholds)
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level calculation based on XP thresholds:
  -- 0-500 XP: Level 1 (Newbie)
  -- 501-1500 XP: Level 2 (Learner)
  -- 1501-5000 XP: Level 3 (Scholar)
  -- 5000+ XP: Level 4 (Master)
  IF xp_amount <= 500 THEN
    RETURN 1;
  ELSIF xp_amount <= 1500 THEN
    RETURN 2;
  ELSIF xp_amount <= 5000 THEN
    RETURN 3;
  ELSE
    RETURN 4;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update level when XP changes
DROP TRIGGER IF EXISTS on_xp_change ON user_profiles;
CREATE TRIGGER on_xp_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION calculate_level_from_xp(NEW.xp);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to reset weekly stats (run this on Monday)
CREATE OR REPLACE FUNCTION reset_weekly_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET weekly_xp = 0, weekly_mastered = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Bước 2: Kiểm tra API**

Sau khi chạy migration, API sẽ hoạt động bình thường. Nếu vẫn lỗi, kiểm tra:

1. **Environment Variables:** Đảm bảo `SUPABASE_SERVICE_ROLE_KEY` được set
2. **Permissions:** User phải đăng nhập và có JWT token hợp lệ
3. **Network:** Kiểm tra console browser có lỗi network không

## 🎮 **XP System Hoạt Động**

### **Quy Tắc XP:**
- **Thuộc từ vựng:** +10 XP/word
- **Trích xuất từ file:** +5 XP/word
- **Bài tập đúng:** +10 XP × độ khó (1x, 1.5x, 2x)

### **Cấp Bậc:**
- **0-500 XP:** Newbie
- **501-1500 XP:** Learner
- **1501-5000 XP:** Scholar
- **5000+ XP:** Master

### **Giao Diện:**

#### **Navbar (Gọn gàng):**
- Hiển thị Level và thanh XP progress
- Avatar link đến Profile page
- Menu compact ở giữa

#### **Profile Page:**
- Card thống kê chi tiết
- Thanh XP lớn với progress
- Achievement system

#### **Leaderboard:**
- Xếp hạng tuần/all-time
- Top 3 với huy chương
- Thông tin XP và từ đã thuộc

## 🚀 **Cách Test XP System**

1. **Đăng nhập** vào app
2. **Thuộc từ vựng** trong My Vocabulary
3. **Xem XP tăng** trên header và profile
4. **Check level up** khi đạt mốc XP
5. **Xem leaderboard** để cạnh tranh

## 🛠 **API Endpoints**

- `GET /api/user-profile` - Lấy profile + XP
- `POST /api/user-profile` - Cập nhật XP
- `GET /api/leaderboard` - Bảng xếp hạng

## 📝 **Prompt AI (nếu cần)**

File `AI_PROMPT_XP_SYSTEM.txt` chứa prompt để AI hiểu cách tính XP.

---

**Sau khi chạy migration, lỗi 500 sẽ biến mất và XP system sẽ hoạt động đầy đủ! 🎯**