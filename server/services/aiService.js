import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

export async function generateQuizFromContent(lessonContent, numQuestions = 5) {
  const prompt = `You are an assistant that creates quizzes for a learning management system.
Based on the lesson content below, generate exactly ${numQuestions} multiple-choice questions.

Return ONLY valid JSON (no markdown, no code fences, no explanation) in this exact shape:
[
  {
    "text": "question text",
    "type": "MCQ",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": "the exact text of the correct option"
  }
]

Lesson content:
"""
${lessonContent}
"""`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function summarizeLesson(lessonContent) {
  const prompt = `Summarize the following lesson content for a student in 3-5 concise bullet points. Focus on the key concepts only. Return plain text bullet points, no markdown headers.

Lesson content:
"""
${lessonContent}
"""`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function generateCourseOutline(topic, numModules = 5) {
  const prompt = `Create a course outline for a course on: "${topic}".
Return ONLY valid JSON (no markdown, no code fences) in this exact shape:
[
  { "title": "Module title", "description": "One sentence description" }
]
Generate exactly ${numModules} modules, in a logical learning order.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function chatWithAssistant(courseContext, conversationHistory, userMessage) {
  const prompt = `You are a helpful study assistant for a course. Only answer questions related to the course material below. If asked something unrelated, politely redirect the student to ask about the course content.

Course material:
"""
${courseContext}
"""

Conversation so far:
${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}

Student: ${userMessage}
Assistant:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}