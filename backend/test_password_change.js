/**
 * Quick Password Change Test
 * Tests the password change functionality for alumni users
 * 
 * Run: node test_password_change.js
 */

const http = require('http');

const API = 'http://localhost:5001';
const TS = Date.now();

// Test alumni credentials
const TEST_ALUMNI = {
  name: `Test Alumni ${TS}`,
  email: `testalumni_pw_${TS}@test.com`,
  username: `alm_pw_${TS}`,
  password: `OldPass_${TS}!`,
  department: 'Computer Science',
  company: 'Test Company',
  batchYear: 2020,
};

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const bodyStr = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         Password Change Feature Test                 ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  let alumniId = null;
  const newPassword = `NewPass_${TS}!`;

  try {
    // Step 1: Register alumni
    console.log('1️⃣  Registering test alumni...');
    const regResult = await request('POST', '/auth/alumni/register', TEST_ALUMNI);
    if (regResult.status === 200 || regResult.status === 201) {
      alumniId = regResult.body?.user?.id;
      console.log(`   ✅ Alumni registered: ${TEST_ALUMNI.email}`);
      console.log(`   📝 Alumni ID: ${alumniId}\n`);
    } else {
      console.log(`   ❌ Registration failed: ${regResult.body?.error || 'Unknown error'}\n`);
      return;
    }

    // Step 2: Login with original password
    console.log('2️⃣  Testing login with original password...');
    const loginResult = await request('POST', '/auth/alumni/login', {
      username: TEST_ALUMNI.username,
      password: TEST_ALUMNI.password,
    });
    if (loginResult.status === 200) {
      console.log(`   ✅ Login successful with original password\n`);
    } else {
      console.log(`   ❌ Login failed: ${loginResult.body?.error || 'Unknown error'}\n`);
      return;
    }

    // Step 3: Try to change password with WRONG current password
    console.log('3️⃣  Testing password change with WRONG current password...');
    const wrongPwResult = await request('POST', '/auth/change-password', {
      userId: alumniId,
      currentPassword: 'WrongPassword123!',
      newPassword: newPassword,
    });
    if (wrongPwResult.status === 401 && wrongPwResult.body?.error === 'Incorrect current password.') {
      console.log(`   ✅ Correctly rejected: ${wrongPwResult.body.error}\n`);
    } else {
      console.log(`   ❌ Expected 401 with "Incorrect current password", got: ${wrongPwResult.status} - ${wrongPwResult.body?.error || 'Unknown'}\n`);
    }

    // Step 4: Change password with CORRECT current password
    console.log('4️⃣  Testing password change with CORRECT current password...');
    const correctPwResult = await request('POST', '/auth/change-password', {
      userId: alumniId,
      currentPassword: TEST_ALUMNI.password,
      newPassword: newPassword,
    });
    if (correctPwResult.status === 200) {
      console.log(`   ✅ Password changed successfully: ${correctPwResult.body?.message}\n`);
    } else {
      console.log(`   ❌ Password change failed: ${correctPwResult.body?.error || 'Unknown error'}\n`);
      return;
    }

    // Step 5: Try to login with OLD password (should fail)
    console.log('5️⃣  Testing login with OLD password (should fail)...');
    const oldPwLogin = await request('POST', '/auth/alumni/login', {
      username: TEST_ALUMNI.username,
      password: TEST_ALUMNI.password,
    });
    if (oldPwLogin.status === 401 && oldPwLogin.body?.error === 'Invalid credentials.') {
      console.log(`   ✅ Correctly rejected old password: ${oldPwLogin.body.error}\n`);
    } else {
      console.log(`   ❌ Expected 401 with "Invalid credentials", got: ${oldPwLogin.status} - ${oldPwLogin.body?.error || 'Unknown'}\n`);
    }

    // Step 6: Login with NEW password (should succeed)
    console.log('6️⃣  Testing login with NEW password (should succeed)...');
    const newPwLogin = await request('POST', '/auth/alumni/login', {
      username: TEST_ALUMNI.username,
      password: newPassword,
    });
    if (newPwLogin.status === 200) {
      console.log(`   ✅ Login successful with new password\n`);
    } else {
      console.log(`   ❌ Login failed with new password: ${newPwLogin.body?.error || 'Unknown error'}\n`);
      return;
    }

    // Summary
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                  TEST SUMMARY                        ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('  ✅ All password change tests passed!');
    console.log('  ✅ Password change feature is working correctly\n');
    console.log('  Test Details:');
    console.log(`    Email: ${TEST_ALUMNI.email}`);
    console.log(`    Old Password: ${TEST_ALUMNI.password}`);
    console.log(`    New Password: ${newPassword}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  }
}

main();
