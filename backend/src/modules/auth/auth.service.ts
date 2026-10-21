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

    const isMatch = await bcrypt.compare(rawPassword, user.password_hash);
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
}
