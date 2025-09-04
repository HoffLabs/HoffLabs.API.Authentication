import { User, UserLoginHistory, UserSession } from '../../interfaces/auth/user';
import { userExists, readUser, incrementLoginAttempts, lockUserAccount, resetLoginAttempts, isAccountLocked, recordLoginAttempt } from '../../database/auth/auth-operations';
import { hash } from '../../utils/crypto';
import { verifyPassword } from '../../utils/auth/authEncryption';
import { createUser, updateUserLoginHistory } from '../../utils/auth/userManagement';
import { createUserSession } from '../../utils/auth/sessionManagement';
import { createJWT, generateRefreshToken } from '../../utils/auth/authEncryption';
import { sendEmailVerificationEmail } from './email';
import { generateVerificationToken } from './emailVerification';
import { logError, logSecurityEvent, logAuthEvent } from '../../utils/secureLogger';

// IP-based rate limiting
const ipAttempts = new Map<string, { attempts: number; lastAttempt: number; blocked: boolean }>();
const IP_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_IP_ATTEMPTS = 20;

function checkIPRateLimit(ip?: string): boolean {
  if (!ip) return true; // Allow if no IP provided
  
  const now = Date.now();
  const ipData = ipAttempts.get(ip);
  
  if (!ipData) {
    ipAttempts.set(ip, { attempts: 1, lastAttempt: now, blocked: false });
    return true;
  }
  
  // Reset if enough time has passed
  if (now - ipData.lastAttempt > IP_BLOCK_DURATION) {
    ipAttempts.set(ip, { attempts: 1, lastAttempt: now, blocked: false });
    return true;
  }
  
  // Check if blocked
  if (ipData.blocked) {
    return false;
  }
  
  // Increment attempts
  ipData.attempts++;
  ipData.lastAttempt = now;
  
    // Block if too many attempts
    if (ipData.attempts > MAX_IP_ATTEMPTS) {
      ipData.blocked = true;
      logSecurityEvent({
        type: 'security',
        severity: 'high',
        message: 'IP blocked due to excessive login attempts',
        ip,
        details: { attempts: ipData.attempts, duration: IP_BLOCK_DURATION }
      });
      return false;
    }
  
  return true;
}

// Helper function to enforce minimum response time
async function enforceMinimumResponseTime(startTime: number, minTime: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  const remaining = minTime - elapsed;
  
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
}

export const loginService = async (username: string, password: string, login_ip?: string, user_agent?: string) => {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_DURATION_MINUTES = 30;
  
  // Start timing early to ensure consistent response times
  const startTime = Date.now();
  const MIN_RESPONSE_TIME = 200; // Minimum 200ms response time
  
  try {
    // Check IP rate limiting first
    if (!checkIPRateLimit(login_ip)) {
      await enforceMinimumResponseTime(startTime, MIN_RESPONSE_TIME);
      return { 
        error: 'Too many login attempts from this IP address. Please try again later.',
        locked: true 
      };
    }
    
    const usernameHash = hash(username);
    
    // Always perform user lookup AND password verification to prevent timing attacks
    let user: User | null = null;
    let userExistsResult = false;
    let passwordValid = false;
    
    // Always do these operations regardless of user existence
    const [userCheckResult, dummyPasswordCheck] = await Promise.all([
      (async () => {
        const exists = await userExists(usernameHash);
        if (exists) {
          user = await readUser(usernameHash) as User;
          return true;
        }
        return false;
      })(),
      // Always perform password verification against dummy hash to prevent timing attacks
      import('bcryptjs').then(bcrypt => 
        bcrypt.compare(password, '$2b$14$dummy.hash.to.prevent.timing.attacks.abcdefghijklmnopqrstuvwxyz')
      )
    ]);
    
    userExistsResult = userCheckResult;
    
    // If user exists, verify password
    if (user && user.password_hash) {
      passwordValid = await verifyPassword(password, user.password_hash);
    }
    
    // Process all security checks before returning
    let shouldProceed = userExistsResult && passwordValid;
    let lockInfo = null;
    let errorMessage = 'Invalid credentials';
    let isLocked = false;
    
    if (user) {
      // Check if account is locked
      const accountLocked = await isAccountLocked(usernameHash);
      if (accountLocked) {
        shouldProceed = false;
        isLocked = true;
        lockInfo = {
          locked_until: user.locked_until,
          attempts_remaining: 0
        };
        errorMessage = 'Account is temporarily locked due to multiple failed login attempts';
      }
      
      // Check if account is active
      if (shouldProceed && !user.is_active) {
        shouldProceed = false;
        errorMessage = 'Account is deactivated';
      }
      
      // Check if account is banned
      if (shouldProceed && user.is_banned) {
        shouldProceed = false;
        errorMessage = 'Account is banned';
      }
    }
    
    // Record login attempt (success or failure)
    if (user) {
      await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, shouldProceed);
      
      if (!shouldProceed && !isLocked) {
        // Increment login attempts for failed password
        const currentAttempts = await incrementLoginAttempts(usernameHash);
        
        // Lock account if max attempts reached
        if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
          await lockUserAccount(usernameHash, LOCK_DURATION_MINUTES);
          isLocked = true;
          lockInfo = {
            attempts_remaining: 0
          };
          errorMessage = `Account locked for ${LOCK_DURATION_MINUTES} minutes due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`;
        } else {
          const attemptsRemaining = MAX_LOGIN_ATTEMPTS - currentAttempts;
          lockInfo = {
            attempts_remaining: attemptsRemaining,
            warning: attemptsRemaining <= 2 ? `Account will be locked after ${attemptsRemaining} more failed attempt(s)` : undefined
          };
        }
      }
    }
    
    // Enforce minimum response time before returning
    await enforceMinimumResponseTime(startTime, MIN_RESPONSE_TIME);
    
    if (!shouldProceed) {
      return {
        error: errorMessage,
        locked: isLocked,
        ...lockInfo
      };
    }
    
    // Successful login - reset login attempts
    await resetLoginAttempts(usernameHash);
    
    // Create session and tokens
    const rt = generateRefreshToken(user!.uid);
    const jwt = createJWT(user!.uid);
    const session = await createUserSession(user!.uid, rt, jwt) as UserSession;

    // Decrypt user data for response
    const { decrypt } = await import('../../utils/crypto');
    const decryptedUsername = await decrypt(user!.username);
    const decryptedEmail = await decrypt(user!.email);

    return {
      success: true,
      user_uid: user!.uid,
      user: {
        uid: user!.uid,
        username: decryptedUsername,
        email: decryptedEmail,
        email_verified: user!.email_verified,
        created_at: user!.created_at
      },
      access_token: jwt,
      refresh_token: rt,
      expires_in: Math.floor((session.session_expires_at.getTime() - Date.now()) / 1000)
    };

  } catch (err) {
    logError('Login service error', err);
    await enforceMinimumResponseTime(startTime, MIN_RESPONSE_TIME);
    return { error: 'Login failed due to server error', locked: false };
  }
};

export const registerService = async (user: Partial<User>, request: Partial<UserLoginHistory>) => {
  try {
    if (!user.username || !user.email || !user.password_hash) {
      throw new Error('Missing fields');
    }
    if (user.username.length > 32) {
      throw new Error('Username length is greater than 32');
    }
    if (user.email.length > 64) {
      throw new Error('Email length is greater than 64');
    }
    // Note: password_hash is encrypted, so length validation is not applicable
    // Password length validation should be done on the plain text password in the controller
    if (await userExists(hash(user.username), hash(user.email))) {
      throw new Error('Email or username already exists');
    }
    
    const uid = (await createUser(user) as Partial<User>).uid;
    if (uid) {
      updateUserLoginHistory(uid, request);
      
      // Generate email verification token
      const verificationToken = generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Update user with verification token (need to get the created user first)
      const createdUsers = await readUser(hash(user.username!));
      if (createdUsers) {
        const { readSelect, update } = await import('../../database/utils/operations');
        const users = await readSelect<User>('users', ['*'], { uid });
        if (users.length > 0) {
          await update<User>('users', users[0].id, {
            email_verification_token: verificationToken,
            email_verification_expires: verificationExpires,
            updated_at: new Date()
          });
          
          // Send verification email (don't fail registration if email fails)
          try {
            await sendEmailVerificationEmail({
              email: user.email!,
              verificationToken,
              username: user.username!
            });
          } catch (emailError) {
            logError('Failed to send verification email during registration', emailError);
            // Continue with registration even if email fails
          }
        }
      }
      
      const rt = generateRefreshToken(uid);
      const jwt = createJWT(uid);
      const session = await createUserSession(uid, rt, jwt) as UserSession;

      return {
        user_uid: session.user_uid, 
        access_token: jwt,
        refresh_token: rt,
        expires_in: Math.floor((session.session_expires_at.getTime() - Date.now()) / 1000),
        message: 'Registration successful! Please check your email to verify your account.'
      };
    }
    
    throw new Error('Registration failed');

  } catch (err) {
    logError('Registration error', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Registration failed');
  }
};