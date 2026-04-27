const { initNotificationJob } = require('./notifyTasks');

let notificationJobInstance = null;

/**
 * Inicia todos os jobs do sistema
 */
function startJobs() {
  try {
    console.log('🚀 Inicializando jobs...');
    
    // Inicia o job de notificações
    // Muda para initNotificationJobTest() para testar a cada minuto
    notificationJobInstance = initNotificationJob();
    
    console.log('✅ Todos os jobs iniciados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao iniciar jobs:', error.message);
  }
}

/**
 * Para todos os jobs
 */
function stopJobs() {
  try {
    if (notificationJobInstance) {
      notificationJobInstance.cancel();
      notificationJobInstance = null;
      console.log('❌ Jobs parados');
    }
  } catch (error) {
    console.error('❌ Erro ao parar jobs:', error.message);
  }
}

module.exports = { startJobs, stopJobs };