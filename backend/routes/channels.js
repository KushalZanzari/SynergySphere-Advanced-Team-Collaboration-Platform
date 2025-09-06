const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// @route   GET /api/channels
// @desc    Get all channels
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const channels = await prisma.channel.findMany({
      include: {
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/channels/:id
// @desc    Get channel by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/channels
// @desc    Create new channel
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }).withMessage('Channel name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if channel already exists
    const existingChannel = await prisma.channel.findUnique({
      where: { name }
    });

    if (existingChannel) {
      return res.status(400).json({ message: 'Channel with this name already exists' });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/channels/:id
// @desc    Update channel
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Channel name cannot be empty'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const channel = await prisma.channel.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      message: 'Channel updated successfully',
      channel
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/channels/:id
// @desc    Delete channel
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.channel.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
