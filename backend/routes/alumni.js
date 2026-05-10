const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /alumni — return all verified alumni with their profile data
router.get('/', async (req, res) => {
  try {
    const data = await prisma.user.findMany({
      where: {
        role: 'ALUMNI',
        verification_status: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        profile_data: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = data.map(u => ({
      ...u,
      profile_data: u.profile_data ? JSON.parse(u.profile_data) : {},
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
