const express  = require('express');
const router   = express.Router();
const supabase = require('../supabase');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Email transporter ─────────────────────────────────────────────────────────
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('✅ Email transporter configured');
} else {
  console.log('ℹ️  EMAIL_USER/EMAIL_PASS not set — emails will be skipped');
}

// ── Username generators ───────────────────────────────────────────────────────

/**
 * Student username = their roll number (e.g. BT25CSE013)
 * If not provided, derive from name + year: bt25.alice.johnson
 */
function generateStudentUsername(rollNo, name, year) {
  if (rollNo && rollNo.trim()) return rollNo.trim().toUpperCase();
  const clean = (name || 'student').toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.');
  const yr = String(year || new Date().getFullYear()).slice(-2);
  return `BT${yr}.${clean}`;
}

/**
 * Alumni username = firstname.lastname.batchyear (e.g. priya.sharma.2020)
 */
function generateAlumniUsername(name, batchYear) {
  const clean = (name || 'alumni').toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.');
  return batchYear ? `${clean}.${batchYear}` : clean;
}

/**
 * Password = Username@AlumNEX (predictable first-login password)
 */
function generatePassword(username) {
  return `${username}@AlumNEX`;
}

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendWelcomeEmail({ to, name, username, password, role, loginUrl }) {
  if (!transporter) return { skipped: true, reason: 'Email not configured' };
  try {
    const roleLabel = role === 'STUDENT' ? 'Student' : 'Alumni Mentor';
    const subject   = `Welcome to AlumNEX — Your ${roleLabel} Account`;
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #0b1326; color: #dae2fd; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 40px auto; background: #171f33; border-radius: 16px; overflow: hidden; border: 1px solid rgba(195,192,255,0.15); }
  .header { background: linear-gradient(135deg,#4f46e5,#c3c0ff); padding: 32px; text-align: center; }
  .header h1 { color: #1d00a5; margin: 0; font-size: 1.75rem; font-weight: 900; letter-spacing: -0.03em; }
  .header p { color: #1d00a5; margin: 8px 0 0; opacity: 0.8; font-size: 0.875rem; }
  .body { padding: 32px; }
  .greeting { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
  .cred-box { background: #131b2e; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid rgba(195,192,255,0.15); }
  .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(70,69,85,0.2); }
  .cred-row:last-child { border-bottom: none; }
  .cred-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #c7c4d8; }
  .cred-value { font-family: monospace; font-size: 1rem; font-weight: 700; color: #c3c0ff; }
  .btn { display: block; width: fit-content; margin: 24px auto 0; padding: 14px 32px; background: linear-gradient(135deg,#4f46e5,#c3c0ff); color: #1d00a5; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 0.875rem; text-align: center; }
  .note { font-size: 0.78rem; color: #c7c4d8; line-height: 1.6; margin-top: 24px; padding: 16px; background: rgba(255,185,95,0.08); border-radius: 10px; border-left: 3px solid #ffb95f; }
  .footer { padding: 20px 32px; border-top: 1px solid rgba(70,69,85,0.2); text-align: center; font-size: 0.72rem; color: #c7c4d8; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>AlumNEX</h1>
      <p>Mentorship & Mock Interview Platform</p>
    </div>
    <div class="body">
      <div class="greeting">Hi ${name} 👋</div>
      <p style="color:#c7c4d8;line-height:1.6;font-size:0.875rem;">
        Your <strong style="color:#dae2fd">${roleLabel}</strong> account on AlumNEX has been created by your TNP coordinator.
        Use the credentials below to sign in.
      </p>
      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Username</span>
          <span class="cred-value">${username}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Password</span>
          <span class="cred-value">${password}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Role</span>
          <span class="cred-value">${roleLabel}</span>
        </div>
      </div>
      <a href="${loginUrl}" class="btn">Sign In to AlumNEX →</a>
      <div class="note">
        ⚠️ <strong>Change your password</strong> after your first login. Keep these credentials safe and do not share them.
      </div>
    </div>
    <div class="footer">
      AlumNEX — Bridging Campus and Career<br>
      This is an automated message. Do not reply.
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `AlumNEX <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`Email failed for ${to}:`, err.message);
    return { skipped: true, reason: err.message };
  }
}

// ── Core account creator ──────────────────────────────────────────────────────
async function createUser({ email, password, username, role, name, department, profileData }) {
  if (!supabase) throw new Error('Supabase not configured');

  // Check duplicate by email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  if (existing) return { skipped: true, email, username, reason: 'Email already exists' };

  // Check duplicate by username
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('profile_data->>username', username)
    .maybeSingle();
  if (existingUser) return { skipped: true, email, username, reason: 'Username already exists' };

  // Create Supabase auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr) throw new Error(`Auth error for ${email}: ${authErr.message}`);

  // Insert profile row — username stored in profile_data for login lookup
  const { data: user, error: insertErr } = await supabase
    .from('users')
    .insert({
      id:                  authData.user.id,
      role,
      name,
      email,
      department:          department || 'General',
      verification_status: 'VERIFIED',
      profile_data:        { ...profileData, username },
    })
    .select()
    .single();

  if (insertErr) throw new Error(`DB error for ${email}: ${insertErr.message}`);

  // Mirror to Prisma so requests/notifications/alumni listing work
  try {
    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { name, email, department: department || 'General', profile_data: JSON.stringify({ ...profileData, username }) },
      create: {
        id: authData.user.id,
        role,
        name,
        email,
        department: department || 'General',
        verification_status: 'VERIFIED',
        profile_data: JSON.stringify({ ...profileData, username }),
      },
    });
  } catch (prismaErr) {
    console.warn(`[Register] Prisma mirror failed for ${email}:`, prismaErr.message);
  }

  return { created: true, email, name, username, password, user };
}

// ── POST /register/bulk-students ──────────────────────────────────────────────
// Body: { students: [{ name, email, rollNo, department, college, year }] }
router.post('/bulk-students', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0)
      return res.status(400).json({ error: 'students array is required and must not be empty.' });
    if (students.length > 500)
      return res.status(400).json({ error: 'Maximum 500 students per upload.' });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const results  = { created: [], skipped: [], failed: [] };

    for (const s of students) {
      if (!s.name || !s.email) {
        results.failed.push({ email: s.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const username = generateStudentUsername(s.rollNo, s.name, s.year);
        const password = generatePassword(username);

        const result = await createUser({
          email:      s.email.trim().toLowerCase(),
          password,
          username,
          role:       'STUDENT',
          name:       s.name.trim(),
          department: s.department,
          profileData: {
            college:   s.college   || '',
            year:      s.year      || '',
            rollNo:    s.rollNo    || username,
          },
        });

        if (result.skipped) {
          results.skipped.push(result);
        } else {
          // Send welcome email
          const emailResult = await sendWelcomeEmail({
            to: s.email.trim().toLowerCase(),
            name: s.name.trim(),
            username,
            password,
            role: 'STUDENT',
            loginUrl,
          });
          results.created.push({ ...result, emailSent: emailResult.sent || false });
        }
      } catch (err) {
        results.failed.push({ email: s.email, reason: err.message });
      }
    }

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total:   students.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed:  results.failed.length,
        emailsSent: results.created.filter(r => r.emailSent).length,
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
    if (!Array.isArray(alumni) || alumni.length === 0)
      return res.status(400).json({ error: 'alumni array is required and must not be empty.' });
    if (alumni.length > 500)
      return res.status(400).json({ error: 'Maximum 500 alumni per upload.' });

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const results  = { created: [], skipped: [], failed: [] };

    for (const a of alumni) {
      if (!a.name || !a.email) {
        results.failed.push({ email: a.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const username = generateAlumniUsername(a.name, a.batchYear);
        const password = generatePassword(username);

        const result = await createUser({
          email:      a.email.trim().toLowerCase(),
          password,
          username,
          role:       'ALUMNI',
          name:       a.name.trim(),
          department: a.department,
          profileData: {
            company:   a.company   || '',
            jobTitle:  a.jobTitle  || '',
            batchYear: a.batchYear || '',
          },
        });

        if (result.skipped) {
          results.skipped.push(result);
        } else {
          const emailResult = await sendWelcomeEmail({
            to: a.email.trim().toLowerCase(),
            name: a.name.trim(),
            username,
            password,
            role: 'ALUMNI',
            loginUrl,
          });
          results.created.push({ ...result, emailSent: emailResult.sent || false });
        }
      } catch (err) {
        results.failed.push({ email: a.email, reason: err.message });
      }
    }

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total:   alumni.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed:  results.failed.length,
        emailsSent: results.created.filter(r => r.emailSent).length,
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
  const csv = [
    'name,email,rollNo,department,college,year',
    'Alice Johnson,alice@college.edu,BT25CSE013,Computer Science,ABC College,2025',
    'Bob Smith,bob@college.edu,BT25ECE007,Electronics,ABC College,2025',
  ].join('\n') + '\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students_template.csv"');
  res.send(csv);
});

// ── GET /register/template/alumni ────────────────────────────────────────────
router.get('/template/alumni', (req, res) => {
  const csv = [
    'name,email,department,company,jobTitle,batchYear',
    'Priya Sharma,priya@gmail.com,Computer Science,Google,Senior Engineer,2020',
    'Amit Joshi,amit@gmail.com,Electronics,Microsoft,Staff Engineer,2019',
  ].join('\n') + '\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="alumni_template.csv"');
  res.send(csv);
});

module.exports = router;
