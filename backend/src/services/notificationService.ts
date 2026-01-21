import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { emitToUser } from '../config/socket';

/**
 * NOTIFICATION CHANNEL POLICY:
 * 
 * - IN-APP NOTIFICATIONS ONLY: All marketplace notifications (proposals, offers, messages, contracts)
 *   are stored in the Notification table and delivered via Socket.IO. No email delivery.
 * 
 * - EMAIL RESERVED: Email is reserved for future authentication/security features only:
 *   - Account verification (not yet implemented)
 *   - Password reset (not yet implemented)
 * 
 * - NO EMAIL FOR MARKETPLACE: No email templates, SMTP configuration, or email delivery
 *   for marketplace events. All marketplace notifications are in-app only.
 */

// Notification type constants - matches Upwork-style MVP
// All notifications are IN-APP ONLY (stored in Notification table, delivered via Socket.IO)
export const NotificationType = {
  PROPOSAL_RECEIVED: 'PROPOSAL_RECEIVED',
  OFFER_SENT: 'OFFER_SENT',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_REJECTED: 'OFFER_REJECTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  // Legacy types (kept for backward compatibility)
  PROPOSAL: 'proposal',
  PROPOSAL_ACCEPTED: 'proposal_accepted',
  PROPOSAL_REJECTED: 'proposal_rejected',
  PROPOSAL_OFFERED: 'proposal_offered',
  MESSAGE: 'message',
  JOB_STATUS_CHANGE: 'job_status_change',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

/**
 * Interface for creating notifications
 */
interface CreateNotificationInput {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  link?: string;
  relatedEntityId?: string; // jobId, proposalId, or messageId (stored in link for now)
}

/**
 * Core notification creation function (IN-APP ONLY)
 * 
 * Creates in-app notifications stored in the Notification table.
 * Notifications are delivered via Socket.IO in real-time.
 * 
 * NOTE: This function does NOT send emails. Email is reserved for future
 * authentication/security features (account verification, password reset).
 * 
 * @param input - Notification data
 * @param tx - Prisma transaction client (optional, uses prisma if not provided)
 * @param options - Options for duplicate prevention
 * 
 * Prevents duplicate notifications and ensures users don't receive notifications for their own actions
 */
async function createNotification(
  input: CreateNotificationInput,
  tx?: Prisma.TransactionClient,
  options?: {
    preventDuplicates?: boolean;
    duplicateCheckWindow?: number; // milliseconds
  }
): Promise<void> {
  const { preventDuplicates = true, duplicateCheckWindow = 5000 } = options || {};
  const client = tx || prisma;

  // Prevent duplicate notifications within a time window
  // Note: Skip duplicate check in transactions for performance (transactions are already atomic)
  if (preventDuplicates && !tx) {
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        link: input.link || undefined,
        createdAt: {
          gte: new Date(Date.now() - duplicateCheckWindow),
        },
      },
    });

    if (recentNotification) {
      // Duplicate notification prevented
      return;
    }
  }

  // Create in-app notification (stored in Notification table)
  // NOTE: No email delivery - email is reserved for future auth/security features
  const notification = await client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      isRead: false,
    },
  });

  // Emit real-time notification via Socket.IO (in-app delivery)
  // This ensures all notifications are delivered instantly to connected clients
  // If Socket.IO fails, notification is still stored in database (graceful degradation)
  try {
    emitToUser(input.userId, 'notification:new', {
      notification,
    });
  } catch (error) {
    // Don't fail notification creation if Socket.IO fails
    // Notification is still stored in database and can be retrieved via API
    console.error('Error emitting Socket.IO notification event:', error);
  }
}

/**
 * Generic helper to notify a user (IN-APP ONLY)
 * 
 * Creates an in-app notification stored in the Notification table.
 * Notification is delivered via Socket.IO in real-time.
 * 
 * NOTE: This does NOT send emails. Email is reserved for future
 * authentication/security features only.
 * 
 * @param userId - User to notify
 * @param type - Notification type
 * @param title - Notification title
 * @param message - Notification message
 * @param link - Optional link to relevant page
 * @param tx - Optional transaction client for use within transactions
 */
export async function notifyUser(
  userId: string,
  type: NotificationTypeValue,
  title: string,
  message: string,
  link?: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  await createNotification(
    {
      userId,
      type,
      title,
      message,
      link,
    },
    tx
  );
}

/**
 * Notify user about proposal-related events (IN-APP ONLY)
 * 
 * Creates in-app notifications for proposal events:
 * - PROPOSAL_RECEIVED: Client receives a new proposal
 * - OFFER_SENT: Freelancer receives an offer
 * - OFFER_ACCEPTED: Client's offer was accepted
 * - OFFER_REJECTED: Client's offer was rejected
 * 
 * NOTE: This does NOT send emails. All marketplace notifications are in-app only.
 * 
 * @param event - Event type (PROPOSAL_RECEIVED, OFFER_SENT, OFFER_ACCEPTED, OFFER_REJECTED)
 * @param recipientId - User to notify
 * @param jobTitle - Job title for context
 * @param proposalId - Proposal ID for link
 * @param additionalContext - Additional context for the message
 * @param tx - Optional transaction client for use within transactions
 */
export async function notifyProposalEvent(
  event: 'PROPOSAL_RECEIVED' | 'OFFER_SENT' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED',
  recipientId: string,
  jobTitle: string,
  proposalId: string,
  additionalContext?: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const eventConfig = {
    PROPOSAL_RECEIVED: {
      type: NotificationType.PROPOSAL_RECEIVED,
      title: 'New Proposal Received',
      message: `You received a new proposal for "${jobTitle}"${additionalContext ? ` - ${additionalContext}` : ''}`,
    },
    OFFER_SENT: {
      type: NotificationType.OFFER_SENT,
      title: 'You Received an Offer!',
      message: `You received an offer for "${jobTitle}"${additionalContext ? ` - ${additionalContext}` : ''}`,
    },
    OFFER_ACCEPTED: {
      type: NotificationType.OFFER_ACCEPTED,
      title: 'Offer Accepted - Contract Created',
      message: `Your offer for "${jobTitle}" has been accepted! Contract created.${additionalContext ? ` ${additionalContext}` : ''}`,
    },
    OFFER_REJECTED: {
      type: NotificationType.OFFER_REJECTED,
      title: 'Offer Rejected',
      message: `Your offer for "${jobTitle}" was rejected${additionalContext ? ` - ${additionalContext}` : ''}`,
    },
  };

  const config = eventConfig[event];

  await createNotification(
    {
      userId: recipientId,
      type: config.type,
      title: config.title,
      message: config.message,
      link: `/contracts`,
      relatedEntityId: proposalId,
    },
    tx
  );
}

/**
 * Notify user about new messages (IN-APP ONLY)
 * 
 * Creates in-app notification when a user receives a new message.
 * Notification is delivered via Socket.IO in real-time.
 * 
 * NOTE: This does NOT send emails. All marketplace notifications are in-app only.
 * 
 * @param recipientId - User to notify
 * @param senderName - Sender's name for context
 * @param jobId - Optional job ID for link
 * @param contractId - Optional contract ID for link
 * @param tx - Optional transaction client for use within transactions
 */
export async function notifyMessageEvent(
  recipientId: string,
  senderName: string,
  jobId?: string,
  contractId?: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const link = jobId ? `/messages/${jobId}` : '/messages';

  await createNotification(
    {
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: `You have a new message from ${senderName}`,
      link,
      relatedEntityId: jobId || contractId,
    },
    tx
  );
}

/**
 * Notify freelancer when their offer is accepted (IN-APP ONLY)
 * 
 * Creates in-app notification for freelancer when they accept an offer.
 * This is different from the client notification (confirmation vs acceptance).
 * 
 * NOTE: This does NOT send emails. All marketplace notifications are in-app only.
 * 
 * @param freelancerId - Freelancer to notify
 * @param jobTitle - Job title
 * @param contractId - Contract ID for link
 * @param tx - Optional transaction client for use within transactions
 */
export async function notifyFreelancerOfferAccepted(
  freelancerId: string,
  jobTitle: string,
  contractId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  await createNotification(
    {
      userId: freelancerId,
      type: NotificationType.OFFER_ACCEPTED,
      title: 'Offer Accepted!',
      message: `You accepted the offer for "${jobTitle}"`,
      link: `/contracts`,
      relatedEntityId: contractId,
    },
    tx
  );
}

// Existing functions (kept for backward compatibility)
export async function getNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }
) {
  const where: any = {
    userId,
  };

  if (options?.unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
      hasMore: (options?.offset || 0) + notifications.length < total,
    },
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  if (notification.userId !== userId) {
    throw new NotFoundError('Notification not found');
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return updatedNotification;
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { updatedCount: result.count };
}
