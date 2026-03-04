import { Router } from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VISION_PROMPT = `Analyze this kitchen photo. Respond ONLY with a JSON object, no explanation, no markdown.

Return:
{
  "layout": "straight" | "l_shape" | "u_shape" | "island",
  "walls": { "a": <ft>, "b": <ft>, "c": <ft>, "island": <ft> },
  "replacing": true | false,
  "confidence": "high" | "medium" | "low",
  "notes": "<one brief sentence about what you see>"
}

Rules:
- layout: the dominant cabinet wall arrangement (straight=single wall, l_shape=two adjacent walls, u_shape=three walls, island=u_shape with center island)
- walls.a: length of the longest/primary wall in feet (best estimate from perspective/objects)
- walls.b: second wall length (0 if straight)
- walls.c: third wall length (0 if straight or l_shape)
- walls.island: island length in feet (0 unless island layout)
- replacing: true if existing cabinets are visible in the photo
- confidence: high if layout is clearly visible, medium if partially visible, low if unclear`;

// POST /api/public/analyze-kitchen
router.post('/analyze-kitchen', upload.single('image'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const mediaType = (req.file.mimetype || 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
    return res.status(400).json({ error: 'Unsupported image type. Use JPEG, PNG, or WEBP.' });
  }

  try {
    const base64 = req.file.buffer.toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: VISION_PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[KitchenVision] Could not find JSON in response:', text);
      return res.status(422).json({ error: 'Could not parse kitchen analysis' });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and sanitize
    const validLayouts = ['straight', 'l_shape', 'u_shape', 'island'];
    if (!validLayouts.includes(result.layout)) result.layout = 'l_shape';
    if (!result.walls || typeof result.walls !== 'object') result.walls = { a: 0, b: 0, c: 0, island: 0 };
    result.walls = {
      a: Math.max(0, Math.min(40, Number(result.walls.a) || 0)),
      b: Math.max(0, Math.min(40, Number(result.walls.b) || 0)),
      c: Math.max(0, Math.min(40, Number(result.walls.c) || 0)),
      island: Math.max(0, Math.min(20, Number(result.walls.island) || 0)),
    };
    if (typeof result.replacing !== 'boolean') result.replacing = false;
    if (!['high', 'medium', 'low'].includes(result.confidence)) result.confidence = 'medium';
    if (typeof result.notes !== 'string') result.notes = '';

    res.json(result);
  } catch (err: any) {
    console.error('[KitchenVision] Error:', err.message);
    res.status(500).json({ error: 'Vision analysis failed. Please fill in details manually.' });
  }
});

export default router;
