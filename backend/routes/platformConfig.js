const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /platform-config
 * Fetch all config entries
 */
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.platformConfig.findMany();
    // Convert to key-value object
    const result = {};
    for (const c of configs) {
      try { result[c.key] = JSON.parse(c.value); }
      catch { result[c.key] = c.value; }
    }
    res.json(result);
  } catch (error) {
    console.error('[PlatformConfig] Error fetching config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /platform-config/:key
 * Fetch a single config entry by key
 */
router.get('/:key', async (req, res) => {
  try {
    const config = await prisma.platformConfig.findUnique({ where: { key: req.params.key } });
    if (!config) return res.status(404).json({ error: 'Config not found' });
    try { res.json(JSON.parse(config.value)); }
    catch { res.json(config.value); }
  } catch (error) {
    console.error('[PlatformConfig] Error fetching config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /platform-config/:key
 * Create or update a config entry
 * Body: { value } — value can be any JSON-serializable data
 */
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value is required' });
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const config = await prisma.platformConfig.upsert({
      where: { key: req.params.key },
      update: { value: serialized },
      create: { key: req.params.key, value: serialized },
    });
    res.json(config);
  } catch (error) {
    console.error('[PlatformConfig] Error saving config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /platform-config/:key
 * Delete a config entry
 */
router.delete('/:key', async (req, res) => {
  try {
    await prisma.platformConfig.delete({ where: { key: req.params.key } });
    res.json({ success: true });
  } catch (error) {
    console.error('[PlatformConfig] Error deleting config:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
