const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const supabase = require('../supabase');
const { authenticate, verifyRole } = require('../lib/authMiddleware');

const tnpOnly = [authenticate, verifyRole('TNP')];

function parseProfileData(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// DELETE /users/bulk — delete multiple users
router.delete('/bulk', tnpOnly, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    // 1. Delete from Supabase Auth
    if (supabase) {
      for (const id of ids) {
        // Basic UUID check
        if (id && id.length >= 32) {
          await supabase.auth.admin.deleteUser(id).catch(e => console.warn(`Supabase delete error for ${id}:`, e.message));
        }
      }
    }

    // 2. Delete from Prisma
    const deleted = await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({ message: 'Users deleted successfully', count: deleted.count });
  } catch (err) {
    console.error('Bulk delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/ban — ban or unban a user
router.patch('/ban', tnpOnly, async (req, res) => {
  try {
    const { userId, isBanned } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { is_banned: !!isBanned }
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/banned — list all banned users
router.get('/banned', tnpOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { is_banned: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id/profile — save full profile data (upserts if user not found)
router.patch('/:id/profile', async (req, res) => {
  try {
    const id = req.params.id;
    const incoming = req.body;

    // Upsert: update if exists, create if not (handles Supabase-only users)

    // Try to find existing user first so we can preserve their data
    let existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      // Determine a safe email (avoid unique constraint collision)
      let safeEmail = incoming.email || `${id}@placeholder.local`;
      if (incoming.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email: incoming.email } });
        if (emailTaken) safeEmail = `${id}@placeholder.local`;
      }
      existingUser = await prisma.user.upsert({
        where: { id },
        update: {},
        create: {
          id,
          role:                incoming.role || 'STUDENT',
          name:                incoming.name || 'User',
          email:               safeEmail,
          department:          incoming.department || 'General',
          verification_status: 'VERIFIED',
          profile_data:        '{}',
        },
      });
      console.log(`[users] Auto-created Prisma record for user ${id}`);
    }

    const isVerified = existingUser.verification_status === 'VERIFIED';
    const isAlumni = existingUser.role === 'ALUMNI';
    const existingProfileData = parseProfileData(existingUser.profile_data);

    // Determine final name, email, department (columns on user table)
    let finalName = existingUser.name;
    let finalEmail = existingUser.email;
    let finalDepartment = existingUser.department;

    if (!isVerified) {
      if (incoming.name) finalName = incoming.name;
      if (incoming.email) finalEmail = incoming.email;
      if (incoming.department) finalDepartment = incoming.department;
    }

    // Merge new fields into existing profile_data JSON object
    const profileDataObj = { ...existingProfileData };

    // Update non-verified fields if present in request body
    const nonVerifiedFields = [
      'bio', 'linkedin', 'github', 'portfolio', 'skills', 'cgpa',
      'resumeName', 'resumeUrl', 'photoPreview', 'projects', 'targetRoles',
      'preferredCompanies', 'openTo', 'gradMonth', 'gradYear', 'experience', 'domain',
      'phone', 'notification_preferences',
    ];

    nonVerifiedFields.forEach(f => {
      if (incoming[f] !== undefined) {
        profileDataObj[f] = incoming[f];
      }
    });

    // Update verified fields only if user is NOT verified
    const verifiedStudentFields = ['college', 'year', 'rollNo'];
    const verifiedAlumniFields = ['company', 'jobTitle', 'currentTitle', 'batchYear', 'passOutYear', 'sector'];

    if (!isVerified) {
      verifiedStudentFields.forEach(f => {
        if (incoming[f] !== undefined) profileDataObj[f] = incoming[f];
      });
      verifiedAlumniFields.forEach(f => {
        if (incoming[f] !== undefined) profileDataObj[f] = incoming[f];
      });
    } else {
      // If verified, enforce database values for locked fields in profile_data
      profileDataObj.name = finalName;
      profileDataObj.email = finalEmail;
      profileDataObj.department = finalDepartment;

      if (isAlumni) {
        profileDataObj.company = existingProfileData.company || '';
        profileDataObj.jobTitle = existingProfileData.jobTitle || existingProfileData.currentTitle || '';
        profileDataObj.currentTitle = existingProfileData.currentTitle || existingProfileData.jobTitle || '';
        profileDataObj.batchYear = existingProfileData.batchYear || existingProfileData.passOutYear || '';
        profileDataObj.passOutYear = existingProfileData.passOutYear || existingProfileData.batchYear || '';
        profileDataObj.sector = existingProfileData.sector || '';
      } else {
        profileDataObj.college = existingProfileData.college || '';
        profileDataObj.year = existingProfileData.year || '';
        profileDataObj.rollNo = existingProfileData.rollNo || '';
      }
    }

    profileDataObj.profileCompletedAt = new Date().toISOString();

    const updates = {
      name: finalName,
      email: finalEmail,
      department: finalDepartment,
      profile_data: JSON.stringify(profileDataObj)
    };

    const user = await prisma.user.update({ where: { id }, data: updates });

    res.json({ message: 'Profile saved', user: { ...user, profile_data: JSON.parse(user.profile_data || '{}') } });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = {
      ...user,
      profile_data: parseProfileData(user.profile_data)
    };

    res.json(result);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /users/by-email/:email
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = {
      ...user,
      profile_data: parseProfileData(user.profile_data)
    };

    res.json(result);
  } catch (err) {
    console.error('Fetch user by email error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /users/:id/rating — store an interviewer rating for a candidate
router.post('/:id/rating', async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { rating, feedback, interviewerName, interviewerId, roomId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Try to find the candidate by id or by name
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: candidateId } });
    } catch (_) {}

    // If not found by id, try finding by name (candidateId might be a name string)
    if (!user) {
      try {
        user = await prisma.user.findFirst({ where: { name: candidateId } });
      } catch (_) {}
    }

    const ratingEntry = {
      rating: Number(rating),
      feedback: feedback || '',
      interviewerName: interviewerName || 'Anonymous',
      interviewerId: interviewerId || null,
      roomId: roomId || null,
      date: new Date().toISOString(),
    };

    if (user) {
      // Append rating to profile_data
      const profileData = parseProfileData(user.profile_data);
      if (!profileData.ratings) profileData.ratings = [];
      profileData.ratings.unshift(ratingEntry);

      // Calculate average rating
      const allRatings = profileData.ratings.map(r => r.rating);
      profileData.averageRating = Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
      profileData.totalRatings = allRatings.length;

      await prisma.user.update({
        where: { id: user.id },
        data: { profile_data: JSON.stringify(profileData) },
      });

      res.json({ success: true, message: 'Rating saved', averageRating: profileData.averageRating, totalRatings: profileData.totalRatings });
    } else {
      // User not in DB — still return success (rating stored in localStorage on frontend)
      console.warn(`[Rating] Candidate "${candidateId}" not found in DB — rating stored client-side only`);
      res.json({ success: true, message: 'Rating acknowledged (candidate not in DB)', clientOnly: true });
    }
  } catch (err) {
    console.error('Rating save error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
