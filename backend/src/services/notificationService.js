const nodemailer = require('nodemailer');
const prisma = require('../prisma');

// ============================================================================
// CONFIGURAÇÃO NODEMAILER
// ============================================================================
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Verifica se está em hora de silêncio
 * @param {number} quietHoursStart - Hora de início (0-23)
 * @param {number} quietHoursEnd - Hora de término (0-23)
 * @returns {boolean}
 */
function isInQuietHours(quietHoursStart, quietHoursEnd) {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentHour = now.getHours();

  // Se fim da noite (ex: 23h a 8h)
  if (quietHoursStart > quietHoursEnd) {
    return currentHour >= quietHoursStart || currentHour < quietHoursEnd;
  }

  // Se horário normal (ex: 14h a 18h)
  return currentHour >= quietHoursStart && currentHour < quietHoursEnd;
}

/**
 * Calcula dias restantes até a data
 * @param {Date} dueDate
 * @returns {number}
 */
function getDaysUntilDue(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Verifica se deve notificar baseado nas preferências
 * @param {Object} preferences - Preferências do usuário
 * @param {string} notificationType - Tipo de notificação (email, sms, inApp)
 * @returns {boolean}
 */
function shouldNotify(preferences, notificationType) {
  if (!preferences) return false;

  // Verifica se está em hora de silêncio
  if (isInQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
    return false;
  }

  // Verifica preferência específica
  switch (notificationType) {
    case 'email':
      return preferences.emailNotifications;
    case 'sms':
      return preferences.pushNotifications; // SMS usa flag de push
    case 'inApp':
      return preferences.inAppNotifications;
    default:
      return false;
  }
}

// ============================================================================
// NOTIFICAÇÃO POR EMAIL
// ============================================================================

/**
 * Envia notificação por email
 * @param {string} recipientEmail
 * @param {string} subject
 * @param {string} htmlContent
 * @returns {Promise}
 */
async function sendEmail(recipientEmail, subject, htmlContent) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email não configurado. Pulando envio.');
      return { success: false, message: 'Email não configurado' };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`✉️ Email enviado para ${recipientEmail}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Erro ao enviar email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// NOTIFICAÇÕES NO BANCO DE DADOS
// ============================================================================

/**
 * Cria notificação no banco de dados
 * @param {number} userId
 * @param {string} title
 * @param {string} body
 * @param {string} type - task_due_soon, task_created, etc
 * @param {number} taskId - (opcional)
 * @param {number} courseId - (opcional)
 * @returns {Promise<Object>}
 */
async function createInAppNotification(userId, title, body, type, taskId = null, courseId = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        taskId,
        courseId,
      },
    });

    console.log(`💬 Notificação criada: ${notification.id}`);
    return notification;
  } catch (error) {
    console.error(`❌ Erro ao criar notificação: ${error.message}`);
    throw error;
  }
}

/**
 * Marca notificação como lida
 * @param {number} notificationId
 * @returns {Promise<Object>}
 */
async function markAsRead(notificationId) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return notification;
  } catch (error) {
    console.error(`❌ Erro ao marcar notificação como lida: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// NOTIFICAÇÃO DE TAREFAS PRÓXIMAS
// ============================================================================

/**
 * Template HTML para email de tarefa próxima
 * @param {string} taskTitle
 * @param {number} daysRemaining
 * @param {string} dueDate
 * @returns {string}
 */
function getTaskDueSoonEmailTemplate(taskTitle, daysRemaining, dueDate) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📋 Tarefa Próxima</h1>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <p style="margin-top: 0; font-size: 16px; color: #555;">Olá,</p>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Você tem uma tarefa vencendo em <strong>${daysRemaining} dias</strong>:
        </p>

        <div style="background: #f5f7ff; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; color: #1f2a43; font-size: 18px;">${taskTitle}</h2>
          <p style="margin: 0; color: #60779a; font-size: 14px;">
            📅 Vencimento: <strong>${dueDate}</strong>
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          Acesse a plataforma StudyHub para mais detalhes e começar a trabalhar.
        </p>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Acessar StudyHub
          </a>
        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
          Você recebeu este email porque tem tarefas próximas do vencimento.<br>
          Altere suas preferências de notificação em Meu Perfil.
        </p>
      </div>
    </div>
  `;
}

/**
 * Envia notificação de tarefa próxima do vencimento
 * @param {number} userId
 * @param {Object} task - Objeto task do Prisma
 * @param {Object} user - Objeto user do Prisma
 * @returns {Promise}
 */
async function notifyTaskDueSoon(userId, task, user) {
  try {
    // Busca preferências do usuário
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      console.log(`⚠️ Usuário ${userId} não tem preferências configuradas`);
      return;
    }

    const daysRemaining = getDaysUntilDue(task.dueDate);
    const dueDate = new Date(task.dueDate).toLocaleDateString('pt-BR');

    // Email
    if (shouldNotify(preferences, 'email') && user.email) {
      const emailHtml = getTaskDueSoonEmailTemplate(task.title, daysRemaining, dueDate);
      await sendEmail(
        user.email,
        `📋 Tarefa próxima: ${task.title}`,
        emailHtml
      );
    }

    // In-app notification
    if (shouldNotify(preferences, 'inApp')) {
      await createInAppNotification(
        userId,
        `Tarefa próxima: ${task.title}`,
        `Esta tarefa vence em ${daysRemaining} dias (${dueDate})`,
        'task_due_soon',
        task.id
      );
    }

    // Atualiza notifiedAt
    await prisma.task.update({
      where: { id: task.id },
      data: { notifiedAt: new Date() },
    });

    console.log(`✅ Notificação de tarefa enviada para ${user.email}`);
  } catch (error) {
    console.error(`❌ Erro ao notificar tarefa: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// JOB: VERIFICAR TAREFAS PRÓXIMAS E NOTIFICAR
// ============================================================================

/**
 * Job que executa periodicamente para verificar tarefas próximas
 * Deve ser executado por um cron job (ex: node-schedule, agenda, etc)
 */
async function checkAndNotifyUpcomingTasks() {
  try {
    console.log('🔍 Verificando tarefas próximas do vencimento...');

    // Busca todas as preferências ativas
    const preferences = await prisma.notificationPreference.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    for (const pref of preferences) {
      // Busca tarefas deste usuário que vencerão em X dias
      const tasks = await prisma.task.findMany({
        where: {
          professorSubject: {
            subject: {
              course: {
                userId: pref.user.id,
              },
            },
          },
          completed: false,
          dueDate: {
            // Entre agora e daqui X dias
            gte: new Date(),
            lte: new Date(Date.now() + pref.notifyDaysBefore * 24 * 60 * 60 * 1000),
          },
          // Não notificar duas vezes (notifiedAt mais recente < 24 horas atrás)
          OR: [
            { notifiedAt: null },
            {
              notifiedAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
        include: {
          professorSubject: {
            include: {
              subject: true,
            },
          },
        },
      });

      // Envia notificação para cada tarefa
      for (const task of tasks) {
        await notifyTaskDueSoon(pref.user.id, task, pref.user);
      }
    }

    console.log('✅ Verificação de tarefas concluída');
  } catch (error) {
    console.error(`❌ Erro ao verificar tarefas: ${error.message}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Funções de envio
  sendEmail,
  createInAppNotification,
  markAsRead,

  // Funções de notificação específicas
  notifyTaskDueSoon,
  checkAndNotifyUpcomingTasks,

  // Funções utilitárias
  isInQuietHours,
  getDaysUntilDue,
  shouldNotify,
};
