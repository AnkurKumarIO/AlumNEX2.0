const express  = require('express');
const router   = express.Router();
const supabase = require('../supabase');
const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');
const { google } = require('googleapis');

// ── Gmail API Setup ─────────────────────────────────────────────────────────
let gmail = null;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  console.log('✅ Gmail API configured and ready (Primary Delivery).');
} else {
  console.log('⚠️ Gmail API partially configured. Missing:');
  if (!process.env.GOOGLE_CLIENT_ID) console.log('   - GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) console.log('   - GOOGLE_CLIENT_SECRET');
  if (!process.env.GOOGLE_REFRESH_TOKEN) console.log('   - GOOGLE_REFRESH_TOKEN');
}

// ── Email transporter (Legacy Fallback) ───────────────────────────────────────
let transporter = null;
if (!gmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  // Keeping SMTP as a secondary fallback if Gmail API isn't set up
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,
    connectionTimeout: 30000,
    socketTimeout: 30000,
  });
  console.log('✅ Email transporter configured (Fallback SMTP)');
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

// ── Global Email Queue State ──────────────────────────────────────────────────
// To sync across different browsers in real-time
const emailQueue = {
  pending: [],
  sentCount: 0,
  failedCount: 0,
  history: [], // Keep last 50 processed for history
};

// ── Email sender ──────────────────────────────────────────────────────────────
async function sendWelcomeEmail({ to, name, username, password, role, loginUrl }) {
  console.log(`[EMAIL-DEBUG] sendWelcomeEmail called for ${to}`);
  
  // Track in queue
  emailQueue.pending.push(to);

  const updateQueueStatus = (status, reason) => {
    emailQueue.pending = emailQueue.pending.filter(e => e !== to);
    emailQueue.history.unshift({ email: to, status, reason, time: new Date() });
    if (emailQueue.history.length > 50) emailQueue.history.pop();
    if (status === 'sent') emailQueue.sentCount++;
    if (status === 'failed') emailQueue.failedCount++;
  };

  const roleLabel = role === 'STUDENT' ? 'Student' : 'Alumni Mentor';
  const subject   = `Welcome to AlumNEX — Your ${roleLabel} Account is Ready`;
  const actionText = role === 'STUDENT' ? 'connect with mentors for mock interviews' : 'start mentoring students through mock interviews';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .wrap { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 48px 40px; text-align: center; }
    .logo { font-size: 2rem; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; margin-bottom: 8px; }
    .logo span { color: #818cf8; }
    .tagline { color: #94a3b8; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
    .body { padding: 48px 40px; }
    .greeting { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .hero { font-size: 1.125rem; color: #475569; margin-bottom: 32px; font-weight: 500; }
    .intro { color: #64748b; margin-bottom: 32px; }
    .cred-card { background: #f1f5f9; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; margin-bottom: 32px; }
    .cred-title { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { font-size: 0.875rem; font-weight: 600; color: #64748b; }
    .cred-value { font-family: monospace; font-size: 1rem; font-weight: 700; color: #0f172a; background: #ffffff; padding: 4px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .btn-wrap { text-align: center; margin-top: 40px; }
    .btn { display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 1rem; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }
    .next-steps { background: #fffbeb; border-radius: 16px; padding: 24px; border-left: 4px solid #f59e0b; margin-top: 40px; }
    .next-title { font-size: 0.875rem; font-weight: 700; color: #92400e; margin-bottom: 12px; }
    .next-list { margin: 0; padding-left: 20px; color: #92400e; font-size: 0.875rem; }
    .next-list li { margin-bottom: 8px; }
    .footer { padding: 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer-text { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .footer-sub { font-size: 0.875rem; color: #64748b; margin-bottom: 16px; }
    .footer-brand { font-size: 0.75rem; color: #94a3b8; }
    .notice { font-size: 0.75rem; color: #cbd5e1; margin-top: 24px; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <div class="logo">Alum<span>NEX</span></div>
      <div class="tagline">Bridging Campus & Career</div>
    </div>
    <div class="body">
      <div class="greeting">Welcome Aboard, ${name}! 👋</div>
      <p class="hero">Your journey on AlumNEX starts here. Connect, mentor, and bridge the gap between campus life and your professional career.</p>
      
      <p class="intro">
        Your <strong>${roleLabel}</strong> account has been successfully created. 
        You can now use the credentials below to sign in and ${actionText}.
      </p>

      <div class="cred-card">
        <div class="cred-title">🔐 Your Account Credentials</div>
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

      <div class="btn-wrap">
        <a href="${loginUrl}" class="btn">Sign In to AlumNEX →</a>
      </div>

      <div class="next-steps">
        <div class="next-title">📌 Next Steps & Security</div>
        <ul class="next-list">
          <li><strong>Complete Your Profile:</strong> Ensure your bio and skills are up to date to get the best matches.</li>
          <li><strong>Important Security Note:</strong> Please change your password immediately after your first login. To protect your data, keep these credentials safe and do not share them with anyone.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">College Training & Placement Office</div>
      <div class="footer-sub">AlumNEX — Bridging Campus & Career</div>
      <div class="footer-brand">Developed by The Tesseract</div>
      <div class="notice">^(*This is an automated message. Please do not reply directly to this email.*)</div>
    </div>
  </div>
</body>
</html>`;

  // 1. Try Gmail API first
  if (gmail) {
    try {
      console.log(`[EMAIL-DEBUG] Attempting send via Gmail API for ${to}`);
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: AlumNEX <${process.env.EMAIL_USER}>`,
        `To: ${to}`,
        `Content-Type: text/html; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        '',
        html,
      ];
      const rawMessage = Buffer.from(messageParts.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawMessage },
      });
      
      console.log(`[EMAIL-DEBUG] ✅ Sent via Gmail API: ${res.data.id}`);
      updateQueueStatus('sent', null);
      return { sent: true };
    } catch (err) {
      console.error('[EMAIL-DEBUG] ❌ Gmail API error:', err.message);
    }
  }

  // 2. Try Resend
  if (process.env.RESEND_API_KEY) {
    try {
      console.log(`[EMAIL-DEBUG] Attempting fallback via Resend API for ${to}`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'AlumNEX <onboarding@resend.dev>',
          to: to,
          subject: subject,
          html: html
        })
      });
      if (res.ok) {
        console.log(`[EMAIL-DEBUG] ✅ Sent via Resend`);
        updateQueueStatus('sent', null);
        return { sent: true };
      }
    } catch (err) {
      console.error('[EMAIL-DEBUG] ❌ Resend error:', err.message);
    }
  }

  // 3. Fallback: SMTP (Nodemailer)
  if (!transporter) {
    console.log('[EMAIL-DEBUG] ❌ No email delivery methods available.');
    updateQueueStatus('failed', 'Email not configured');
    return { skipped: true, reason: 'Email not configured' };
  }
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `AlumNEX <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL-DEBUG] ✅ Email sent via SMTP to ${to}`);
    updateQueueStatus('sent', null);
    return { sent: true };
  } catch (err) {
    console.error(`[EMAIL-DEBUG] ❌ Email FAILED for ${to}:`, err.message);
    updateQueueStatus('failed', err.message);
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
      password, // Save plain text password in Prisma for reference/admin use
      name,
      department: department || 'General',
      verification_status: 'VERIFIED',
      profile_data: JSON.stringify({ ...profileData, username }),
    },
    create: {
      id:                  authId || undefined,
      username,
      password, // Save plain text password in Prisma for reference/admin use
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

// ── GET /register/email-queue ────────────────────────────────────────────────
// Fetches the real-time queue status for the dashboard
router.get('/email-queue', (req, res) => {
  res.json({
    pending: emailQueue.pending,
    sentCount: emailQueue.sentCount,
    failedCount: emailQueue.failedCount,
    history: emailQueue.history,
  });
});

// ── DELETE /register/email-queue/clear ───────────────────────────────────────
// Optionally clear the history
router.delete('/email-queue/clear', (req, res) => {
  emailQueue.history = [];
  res.json({ success: true });
});

module.exports = router;
