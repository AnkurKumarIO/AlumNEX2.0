const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePassword(name) {
  const clean = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${clean}@${suffix}`;
}

async function createUser({ email, password, role, name, department, profileData }) {
  // Check duplicate
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) return { skipped: true, email, reason: 'Email already exists' };

  // Create Supabase auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr) throw new Error(`Auth error for ${email}: ${authErr.message}`);

  // Insert profile row
  const { data: user, error: insertErr } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      role,
      name,
      email,
      department: department || 'General',
      verification_status: 'VERIFIED',
      profile_data: profileData,
    })
    .select()
    .single();

  if (insertErr) throw new Error(`DB error for ${email}: ${insertErr.message}`);

  return { created: true, email, name, password, user };
}

// ── POST /register/bulk-students ──────────────────────────────────────────────
// Body: { students: [{ name, email, department, college, year, studentId }] }
router.post('/bulk-students', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'students array is required and must not be empty.' });
    }
    if (students.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 students per upload.' });
    }

    const results = { created: [], skipped: [], failed: [] };

    for (const s of students) {
      if (!s.name || !s.email) {
        results.failed.push({ email: s.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const password = generatePassword(s.name);
        const result = await createUser({
          email: s.email.trim().toLowerCase(),
          password,
          role: 'STUDENT',
          name: s.name.trim(),
          department: s.department,
          profileData: {
            college: s.college || '',
            year: s.year || '',
            studentId: s.studentId || '',
          },
        });
        if (result.skipped) results.skipped.push(result);
        else results.created.push(result);
      } catch (err) {
        results.failed.push({ email: s.email, reason: err.message });
      }
    }

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total: students.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
      results,
    });
  } catch (err) {
    console.error('Bulk student register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /register/bulk-alumni ────────────────────────────────────────────────
// Body: { alumni: [{ name, email, department, company, jobTitle, batchYear }] }
router.post('/bulk-alumni', async (req, res) => {
  try {
    const { alumni } = req.body;
    if (!Array.isArray(alumni) || alumni.length === 0) {
      return res.status(400).json({ error: 'alumni array is required and must not be empty.' });
    }
    if (alumni.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 alumni per upload.' });
    }

    const results = { created: [], skipped: [], failed: [] };

    for (const a of alumni) {
      if (!a.name || !a.email) {
        results.failed.push({ email: a.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const password = generatePassword(a.name);
        const result = await createUser({
          email: a.email.trim().toLowerCase(),
          password,
          role: 'ALUMNI',
          name: a.name.trim(),
          department: a.department,
          profileData: {
            company: a.company || '',
            jobTitle: a.jobTitle || '',
            batchYear: a.batchYear || '',
          },
        });
        if (result.skipped) results.skipped.push(result);
        else results.created.push(result);
      } catch (err) {
        results.failed.push({ email: a.email, reason: err.message });
      }
    }

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total: alumni.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
      results,
    });
  } catch (err) {
    console.error('Bulk alumni register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /register/template/students ──────────────────────────────────────────
router.get('/template/students', (req, res) => {
  const csv = 'name,email,department,college,year,studentId\nAlice Johnson,alice@college.edu,Computer Science,MIT,2025,STU001\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students_template.csv"');
  res.send(csv);
});

// ── GET /register/template/alumni ────────────────────────────────────────────
router.get('/template/alumni', (req, res) => {
  const csv = 'name,email,department,company,jobTitle,batchYear\nPriya Sharma,priya@gmail.com,Computer Science,Google,Senior Engineer,2020\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="alumni_template.csv"');
  res.send(csv);
});

module.exports = router;
