import { User, UserLoginHistory, UserSession } from '../../interfaces/auth/user';
import { userExists, readUser, incrementLoginAttempts, lockUserAccount, resetLoginAttempts, isAccountLocked, recordLoginAttempt } from '../../database/auth/auth-operations';
import { hash } from '../../utils/crypto';
import { verifyPassword } from '../../utils/auth/authEncryption';
import { createUser, updateUserLoginHistory } from '../../utils/auth/userManagement';
import { createUserSession } from '../../utils/auth/sessionManagement';
import { createJWT, generateRefreshToken } from '../../utils/auth/authEncryption';
import { sendEmailVerificationEmail } from './email';
import { generateVerificationToken } from './emailVerification';

export const loginService = async (username: string, password: string, login_ip?: string, user_agent?: string) => {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_DURATION_MINUTES = 30;
  
  try {
    const usernameHash = hash(username);
    
    // Check if user exists
    const userExistsResult = await userExists(usernameHash);
    if (!userExistsResult) {
      return { error: 'Invalid credentials', locked: false };
    }
    
    // Get user data
    const user = await readUser(usernameHash) as User;
    if (!user) {
      return { error: 'Invalid credentials', locked: false };
    }
    
    // Check if account is locked
    const accountLocked = await isAccountLocked(usernameHash);
    if (accountLocked) {
      // Record failed attempt
      await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, false);
      return { 
        error: 'Account is temporarily locked due to multiple failed login attempts', 
        locked: true,
        locked_until: user.locked_until,
        attempts_remaining: 0
      };
    }
    
    // Check if account is active
    if (!user.is_active) {
      await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, false);
      return { error: 'Account is deactivated', locked: false };
    }
    
    // Check if account is banned
    if (user.is_banned) {
      await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, false);
      return { error: 'Account is banned', locked: false, ban_reason: user.ban_reason };
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash as string);
    
    if (!isValidPassword) {
      // Increment login attempts
      const currentAttempts = await incrementLoginAttempts(usernameHash);
      
      // Record failed attempt
      await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, false);
      
      // Lock account if max attempts reached
      if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
        await lockUserAccount(usernameHash, LOCK_DURATION_MINUTES);
        return { 
          error: `Account locked for ${LOCK_DURATION_MINUTES} minutes due to ${MAX_LOGIN_ATTEMPTS} failed login attempts`, 
          locked: true,
          attempts_remaining: 0
        };
      }
      
      const attemptsRemaining = MAX_LOGIN_ATTEMPTS - currentAttempts;
      return { 
        error: 'Invalid credentials', 
        locked: false,
        attempts_remaining: attemptsRemaining,
        warning: attemptsRemaining <= 2 ? `Account will be locked after ${attemptsRemaining} more failed attempt(s)` : undefined
      };
    }
    
    // Successful login - reset login attempts
    await resetLoginAttempts(usernameHash);
    
    // Record successful attempt
    await recordLoginAttempt(user.uid, login_ip || null, user_agent || null, true);
    
    // Create session and tokens
    const rt = generateRefreshToken(user.uid);
    const jwt = createJWT(user.uid);
    const session = await createUserSession(user.uid, rt, jwt) as UserSession;

    return {
      success: true,
      user_uid: user.uid,
      user: {
        uid: user.uid,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified,
        created_at: user.created_at
      },
      access_token: jwt,
      refresh_token: rt,
      expires_in: Math.floor((session.session_expires_at.getTime() - Date.now()) / 1000)
    };

  } catch (err) {
    console.error('Login service error:', err);
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
    if (user.password_hash.length > 64) {
      throw new Error('Password length is greater than 64');
    }
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
            console.error('Failed to send verification email during registration:', emailError);
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
    console.error('Registration error:', err);
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Registration failed');
  }
};