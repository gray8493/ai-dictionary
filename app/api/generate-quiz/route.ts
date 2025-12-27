import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const body = await req.json();
  const { questionCount, difficulty, vocabularyList, quizType } = body;

  try {

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

    const prompt = quizType === 'meaning' ? `
Create multiple choice vocabulary questions.

Vocabulary words: ${vocabularyList.join(', ')}

Requirements:
- Create ${questionCount} multiple choice questions
- Difficulty: ${difficulty}
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

    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
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