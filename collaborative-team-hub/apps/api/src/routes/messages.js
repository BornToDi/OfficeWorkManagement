const express = require('express');
const auth = require('../middleware/auth');
const prisma = require('../prismaClient');

const router = express.Router({ mergeParams: true });

function buildMessageNotification(senderName, workspaceName, content) {
  const preview = content.length > 80 ? `${content.slice(0, 77)}...` : content;
  return `${senderName} sent a new message in ${workspaceName}: ${preview}`;
}

router.post('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { workspaceId } = req.params;
    const { content } = req.body;

    if (!content || !workspaceId) {
      return res.status(400).json({ error: 'Content and workspaceId required' });
    }

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: {
        user: { select: { name: true } }
      }
    });
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        name: true,
        members: {
          select: { userId: true }
        }
      }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const message = await prisma.message.create({
      data: {
        workspaceId,
        authorId: userId,
        content
      },
      include: {
        author: true
      }
    });

    const recipientIds = workspace.members
      .map((workspaceMember) => workspaceMember.userId)
      .filter((recipientId) => recipientId !== userId);

    if (recipientIds.length > 0) {
      const notificationMessage = buildMessageNotification(
        member.user.name,
        workspace.name,
        content
      );

      await Promise.all(
        recipientIds.map((recipientId) =>
          prisma.notification.create({
            data: {
              userId: recipientId,
              workspaceId,
              type: 'MESSAGE',
              message: notificationMessage,
              isRead: false
            }
          })
        )
      );
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('[messages POST] error:', err);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { workspaceId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId }
    });
    if (!member) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const messages = await prisma.message.findMany({
      where: { workspaceId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(messages);
  } catch (err) {
    console.error('[messages GET] error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
