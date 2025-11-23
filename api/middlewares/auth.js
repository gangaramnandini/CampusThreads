const createError = require('http-errors');
const ms = require('ms');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const prisma = require('../services/connect-db');
const {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_LIFE,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_LIFE,
} = require('../utils/config');
const { generateJWT, COOKIE_OPTIONS } = require('../utils/auth');

const isAuthenticated = async (req, res, next) => {
  try {
    // 1. Get access token from Authorization header
    const authHeader = req.get('Authorization');
    const accessToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : null;

    if (!accessToken) {
      throw createError.Unauthorized('Access token missing');
    }

    // 2. Get refresh token from signed cookies
    const { refreshToken } = req.signedCookies || {};
    if (!refreshToken) {
      throw createError.Unauthorized('Refresh token missing');
    }

    // 3. Ensure refresh token exists in Session table
    const session = await prisma.session.findFirst({
      where: { refreshToken },
    });
    if (!session) {
      throw createError.Unauthorized('Invalid session');
    }

    // 4. Verify access token
    let decodedToken;
    try {
      decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw createError.Unauthorized('Invalid access token');
    }

    // (Optional but safer) ensure token user matches session user
    if (decodedToken.userId !== session.userId) {
      throw createError.Unauthorized('Token does not match session');
    }

    // 5. Fetch user with campus info
    const dbUser = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: {
        id: true,
        organization_id: true,
        department_id: true,
        role: true,
      },
    });

    if (!dbUser) {
      throw createError.Unauthorized('User not found');
    }

    // 6. Normalize to a clean `req.user` object (camelCase)
    const user = {
      id: dbUser.id,
      organizationId: dbUser.organization_id,
      departmentId: dbUser.department_id,
      role: dbUser.role,
    };

    // Attach to req
    req.user = user;

    // Backwards-compatible aliases if other code still expects them:
    req.userId = user.id;
    req.organizationId = user.organizationId;
    req.departmentId = user.departmentId;
    req.userRole = user.role;
    req.organization_id = dbUser.organization_id; // if any old code still uses snake_case
    req.department_id = dbUser.department_id;

    next();
  } catch (error) {
    next(error);
  }
};

const generateAuthTokens = async (req, res, next) => {
  try {
    if (!req.userId) {
      throw createError.InternalServerError('User id missing for token generation');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        newUser: true,
        googleId: true,
        provider: true,
        createdAt: true,
        profile: true,
        organization_id: true,
        department_id: true,
        role: true,
        academic_year: true,
        roll_number: true,
      },
    });

    if (!user) {
      throw createError.Unauthorized('User not found');
    }

    // Generate tokens
    const refreshToken = generateJWT(
      req.userId,
      REFRESH_TOKEN_SECRET,
      REFRESH_TOKEN_LIFE
    );
    const accessToken = generateJWT(
      req.userId,
      ACCESS_TOKEN_SECRET,
      ACCESS_TOKEN_LIFE
    );

    // Store refresh token as a session
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessions: {
          create: {
            refreshToken,
            expirationTime: new Date(Date.now() + ms(REFRESH_TOKEN_LIFE)),
          },
        },
      },
    });

    // Send refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      expires: new Date(Date.now() + ms(REFRESH_TOKEN_LIFE)),
    });

    // Respond with access token + user
    res.status(200).json({
      user,
      accessToken,
      expiresAt: new Date(Date.now() + ms(ACCESS_TOKEN_LIFE)),
    });
  } catch (error) {
    next(error);
  }
};

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ errors: errors.array({ onlyFirstError: true }) });
  }
  return next();
};

const isValidUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      throw createError.NotFound('User not found');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAuthenticated,
  generateAuthTokens,
  validateRequest,
  isValidUser,
};
