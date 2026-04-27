const express = require('express');
const prisma = require('../prisma');
const router = express.Router();
const {
  checkAndNotifyUpcomingTasks,
  markAsRead,
} = require('../services/notificationService');

// ============================================================================
// GET: Listar notificações do usuário
// Rota: GET /api/notifications
// Headers: Authorization: Bearer <token>
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações' });
  }
});

// ============================================================================
// GET: Contar notificações não lidas
// Rota: GET /api/notifications/unread/count
// Headers: Authorization: Bearer <token>
// ============================================================================
router.get('/unread/count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.userId,
        read: false,
      },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Erro ao contar notificações:', error);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
});

// ============================================================================
// PATCH: Marcar notificação como lida
// Rota: PATCH /api/notifications/:id/read
// Headers: Authorization: Bearer <token>
// ============================================================================
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updated = await markAsRead(parseInt(id));

    res.json({
      message: 'Notificação marcada como lida',
      notification: updated,
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res
      .status(500)
      .json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// ============================================================================
// DELETE: Deletar notificação
// Rota: DELETE /api/notifications/:id
// Headers: Authorization: Bearer <token>
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification.userId !== req.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Notificação deletada' });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
});

// ============================================================================
// GET: Preferências de notificação do usuário
// Rota: GET /api/notifications/preferences
// Headers: Authorization: Bearer <token>
// ============================================================================
router.get('/preferences', async (req, res) => {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: req.userId },
    });

    // Cria preferências padrão se não existir
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: req.userId,
          emailNotifications: true,
          pushNotifications: true,
          inAppNotifications: true,
          notifyDaysBefore: 2,
          quietHoursStart: 23,
          quietHoursEnd: 8,
        },
      });
    }

    res.json({ preferences });
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    res.status(500).json({ error: 'Erro ao buscar preferências' });
  }
});

// ============================================================================
// PATCH: Atualizar preferências de notificação
// Rota: PATCH /api/notifications/preferences
// Headers: Authorization: Bearer <token>
// Body: {
//   emailNotifications?: boolean,
//   pushNotifications?: boolean,
//   inAppNotifications?: boolean,
//   notifyDaysBefore?: number,
//   quietHoursStart?: number,
//   quietHoursEnd?: number
// }
// ============================================================================
router.patch('/preferences', async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      inAppNotifications,
      notifyDaysBefore,
      quietHoursStart,
      quietHoursEnd,
    } = req.body;

    // Validações
    if (notifyDaysBefore !== undefined) {
      if (notifyDaysBefore < 0 || notifyDaysBefore > 30) {
        return res.status(400).json({
          error: 'notifyDaysBefore deve estar entre 0 e 30',
        });
      }
    }

    if (quietHoursStart !== undefined || quietHoursEnd !== undefined) {
      const start = quietHoursStart ?? 0;
      const end = quietHoursEnd ?? 0;

      if (start < 0 || start > 23 || end < 0 || end > 23) {
        return res.status(400).json({
          error: 'Horas devem estar entre 0 e 23',
        });
      }
    }

    // Busca ou cria preferências
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: req.userId },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: req.userId,
          emailNotifications:
            emailNotifications !== undefined ? emailNotifications : true,
          pushNotifications:
            pushNotifications !== undefined ? pushNotifications : true,
          inAppNotifications:
            inAppNotifications !== undefined ? inAppNotifications : true,
          notifyDaysBefore: notifyDaysBefore ?? 2,
          quietHoursStart: quietHoursStart,
          quietHoursEnd: quietHoursEnd,
        },
      });
    } else {
      // Atualiza preferências existentes
      preferences = await prisma.notificationPreference.update({
        where: { userId: req.userId },
        data: {
          ...(emailNotifications !== undefined && { emailNotifications }),
          ...(pushNotifications !== undefined && { pushNotifications }),
          ...(inAppNotifications !== undefined && { inAppNotifications }),
          ...(notifyDaysBefore !== undefined && { notifyDaysBefore }),
          ...(quietHoursStart !== undefined && { quietHoursStart }),
          ...(quietHoursEnd !== undefined && { quietHoursEnd }),
        },
      });
    }

    res.json({
      message: 'Preferências atualizadas com sucesso',
      preferences,
    });
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({ error: 'Erro ao atualizar preferências' });
  }
});

// ============================================================================
// POST: Trigger manual para verificar e enviar notificações (Debug)
// Rota: POST /api/notifications/check
// Headers: Authorization: Bearer <token>
// ============================================================================
router.post('/check', async (req, res) => {
  try {
    await checkAndNotifyUpcomingTasks();
    res.json({
      message: 'Verificação de tarefas concluída com sucesso',
    });
  } catch (error) {
    console.error('Erro ao verificar tarefas:', error);
    res.status(500).json({
      error: 'Erro ao verificar tarefas',
      details: error.message,
    });
  }
});

module.exports = router;