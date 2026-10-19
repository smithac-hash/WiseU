import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import redis from '../config/redis.js';

const JWT_EXPIRES_IN = '7d';
const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

const generateTokenAndSession = async (user) => {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  try {
    // Store token in Redis session
    await redis.setex(`session:${user.id}`, JWT_EXPIRES_SECONDS, token);
  } catch (err) {
    console.warn(`⚠️ Could not save session to Redis for user ${user.id}. Is Redis running?`);
  }
  
  return token;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, monthlyIncome, savingsGoal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : 0,
        savingsGoal: savingsGoal ? parseFloat(savingsGoal) : 0,
      },
    });

    const token = await generateTokenAndSession(user);

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = await generateTokenAndSession(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = async (req, res) => {
  try {
    // req.user is populated by auth middleware
    await redis.del(`session:${req.user.id}`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
};

export const getMe = async (req, res) => {
  // Return the user object attached by the auth middleware
  const { passwordHash: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
};
