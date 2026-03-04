import { Router } from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const SINGLE_PHOTO_PROMPT = `Analyze this kitchen photo. Respond ONLY with a JSON object, no explanation, no markdown.

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

const TWO_PHOTO_PROMPT = `You are given TWO photos of the SAME kitchen from different angles. Respond ONLY with a JSON object, no explanation, no markdown.

Your task is to synthesize them into a single accurate layout — do NOT add wall lengths together.

Return:
{
  "layout": "straight" | "l_shape" | "u_shape" | "island",
  "walls": { "a": <ft>, "b": <ft>, "c": <ft>, "island": <ft> },
  "replacing": true | false,
  "confidence": "high" | "medium" | "low",
  "notes": "<one brief sentence noting both angles were used>"
}

Rules:
- Each wall should appear ONCE — pick the best estimate from whichever photo shows it most clearly
- If both photos show the same wall, use the average or the clearer estimate — never add them
- layout: the overall kitchen shape across both angles (straight=single wall, l_shape=two adjacent walls, u_shape=three walls, island=u_shape with center island)
- walls.a: longest/primary wall in feet (do NOT double-count)
- walls.b: second wall in feet (0 if straight)
- walls.c: third wall in feet (0 if straight or l_shape)
- walls.island: island length in feet (0 unless island layout)
- replacing: true if existing cabinets are visible in either photo
- confidence: high if layout is clearly visible across both photos, medium if partially visible, low if unclear`;

// POST /api/public/analyze-kitchen
router.post('/analyze-kitchen', upload.array('images', 2), async (req: any, res: any) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  for (const file of files) {
    if (!VALID_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported image type. Use JPEG, PNG, or WEBP.' });
    }
  }

  try {
    const imageBlocks = files.map(f => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: f.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: f.buffer.toString('base64'),
      },
    }));

    const prompt = files.length === 2 ? TWO_PHOTO_PROMPT : SINGLE_PHOTO_PROMPT;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [...imageBlocks, { type: 'text' as const, text: prompt }],
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

    res.json({ ...result, photoCount: files.length });
  } catch (err: any) {
    console.error('[KitchenVision] Error:', err.message);
    res.status(500).json({ error: 'Vision analysis failed. Please fill in details manually.' });
  }
});

export default router;
