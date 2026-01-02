import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import mammoth from 'mammoth';

export const runtime = 'nodejs'; // Bắt buộc để sử dụng thư viện đọc file
export const dynamic = 'force-dynamic';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    const formData = await req.formData();
    console.log('FormData keys:', Array.from(formData.keys()));
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error("No file provided");
    }
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    let content: string;

    if (file.type === 'text/plain') {
      content = await file.text();
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    const prompt = `
      Dưới đây là nội dung của một tài liệu văn bản. Hãy trích xuất các từ vựng tiếng Anh quan trọng:
      1. Loại bỏ các từ quá cơ bản (ví dụ: the, is, a, I, you, what...).
      2. Phân loại từ vựng vào 3 nhóm độ khó: "Easy", "Medium", "Hard".
      3. Với mỗi từ, cung cấp phiên âm IPA và định nghĩa tiếng Việt ngắn gọn.

      TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON NHƯ SAU:
      {
        "Easy": [{"word": "...", "ipa": "...", "definition": "...", "type": "noun/verb/adjective/adverb"}],
        "Medium": [...],
        "Hard": [...]
      }

      Nội dung tài liệu:
      ${content.substring(0, 15000)}
    `;

    const result = await model.generateContent(prompt);

    const text = result.response.text();
    console.log("AI response text:", text);
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI không trả về JSON hợp lệ" }, { status: 500 });
    }
    const jsonString = jsonMatch[0];
    try {
      return NextResponse.json(JSON.parse(jsonString));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({ error: "AI không trả về JSON hợp lệ" }, { status: 500 });
    }
  } catch (error) {
    console.error("Extract vocab error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi phân tích AI" }, { status: 500 });
  }
}