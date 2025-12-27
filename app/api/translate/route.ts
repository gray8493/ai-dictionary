import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  let text = '';

  try {
    const body = await req.json();
    text = body.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const prompt = `Translate the following English text to Vietnamese. Provide only the translation, no additional text or explanations:

English: "${text}"

Vietnamese:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Translation service error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!translation) {
      console.error('Invalid Gemini response structure:', data);
      throw new Error('Invalid translation response');
    }

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);

    // Fallback: Simple translation for common words
    const fallbackTranslations: { [key: string]: string } = {
      'hello': 'xin chào',
      'world': 'thế giới',
      'how': 'làm thế nào',
      'are': 'là',
      'you': 'bạn',
      'today': 'hôm nay',
      'good': 'tốt',
      'morning': 'buổi sáng',
      'thank': 'cảm ơn',
      'please': 'làm ơn',
      'yes': 'vâng',
      'no': 'không',
      'sorry': 'xin lỗi'
    };

    const words = text.toLowerCase().split(/\s+/);
    const translatedWords = words.map(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      return fallbackTranslations[cleanWord] || word;
    });

    const fallbackTranslation = translatedWords.join(' ');

    console.log('Using fallback translation:', fallbackTranslation);

    return NextResponse.json({
      translation: fallbackTranslation,
      note: 'This is a basic translation. For better results, set up Gemini API key.'
    });
  }
}