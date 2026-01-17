import { prisma } from '../config/database';
import { CreateMessageInput } from '../utils/validation';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { UserRole, ProposalStatus } from '@prisma/client';
import { emitToRoom, emitToUser } from '../config/socket';

export async function sendMessage(senderId: string, input: CreateMessageInput) {
  // Validate that sender and receiver exist
  const [sender, receiver] = await Promise.all([
    prisma.user.findUnique({ where: { id: senderId } }),
    prisma.user.findUnique({ where: { id: input.receiverId } }),
  ]);

  if (!sender || !receiver) {
    throw new NotFoundError('Sender or receiver not found');
  }

  if (input.receiverId === senderId) {
    throw new ValidationError('You cannot send a message to yourself');
  }

  // Validate job or contract context
  if (input.jobId) {
    const job = await prisma.job.findUnique({
      where: { id: input.jobId },
      include: {
        contract: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Verify sender is either client or a freelancer who submitted a non-rejected proposal
    const isClient = job.clientId === senderId;
    const senderProposal = !isClient
      ? await prisma.proposal.findUnique({
          where: {
            jobId_freelancerId: {
              jobId: input.jobId,
              freelancerId: senderId,
            },
          },
        })
      : null;

    // Rejected freelancers cannot message
    if (!isClient && (!senderProposal || senderProposal.status === ProposalStatus.REJECTED)) {
      throw new ForbiddenError(
        'You can only message about jobs you own or have an active proposal for. Rejected proposals cannot send messages.'
      );
    }

    if (isClient) {
      const receiverProposal = await prisma.proposal.findUnique({
        where: {
          jobId_freelancerId: {
            jobId: input.jobId,
            freelancerId: input.receiverId,
          },
        },
      });

      if (!receiverProposal || receiverProposal.status === ProposalStatus.REJECTED) {
        throw new ForbiddenError('Invalid receiver for this job context');
      }
    } else if (receiver.id !== job.clientId) {
      throw new ForbiddenError('Invalid receiver for this job context');
    }

    if (input.contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract) {
        throw new NotFoundError('Contract not found');
      }

      if (contract.jobId !== input.jobId) {
        throw new ValidationError('Contract does not belong to this job');
      }

      if (senderId !== contract.clientId && senderId !== contract.freelancerId) {
        throw new ForbiddenError('You are not part of this contract');
      }

      const expectedReceiver =
        senderId === contract.clientId ? contract.freelancerId : contract.clientId;
      if (receiver.id !== expectedReceiver) {
        throw new ForbiddenError('Invalid receiver for this contract');
      }
    }
  } else if (input.contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: input.contractId },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    // Verify sender is either client or freelancer in the contract
    if (senderId !== contract.clientId && senderId !== contract.freelancerId) {
      throw new ForbiddenError('You are not part of this contract');
    }

    // Verify receiver is the other party
    if (receiver.id !== contract.clientId && receiver.id !== contract.freelancerId) {
      throw new ForbiddenError('Invalid receiver for this contract');
    }
  } else {
    throw new ValidationError('Either jobId or contractId must be provided');
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      jobId: input.jobId || null,
      contractId: input.contractId || null,
      senderId,
      receiverId: input.receiverId,
      content: input.content,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      job: input.jobId
        ? {
            select: {
              id: true,
              title: true,
            },
          }
        : undefined,
      contract: input.contractId
        ? {
            select: {
              id: true,
            },
          }
        : undefined,
    },
  });

  // Emit real-time message events via Socket.IO (separate from notification)
  // This emits to conversation rooms for real-time message display
  try {
    // Emit to the conversation room (job or contract) for real-time message display
    if (input.jobId) {
      emitToRoom(`job:${input.jobId}`, 'message:new', {
        message,
      });
    } else if (input.contractId) {
      emitToRoom(`contract:${input.contractId}`, 'message:new', {
        message,
      });
    }

    // Note: Notification is automatically emitted by NotificationService via Socket.IO
    // No need to emit notification:new here - it's handled by notifyMessageEvent()

    // Emit unread count update to receiver
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: input.receiverId,
        isRead: false,
      },
    });
    emitToUser(input.receiverId, 'message:unread-count', {
      unreadCount,
    });
  } catch (error) {
    // Don't fail the request if Socket.IO fails
    console.error('Error emitting Socket.IO event:', error);
  }

  return message;
}

export async function getMessages(
  userId: string,
  filters?: {
    jobId?: string;
    contractId?: string;
    conversationWith?: string;
  }
) {
  const where: any = {
    OR: [
      { senderId: userId },
      { receiverId: userId },
    ],
  };

  if (filters?.jobId) {
    where.jobId = filters.jobId;

    // Verify user has access to this job
    const job = await prisma.job.findUnique({
      where: { id: filters.jobId },
      include: {
        contract: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isClient = job.clientId === userId;
    const hasProposal = await prisma.proposal.findUnique({
      where: {
        jobId_freelancerId: {
          jobId: filters.jobId,
          freelancerId: userId,
        },
      },
    });

    // Rejected freelancers cannot access messages
    if (!isClient && !job.contract) {
      if (!hasProposal || hasProposal.status === ProposalStatus.REJECTED) {
        throw new ForbiddenError('You do not have access to messages for this job');
      }
    }

    // If job has contract, verify user is part of it
    if (job.contract) {
      if (userId !== job.contract.clientId && userId !== job.contract.freelancerId) {
        throw new ForbiddenError('You do not have access to messages for this contract');
      }
    }
  }

  if (filters?.contractId) {
    where.contractId = filters.contractId;

    // Verify user is part of this contract
    const contract = await prisma.contract.findUnique({
      where: { id: filters.contractId },
    });

    if (!contract) {
      throw new NotFoundError('Contract not found');
    }

    if (userId !== contract.clientId && userId !== contract.freelancerId) {
      throw new ForbiddenError('You are not part of this contract');
    }
  }

  if (filters?.conversationWith) {
    where.OR = [
      {
        senderId: userId,
        receiverId: filters.conversationWith,
      },
      {
        senderId: filters.conversationWith,
        receiverId: userId,
      },
    ];
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
      contract: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return messages;
}

export async function markMessageAsRead(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new NotFoundError('Message not found');
  }

  // Only receiver can mark as read
  if (message.receiverId !== userId) {
    throw new ForbiddenError('You can only mark your own received messages as read');
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      receiver: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Emit real-time event to notify sender that message was read
  try {
    if (message.jobId) {
      emitToRoom(`job:${message.jobId}`, 'message:read', {
        messageId: updatedMessage.id,
        readBy: userId,
        readAt: updatedMessage.createdAt,
      });
    } else if (message.contractId) {
      emitToRoom(`contract:${message.contractId}`, 'message:read', {
        messageId: updatedMessage.id,
        readBy: userId,
        readAt: updatedMessage.createdAt,
      });
    }

    // Emit to sender that their message was read
    emitToUser(message.senderId, 'message:read-status', {
      messageId: updatedMessage.id,
      isRead: true,
    });
  } catch (error) {
    console.error('Error emitting Socket.IO event:', error);
  }

  return updatedMessage;
}

export async function getUnreadMessageCount(userId: string) {
  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });

  return { unreadCount: count };
}

