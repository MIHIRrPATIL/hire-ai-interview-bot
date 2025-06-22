const testData = {
  interviewId: "behavioral-test-456",
  intervieweeName: "Jane Smith",
  question: "Describe a challenging situation you faced at work and how you handled it.",
  candidateAnswer: "In my previous role, we had a major project deadline that was moved up by two weeks unexpectedly. My team was already stretched thin. I immediately called a meeting to reassess our priorities. I broke down the remaining work into smaller, manageable tasks and we identified a few non-essential features that could be postponed. I also negotiated for some overtime budget. It was stressful, but we managed to deliver the core product on the new deadline by focusing on communication and clear priorities.",
  interviewType: "Behavioral",
  jobDescription: "We are looking for a proactive project manager who can handle pressure and lead teams effectively.",
  experienceLevel: "Senior"
};

async function testAPI() {
  try {
    console.log('Testing AI-feedback endpoint with new behavioral data...');
    const response = await fetch('http://localhost:3000/api/AI-feedback', {
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