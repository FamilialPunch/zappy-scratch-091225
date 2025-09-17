import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Submit a refill check-in
router.post(
  '/',
  [
    body('prescription_id').optional().isString().withMessage('prescription_id must be a string if provided'),
    // The rest are optional and flexible for MVP/demo; validate shape lightly
    body('responses').optional(),
    body('side_effects').optional().isArray().withMessage('side_effects must be an array'),
    body('has_red_flags').optional().isBoolean().withMessage('has_red_flags must be a boolean'),
    body('red_flags').optional().isArray().withMessage('red_flags must be an array'),
    body('weight_log').optional(),
    body('photos_urls').optional()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      prescription_id,
      responses = {},
      side_effects = [],
      has_red_flags = false,
      red_flags = [],
      weight_log,
      photos_urls
    } = req.body;

    // Simple decision logic for demo/MVP
    const severeSideEffects = Array.isArray(side_effects)
      ? side_effects.some((se) => (se?.severity || 0) >= 8)
      : false;

    const flagged = !!has_red_flags || (Array.isArray(red_flags) && red_flags.length > 0);

    const effectiveness = typeof responses?.effectiveness === 'number' ? responses.effectiveness : undefined;
    const lowEffectiveness = typeof effectiveness === 'number' && effectiveness <= 3;

    const continueAnswer = (responses?.continue_treatment || '').toString().toLowerCase();
    const wantsChange = [
      'adjust',
      'try something else',
      'discuss'
    ].some((kw) => continueAnswer.includes(kw));

    const requires_consultation = flagged || severeSideEffects || lowEffectiveness || wantsChange;

    const checkin = {
      id: uuidv4(),
      prescription_id,
      responses,
      side_effects,
      has_red_flags: flagged,
      red_flags: Array.isArray(red_flags) ? red_flags : [],
      weight_log: weight_log ?? null,
      photos_urls: photos_urls ?? null,
      created_at: new Date().toISOString()
    };

    // In a production implementation, persist to DB and enqueue for provider review if required
    // For now we return a synthetic record and the decision flag
    return res.status(201).json({
      success: true,
      data: checkin,
      requires_consultation,
      message: requires_consultation
        ? 'Check-in received. A provider will follow up based on your responses.'
        : 'Check-in received. You are cleared to continue your treatment.'
    });
  })
);

export default router;
