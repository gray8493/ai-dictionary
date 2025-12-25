import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
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

    let result;
    if (file.type === 'text/plain') {
      // For txt files, read as text
      const content = await file.text();
      const prompt = `
        Dưới đây là nội dung của một tài liệu văn bản. Hãy trích xuất các từ vựng tiếng Anh quan trọng:
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
      result = await model.generateContent(prompt);
    } else {
      // For images or other, use inlineData
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type;
      const prompt = `
        Phân tích tài liệu hoặc hình ảnh này và trích xuất các từ vựng tiếng Anh hữu ích.
        1. Bỏ qua các từ quá cơ bản (như: a, an, the, hello, go, eat...).
        2. Nhóm các từ thành 3 mức độ khó: "Easy", "Medium", "Hard".
        3. Với mỗi từ, cung cấp phiên âm (IPA) và định nghĩa ngắn gọn bằng tiếng Việt.
        Trả về CHỈ định dạng JSON, không có văn bản thêm, không có markdown:
        {
          "Easy": [{"word": "...", "ipa": "...", "definition": "..."}],
          "Medium": [...],
          "Hard": [...]
        }
      `;
      result = await model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType } },
      ]);
    }

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