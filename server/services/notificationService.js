import prisma from '../config/prisma.js';

export async function notify(userId, type, message, link = null) {
  try {
    await prisma.notification.create({
      data: { userId, type, message, link },
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

export async function notifyMany(userIds, type, message, link = null) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, message, link })),
    });
  } catch (err) {
    console.error('Failed to create bulk notifications:', err.message);
  }
}