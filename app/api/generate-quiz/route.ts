import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionCount, difficulty, vocabularyList } = body;

    if (!questionCount || !difficulty || !vocabularyList) {
      return NextResponse.json({
        error: 'Missing required parameters: questionCount, difficulty, vocabularyList'
      }, { status: 400 });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
      return NextResponse.json({
        error: 'Invalid difficulty. Must be: easy, medium, or hard'
      }, { status: 400 });
    }

    if (!Array.isArray(vocabularyList) || vocabularyList.length === 0) {
      return NextResponse.json({
        error: 'Vocabulary list must be a non-empty array'
      }, { status: 400 });
    }

    // Calculate XP per correct answer based on difficulty
    const xpPerCorrect = difficulty.toLowerCase() === 'easy' ? 10 :
                        difficulty.toLowerCase() === 'medium' ? 15 : 20;

    const prompt = `Bạn là một chuyên gia khảo thí ngôn ngữ. Hãy tạo một bộ câu hỏi trắc nghiệm tiếng Anh dựa trên các thông số sau:

### THÔNG SỐ CẤU HÌNH:
- Số lượng câu hỏi: ${questionCount}
- Mức độ khó: ${difficulty}
- Danh sách từ vựng mục tiêu: ${vocabularyList.join(', ')}

### YÊU CẦU NỘI DUNG:
1. Mỗi câu hỏi phải có ngữ cảnh rõ ràng, thực tế.
2. Hình thức: Điền từ vào chỗ trống hoặc tìm từ đồng nghĩa/trái nghĩa.
3. Độ khó phải tương xứng với lựa chọn ${difficulty}.
   - Easy: Câu đơn, từ vựng thông dụng.
   - Medium: Câu phức, ngữ cảnh công việc/học tập.
   - Hard: Thành ngữ, từ vựng học thuật cao cấp.

### ĐỊNH DẠNG TRẢ VỀ (JSON THUẦN TÚY):
Trả về duy nhất 1 mảng JSON, không có văn bản thừa.
{
  "quiz_metadata": {
    "total_questions": ${questionCount},
    "difficulty": "${difficulty}",
    "xp_per_correct_answer": ${xpPerCorrect}
  },
  "questions": [
    {
      "id": 1,
      "question": "Nội dung câu hỏi có chứa chỗ trống (...)",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct_answer": "Đáp án đúng",
      "explanation": "Giải thích ngắn gọn lý do chọn đáp án này bằng tiếng Việt"
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let quizData;
    try {
      // Remove any markdown formatting if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      quizData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({
        error: 'Failed to parse quiz data from AI response'
      }, { status: 500 });
    }

    // Validate the quiz structure
    if (!quizData.quiz_metadata || !quizData.questions || !Array.isArray(quizData.questions)) {
      return NextResponse.json({
        error: 'Invalid quiz structure returned from AI'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      quiz: quizData
    });

  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate quiz',
      details: error.message
    }, { status: 500 });
  }
}