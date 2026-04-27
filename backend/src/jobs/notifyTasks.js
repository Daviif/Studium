/**
 * Job para verificar tarefas próximas e enviar notificações
 * Executa periodicamente usando node-schedule
 */

const schedule = require('node-schedule');
const { checkAndNotifyUpcomingTasks } = require('../services/notificationService');

// ============================================================================
// INICIALIZAR JOB PRINCIPAL
// ============================================================================

/**
 * Inicia o job de notificações
 * Executa a cada 30 minutos por padrão (para produção)
 */
function initNotificationJob() {
  try {
    // Cron: */30 * * * * = a cada 30 minutos
    const job = schedule.scheduleJob('*/30 * * * *', async () => {
      console.log(`⏰ [${new Date().toLocaleString()}] Iniciando job de notificações...`);
      try {
        await checkAndNotifyUpcomingTasks();
        console.log('✅ Job de notificações concluído');
      } catch (error) {
        console.error('❌ Erro no job de notificações:', error.message);
      }
    });

    console.log('✅ Job de notificações inicializado');
    console.log('📅 Próxima execução:', job.nextInvocation());

    return job;
  } catch (error) {
    console.error('❌ Erro ao inicializar job de notificações:', error.message);
    return null;
  }
}

// ============================================================================
// JOB DE TESTE (Desenvolvimento)
// ============================================================================

/**
 * Job customizado para teste (executa a cada 1 minuto)
 * Use apenas para desenvolvimento!
 */
function initNotificationJobTest() {
  try {
    // Cron: * * * * * = a cada minuto
    const job = schedule.scheduleJob('* * * * *', async () => {
      console.log(
        `⏰ [${new Date().toLocaleString()}] Executando teste de notificações...`
      );
      try {
        await checkAndNotifyUpcomingTasks();
        console.log('✅ Teste concluído');
      } catch (error) {
        console.error('❌ Erro no teste:', error.message);
      }
    });

    console.warn('⚠️ MODO TESTE: Job executa a cada 1 minuto!');
    console.log('📅 Próxima execução:', job.nextInvocation());
    return job;
  } catch (error) {
    console.error('❌ Erro ao inicializar job de teste:', error.message);
    return null;
  }
}

// ============================================================================
// JOB DIÁRIO (Produção)
// ============================================================================

/**
 * Job que executa diariamente às 08:00 (horário do servidor)
 */
function initNotificationJobDaily() {
  try {
    // Cron: 0 8 * * * = às 08:00 todos os dias
    const job = schedule.scheduleJob('0 8 * * *', async () => {
      console.log(
        `⏰ [${new Date().toLocaleString()}] Executando notificações diárias...`
      );
      try {
        await checkAndNotifyUpcomingTasks();
        console.log('✅ Job diário concluído');
      } catch (error) {
        console.error('❌ Erro no job diário:', error.message);
      }
    });

    console.log('✅ Job diário inicializado (às 08:00)');
    console.log('📅 Próxima execução:', job.nextInvocation());
    return job;
  } catch (error) {
    console.error('❌ Erro ao inicializar job diário:', error.message);
    return null;
  }
}

// ============================================================================
// CANCELAR JOB
// ============================================================================

function cancelJob(job) {
  if (job) {
    job.cancel();
    console.log('❌ Job cancelado');
  }
}

// ============================================================================
// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  initNotificationJob,
  initNotificationJobTest,
  initNotificationJobDaily,
  cancelJob,
};