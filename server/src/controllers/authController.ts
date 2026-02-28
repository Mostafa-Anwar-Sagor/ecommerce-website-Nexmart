import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const generateTokens = (user: { id: string; email: string; role: string; name: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const { name, email, password, phone } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'BUYER',
      isVerified: false,
    },
    select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isVerified: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
  });

  return successResponse(res, { user, accessToken, refreshToken }, 'Account created successfully', 201);
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest('Invalid email or password');
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { shop: true },
  });

  if (!user || !user.password) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens({
    id: user.id, email: user.email, role: user.role, name: user.name,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
  });

  // Sanitize user object (exclude password and refreshToken)
  const { password: _, refreshToken: __, ...safeUser } = user;

  return successResponse(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
};

export const refreshTokens = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');

  let decoded: { id: string };
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { shop: true },
  });

  if (!user || !user.refreshToken) {
    throw ApiError.unauthorized('Session expired, please login again');
  }

  const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValidRefreshToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, name: user.name });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 10) },
  });

  const { password: _, refreshToken: __, ...safeUser } = user;

  return successResponse(res, { user: safeUser, ...tokens }, 'Token refreshed');
};

export const logout = async (req: AuthRequest, res: Response) => {
  if (req.user?.id) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    }).catch(() => {}); // Ignore silently if user not found
  }
  return successResponse(res, null, 'Logged out successfully');
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      role: true, isVerified: true, totalSpent: true, loyaltyPoints: true,
      createdAt: true,
      shop: {
        select: {
          id: true, name: true, slug: true, logo: true, rating: true,
          totalSales: true, isVerified: true, status: true,
        },
      },
    },
  });

  if (!user) throw ApiError.notFound('User not found');
  return successResponse(res, user);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(avatar !== undefined && { avatar }),
    },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      role: true, isVerified: true, createdAt: true,
    },
  });

  return successResponse(res, user, 'Profile updated successfully');
};

export const googleAuth = async (req: Request, res: Response) => {
  const { token, sub, email: bodyEmail, name: bodyName, picture: bodyPicture } = req.body;
  if (!token) throw ApiError.badRequest('Google token required');

  let googleUser: { sub: string; email: string; name: string; picture?: string };

  // Demo mode: only bypass verification for explicit demo token
  const isDemoMode = token === 'NEXMART_DEMO_TOKEN';

  if (isDemoMode && sub && bodyEmail && bodyName) {
    // Trust provided user info in demo/development mode
    googleUser = { sub, email: bodyEmail, name: bodyName, picture: bodyPicture };
  } else if (sub && bodyEmail && bodyName) {
    // Access-token flow: frontend already retrieved user info
    const verifyRes = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
    );
    const verifyData = await verifyRes.json() as { error?: string; user_id?: string };
    if (verifyData.error || !verifyData.user_id) {
      throw ApiError.unauthorized('Invalid Google access token');
    }
    googleUser = { sub, email: bodyEmail, name: bodyName, picture: bodyPicture };
  } else {
    // ID-token flow (credential from GoogleLogin component)
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    );
    const data = await response.json() as {
      sub: string; email: string; name: string; picture?: string; error_description?: string;
    };
    if (data.error_description) throw ApiError.unauthorized('Invalid Google token');
    googleUser = data;
  }

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: googleUser.sub }, { email: googleUser.email }] },
    include: { shop: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: uuidv4(), name: googleUser.name, email: googleUser.email,
        googleId: googleUser.sub, avatar: googleUser.picture, isVerified: true,
      },
      include: { shop: true },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.sub, avatar: user.avatar || googleUser.picture },
      include: { shop: true },
    });
  }

  const { accessToken, refreshToken } = generateTokens({
    id: user.id, email: user.email, role: user.role, name: user.name,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
  });

  const { password: _, refreshToken: __, ...safeUser } = user;
  return successResponse(res, { user: safeUser, accessToken, refreshToken }, 'Google auth successful');
};
