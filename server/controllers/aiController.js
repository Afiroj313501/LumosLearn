import { generateCourseOutline } from '../services/aiService.js';

export const generateOutline = async (req, res) => {
  try {
    const { topic, numModules } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'A topic is required' });
    }

    const outline = await generateCourseOutline(topic, numModules || 5);
    res.json({ outline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate course outline' });
  }
};