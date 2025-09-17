import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all prescriptions with pagination
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 25, status, patient_id, provider_id } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();
  
  let query = `
    SELECT 
      p.*,
      pat.first_name as patient_first_name,
      pat.last_name as patient_last_name,
      pat.email as patient_email,
      prov.name as provider_name,
      c.consultation_type
    FROM prescriptions p
    JOIN patients pat ON p.patient_id = pat.id
    LEFT JOIN providers prov ON p.provider_id = prov.id
    LEFT JOIN consultations c ON p.consultation_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 1;
  
  if (status) {
    query += ` AND p.status = $${paramCount++}`;
    params.push(status);
  }
  
  if (patient_id) {
    query += ` AND p.patient_id = $${paramCount++}`;
    params.push(patient_id);
  }
  
  if (provider_id) {
    query += ` AND p.provider_id = $${paramCount++}`;
    params.push(provider_id);
  }
  
  query += ` ORDER BY p.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
  params.push(limit, offset);
  
  const result = await db.query(query, params);
  
  // Get total count
  let countQuery = `SELECT COUNT(*) FROM prescriptions p WHERE 1=1`;
  const countParams = [];
  paramCount = 1;
  
  if (status) {
    countQuery += ` AND p.status = $${paramCount++}`;
    countParams.push(status);
  }
  
  if (patient_id) {
    countQuery += ` AND p.patient_id = $${paramCount++}`;
    countParams.push(patient_id);
  }
  
  if (provider_id) {
    countQuery += ` AND p.provider_id = $${paramCount++}`;
    countParams.push(provider_id);
  }
  
  const countResult = await db.query(countQuery, countParams);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Get single prescription details
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Handle mock prescriptions for demo/MVP
  if (id.startsWith('mock-')) {
    const mockPrescriptions = {
      'mock-1': {
        id: 'mock-1',
        medication_name: 'Tretinoin + Doxycycline',
        category: 'acne',
        dosage: '0.05% cream + 100mg',
        frequency: 'Nightly + Twice daily',
        quantity: 30,
        refills: 2,
        status: 'active',
        patient_id: req.user.id,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      'mock-2': {
        id: 'mock-2',
        medication_name: 'Semaglutide',
        category: 'weight-loss',
        dosage: '0.5mg',
        frequency: 'Once weekly',
        quantity: 4,
        refills: 5,
        status: 'active',
        patient_id: req.user.id,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    };
    
    const mockPrescription = mockPrescriptions[id];
    if (mockPrescription) {
      return res.json({
        success: true,
        data: mockPrescription
      });
    }
  }
  
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      p.*,
      pat.first_name as patient_first_name,
      pat.last_name as patient_last_name,
      pat.email as patient_email,
      pat.date_of_birth as patient_dob,
      prov.name as provider_name,
      prov.license_number as provider_license,
      c.consultation_type,
      c.diagnosis
    FROM prescriptions p
    JOIN patients pat ON p.patient_id = pat.id
    LEFT JOIN providers prov ON p.provider_id = prov.id
    LEFT JOIN consultations c ON p.consultation_id = c.id
    WHERE p.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Create prescription
router.post('/', 
  requireAuth,
  [
    body('patient_id').isUUID().withMessage('Valid patient ID required'),
    body('medication_name').notEmpty().withMessage('Medication name required'),
    body('dosage').notEmpty().withMessage('Dosage required'),
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('frequency').notEmpty().withMessage('Frequency required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      patient_id,
      consultation_id,
      medication_name,
      generic_name,
      dosage,
      quantity,
      frequency,
      duration,
      instructions,
      refills,
      price
    } = req.body;
    
    const db = getDatabase();
    const provider_id = req.user.role === 'provider' ? req.user.id : null;
    
    const result = await db.query(`
      INSERT INTO prescriptions (
        patient_id, provider_id, consultation_id,
        medication_name, generic_name, dosage,
        quantity, frequency, duration,
        instructions, refills, price,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', NOW())
      RETURNING *
    `, [
      patient_id, provider_id, consultation_id,
      medication_name, generic_name, dosage,
      quantity, frequency, duration,
      instructions, refills || 0, price || 0
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  })
);

// Update prescription status
router.put('/:id/status', 
  requireAuth,
  [
    body('status').isIn(['active', 'filled', 'cancelled', 'expired'])
      .withMessage('Invalid status')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const db = getDatabase();
    
    const result = await db.query(`
      UPDATE prescriptions
      SET 
        status = $1,
        status_reason = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [status, reason, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// Get prescription refill history
router.get('/:id/refills', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      pr.*,
      o.order_number,
      o.total_amount,
      o.payment_status
    FROM prescription_refills pr
    LEFT JOIN orders o ON pr.order_id = o.id
    WHERE pr.prescription_id = $1
    ORDER BY pr.refilled_at DESC
  `, [id]);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Request refill
router.post('/:id/refill', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, notes } = req.body;
    const db = getDatabase();
    
    // Check if prescription is active and has refills remaining
    const prescriptionResult = await db.query(`
      SELECT * FROM prescriptions
      WHERE id = $1 AND status = 'active'
    `, [id]);
    
    if (prescriptionResult.rows.length === 0) {
      return res.status(400).json({ error: 'Prescription not available for refill' });
    }
    
    const prescription = prescriptionResult.rows[0];
    
    // Check refills remaining
    const refillCount = await db.query(`
      SELECT COUNT(*) as count FROM prescription_refills
      WHERE prescription_id = $1
    `, [id]);
    
    if (refillCount.rows[0].count >= prescription.refills) {
      return res.status(400).json({ error: 'No refills remaining' });
    }
    
    // Create refill request
    const result = await db.query(`
      INSERT INTO prescription_refills (
        prescription_id, patient_id, quantity,
        notes, status, requested_at
      ) VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *
    `, [id, prescription.patient_id, quantity || prescription.quantity, notes]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Refill request submitted'
    });
  })
);

// Get prescription statistics
router.get('/stats/overview', requireAdmin, asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const stats = await db.query(`
    SELECT
      COUNT(*) as total_prescriptions,
      COUNT(*) FILTER (WHERE status = 'active') as active_prescriptions,
      COUNT(*) FILTER (WHERE status = 'filled') as filled_prescriptions,
      COUNT(DISTINCT patient_id) as unique_patients,
      COUNT(DISTINCT medication_name) as unique_medications,
      AVG(price)::numeric(10,2) as average_price,
      SUM(price)::numeric(10,2) as total_value
    FROM prescriptions
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);
  
  const topMedications = await db.query(`
    SELECT 
      medication_name,
      COUNT(*) as prescription_count,
      AVG(price)::numeric(10,2) as average_price
    FROM prescriptions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY medication_name
    ORDER BY prescription_count DESC
    LIMIT 10
  `);
  
  res.json({
    success: true,
    data: {
      overview: stats.rows[0],
      topMedications: topMedications.rows
    }
  });
}));

export default router;
