import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const prompt = `
Analyze this English text and extract important vocabulary words. Categorize them into three difficulty levels: Easy, Medium, and Hard.

Text to analyze:
"${text}"

Please return ONLY a valid JSON object with this exact structure:
{
  "Easy": [
    {
      "word": "example",
      "ipa": "/ɪɡˈzæmpəl/",
      "definition": "ví dụ, mẫu"
    }
  ],
  "Medium": [
    {
      "word": "vocabulary",
      "ipa": "/voʊˈkæbjəˌlɛri/",
      "definition": "từ vựng"
    }
  ],
  "Hard": [
    {
      "word": "sophisticated",
      "ipa": "/səˈfɪstɪˌkeɪtɪd/",
      "definition": "phức tạp, tinh vi"
    }
  ]
}

Guidelines:
- Extract 8-15 words total across all levels
- Easy: Basic, common words
- Medium: Intermediate vocabulary
- Hard: Advanced, academic, or specialized terms
- Include phonetic transcription (IPA) for each word
- Provide Vietnamese definitions
- Focus on words that are important for understanding the text
- Return only the JSON, no additional text
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          temperature: 0.3,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Try to extract JSON from the response
    let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Validate the structure
    if (!parsedData.Easy || !parsedData.Medium || !parsedData.Hard) {
      throw new Error('Invalid response structure');
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Text analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}