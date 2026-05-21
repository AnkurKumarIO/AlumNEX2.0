const { test, expect } = require('@playwright/test');

test.describe('Meeting Link Verification', () => {
  const requestId = 'req-1234567890';
  const expectedRoomId = `room-34567890`; // last 8 chars
  const studentName = 'Kanak';
  const alumniName = 'Senior';

  test('Student and Alumni see the same meeting link', async ({ page }) => {
    const now = Date.now();
    const scheduledTime = new Date(now + 2 * 60 * 1000).toISOString(); // 2 minutes from now

    const mockRequest = {
      id: requestId,
      studentName: studentName,
      studentId: 'stu-1',
      alumniName: alumniName,
      alumniId: 'alm-1',
      topic: 'Mock Interview',
      status: 'slot_booked',
      scheduledTime: scheduledTime,
      roomId: expectedRoomId,
      createdAt: new Date(now - 3600000).toISOString(),
    };

    const mockNotification = {
      id: 'notif-1',
      studentName: studentName,
      type: 'slot_booked',
      title: 'Interview Scheduled',
      message: `Your interview with ${alumniName} has been scheduled.`,
      requestId: requestId,
      read: false,
      createdAt: new Date(now - 60000).toISOString(),
    };

    // 1. Check Student Dashboard
    await page.goto('http://localhost:5173/login');
    await page.evaluate(({ studentName, mockRequest, mockNotification }) => {
      localStorage.setItem('alumniconnect_user', JSON.stringify({ name: studentName, role: 'STUDENT', id: 'stu-1' }));
      localStorage.setItem('alumnex_interview_requests', JSON.stringify([mockRequest]));
      localStorage.setItem('alumniconnect_student_notifications', JSON.stringify([mockNotification]));
    }, { studentName, mockRequest, mockNotification });

    await page.goto('http://localhost:5173/dashboard');
    // Click on Messages tab to see notifications
    await page.click('text=Messages');

    // Wait for "Join Now" button
    const studentJoinButton = page.locator('text=Join Now');
    await expect(studentJoinButton).toBeVisible({ timeout: 10000 });
    const studentJoinUrl = await studentJoinButton.getAttribute('href');
    console.log('Student Join URL:', studentJoinUrl);
    expect(studentJoinUrl).toContain(`/interview/${expectedRoomId}`);
    expect(studentJoinUrl).toContain(`name=${encodeURIComponent(studentName)}`);

    // 2. Check Alumni Dashboard
    await page.evaluate(({ alumniName, mockRequest }) => {
      localStorage.clear();
      localStorage.setItem('alumniconnect_user', JSON.stringify({ name: alumniName, role: 'ALUMNI', id: 'alm-1' }));
      localStorage.setItem('alumnex_interview_requests', JSON.stringify([mockRequest]));
    }, { alumniName, mockRequest });

    await page.goto('http://localhost:5173/alumni-dashboard');
    // Go to Requests tab
    await page.click('text=Requests');

    // Wait for "Join Now" button
    const alumniJoinButton = page.locator('text=Join Now');
    await expect(alumniJoinButton).toBeVisible({ timeout: 10000 });
    const alumniJoinUrl = await alumniJoinButton.getAttribute('href');
    console.log('Alumni Join URL:', alumniJoinUrl);
    expect(alumniJoinUrl).toContain(`/interview/${expectedRoomId}`);
    expect(alumniJoinUrl).toContain(`name=${encodeURIComponent(alumniName)}`);

    // Verify consistency
    const studentBaseLink = studentJoinUrl.split('?')[0];
    const alumniBaseLink = alumniJoinUrl.split('?')[0];
    expect(studentBaseLink).toBe(alumniBaseLink);
    console.log('Verification Successful: Both links point to', studentBaseLink);
  });
});
