import { describe, it, expect, beforeAll } from 'bun:test';
import runDbSync from '../database/utils/sync';
import { loginService, registerService } from '../services/auth';
import { readSelect } from '../database/utils/operations';
import { User } from '../interfaces/auth/user';

describe('Login Attempts Reset on Successful Login', () => {
  let testUser: any;
  
  beforeAll(async () => {
    await runDbSync();
    
    // Create a test user
    const userData = {
      username: `resettest_${Date.now()}`,
      email: `resettest_${Date.now()}@example.com`,
      password_hash: 'testPassword123!'
    };
    
    const requestInfo = {
      login_ip: '127.0.0.1',
      user_agent: 'Test Runner'
    };
    
    testUser = await registerService(userData, requestInfo);
  });

  it('should reset login_attempts and locked_until on successful login', async () => {
    // Get the test user from database
    const users = await readSelect<User>('users', ['*'], { uid: testUser.user_uid });
    const user = users[0];
    const { decrypt } = await import('../utils/crypto');
    const username = await decrypt(user.username);

    // Step 1: Make multiple failed login attempts to trigger lock
    console.log('Making failed login attempts...');
    
    // Make 5 failed attempts to lock the account
    for (let i = 0; i < 5; i++) {
      const failResult = await loginService(username, 'wrongpassword', '127.0.0.1', 'Test Runner');
      console.log(`Attempt ${i + 1}:`, failResult.error, `Attempts remaining: ${failResult.attempts_remaining}`);
    }
    
    // Verify account is locked
    const lockResult = await loginService(username, 'wrongpassword', '127.0.0.1', 'Test Runner');
    expect(lockResult.locked).toBe(true);
    console.log('Account locked:', lockResult.error);
    
    // Check database state - should have login_attempts = 5 and locked_until set
    const lockedUser = await readSelect<User>('users', ['login_attempts', 'locked_until'], { uid: testUser.user_uid });
    console.log('Database state when locked:', {
      login_attempts: lockedUser[0].login_attempts,
      locked_until: lockedUser[0].locked_until
    });
    
    expect(lockedUser[0].login_attempts).toBe(5);
    expect(lockedUser[0].locked_until).not.toBeNull();
    
    // Step 2: Manually reset the lock (simulating time expiry) by updating locked_until to past
    const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago
    await import('../database/utils/operations').then(ops => 
      ops.executeQuery({
        text: 'UPDATE users SET locked_until = $1 WHERE uid = $2',
        values: [pastTime.toISOString(), testUser.user_uid]
      })
    );
    
    // Step 3: Attempt successful login
    console.log('Attempting successful login after manual unlock...');
    const successResult = await loginService(username, 'testPassword123!', '127.0.0.1', 'Test Runner');
    
    expect(successResult.success).toBe(true);
    expect(successResult.user).toBeDefined();
    expect(successResult.access_token).toBeDefined();
    console.log('Successful login:', { success: successResult.success, user_uid: successResult.user?.uid });
    
    // Step 4: Verify database state - should have login_attempts = 0 and locked_until = NULL
    const resetUser = await readSelect<User>('users', ['login_attempts', 'locked_until'], { uid: testUser.user_uid });
    console.log('Database state after successful login:', {
      login_attempts: resetUser[0].login_attempts,
      locked_until: resetUser[0].locked_until
    });
    
    expect(resetUser[0].login_attempts).toBe(0);
    expect(resetUser[0].locked_until).toBeNull();
    
    // Step 5: Verify subsequent failed attempt starts from 0 again
    const newFailResult = await loginService(username, 'wrongpassword', '127.0.0.1', 'Test Runner');
    expect(newFailResult.attempts_remaining).toBe(4); // Should be 5 - 1 = 4
    console.log('New failed attempt after reset:', { 
      error: newFailResult.error, 
      attempts_remaining: newFailResult.attempts_remaining 
    });
    
    // Final verification: Check database shows login_attempts = 1
    const finalUser = await readSelect<User>('users', ['login_attempts', 'locked_until'], { uid: testUser.user_uid });
    expect(finalUser[0].login_attempts).toBe(1);
    expect(finalUser[0].locked_until).toBeNull();
    console.log('Final database state:', {
      login_attempts: finalUser[0].login_attempts,
      locked_until: finalUser[0].locked_until
    });
  });
});
