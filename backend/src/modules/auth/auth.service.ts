import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config';
import { AuthRepository } from './auth.repository';
import { TokenPayload, UserRole } from '../../types/auth.types';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    schoolId: string | null;
    identifier: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    roles: UserRole[];
    profileId: string | null;
    wingId: string | null;
    classId: string | null;
    sectionId: string | null;
  };
}

export class AuthService {
  static async login(identifier: string, rawPassword: string): Promise<LoginResult> {
    const user = await AuthRepository.findByIdentifier(identifier.trim());

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new Error('ACCOUNT_INACTIVE');
    }

    if (user.school_status === 'SUSPENDED' && !user.roles.includes('SUPER_ADMIN')) {
      throw new Error('SCHOOL_SUSPENDED');
    }

    let isMatch = await bcrypt.compare(rawPassword, user.password_hash);
    if (!isMatch && rawPassword.trim() !== rawPassword) {
      isMatch = await bcrypt.compare(rawPassword.trim(), user.password_hash);
    }

    // Resilience fallback: If plain_login_password in staff_profiles or student_profiles matches,
    // immediately re-sync the password hash in the users table and permit login
    if (!isMatch && user.plain_login_password) {
      if (rawPassword === user.plain_login_password || rawPassword.trim() === user.plain_login_password) {
        isMatch = true;
        try {
          const freshHash = await bcrypt.hash(rawPassword.trim(), 12);
          await AuthRepository.updateUserPassword(user.id, freshHash, rawPassword.trim());
        } catch (_) {
          // non-blocking
        }
      }
    }

    if (!isMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const payload: TokenPayload = {
      userId: user.id,
      schoolId: user.school_id || '',
      identifier: user.identifier,
      email: user.email,
      roles: user.roles,
      profileId: user.profile_id,
      wingId: user.wing_id,
      classId: user.class_id,
      sectionId: user.section_id,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    return {
      token,
      user: {
        id: user.id,
        schoolId: user.school_id,
        identifier: user.identifier,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles,
        profileId: user.profile_id,
        wingId: user.wing_id,
        classId: user.class_id,
        sectionId: user.section_id,
      },
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      id: user.id,
      schoolId: user.school_id,
      identifier: user.identifier,
      email: user.email,
      phone: user.phone,
      firstName: user.first_name,
      lastName: user.last_name,
      roles: user.roles,
      profileId: user.profile_id,
      wingId: user.wing_id,
      classId: user.class_id,
      sectionId: user.section_id,
    };
  }

  static async getForgotRequirements(identifier: string) {
    const profile = await AuthRepository.findChallengeProfileByIdentifier(identifier);
    if (!profile) {
      throw new Error('USER_NOT_FOUND');
    }
    if (!profile.is_active) {
      throw new Error('ACCOUNT_INACTIVE');
    }

    const isStudent = profile.roles.includes('STUDENT') || Boolean(profile.student_profile_id);
    const rawPhone = profile.student_emergency_phone || profile.staff_phone || profile.phone || '';
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const maskedPhone = cleanDigits.length >= 4 
      ? `******${cleanDigits.slice(-4)}`
      : 'Registered Mobile';

    return {
      userType: isStudent ? 'STUDENT' : 'STAFF',
      identifier: profile.identifier,
      maskedPhone,
      prompt: isStudent
        ? 'Please enter your registered Parent Mobile Number and Date of Birth to verify identity.'
        : 'Please enter your registered Email or Mobile Number to verify identity.',
    };
  }

  static async verifyForgotChallenge(
    identifier: string,
    challenge: { phone?: string; dob?: string; email?: string }
  ) {
    const profile = await AuthRepository.findChallengeProfileByIdentifier(identifier);
    if (!profile) {
      throw new Error('USER_NOT_FOUND');
    }
    if (!profile.is_active) {
      throw new Error('ACCOUNT_INACTIVE');
    }

    const isStudent = profile.roles.includes('STUDENT') || Boolean(profile.student_profile_id);

    if (isStudent) {
      const inputPhone = normalizePhone(challenge.phone);
      const registeredPhones = [
        normalizePhone(profile.student_emergency_phone),
        normalizePhone(profile.phone),
      ].filter(Boolean);

      const phoneMatches = inputPhone && registeredPhones.includes(inputPhone);

      const inputDob = normalizeDob(challenge.dob);
      const registeredDob = normalizeDob(profile.student_dob);
      const dobMatches = inputDob && registeredDob && inputDob === registeredDob;

      if (!phoneMatches || !dobMatches) {
        throw new Error('VERIFICATION_FAILED');
      }

      const resetToken = jwt.sign(
        { userId: profile.user_id, identifier: profile.identifier, purpose: 'PASSWORD_RESET' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        resetToken,
        userType: 'STUDENT',
        name: `${profile.student_first_name || ''} ${profile.student_last_name || ''}`.trim() || 'Student',
      };
    } else {
      // Staff / Teacher / Admin verification
      const inputEmail = challenge.email?.trim().toLowerCase();
      const inputPhone = normalizePhone(challenge.phone);

      const registeredEmail = profile.email?.trim().toLowerCase();
      const registeredPhones = [
        normalizePhone(profile.staff_phone),
        normalizePhone(profile.staff_emergency_phone),
        normalizePhone(profile.phone),
      ].filter(Boolean);

      const emailMatches = Boolean(inputEmail && registeredEmail && inputEmail === registeredEmail);
      const phoneMatches = Boolean(inputPhone && registeredPhones.includes(inputPhone));

      if (!emailMatches && !phoneMatches) {
        throw new Error('VERIFICATION_FAILED');
      }

      const resetToken = jwt.sign(
        { userId: profile.user_id, identifier: profile.identifier, purpose: 'PASSWORD_RESET' },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      return {
        resetToken,
        userType: 'STAFF',
        name: `${profile.staff_first_name || ''} ${profile.staff_last_name || ''}`.trim() || 'Staff',
      };
    }
  }

  static async resetPasswordWithToken(resetToken: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }

    let payload: any;
    try {
      payload = jwt.verify(resetToken, env.JWT_SECRET);
    } catch (_err) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    if (payload.purpose !== 'PASSWORD_RESET' || !payload.userId) {
      throw new Error('INVALID_TOKEN_PURPOSE');
    }

    const hash = await bcrypt.hash(newPassword.trim(), 10);
    await AuthRepository.updateUserPassword(payload.userId, hash, newPassword.trim());

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }

    const currentHash = await AuthRepository.getUserPasswordHash(userId);
    if (!currentHash) {
      throw new Error('USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      throw new Error('INVALID_CURRENT_PASSWORD');
    }

    const hash = await bcrypt.hash(newPassword.trim(), 10);
    await AuthRepository.updateUserPassword(userId, hash, newPassword.trim());

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}

function normalizePhone(p?: string | null): string {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function normalizeDob(d?: string | null): string {
  if (!d) return '';
  const trimmed = d.trim();
  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }
  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return trimmed;
}

