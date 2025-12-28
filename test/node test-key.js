// Chạy lệnh: node test-key.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("" + process.env.GEMINI_API_KEY + "");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Kết quả test:", result.response.text());
  } catch (e) {
    console.error("Lỗi Key:", e.message);
  }
}
test();