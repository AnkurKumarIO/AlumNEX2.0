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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to AlumNEX</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .main-wrap { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .sec-header { padding: 32px 20px !important; }
      .sec-body { padding: 32px 20px !important; }
      .cred-inner { padding: 20px !important; }
      .cred-row { display: block !important; width: 100% !important; }
      .cred-label { display: block !important; width: 100% !important; margin-bottom: 6px !important; }
      .cred-value { display: block !important; width: 100% !important; }
      .btn-link { width: 100% !important; box-sizing: border-box !important; }
      .sec-footer { padding: 32px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4F7FA;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td align="center" valign="top" width="600"><![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E9F0;box-shadow:0 4px 20px rgba(0,0,0,0.05);" class="main-wrap">

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:48px 40px;background-color:#2C3647;" class="sec-header">
              <div style="font-size:32px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;margin-bottom:8px;">Alum<span style="color:#818CF8;">NEX</span></div>
              <div style="color:#94A3B8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Intelligence Platform</div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 40px 40px 40px;" class="sec-body">

              <!-- Greeting -->
              <p style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#0F172A;">Welcome Aboard, ${name}! 👋</p>

              <!-- Intro -->
              <p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#64748B;">Your journey on AlumNEX starts here.</p>
              <p style="margin:0 0 32px 0;font-size:14px;line-height:22px;color:#64748B;">Your <strong>${roleLabel}</strong> account has been successfully created. You can now use the credentials below to sign in and ${actionText}.</p>

              <!-- Credentials Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:36px;">
                <tr>
                  <td style="padding:32px;" class="cred-inner">
                    <p style="margin:0 0 24px 0;font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:1px;">🔐 YOUR ACCOUNT CREDENTIALS</p>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <!-- Username -->
                      <tr>
                        <td style="padding:0 0 16px 0;border-bottom:1px solid #E2E8F0;" class="cred-row">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="100" style="font-size:14px;font-weight:600;color:#64748B;" class="cred-label">Username</td>
                              <td align="left">
                                <div style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:10px 14px;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:700;color:#0F172A;display:block;width:100%;box-sizing:border-box;">${username}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Password -->
                      <tr>
                        <td style="padding:16px 0;border-bottom:1px solid #E2E8F0;" class="cred-row">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="100" style="font-size:14px;font-weight:600;color:#64748B;" class="cred-label">Password</td>
                              <td align="left">
                                <div style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:10px 14px;font-family:'Courier New',Courier,monospace;font-size:15px;font-weight:700;color:#0F172A;display:block;width:100%;box-sizing:border-box;">${password}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Role -->
                      <tr>
                        <td style="padding:16px 0 0 0;" class="cred-row">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="100" style="font-size:14px;font-weight:600;color:#64748B;" class="cred-label">Role</td>
                              <td align="left">
                                <div style="background-color:#FFFFFF;border:1px solid #E2E8F0;border-radius:6px;padding:10px 14px;font-size:15px;font-weight:700;color:#0F172A;display:block;width:100%;box-sizing:border-box;">${roleLabel}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;padding:16px 40px;background-color:#6366F1;color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;" class="btn-link">Sign In to AlumNEX &rarr;</a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FFFBEB;border-radius:12px;border-left:4px solid #F59E0B;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px 0;font-size:14px;font-weight:700;color:#92400E;">📌 Next Steps &amp; Security</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" style="padding:0 8px 8px 0;font-size:14px;color:#92400E;">&bull;</td>
                        <td style="padding:0 0 8px 0;font-size:13px;line-height:20px;color:#92400E;"><strong>Complete Your Profile:</strong> Ensure your bio and skills are up to date to get the best matches.</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:0 8px 0 0;font-size:14px;color:#92400E;">&bull;</td>
                        <td style="padding:0;font-size:13px;line-height:20px;color:#92400E;"><strong>Important Security Note:</strong> Please change your password immediately after your first login. To protect your data, keep these credentials safe and do not share them with anyone.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:40px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;" class="sec-footer">
              <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#0F172A;">College Training &amp; Placement Office</p>
              <p style="margin:0 0 16px 0;font-size:13px;color:#64748B;">AlumNEX &mdash; Intelligence Platform</p>
              <p style="margin:0 0 24px 0;font-size:12px;color:#94A3B8;">Developed by The Tesseract</p>
              <p style="margin:0;font-size:11px;color:#CBD5E1;font-style:italic;">This is an automated message. Please do not reply directly to this email.</p>
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
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

    // Pre-fetch existing users to build dedup sets
    const existingUsers = await prisma.user.findMany({
      select: { email: true, username: true, profile_data: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Build a set of existing roll numbers — the PRIMARY dedup criteria
    const existingRollNos = new Set();
    existingUsers.forEach(u => {
      // Roll number stored in profile_data.rollNo
      try {
        const pd = JSON.parse(u.profile_data || '{}');
        if (pd.rollNo) existingRollNos.add(pd.rollNo.trim().toUpperCase());
      } catch {}
      // Username is also the roll number for students
      if (u.username) existingRollNos.add(u.username.trim().toUpperCase());
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
        const rollNo = (s.rollNo || username).trim().toUpperCase();

        // PRIMARY check: Roll number dedup
        if (existingRollNos.has(rollNo)) {
          results.skipped.push({ skipped: true, email, username, rollNo, reason: 'Roll number already exists' });
          continue;
        }

        // SECONDARY check: Email dedup
        if (existingEmails.has(email)) {
          results.skipped.push({ skipped: true, email, username, rollNo, reason: 'Email already exists' });
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
          // Track to avoid duplicates within the same batch
          existingEmails.add(email);
          existingRollNos.add(rollNo);

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

    // Do NOT wait for emails to settle to prevent frontend timeout
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
        emailsSent: results.created.length,
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

    // Pre-fetch existing emails for dedup
    const existingUsers = await prisma.user.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    const emailPromises = [];

    for (const a of alumni) {
      if (!a.name || !a.email) {
        results.failed.push({ email: a.email || '?', reason: 'name and email are required' });
        continue;
      }
      try {
        const email = a.email.trim().toLowerCase();
        const username = generateAlumniUsername(a.name, a.batchYear);

        // Dedup by email only for alumni
        if (existingEmails.has(email)) {
          results.skipped.push({ skipped: true, email, username, reason: 'Email already exists' });
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
