export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Lỗi xác thực
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Có lỗi xảy ra trong quá trình đăng nhập Google. Vui lòng thử lại.
        </p>
        <div className="space-y-3">
          <a
            href="/auth"
            className="block w-full bg-primary text-white py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Thử lại đăng nhập
          </a>
          <a
            href="/"
            className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}