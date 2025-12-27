// Test script for generate-quiz API
const testQuizGeneration = async () => {
  console.log('🔍 Testing quiz generation with test mode...');

  const ports = [3000, 3001]; // Try both ports
  const quizTypes = ['fill-blank', 'meaning'];

  for (const port of ports) {
    for (const quizType of quizTypes) {
      try {
        console.log(`\n🔍 Testing port ${port}, type: ${quizType}...`);
        const response = await fetch(`http://localhost:${port}/api/generate-quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-test-mode': 'true'
          },
          body: JSON.stringify({
            questionCount: 2,
            difficulty: 'easy',
            vocabularyList: ['book', 'take', 'run'],
            quizType: quizType
          })
        });

        const result = await response.json();
        console.log(`✅ ${quizType.toUpperCase()} Response from port ${port}:`);
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
          console.log(`🎉 ${quizType} quiz generated successfully!`);
          console.log('📚 Questions:', result.quiz.questions.length);
        } else {
          console.log(`❌ ${quizType} quiz generation failed:`, result.error);
        }
      } catch (error) {
        console.log(`❌ Port ${port}, type ${quizType} failed:`, error.message);
      }
    }
  }

  console.log('\n💡 Test completed. Make sure server is running with: npm run dev');
};

testQuizGeneration();