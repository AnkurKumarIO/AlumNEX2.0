const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSnapshot() {
  try {
    const request = await prisma.interviewRequest.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('=== Latest Interview Request ===');
    console.log('ID:', request?.request_id);
    console.log('Student ID:', request?.student_id);
    console.log('Has snapshot:', !!request?.student_profile_snapshot);
    
    if (request?.student_profile_snapshot) {
      try {
        const snap = JSON.parse(request.student_profile_snapshot);
        console.log('\n=== Snapshot Contents ===');
        console.log('Has photoPreview:', !!snap.photoPreview);
        console.log('Photo length:', snap.photoPreview?.length || 0);
        console.log('Photo starts with:', snap.photoPreview?.substring(0, 50));
        console.log('Has resumeUrl:', !!snap.resumeUrl);
        console.log('Resume length:', snap.resumeUrl?.length || 0);
        console.log('Has name:', !!snap.name);
        console.log('Has bio:', !!snap.bio);
        console.log('Has skills:', !!snap.skills);
      } catch (e) {
        console.error('Error parsing snapshot:', e.message);
      }
    } else {
      console.log('No snapshot found!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSnapshot();
