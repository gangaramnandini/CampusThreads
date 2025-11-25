const prisma = require('../services/connect-db');
const createError = require('http-errors');

// Log membership actions
function logMembership(action, channelId, userId, result) {
  console.log(`[${action}] channelId:${channelId} userId:${userId} =>`, result);
}

// Create a new channel and auto-join creator as admin
exports.createChannel = async (req, res, next) => {
  try {
    const { name, type = 'public', description } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!name || typeof name !== 'string' || name.trim() === '')
      throw createError.BadRequest('Channel name is required');

    // 1. Create channel
    const channel = await prisma.channel.create({
      data: {
        name: name.trim(),
        type,
        description: description?.trim() || null,
        organizationId,
        createdBy: userId,
      },
    });

    // 2. Add creator as admin member to ChannelMembership (always!)
    let membership;
    try {
      membership = await prisma.channelMembership.create({
        data: {
          channelId: channel.id,
          userId,
          role: 'admin',
        },
      });
      logMembership('CREATE_CH_ADMIN', channel.id, userId, membership);
    } catch (memberErr) {
      // Likely a duplicate (shouldn't happen, but just in case)
      membership = await prisma.channelMembership.findUnique({
        where: {
          channelId_userId: { channelId: channel.id, userId }
        }
      });
      console.warn('Creator membership possibly already exists:', memberErr);
    }

    res.status(201).json({ channel, membership });
  } catch (error) {
    next(error);
  }
};

// List all channels in user's organization
exports.listChannels = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const channels = await prisma.channel.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(channels);
  } catch (error) {
    next(error);
  }
};

// User joins a channel
exports.joinChannel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const channelId = parseInt(req.params.id);

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw createError.NotFound('Channel not found');
    if (channel.organizationId !== organizationId)
      throw createError.Forbidden('Cannot join channel outside your institution');

    const existingMembership = await prisma.channelMembership.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
    if (existingMembership)
      return res.status(200).json({ message: 'Already a member', membership: existingMembership });

    const membership = await prisma.channelMembership.create({
      data: {
        channelId: channelId,
        userId: userId,
        role: 'member',
      },
    });
    logMembership('JOIN', channelId, userId, membership);

    res.status(201).json({ message: 'Joined channel', membership });
  } catch (error) {
    next(error);
  }
};

// User leaves a channel
exports.leaveChannel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const channelId = parseInt(req.params.id);

    const membership = await prisma.channelMembership.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
    if (!membership) throw createError.NotFound('Membership not found');

    await prisma.channelMembership.delete({
      where: { id: membership.id },
    });
    logMembership('LEAVE', channelId, userId, membership);

    res.json({ message: 'Left channel successfully' });
  } catch (error) {
    next(error);
  }
};

// Get messages for a channel (only for members)
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const channelId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 20;
    const cursorId = req.query.cursor ? parseInt(req.query.cursor) : undefined;

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw createError.NotFound('Channel not found');
    if (channel.organizationId !== organizationId)
      throw createError.Forbidden('Cannot view messages outside your institution');

    const isMember = await prisma.channelMembership.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
    if (!isMember) throw createError.Forbidden('You must join the channel to view messages');

    const messages = await prisma.channelMessage.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursorId && { cursor: { id: cursorId }, skip: 1 }),
    });

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

// Send a message to a channel (only for members)
exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const channelId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '')
      throw createError.BadRequest('Message content is required');

    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw createError.NotFound('Channel not found');
    if (channel.organizationId !== organizationId)
      throw createError.Forbidden('Cannot send message outside your institution');

    const membership = await prisma.channelMembership.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) throw createError.Forbidden('You must join the channel to send messages');

    const message = await prisma.channelMessage.create({
      data: {
        channelId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

// controllers/channelController.js

exports.getUserChannels = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const memberships = await prisma.channelMembership.findMany({
      where: { userId },
      select: { channelId: true },
    });
    res.json(memberships); // Returns [{ channelId: 1 }, { channelId: 2 }, ...]
  } catch (error) {
    next(error);
  }
};
