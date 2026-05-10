const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /activity-logs
 * Fetch all activity logs, newest first
 * Optional query param: limit (default 20)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(logs);
  } catch (error) {
    console.error('[ActivityLog] Error fetching logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /activity-logs
 * Create a new activity log entry
 * Body: { icon, color, title, desc, category? }
 */
router.post('/', async (req, res) => {
  try {
    const { icon, color, title, desc, category } = req.body;
    if (!icon || !title || !desc) {
      return res.status(400).json({ error: 'icon, title, and desc are required' });
    }
    const log = await prisma.activityLog.create({
      data: { icon, color: color || '#c3c0ff', title, desc, category: category || 'general' },
    });
    res.json(log);
  } catch (error) {
    console.error('[ActivityLog] Error creating log:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /activity-logs/:id
 * Delete an activity log entry
 */
router.delete('/:id', async (req, res) => {
  try {
    await prisma.activityLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('[ActivityLog] Error deleting log:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
