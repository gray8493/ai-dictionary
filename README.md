# Ứng Dụng Học Tiếng Anh

Ứng dụng web học tiếng Anh sử dụng trí tuệ nhân tạo (AI) để hỗ trợ người dùng học từ vựng, ngữ pháp và kỹ năng ngôn ngữ. Dự án được xây dựng bằng Next.js và sử dụng Supabase làm cơ sở dữ liệu.

## Tính Năng Chính

- **Tra cứu từ vựng**: Tìm kiếm định nghĩa, phát âm và ví dụ sử dụng của từ.
- **Luyện tập**: Các bài tập đa dạng bao gồm:
  - Bài quiz AI
  - Điền khuyết
  - Quiz nghĩa từ
  - Luyện phát âm
- **Từ vựng cá nhân**: Lưu trữ và quản lý danh sách từ vựng của riêng bạn.
- **Bảng xếp hạng**: Theo dõi tiến độ học tập và cạnh tranh với người khác.
- **Trích xuất từ vựng từ file**: Sử dụng AI để trích xuất từ vựng từ tài liệu PDF hoặc văn bản.
- **Quản lý hồ sơ**: Cập nhật thông tin cá nhân và nâng cấp tài khoản Pro.

## Công Nghệ Sử Dụng

- **Next.js**: Framework React cho web app.
- **TypeScript**: Ngôn ngữ lập trình với kiểu dữ liệu tĩnh.
- **Supabase**: Cơ sở dữ liệu và backend as a service.
- **Tailwind CSS**: Framework CSS cho styling.
- **AI Integration**: Sử dụng Google Gemini AI cho các tính năng thông minh.

## Cài Đặt và Chạy

### Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn

### Bước 1: Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env.local` trong thư mục gốc và thêm các biến môi trường cần thiết:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Bước 3: Chạy ứng dụng
```bash
npm run dev
# hoặc
yarn dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt để xem ứng dụng.

## Triển Khai

Ứng dụng được triển khai trên Vercel. Để triển khai:

1. Đẩy code lên GitHub repository.
2. Kết nối repository với Vercel.
3. Thêm các biến môi trường trong Vercel dashboard.
4. Triển khai tự động.

## Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork dự án
2. Tạo branch mới cho tính năng của bạn
3. Commit các thay đổi
4. Push lên branch
5. Tạo Pull Request

## Giấy Phép

Dự án này sử dụng giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## Liên Hệ

Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ qua email hoặc tạo issue trên GitHub.
