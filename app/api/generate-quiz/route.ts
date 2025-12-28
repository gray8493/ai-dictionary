import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { hasAIAccess, consumeAICredit } from '@/lib/checkPro';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Fallback function to generate quiz when AI API fails
function generateFallbackQuiz(questionCount: number, difficulty: string, vocabularyList: string[], quizType: string) {
  const xpPerCorrect = difficulty.toLowerCase() === 'easy' ? 10 :
                      difficulty.toLowerCase() === 'medium' ? 15 : 20;

  // Simple fallback - basic quiz without database data
  const shuffledWords = [...vocabularyList].sort(() => Math.random() - 0.5);
  const selectedWords = shuffledWords.slice(0, Math.min(questionCount, shuffledWords.length));

  if (quizType === 'meaning') {
    const questions = selectedWords.map(word => ({
      word: word,
      question: `Từ "${word}" có nghĩa là gì?`,
      options: [`Nghĩa của "${word}"`, 'Ý nghĩa A', 'Ý nghĩa B', 'Ý nghĩa C'],
      correct_answer: `Nghĩa của "${word}"`,
      explanation: `Đây là nghĩa của từ "${word}".`,
      xp: xpPerCorrect
    }));

    return {
      quiz_metadata: {
        total_questions: questions.length,
        difficulty,
        xp_per_correct_answer: xpPerCorrect
      },
      questions
    };
  } else {
    const questions = selectedWords.map(word => ({
      word: word,
      sentence: `Điền từ: ______`,
      correct_answer: word,
      explanation: `Cần điền từ "${word}".`,
      xp: xpPerCorrect
    }));

    return {
      quiz_metadata: {
        total_questions: questions.length,
        difficulty,
        xp_per_correct_answer: xpPerCorrect
      },
      questions
    };
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
  }

  const body = await req.json();
  const { questionCount, difficulty, vocabularyList, quizType } = body;

  try {
    // Check for test mode (skip auth for testing)
    const testMode = req.headers.get('x-test-mode') === 'true';

    let user, supabaseServer;
    if (!testMode) {
      // Get user from Authorization header
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.substring(7);
      supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user: authUser }, error: userError } = await supabaseServer.auth.getUser();
      if (userError || !authUser) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      user = authUser;
    } else {
      // Test mode: use service role for all operations
      supabaseServer = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const testUserId = '00000000-0000-0000-0000-000000000001'; // Fixed test user ID
      user = { id: testUserId };

      // Ensure test user profile exists with Pro status
      const { data: profile, error: profileError } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        await supabaseServer
          .from('user_profiles')
          .insert({
            user_id: testUserId,
            is_pro: true,
            ai_credits: 10
          });
      } else if (profile && !profile.is_pro) {
        await supabaseServer
          .from('user_profiles')
          .update({ is_pro: true, ai_credits: 10 })
          .eq('user_id', testUserId);
      }
    }

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

    // Check Pro access using authenticated user
    if (!testMode) {
      const { data: profile } = await supabaseServer
        .from('user_profiles')
        .select('is_pro')
        .eq('user_id', user.id)
        .single();
      const hasAccess = profile?.is_pro || false;
      if (!hasAccess) {
        return NextResponse.json({
          error: 'Yêu cầu gói Pro để sử dụng tính năng AI tạo bài tập. Hoặc dùng thử còn 3 lần miễn phí.'
        }, { status: 403 });
      }
    }

    // Consume credit if not Pro (skip in test mode)
    if (!testMode) {
      const consumed = await consumeAICredit(user);
      if (!consumed) {
        // If consumption failed, check again (might be Pro user)
        const recheckAccess = await hasAIAccess(user);
        if (!recheckAccess) {
          return NextResponse.json({
            error: 'Không thể sử dụng tính năng AI. Vui lòng nâng cấp gói Pro.'
          }, { status: 403 });
        }
      }
    }

    // Calculate XP per correct answer based on difficulty
    const xpPerCorrect = difficulty.toLowerCase() === 'easy' ? 10 :
                        difficulty.toLowerCase() === 'medium' ? 15 : 20;

    const prompt = quizType === 'meaning' ? `
Create multiple choice vocabulary questions.

Vocabulary words: ${vocabularyList.join(', ')}

Requirements:
- Create ${questionCount} multiple choice questions
- Difficulty: ${difficulty}
- Distribute questions across different vocabulary words from the list (use different words for different questions)
- Each question tests ONE vocabulary word from the list
- Show the word and ask for its meaning in Vietnamese
- Provide 4 options: 1 correct meaning, 3 plausible distractors
- Distractors should be related but incorrect meanings
- Provide brief explanation in Vietnamese

Return ONLY valid JSON in this exact format:
{
  "quiz_metadata": {
    "total_questions": ${questionCount},
    "difficulty": "${difficulty}",
    "xp_per_correct_answer": ${xpPerCorrect}
  },
  "questions": [
    {
      "word": "vocabulary_word_here",
      "question": "What does 'vocabulary_word_here' mean in Vietnamese?",
      "options": ["Correct meaning", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
      "correct_answer": "Correct meaning",
      "explanation": "Brief Vietnamese explanation.",
      "xp": ${xpPerCorrect}
    }
  ]
}

IMPORTANT: Return ONLY the JSON, no markdown, no extra text.`
    : `
Create fill-in-the-blank sentences for English vocabulary practice.

Vocabulary words: ${vocabularyList.join(', ')}

Requirements:
- Create ${questionCount} fill-in-the-blank sentences
- Difficulty: ${difficulty}
- Each sentence must use ONE of the vocabulary words from the list
- Replace the vocabulary word with ______ (exactly 6 underscores)
- Sentences should be natural and appropriate for the word's context
- Provide a brief Vietnamese explanation for each sentence

Return ONLY valid JSON in this exact format:
{
  "quiz_metadata": {
    "total_questions": ${questionCount},
    "difficulty": "${difficulty}",
    "xp_per_correct_answer": ${xpPerCorrect}
  },
  "questions": [
    {
      "word": "vocabulary_word_here",
      "sentence": "Complete sentence with ______ for the blank.",
      "correct_answer": "vocabulary_word_here",
      "explanation": "Brief Vietnamese explanation.",
      "xp": ${xpPerCorrect}
    }
  ]
}

IMPORTANT: Return ONLY the JSON, no markdown, no extra text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let quizData;
    try {
      // Remove any markdown formatting if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      console.log('AI Response:', cleanText); // Debug log
      quizData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      console.error('Parse error:', parseError);
      return NextResponse.json({
        error: 'Failed to parse quiz data from AI response',
        rawResponse: text.substring(0, 500) // Include partial response for debugging
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

    // Check if it's a quota exceeded error, use fallback
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('quota')) {
      console.log('AI quota exceeded, using fallback quiz generation...');

      try {
        const fallbackQuiz = generateFallbackQuiz(questionCount, difficulty, vocabularyList, quizType);

        return NextResponse.json({
          success: true,
          quiz: fallbackQuiz,
          fallback: true,
          message: 'Quiz generated using fallback method due to AI quota limit'
        });
      } catch (fallbackError: any) {
        console.error('Fallback quiz generation failed:', fallbackError);
        return NextResponse.json({
          error: 'Failed to generate quiz and fallback failed',
          details: fallbackError.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate quiz',
      details: error.message
    }, { status: 500 });
  }
}