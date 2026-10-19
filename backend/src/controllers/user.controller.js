import prisma from '../config/prisma.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        monthlyIncome: true,
        savingsGoal: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, monthlyIncome, savingsGoal } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        monthlyIncome: monthlyIncome !== undefined ? parseFloat(monthlyIncome) : undefined,
        savingsGoal: savingsGoal !== undefined ? parseFloat(savingsGoal) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        monthlyIncome: true,
        savingsGoal: true,
      },
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
