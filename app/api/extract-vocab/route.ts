import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { content } = await req.json(); // Nhận text từ client

    if (!content) {
      return NextResponse.json({ error: "Không tìm thấy nội dung văn bản" }, { status: 400 });
    }

    // BẮT BUỘC dùng gemini-flash-lite-latest cho tài liệu văn bản dài
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    const prompt = `
      Dưới đây là nội dung của một tài liệu. Hãy trích xuất các từ vựng tiếng Anh quan trọng:
      1. Loại bỏ các từ quá cơ bản (ví dụ: the, is, a, I, you, what...).
      2. Phân loại từ vựng vào 3 nhóm độ khó: "Easy", "Medium", "Hard".
      3. Với mỗi từ, cung cấp phiên âm IPA và định nghĩa tiếng Việt ngắn gọn.
      
      TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON NHƯ SAU:
      {
        "Easy": [{"word": "...", "ipa": "...", "definition": "..."}],
        "Medium": [...],
        "Hard": [...]
      }

      Nội dung tài liệu:
      ${content.substring(0, 15000)} 
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("Extract vocab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}