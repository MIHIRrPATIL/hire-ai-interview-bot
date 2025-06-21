const testData = {
  interviewId: "test-123",
  intervieweeName: "John Doe",
  question: "Tell me about your experience with React",
  candidateAnswer: "I have been working with React for about 2 years. I started with class components but now prefer functional components with hooks. I've built several applications including an e-commerce site and a dashboard. I'm comfortable with state management using Redux and Context API.",
  interviewType: "Technical",
  experienceLevel: "Mid-level"
};

async function testAPI() {
  try {
    console.log('Testing AI-feedback test endpoint...');
    const response = await fetch('http://localhost:3000/api/AI-feedback/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 