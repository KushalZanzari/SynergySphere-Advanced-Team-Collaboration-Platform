const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/messages/:channelId
// @desc    Get messages for a channel
// @access  Private
router.get('/:channelId', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalMessages = await prisma.message.count({
      where: { channelId }
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Create new message
// @access  Private
router.post('/', [
  auth,
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required'),
  body('channelId').isUUID().withMessage('Valid channel ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, channelId } = req.body;

    // Check if channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Message created successfully',
      data: message
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Update message
// @access  Private
router.put('/:id', [
  auth,
  body('content').trim().isLength({ min: 1 }).withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content } = req.body;
    const messageId = req.params.id;

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: req.user.id
      }
    });

    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    const message = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const messageId = req.params.id;

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        userId: req.user.id
      }
    });

    if (!existingMessage) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
