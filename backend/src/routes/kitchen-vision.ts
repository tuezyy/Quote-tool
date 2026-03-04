import { Router } from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const MEASUREMENT_RULES = `
LAYOUT TYPES — pick the best match:
- straight: all cabinets along ONE wall only
- galley: TWO PARALLEL walls facing each other across a center aisle (common in apartments, mobile homes, narrow kitchens — two runs of cabinets with walking space between them)
- l_shape: TWO ADJACENT walls meeting at a corner (90° turn)
- u_shape: THREE walls — two parallel runs connected by a third wall at one end
- island: l_shape or u_shape PLUS a freestanding island or peninsula in the center

HOW TO MEASURE WALL LENGTH — this is the most critical part. DO NOT over-estimate:
1. Count visible cabinet UNITS on each wall. A base cabinet with 2 drawers on top + a door below = ONE unit. Do not count drawer fronts as separate cabinets.
2. Estimate width per unit: most base cabinets are 24–30" wide. Sink bases are usually 30–36". Narrow fillers are 12–18".
3. Wall length ≈ number of units × estimated width per unit, converted to feet.
4. Use scale anchors if visible:
   - Refrigerator: 30–36" wide (2.5–3 ft)
   - Standard interior door: 32–36" wide (2.75–3 ft)
   - Counter height: 36" (3 ft) — useful if you can see a person's waist level
5. PERSPECTIVE CORRECTION: wide-angle and perspective photos make spaces look larger than they are. After estimating, reduce by 15–20%. A wall that LOOKS like 14 ft in a photo is probably 10–12 ft in real life.
6. Most residential kitchen walls are 6–12 ft. A wall over 14 ft is unusual. If your estimate exceeds 14 ft, reconsider.`;

const SINGLE_PHOTO_PROMPT = `Analyze this kitchen photo. Respond ONLY with a JSON object, no explanation, no markdown.

${MEASUREMENT_RULES}

Return:
{
  "layout": "straight" | "galley" | "l_shape" | "u_shape" | "island",
  "walls": { "a": <ft>, "b": <ft>, "c": <ft>, "island": <ft> },
  "replacing": true | false,
  "confidence": "high" | "medium" | "low",
  "notes": "<one brief sentence about what you see>"
}

- walls.a: primary/longest wall in feet
- walls.b: second wall (0 if straight; the opposite parallel wall for galley; the adjacent wall for l_shape/u_shape)
- walls.c: third wall in feet (0 unless u_shape or island with 3 perimeter walls)
- walls.island: freestanding island length (0 unless island layout)
- replacing: true if existing cabinets are visible in the photo
- confidence: high if layout and dimensions are clearly visible, medium if partially visible, low if unclear or small photo`;

const TWO_PHOTO_PROMPT = `You are given TWO photos of the SAME kitchen from different angles. Respond ONLY with a JSON object, no explanation, no markdown.

Your task: synthesize both photos into ONE accurate measurement. Do NOT add wall lengths together.

${MEASUREMENT_RULES}

Return:
{
  "layout": "straight" | "galley" | "l_shape" | "u_shape" | "island",
  "walls": { "a": <ft>, "b": <ft>, "c": <ft>, "island": <ft> },
  "replacing": true | false,
  "confidence": "high" | "medium" | "low",
  "notes": "<one brief sentence noting both angles were used>"
}

- Each wall appears ONCE — use whichever photo shows it most clearly; if both show the same wall, average the two estimates
- walls.a: primary/longest wall; walls.b: second wall (parallel opposite for galley; adjacent for l_shape); walls.c: third wall only for u_shape/island
- replacing: true if existing cabinets are visible in EITHER photo
- confidence: high if both photos together give a clear full picture, medium if partial, low if unclear`;

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
    const validLayouts = ['straight', 'galley', 'l_shape', 'u_shape', 'island'];
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
