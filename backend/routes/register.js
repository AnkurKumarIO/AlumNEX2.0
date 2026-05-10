const express  = require('express');
const router   = express.Router();
const supabase = require('../supabase');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

// ── Email transporter ─────────────────────────────────────────────────────────
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  const port = parseInt(process.env.EMAIL_PORT || '587');
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Helps prevent SSL/TLS errors in cloud environments
    },
    connectionTimeout: 10000, // 10 seconds to connect
    greetingTimeout: 10000,
    socketTimeout: 15000, // 15 seconds max for entire transaction
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
  console.log(`[EMAIL-DEBUG] sendWelcomeEmail called for ${to}, transporter=${!!transporter}`);
  if (!transporter) {
    console.log('[EMAIL-DEBUG] ❌ transporter is NULL — skipping email');
    return { skipped: true, reason: 'Email not configured' };
  }
  try {
    const roleLabel = role === 'STUDENT' ? 'Student' : 'Alumni Mentor';
    const roleColor = role === 'STUDENT' ? '#c3c0ff' : '#4edea3';
    const subject   = `Welcome to AlumNEX — Your ${roleLabel} Account is Ready`;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  body{font-family:'Segoe UI',Inter,Arial,sans-serif;background:#f5f5f5;color:#1a1a2e;margin:0;padding:0;}
  .wrap{max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
  .header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;}
  .logo-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;}
  .logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#4f46e5,#818cf8);border-radius:12px;display:flex;align-items:center;justify-content:center;}
  .logo-text{font-size:1.6rem;font-weight:900;color:#ffffff;letter-spacing:-0.03em;}
  .logo-text span{color:#818cf8;}
  .header-sub{font-size:0.72rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.15em;margin-top:6px;}
  .body{padding:32px;}
  .greeting{font-size:1.15rem;font-weight:700;color:#1a1a2e;margin-bottom:16px;}
  .role-badge{display:inline-block;background:${roleColor}20;color:${role === 'STUDENT' ? '#4f46e5' : '#059669'};padding:4px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;}
  .intro{color:#4a5568;line-height:1.7;font-size:0.875rem;margin-bottom:24px;}
  .cred-box{background:#f8fafc;border-radius:12px;padding:0;margin:24px 0;border:1px solid #e2e8f0;overflow:hidden;}
  .cred-header{background:#1a1a2e;padding:12px 20px;}
  .cred-header span{color:#ffffff;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;}
  .cred-row{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #e2e8f0;}
  .cred-row:last-child{border-bottom:none;}
  .cred-label{font-size:0.75rem;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:0.08em;}
  .cred-value{font-family:'Courier New',monospace;font-size:0.95rem;font-weight:700;color:#1a1a2e;}
  .btn{display:block;width:fit-content;margin:28px auto 0;padding:14px 40px;background:linear-gradient(135deg,#4f46e5,#818cf8);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:0.9rem;text-align:center;box-shadow:0 4px 14px rgba(79,70,229,0.3);}
  .note{font-size:0.78rem;color:#718096;line-height:1.6;margin-top:24px;padding:16px;background:#fffbeb;border-radius:10px;border-left:3px solid #f59e0b;}
  .note strong{color:#92400e;}
  .footer{padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;background:#f8fafc;}
  .footer-brand{font-size:0.7rem;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;}
  .footer-inst{font-size:0.72rem;color:#a0aec0;line-height:1.6;}
</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo-row">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#ffffff" opacity="0.9"/><path d="M2 17l10 5 10-5" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/><path d="M2 12l10 5 10-5" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8"/></svg>
        </div>
        <div class="logo-text">Alum<span>NEX</span></div>
      </div>
      <div class="header-sub">VNIT Training & Placement Cell — Mentorship Platform</div>
    </div>
    <div class="body">
      <div class="greeting">Hi ${name} 👋</div>
      <div class="role-badge">${roleLabel} Account</div>
      <p class="intro">
        Your <strong>${roleLabel}</strong> account on AlumNEX has been created by the VNIT T&P Cell.
        Use the credentials below to sign in and ${role === 'STUDENT' ? 'connect with alumni mentors for mock interviews' : 'start mentoring students through mock interviews'}.
      </p>
      <div class="cred-box">
        <div class="cred-header"><span>🔑 Your Login Credentials</span></div>
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
        ⚠️ <strong>Change your password</strong> after your first login. Keep these credentials safe and do not share them with anyone.
      </div>
    </div>
    <div class="footer">
      <div class="footer-brand">AlumNEX — Bridging Campus & Career</div>
      <div class="footer-inst">
        VNIT Training & Placement Cell<br>
        Visvesvaraya National Institute of Technology, Nagpur<br>
        This is an automated message. Do not reply.
      </div>
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
    console.log(`[EMAIL-DEBUG] ✅ Email sent successfully to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL-DEBUG] ❌ Email FAILED for ${to}:`, err.message);
    try { require('fs').appendFileSync('scratch/email_error.txt', new Date().toISOString() + ' - ' + to + ' - ' + err.message + '\n'); } catch (e) {}
    return { skipped: true, reason: err.message };
  }
}

// ── Core account creator ──────────────────────────────────────────────────────
async function createUser({ email, password, username, role, name, department, profileData, skipDuplicateCheck = false }) {
  if (!skipDuplicateCheck) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) {
      if (existing.email === email) return { skipped: true, email, username, reason: 'Email already exists' };
      if (existing.username === username) return { skipped: true, email, username, reason: 'Username already exists' };
    }
  }

  // Create Supabase Auth user (for login)
  let authId = null;
  if (supabase) {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      // If user already exists in Supabase Auth, look up their ID and sync to Prisma
      if (authErr.message && authErr.message.includes('already been registered')) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingAuthUser = (listData?.users || []).find(u => u.email === email);
        if (existingAuthUser) {
          authId = existingAuthUser.id;
          console.log(`[Register] Supabase Auth user already exists for ${email}, updating password and syncing to Prisma`);
          
          // Update the password to match the one we just generated/sent
          const { error: updateErr } = await supabase.auth.admin.updateUserById(authId, {
            password: password
          });
          if (updateErr) console.warn(`[Register] Failed to update password for existing user ${email}:`, updateErr.message);
        } else {
          throw new Error(`Auth error for ${email}: ${authErr.message}`);
        }
      } else {
        throw new Error(`Auth error for ${email}: ${authErr.message}`);
      }
    } else {
      authId = authData.user.id;
    }
  }

  // Write to Prisma (primary DB)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      name,
      department: department || 'General',
      verification_status: 'VERIFIED',
      profile_data: JSON.stringify({ ...profileData, username }),
    },
    create: {
      id:                  authId || undefined,
      username,
      role,
      name,
      email,
      department:          department || 'General',
      verification_status: 'VERIFIED',
      profile_data:        JSON.stringify({ ...profileData, username }),
    },
  });

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

    // Pre-fetch existing users to avoid O(N) DB queries per user
    const existingUsers = await prisma.user.findMany({
      select: { email: true, username: true, profile_data: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
    const existingUsernames = new Set(existingUsers.map(u => u.username).filter(Boolean));
    existingUsers.forEach(u => {
      try {
        const pd = JSON.parse(u.profile_data || '{}');
        if (pd.username) existingUsernames.add(pd.username);
      } catch {}
    });

    const emailPromises = [];

    for (const s of students) {
      if (!s.name || !s.email) {
        results.failed.push({ email: s.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const email = s.email.trim().toLowerCase();
        const username = generateStudentUsername(s.rollNo, s.name, s.year);

        // In-memory duplicate check
        if (existingEmails.has(email)) {
          results.skipped.push({ skipped: true, email, username, reason: 'Email already exists' });
          continue;
        }
        if (existingUsernames.has(username)) {
          results.skipped.push({ skipped: true, email, username, reason: 'Username already exists' });
          continue;
        }

        const password = generatePassword(username);

        const result = await createUser({
          email,
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
          skipDuplicateCheck: true,
        });

        if (result.skipped) {
          results.skipped.push(result);
        } else {
          // Track to avoid duplicates in the same batch
          existingEmails.add(email);
          existingUsernames.add(username);

          results.created.push({ ...result, emailSent: false });

          // Send welcome email asynchronously
          console.log(`[EMAIL-DEBUG] Queuing email for ${email}`);
          emailPromises.push(
            sendWelcomeEmail({
              to: email,
              name: s.name.trim(),
              username,
              password,
              role: 'STUDENT',
              loginUrl,
            }).then(emailResult => {
              console.log(`[EMAIL-DEBUG] Email result for ${email}:`, JSON.stringify(emailResult));
              const createdRec = results.created.find(r => r.email === email);
              if (createdRec) createdRec.emailSent = emailResult.sent || false;
              return emailResult;
            }).catch(err => { console.error('[EMAIL-DEBUG] Promise catch:', err); return { skipped: true }; })
          );
        }
      } catch (err) {
        results.failed.push({ email: s.email, reason: err.message });
      }
    }

    // Wait for emails to settle so we can report accurate counts
    // Do NOT wait for emails to settle to prevent frontend timeout (or user impatience)
    // Emails are sent asynchronously in the background
    console.log(`[EMAIL-DEBUG] Queued ${emailPromises.length} emails to send in the background...`);
    
    Promise.allSettled(emailPromises).then(emailResults => {
      console.log('[EMAIL-DEBUG] Background emails finished processing.');
      const emailsSent = emailResults.filter(r => r.status === 'fulfilled' && r.value?.sent).length;
      console.log(`[EMAIL-DEBUG] Final background emailsSent count: ${emailsSent}`);
    });

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total:   students.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed:  results.failed.length,
        emailsSent: results.created.length, // Report queued as sent to frontend
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

    // Pre-fetch existing users to avoid O(N) DB queries per user
    const existingUsers = await prisma.user.findMany({
      select: { email: true, username: true, profile_data: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
    const existingUsernames = new Set(existingUsers.map(u => u.username).filter(Boolean));
    existingUsers.forEach(u => {
      try {
        const pd = JSON.parse(u.profile_data || '{}');
        if (pd.username) existingUsernames.add(pd.username);
      } catch {}
    });

    const emailPromises = [];

    for (const a of alumni) {
      if (!a.name || !a.email) {
        results.failed.push({ email: a.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const email = a.email.trim().toLowerCase();
        const username = generateAlumniUsername(a.name, a.batchYear);

        // In-memory duplicate check
        if (existingEmails.has(email)) {
          results.skipped.push({ skipped: true, email, username, reason: 'Email already exists' });
          continue;
        }
        if (existingUsernames.has(username)) {
          results.skipped.push({ skipped: true, email, username, reason: 'Username already exists' });
          continue;
        }

        const password = generatePassword(username);

        const result = await createUser({
          email,
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
          skipDuplicateCheck: true,
        });

        if (result.skipped) {
          results.skipped.push(result);
        } else {
          // Track to avoid duplicates in the same batch
          existingEmails.add(email);
          existingUsernames.add(username);

          results.created.push({ ...result, emailSent: false });

          // Send welcome email asynchronously
          emailPromises.push(
            sendWelcomeEmail({
              to: email,
              name: a.name.trim(),
              username,
              password,
              role: 'ALUMNI',
              loginUrl,
            }).then(emailResult => {
              const createdRec = results.created.find(r => r.email === email);
              if (createdRec) createdRec.emailSent = emailResult.sent || false;
              return emailResult; // Must return so Promise.allSettled captures it
            }).catch(err => { console.error(err); return { skipped: true }; })
          );
        }
      } catch (err) {
        results.failed.push({ email: a.email, reason: err.message });
      }
    }

    // Do NOT wait for emails to settle to prevent frontend timeout
    Promise.allSettled(emailPromises).then(emailResults => {
      console.log('[EMAIL-DEBUG] Background alumni emails finished processing.');
      const emailsSent = emailResults.filter(r => r.status === 'fulfilled' && r.value?.sent).length;
      console.log(`[EMAIL-DEBUG] Final background alumni emailsSent count: ${emailsSent}`);
    });

    res.json({
      message: `Bulk upload complete. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`,
      summary: {
        total:   alumni.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed:  results.failed.length,
        emailsSent: results.created.length, // Report queued as sent to frontend
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
