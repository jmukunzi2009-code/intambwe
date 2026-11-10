const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('INTAMBWE Full Platform End-to-End Integration Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('PASSED ✓');
      passed++;
    } catch (err) {
      console.log('FAILED ✗');
      console.error('  Error:', err.message);
      failed++;
    }
  }

  // 1. Test Homepage
  await test('Public Homepage (GET /)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes('Every Step Creates a Leader'));
    assert(html.includes('INTAMBWE'));
  });

  // 2. Test Stats API
  await test('Stats API (GET /api/stats)', async () => {
    const res = await fetch(`${BASE_URL}/api/stats`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.totalSchools >= 5);
    assert(data.totalMeetings >= 2);
    assert(data.totalArticles >= 8);
  });

  // 3. Test Articles API
  await test('Articles API (GET /api/articles)', async () => {
    const res = await fetch(`${BASE_URL}/api/articles`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.articles.length >= 8, 'Should have all 8 leadership pillars');
    assert(data.categories.length === 8);
  });

  // 4. Test Single Article
  let articleId = null;
  await test('Single Article (GET /api/articles/architecture-of-self-leadership)', async () => {
    const res = await fetch(`${BASE_URL}/api/articles/architecture-of-self-leadership`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.article.slug, 'architecture-of-self-leadership');
    assert(data.article.learning_objectives.length > 0);
    articleId = data.article.id;
  });

  // 5. Test Meetings API
  await test('Meetings API (GET /api/meetings)', async () => {
    const res = await fetch(`${BASE_URL}/api/meetings`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.meetings.length >= 2);
  });

  // 6. Test Single Meeting with Agenda & Speakers
  let meetingId = null;
  await test('Single Meeting Details with Agenda & Speakers', async () => {
    const resAll = await fetch(`${BASE_URL}/api/meetings`);
    const all = await resAll.json();
    meetingId = all.meetings[0].id;

    const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.meeting.id === meetingId);
    assert(Array.isArray(data.agenda));
  });

  // 7. Test Contact Form Submission
  await test('Contact Form Submission (POST /api/contact)', async () => {
    const res = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Delegate',
        email: 'delegate.test@ldk.rw',
        phone: '+250788123456',
        subject: 'Inquiry regarding Leadership Summit Agenda',
        message: 'Hello, our school student council would like to confirm delegate seat allocations.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 8. Test Student Self-Registration
  const testStudentEmail = `student_${Date.now()}@test.rw`;
  let studentCookie = '';
  await test('Student Registration (POST /api/auth/register)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Keza Diane',
        email: testStudentEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        school: 'Green Hills Academy',
        classLevel: 'Senior 5 MPC',
        country: 'Rwanda',
        preferredLanguage: 'English',
        phone: '+250788999888',
        agreeTerms: true,
      }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('intambwe_session='));
    studentCookie = setCookie.split(';')[0];
    const data = await res.json();
    assert.strictEqual(data.user.role, 'student');
  });

  // 9. Test Student Conference Registration
  await test('Conference Registration by Student', async () => {
    const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 10. Test Duplicate Conference Registration Prevention
  await test('Conference Registration Duplicate Prevention', async () => {
    const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
    });
    assert.strictEqual(res.status, 409); // Conflict / Already registered
  });

  // 11. Test Student Private Journal Entry
  await test('Student Leadership Journal (POST /api/journal)', async () => {
    const res = await fetch(`${BASE_URL}/api/journal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
      body: JSON.stringify({
        title: 'My Growth in Ethical Responsibility',
        lessonReflected: 'Self-Leadership Framework',
        reflectionContent: 'Today I reflected on how my small daily habits build character.',
        actionCommitment: 'I will prepare an agenda before every school council meeting.',
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.journal.title, 'My Growth in Ethical Responsibility');
  });

  // 12. Test Super Admin Login with Environment Credentials
  let adminCookie = '';
  await test('Super Admin Authentication (POST /api/auth/login)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jmukunzi2009@gmail.com',
        password: 'godson2009',
      }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('intambwe_session='));
    adminCookie = setCookie.split(';')[0];
    const data = await res.json();
    assert.strictEqual(data.user.role, 'super_admin');
    assert.strictEqual(data.redirectTo, '/dashboard/admin');
  });

  // 13. Test Attendance Marking by Super Admin
  await test('Attendance Marking (POST /api/meetings/[id]/attendance)', async () => {
    const attListRes = await fetch(`${BASE_URL}/api/meetings/${meetingId}/attendance`, {
      headers: { 'Cookie': adminCookie },
    });
    assert.strictEqual(attListRes.status, 200);
    const attData = await attListRes.json();
    assert(attData.participants.length > 0);
    const studentAttendee = attData.participants.find(p => p.email === testStudentEmail);
    assert(studentAttendee, 'Student should be in attendance list');

    const markRes = await fetch(`${BASE_URL}/api/meetings/${meetingId}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
      body: JSON.stringify({
        userId: studentAttendee.user_id,
        status: 'present',
        notes: 'Arrived on time with school council delegation.',
      }),
    });
    assert.strictEqual(markRes.status, 200);
    const markData = await markRes.json();
    assert.strictEqual(markData.record.status, 'present');
  });

  // 14. Test Staff Creation by Super Admin
  const staffEmail = `eventmanager_${Date.now()}@intambwe.org`;
  await test('Staff Account Creation by Super Admin (POST /api/users)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
      body: JSON.stringify({
        fullName: 'Aimable Ndayisaba',
        email: staffEmail,
        password: 'StaffPassword2026!',
        role: 'event_manager',
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.user.role, 'event_manager');
  });

  // 15. Test Unauthorized Access Prevention (Student trying to create staff)
  await test('Role Security: Student Forbidden from Creating Staff', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
      body: JSON.stringify({
        fullName: 'Hacker Attempt',
        email: 'hack@test.rw',
        password: 'password',
        role: 'super_admin',
      }),
    });
    assert.strictEqual(res.status, 403); // Forbidden
  });

  // 16. Test Newsletter Subscription
  await test('Newsletter Subscription (POST /api/newsletter)', async () => {
    const res = await fetch(`${BASE_URL}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `subscriber_${Date.now()}@ldk.rw` }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 17. Test Student Learning Progress Tracking
  await test('Student Learning Progress Tracking (POST & GET /api/learning)', async () => {
    const toggleRes = await fetch(`${BASE_URL}/api/learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
      body: JSON.stringify({ articleId }),
    });
    assert.strictEqual(toggleRes.status, 200);
    const toggleData = await toggleRes.json();
    assert.strictEqual(toggleData.success, true);
    assert.strictEqual(toggleData.isCompleted, true);

    const getRes = await fetch(`${BASE_URL}/api/learning`, {
      headers: { 'Cookie': studentCookie },
    });
    assert.strictEqual(getRes.status, 200);
    const getData = await getRes.json();
    assert(getData.completedArticles.includes(articleId));
  });

  // 18. Test Agenda Builder (Add Session to Meeting)
  await test('Agenda Builder: Add Session to Summit (POST /api/meetings/[id]/agenda)', async () => {
    const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/agenda`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie,
      },
      body: JSON.stringify({
        sessionTitle: 'Inter-School Ethics Debate Session',
        description: 'Structured debates on academic integrity and social media responsibility.',
        startTime: '14:00',
        endTime: '15:30',
        speakerName: 'Debate Captains',
        facilitatorName: 'Lead Mentor',
        sortOrder: 10,
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.item.session_title, 'Inter-School Ethics Debate Session');
  });

  // 19. Test Community Dialogue Creation
  await test('Community Dialogue Topic Creation (POST /api/community)', async () => {
    const res = await fetch(`${BASE_URL}/api/community`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': studentCookie,
      },
      body: JSON.stringify({
        title: 'How can student councils promote peer mental health and study balance?',
        content: 'Balancing academic pressure with student council responsibilities is challenging. What routines have helped your school?',
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // 20. Test Certificate Public Verification Page
  await test('Certificate Public Verification Page (GET /certificates/INT-CERT-2026-001)', async () => {
    const res = await fetch(`${BASE_URL}/certificates/INT-CERT-2026-001`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert(html.includes('INT-CERT-2026-001'));
    assert(html.includes('Irakoze Sarah Divine'));
  });

  console.log('\n====================================================');
  console.log(`All Tests Completed: ${passed} Passed, ${failed} Failed.`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
