const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../supabase');
const prisma   = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'alumnex_secret_2026';

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Upsert user into Prisma so all other routes (requests, notifications) can find them
async function upsertPrismaUser({ id, role, name, email, department, profile_data }) {
  try {
    const pd = typeof profile_data === 'string' ? profile_data : JSON.stringify(profile_data || {});
    await prisma.user.upsert({
      where: { id },
      update: { name, email, department: department || 'General', profile_data: pd },
      create: { id, role, name, email, department: department || 'General', verification_status: 'VERIFIED', profile_data: pd },
    });
  } catch (e) {
    console.warn('[Auth] Prisma upsert failed:', e.message);
  }
}

// ── POST /auth/student/register ───────────────────────────────────────────────
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, username, password, department, college, year } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });

    // Check duplicate in Prisma
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    // Create Supabase Auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) throw authErr;

    const profileObj = { college, year, username };

    // Write to Prisma (primary DB)
    const user = await prisma.user.create({
      data: {
        id:                  authData.user.id,
        role:                'STUDENT',
        name,
        email,
        department:          department || 'General',
        verification_status: 'VERIFIED',
        profile_data:        JSON.stringify(profileObj),
      },
    });

    res.json({ message: 'Registration successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Student Register Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/student/login ──────────────────────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    let { username, password, email } = req.body;
    if (username) username = username.trim();
    if (email) email = email.trim();

    // Support both email and username login — look up in Prisma
    let userEmail = email;
    if (!userEmail && username) {
      // Use indexed username column first, then try email match — O(1) instead of O(N)
      const match = await prisma.user.findFirst({
        where: {
          role: 'STUDENT',
          OR: [
            { username: { equals: username, mode: 'insensitive' } },
            { email: { equals: username, mode: 'insensitive' } },
          ],
        },
      });
      if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
      userEmail = match.email;
    }

    if (!userEmail || !password) return res.status(400).json({ error: 'Credentials required.' });

    // Sign in via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authErr) return res.status(401).json({ error: 'Invalid credentials.' });

    // Fetch from Prisma
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || user.role !== 'STUDENT') return res.status(401).json({ error: 'Not a student account.' });

    const profileData = JSON.parse(user.profile_data || '{}');
    res.json({ message: 'Login successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department, profile_data: profileData } });
  } catch (err) {
    console.error('Student Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/alumni/register ────────────────────────────────────────────────
router.post('/alumni/register', async (req, res) => {
  try {
    const { name, email, username, password, department, company, batchYear } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });

    // Check duplicate in Prisma
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    // Create Supabase Auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) throw authErr;

    const profileObj = { username, company, batchYear };

    // Write to Prisma (primary DB)
    const user = await prisma.user.create({
      data: {
        id:                  authData.user.id,
        role:                'ALUMNI',
        username:            username || null,
        name,
        email,
        department:          department || 'General',
        verification_status: 'VERIFIED',
        profile_data:        JSON.stringify(profileObj),
      },
    });

    res.json({ message: 'Alumni registration successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Alumni Register Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/alumni/login ───────────────────────────────────────────────────
router.post('/alumni/login', async (req, res) => {
  try {
    let { username, password, email } = req.body;
    if (username) username = username.trim();
    if (email) email = email.trim();

    // Support both email and username login — look up in Prisma
    let userEmail = email;
    if (!userEmail && username) {
      // Use indexed username column first, then try email match — O(1) instead of O(N)
      const match = await prisma.user.findFirst({
        where: {
          role: 'ALUMNI',
          OR: [
            { username: { equals: username, mode: 'insensitive' } },
            { email: { equals: username, mode: 'insensitive' } },
          ],
        },
      });
      if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
      userEmail = match.email;
    }

    if (!userEmail || !password) return res.status(400).json({ error: 'Credentials required.' });

    // Sign in via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authErr) return res.status(401).json({ error: 'Invalid credentials.' });

    // Fetch from Prisma
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || user.role !== 'ALUMNI') return res.status(401).json({ error: 'Not an alumni account.' });

    const profileData = JSON.parse(user.profile_data || '{}');
    res.json({ message: 'Login successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department, profile_data: profileData } });
  } catch (err) {
    console.error('Alumni Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/tnp/login ──────────────────────────────────────────────────────
router.post('/tnp/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== (process.env.TNP_USERNAME || 'admin') || password !== (process.env.TNP_PASSWORD || 'tnp_secure_123')) {
      return res.status(401).json({ error: 'Invalid TNP credentials.' });
    }
    const user = { id: 'tnp-001', name: 'TNP Coordinator', role: 'TNP' };
    res.json({ message: 'TNP Login successful', token: makeToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
