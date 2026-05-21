/**
 * Clears all interview-related records for testing.
 * Uses Prisma (already configured with DATABASE_URL).
 * Run: node scratch/clear_interview_data.js  (from backend/ directory)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAll() {
  console.log('🗑️  Clearing interview data...\n');

  // Order matters — delete dependents before parents
  const steps = [
    { label: 'SessionFeedback',   fn: () => prisma.sessionFeedback.deleteMany({}) },
    { label: 'InterviewRecord',   fn: () => prisma.interviewRecord.deleteMany({}) },
    { label: 'Notification',      fn: () => prisma.notification.deleteMany({}) },
    { label: 'InterviewRequest',  fn: () => prisma.interviewRequest.deleteMany({}) },
  ];

  for (const step of steps) {
    try {
      const result = await step.fn();
      console.log(`  ✅ ${step.label}: deleted ${result.count} rows`);
    } catch (e) {
      console.error(`  ❌ ${step.label}: ${e.message}`);
    }
  }

  console.log('\n✅ Database cleared.');
  console.log('\nAlso run this in your browser console to clear local state:');
  console.log('  localStorage.removeItem("alumnex_interview_requests")');
  console.log('  localStorage.removeItem("alumniconnect_student_notifications")');
}

clearAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
