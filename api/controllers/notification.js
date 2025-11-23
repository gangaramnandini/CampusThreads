const createError = require('http-errors');

const prisma = require('../services/connect-db');

/**
 * Helper to confirm user belongs to the same organization as authenticated user.
 */
const verifyNotificationAccess = async (userId, notificationId) => {
  // Fetch notification with sender and recipient organization_ids
  const notification = await prisma.notification.findUnique({
    where: { id: Number(notificationId) },
    select: {
      sender: { select: { organization_id: true } },
      recipient: { select: { organization_id: true } },
    },
  });
  if (!notification) throw createError.NotFound();

  // Fetch authenticated user's organization_id
  const authUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organization_id: true },
  });

  if (
    !authUser ||
    notification.sender.organization_id !== authUser.organization_id ||
    notification.recipient.organization_id !== authUser.organization_id
  ) {
    throw createError.Forbidden("Access denied: cross-institution notification");
  }
  return notification;
};

const getNotifications = async (req, res, next) => {
  const { userId } = req;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  try {
    // Fetch authenticated user's organization_id
    const authUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });
    if (!authUser) throw createError.Unauthorized();

    // Count notifications where recipient is user and sender is in same organization
    const total = await prisma.notification.count({
      where: {
        recipientId: userId,
        sender: { organization_id: authUser.organization_id },
      },
    });

    const unReadNotificationCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        sender: { organization_id: authUser.organization_id },
        read: false,
      },
    });

    // Fetch notifications with institution filtering
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        sender: { organization_id: authUser.organization_id },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        recipient: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true } },
          },
        },
        sender: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true } },
          },
        },
      },
    });

    return res.status(200).json({
      info: {
        total,
        unReadNotifications: unReadNotificationCount,
        nextPage: total > (page - 1) * limit + notifications.length ? page + 1 : null,
        prevPage: page === 1 ? null : page - 1,
      },
      results: notifications,
    });
  } catch (error) {
    return next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req;
  try {
    await verifyNotificationAccess(userId, id);

    const updatedNotification = await prisma.notification.update({
      where: { id: Number(id) },
      data: { read: true },
    });
    return res.status(200).json({ notification: updatedNotification });
  } catch (error) {
    return next(error);
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  const { userId } = req;
  try {
    // Only mark notifications read where sender and recipient are in same institution
    const authUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });
    if (!authUser) throw createError.Unauthorized();

    // Find notifications to update
    const notificationIds = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        sender: { organization_id: authUser.organization_id },
        read: false,
      },
      select: { id: true },
    });

    const idsToUpdate = notificationIds.map((n) => n.id);

    if (idsToUpdate.length === 0) {
      return res.status(200).json({ notifications: { count: 0 } });
    }

    const updateResult = await prisma.notification.updateMany({
      where: { id: { in: idsToUpdate } },
      data: { read: true },
    });
    return res.status(200).json({ notifications: updateResult });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
