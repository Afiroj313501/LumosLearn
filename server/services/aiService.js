import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const primaryModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function generateWithFallback(prompt) {
  try {
    const result = await primaryModel.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (err?.status === 503) {
      console.warn('Primary model overloaded, retrying with fallback model...');
      const result = await fallbackModel.generateContent(prompt);
      return result.response.text();
    }
    throw err;
  }
}

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

  const text = await generateWithFallback(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export async function summarizeLesson(lessonContent) {
  const prompt = `Summarize the following lesson content for a student in 3-5 concise bullet points. Focus on the key concepts only. Return plain text bullet points, no markdown headers.

Lesson content:
"""
${lessonContent}
"""`;

  const text = await generateWithFallback(prompt);
  return text.trim();
}

export async function generateCourseOutline(topic, numModules = 5) {
  const prompt = `Create a course outline for a course on: "${topic}".
Return ONLY valid JSON (no markdown, no code fences) in this exact shape:
[
  { "title": "Module title", "description": "One sentence description" }
]
Generate exactly ${numModules} modules, in a logical learning order.`;

  const text = await generateWithFallback(prompt);
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

  const text = await generateWithFallback(prompt);
  return text.trim();
}

export async function recommendCourses(studentContext, availableCourses) {
  const prompt = `You are a course recommendation assistant for a learning platform.

Student's enrollment/progress history:
"""
${studentContext}
"""

Available courses the student is NOT yet enrolled in:
"""
${availableCourses.map((c) => `- ID: ${c.id} | Title: ${c.title} | Category: ${c.category || 'General'} | Description: ${c.description}`).join('\n')}
"""

Based on the student's history, pick the 3 most relevant courses from the available list above.
Return ONLY valid JSON (no markdown, no code fences) in this exact shape:
[
  { "id": "course id from the list", "reason": "one short sentence explaining why this fits the student" }
]`;

  const text = await generateWithFallback(prompt);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}