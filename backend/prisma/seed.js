/**
 * Seed script — populates ActivityLog and PlatformConfig tables with initial data.
 * Run: node prisma/seed.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Activity Logs ────────────────────────────────────────────────────────
  const existingLogs = await prisma.activityLog.count();
  if (existingLogs === 0) {
    await prisma.activityLog.createMany({
      data: [
        { icon: 'person_add',           color: '#4edea3', title: 'New Alumni Mentor Added',      desc: 'Priya Sharma (Google) account created via bulk upload.',                    category: 'Alumni' },
        { icon: 'school',               color: '#c3c0ff', title: 'Student Batch Uploaded',        desc: '47 students from Batch 2025 added to the platform.',                        category: 'Student' },
        { icon: 'event_available',      color: '#ffb95f', title: '12 Sessions Completed',         desc: 'Mock interview batch for System Design concluded successfully.',              category: 'Interview' },
        { icon: 'handshake',            color: '#c3c0ff', title: 'Mentorship Match Created',      desc: 'Rohan Verma (Student) matched with Neha Gupta (Alumni, Airbnb).',            category: 'Mentorship' },
        { icon: 'star',                 color: '#ffb95f', title: 'Top Mentor Recognised',         desc: 'Amit Joshi (Microsoft) rated 4.9/5 across 32 mentorship sessions.',          category: 'Mentorship' },
        { icon: 'psychology',           color: '#4edea3', title: 'Alumni Mentor Onboarded',       desc: 'Dr. Elena Rodriguez (PhD AI Ethics) completed profile setup.',               category: 'Alumni' },
        { icon: 'event_repeat',         color: '#c3c0ff', title: 'Session Rescheduled',           desc: 'Mock interview for Kavya Nair rescheduled to Oct 18th at 3:00 PM.',          category: 'Interview' },
        { icon: 'group_add',            color: '#60a5fa', title: 'Batch 2025 Onboarding',         desc: '47 new students from Batch 2025 completed profile setup.',                   category: 'Student' },
        { icon: 'cancel',               color: '#ffb4ab', title: 'Session Cancelled',             desc: 'Interview session between Arjun M. and Rahul V. was cancelled.',             category: 'Interview' },
        { icon: 'analytics',            color: '#c3c0ff', title: 'Weekly Report Generated',       desc: 'Mentorship analytics report for Week 41 auto-generated.',                    category: 'System' },
        { icon: 'notifications_active', color: '#4edea3', title: 'Session Reminder Sent',         desc: 'Automated reminder sent to 34 students with upcoming sessions.',              category: 'System' },
        { icon: 'login',                color: '#c7c4d8', title: 'TNP Login',                     desc: 'Coordinator logged in from 192.168.1.10.',                                   category: 'System' },
      ],
    });
    console.log('  ✓ Activity logs seeded');
  } else {
    console.log('  ⊘ Activity logs already exist, skipping');
  }

  // ── Platform Config ──────────────────────────────────────────────────────
  const configs = [
    {
      key: 'interview_domains',
      value: JSON.stringify([
        { domain: 'System Design',   count: 34 },
        { domain: 'Frontend',        count: 28 },
        { domain: 'Backend',         count: 22 },
        { domain: 'Data Science',    count: 18 },
        { domain: 'DevOps',          count: 12 },
        { domain: 'Product',         count: 8  },
      ]),
    },
    {
      key: 'engagement_summary',
      value: JSON.stringify({
        active_matches: 24,
        completion_rate: 89,
      }),
    },
    {
      key: 'category_colors',
      value: JSON.stringify({
        Alumni:     '#4edea3',
        Student:    '#60a5fa',
        Interview:  '#ffb95f',
        Mentorship: '#f472b6',
        System:     '#94a3b8',
      }),
    },
  ];

  for (const c of configs) {
    await prisma.platformConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: { key: c.key, value: c.value },
    });
  }
  console.log('  ✓ Platform config seeded');

  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
