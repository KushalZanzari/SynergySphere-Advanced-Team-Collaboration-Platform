const { verifyToken } = require('@clerk/backend');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    if (!payload) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Get or create user in our database
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true
      }
    });

    // If user doesn't exist in our database, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.first_name || payload.email,
          avatar: payload.image_url
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true
        }
      });
    }

    req.user = user;
    req.clerkUserId = payload.sub; // Clerk user ID
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
