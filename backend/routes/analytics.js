const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });

    // Get message statistics
    const messageStats = await prisma.message.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {},
      orderBy: { createdAt: 'asc' }
    });

    // Get user activity
    const userActivity = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            messages: true,
            tasks: true,
            events: true
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Get project statistics
    const projectStats = await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate completion rate
    const totalTasks = await prisma.task.count({
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });
    const completedTasks = await prisma.task.count({
      where: {
        status: 'DONE',
        ...(dateFilter.createdAt ? { createdAt: dateFilter } : {})
      }
    });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      taskStats: taskStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status;
        return acc;
      }, {}),
      messageStats: messageStats.map(stat => ({
        date: stat.createdAt,
        count: stat._count.id
      })),
      userActivity,
      projectStats,
      completionRate: Math.round(completionRate * 100) / 100,
      totalTasks,
      completedTasks
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/tasks
// @desc    Get task analytics
// @access  Private
router.get('/tasks', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    // Tasks by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: { status: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });

    // Tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });

    // Tasks by assignee
    const tasksByAssignee = await prisma.task.groupBy({
      by: ['assigneeId'],
      _count: { assigneeId: true },
      where: {
        assigneeId: { not: null },
        ...(dateFilter.createdAt ? { createdAt: dateFilter } : {})
      }
    });

    // Get assignee details
    const assigneeIds = tasksByAssignee.map(t => t.assigneeId);
    const assignees = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, avatar: true }
    });

    const tasksByAssigneeWithDetails = tasksByAssignee.map(task => {
      const assignee = assignees.find(a => a.id === task.assigneeId);
      return {
        assigneeId: task.assigneeId,
        assignee,
        count: task._count.assigneeId
      };
    });

    res.json({
      byStatus: tasksByStatus,
      byPriority: tasksByPriority,
      byAssignee: tasksByAssigneeWithDetails
    });
  } catch (error) {
    console.error('Get task analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/messages
// @desc    Get message analytics
// @access  Private
router.get('/messages', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    // Messages by channel
    const messagesByChannel = await prisma.message.groupBy({
      by: ['channelId'],
      _count: { channelId: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });

    // Get channel details
    const channelIds = messagesByChannel.map(m => m.channelId);
    const channels = await prisma.channel.findMany({
      where: { id: { in: channelIds } },
      select: { id: true, name: true }
    });

    const messagesByChannelWithDetails = messagesByChannel.map(message => {
      const channel = channels.find(c => c.id === message.channelId);
      return {
        channelId: message.channelId,
        channel,
        count: message._count.channelId
      };
    });

    // Messages by user
    const messagesByUser = await prisma.message.groupBy({
      by: ['userId'],
      _count: { userId: true },
      where: dateFilter.createdAt ? { createdAt: dateFilter } : {}
    });

    // Get user details
    const userIds = messagesByUser.map(m => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true }
    });

    const messagesByUserWithDetails = messagesByUser.map(message => {
      const user = users.find(u => u.id === message.userId);
      return {
        userId: message.userId,
        user,
        count: message._count.userId
      };
    });

    res.json({
      byChannel: messagesByChannelWithDetails,
      byUser: messagesByUserWithDetails
    });
  } catch (error) {
    console.error('Get message analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
