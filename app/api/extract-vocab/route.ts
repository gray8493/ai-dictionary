import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { hasAIAccess, consumeAICredit } from "@/lib/checkPro";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json(); // Nhận text từ client

    if (!content) {
      return NextResponse.json({ error: "Không tìm thấy nội dung văn bản" }, { status: 400 });
    }

    // Check Pro access or AI credits
    const hasAccess = await hasAIAccess(user);
    if (!hasAccess) {
      return NextResponse.json({
        error: 'Yêu cầu gói Pro để sử dụng tính năng AI trích xuất từ vựng. Hoặc dùng thử còn 3 lần miễn phí.'
      }, { status: 403 });
    }

    // Consume credit if not Pro
    const consumed = await consumeAICredit(user);
    if (!consumed) {
      const recheckAccess = await hasAIAccess(user);
      if (!recheckAccess) {
        return NextResponse.json({
          error: 'Không thể sử dụng tính năng AI. Vui lòng nâng cấp gói Pro.'
        }, { status: 403 });
      }
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