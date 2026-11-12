import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../../models/User';
import { config } from '../../config/env';
import { AuthenticationError, NotFoundError, ValidationError } from '../../shared/errors';

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  role?: UserRole;
  state?: string;
  district?: string;
  block?: string;
  villageId?: string;
  villageName?: string;
  preferredLanguage?: 'en' | 'hi';
  farmSizeAcres?: number;
  soilType?: string;
  soilPh?: number;
  irrigationSource?: string;
  primaryCrops?: string[];
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  state?: string;
  district?: string;
  block?: string;
  villageId?: string;
  villageName?: string;
  preferredLanguage?: 'en' | 'hi';
  farmSizeAcres?: number;
  soilType?: string;
  soilPh?: number;
  irrigationSource?: string;
  primaryCrops?: string[];
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    role: UserRole;
    state?: string;
    district?: string;
    block?: string;
    villageId?: string;
    villageName?: string;
    preferredLanguage?: 'en' | 'hi';
    farmSizeAcres?: number;
    soilType?: string;
    soilPh?: number;
    irrigationSource?: string;
    primaryCrops?: string[];
    createdAt: string;
  };
  token: string;
}

function sanitizeUser(user: IUser) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone,
    role: user.role,
    state: user.state,
    district: user.district,
    block: user.block,
    villageId: user.villageId ? String(user.villageId) : undefined,
    villageName: user.villageName,
    preferredLanguage: user.preferredLanguage || 'en',
    farmSizeAcres: user.farmSizeAcres,
    soilType: user.soilType,
    soilPh: user.soilPh,
    irrigationSource: user.irrigationSource,
    primaryCrops: user.primaryCrops,
    createdAt: user.createdAt.toISOString(),
  };
}

function generateToken(user: IUser): string {
  return jwt.sign(
    {
      userId: String(user._id),
      phone: user.phone,
      role: user.role,
    },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_EXPIRES_IN as any,
    }
  );
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const cleanPhone = input.phone.trim();
  const existing = await User.findOne({ phone: cleanPhone });
  if (existing) {
    throw new ValidationError('A user with this mobile number already exists');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  const user = await User.create({
    name: input.name.trim(),
    phone: cleanPhone,
    passwordHash,
    role: input.role || 'farmer',
    state: input.state?.trim(),
    district: input.district?.trim(),
    block: input.block?.trim(),
    villageId: input.villageId || undefined,
    villageName: input.villageName?.trim(),
    preferredLanguage: input.preferredLanguage || 'en',
    farmSizeAcres: input.farmSizeAcres,
    soilType: input.soilType?.trim(),
    soilPh: input.soilPh,
    irrigationSource: input.irrigationSource?.trim(),
    primaryCrops: input.primaryCrops || [],
  });

  const token = generateToken(user);
  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const cleanPhone = input.phone.trim();
  const user = await User.findOne({ phone: cleanPhone }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new AuthenticationError('Invalid mobile number or password');
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AuthenticationError('Invalid mobile number or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);
  return {
    user: sanitizeUser(user),
    token,
  };
}

export async function getUserProfile(userId: string) {
  const user = await User.findById(userId).populate('villageId', 'name district state block');
  if (!user || !user.isActive) {
    throw new NotFoundError('User profile');
  }
  return sanitizeUser(user);
}

export async function updateUserProfile(userId: string, updates: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new NotFoundError('User profile');
  }

  if (updates.name !== undefined) user.name = updates.name.trim();
  if (updates.state !== undefined) user.state = updates.state.trim();
  if (updates.district !== undefined) user.district = updates.district.trim();
  if (updates.block !== undefined) user.block = updates.block.trim();
  if (updates.villageId !== undefined) user.villageId = updates.villageId as any;
  if (updates.villageName !== undefined) user.villageName = updates.villageName.trim();
  if (updates.preferredLanguage !== undefined) user.preferredLanguage = updates.preferredLanguage;
  if (updates.farmSizeAcres !== undefined) user.farmSizeAcres = updates.farmSizeAcres;
  if (updates.soilType !== undefined) user.soilType = updates.soilType.trim();
  if (updates.soilPh !== undefined) user.soilPh = updates.soilPh;
  if (updates.irrigationSource !== undefined) user.irrigationSource = updates.irrigationSource.trim();
  if (updates.primaryCrops !== undefined) user.primaryCrops = updates.primaryCrops;

  await user.save();
  return sanitizeUser(user);
}
