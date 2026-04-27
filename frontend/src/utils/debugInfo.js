/**
 * Arquivo de debug para exibir informações no console do navegador
 * Mostra: URL da API, status de conexão com banco, e rotas disponíveis
 */

const API_URL = import.meta.env.VITE_API_URL;

const AVAILABLE_ROUTES = {
  public: [
    'POST /auth/register - Registrar novo usuário',
    'POST /auth/login - Login',
  ],
  protected: [
    'GET /auth/profile - Obter perfil do usuário',
    'PATCH /auth/profile - Atualizar nome do perfil',
    'POST /auth/change-password - Mudar senha',
    'GET /courses - Listar cursos',
    'GET /courses/:id - Obter detalhes de um curso',
    'POST /courses - Criar novo curso',
    'PATCH /courses/:id - Atualizar curso',
    'DELETE /courses/:id - Deletar curso',
    'GET /subjects - Listar matérias',
    'GET /tasks - Listar tarefas',
    'GET /routines - Listar rotinas',
    'GET /files - Listar arquivos',
    'GET /professors - Listar professores',
    'GET /notifications - Listar notificações',
    'GET /notifications/preferences - Obter preferências de notificação',
    'PUT /notifications/preferences - Atualizar preferências',
  ]
};

/**
 * Função principal de debug
 */
export async function initDebugInfo() {
  console.clear();
  
  // Estilo customizado para os logs
  const style = {
    title: 'color: #667eea; font-size: 16px; font-weight: bold; padding: 10px; background: #f0f0f0; border-radius: 4px;',
    section: 'color: #764ba2; font-size: 14px; font-weight: bold; margin-top: 10px;',
    value: 'color: #333; font-size: 13px;',
    success: 'color: #27ae60; font-weight: bold;',
    error: 'color: #e74c3c; font-weight: bold;',
  };

  console.log('%c🔍 STUDYHUB - DEBUG INFO', style.title);
  
  // ============================================================================
  // INFORMAÇÕES DO FRONTEND
  // ============================================================================
  console.log('%c📱 FRONTEND', style.section);
  console.log(`%cURL da API: ${API_URL}`, style.value);
  console.log(`%cAmbiente: ${import.meta.env.MODE}`, style.value);
  console.log(`%cHost: ${window.location.hostname}`, style.value);
  console.log(`%cPorta: ${window.location.port || 'Padrão (80/443)'}`, style.value);

  // ============================================================================
  // INFORMAÇÕES DO BACKEND
  // ============================================================================
  console.log('%c🚀 BACKEND', style.section);
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`%c✅ Status: ${data.status}`, style.success);
      console.log(`%cMensagem: ${data.message}`, style.value);
    } else {
      console.log(`%c❌ Backend retornou erro: ${response.status}`, style.error);
    }
  } catch (error) {
    console.log(`%c❌ Erro ao conectar com backend: ${error.message}`, style.error);
    console.log(`%c   URL testada: ${API_URL}/health`, style.value);
  }

  // ============================================================================
  // ROTAS DISPONÍVEIS
  // ============================================================================
  console.log('%c📍 ROTAS DISPONÍVEIS', style.section);
  
  console.log('%c🔓 Públicas (sem autenticação):', style.value);
  AVAILABLE_ROUTES.public.forEach(route => {
    console.log(`   ${route}`);
  });

  console.log('%c🔒 Protegidas (requer token JWT):', style.value);
  AVAILABLE_ROUTES.protected.forEach(route => {
    console.log(`   ${route}`);
  });

  // ============================================================================
  // AUTENTICAÇÃO
  // ============================================================================
  console.log('%c🔐 AUTENTICAÇÃO', style.section);
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token) {
    console.log(`%c✅ Token armazenado: ${token.substring(0, 20)}...`, style.success);
    console.log(`%cToken completo: ${token}`, style.value);
  } else {
    console.log(`%c⚠️ Nenhum token armazenado`, style.error);
  }

  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log(`%c✅ Usuário: ${userData.email}`, style.value);
      console.log(`%cID: ${userData.id}`, style.value);
      console.log(`%cNome: ${userData.name}`, style.value);
    } catch (e) {
      console.log(`%c❌ Erro ao parsear dados do usuário`, style.error);
    }
  } else {
    console.log(`%c⚠️ Nenhum usuário armazenado`, style.error);
  }

  // ============================================================================
  // COMANDOS ÚTEIS
  // ============================================================================
  console.log('%c💡 COMANDOS ÚTEIS', style.section);
  console.log('   debugInfo.testHealth() - Testar conexão com backend');
  console.log('   debugInfo.clearStorage() - Limpar localStorage');
  console.log('   debugInfo.showToken() - Mostrar token armazenado');
  console.log('   debugInfo.showUser() - Mostrar dados do usuário');
  console.log('   debugInfo.showConfig() - Mostrar configurações');

  // ============================================================================
  // FUNÇÕES GLOBAIS DE DEBUG
  // ============================================================================
  window.debugInfo = {
    async testHealth() {
      try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data);
      } catch (error) {
        console.error('❌ Erro:', error);
      }
    },

    clearStorage() {
      localStorage.clear();
      console.log('✅ localStorage limpo');
      window.location.reload();
    },

    showToken() {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      return token;
    },

    showUser() {
      const user = localStorage.getItem('user');
      console.log('Usuário:', JSON.parse(user));
      return JSON.parse(user);
    },

    showConfig() {
      console.log({
        API_URL,
        Environment: import.meta.env.MODE,
        Host: window.location.hostname,
        Port: window.location.port,
      });
    },

    async testRoute(method = 'GET', path = '/health', data = null) {
      try {
        const token = localStorage.getItem('token');
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (token) {
          options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_URL}${path}`, options);
        const responseData = await response.json();

        console.log(`${method} ${path}:`, {
          status: response.status,
          data: responseData,
        });

        return { status: response.status, data: responseData };
      } catch (error) {
        console.error('❌ Erro:', error);
      }
    },
  };

  console.log('%c✅ Debug inicializado! Use window.debugInfo para acessar funções.', style.success);
}

export default initDebugInfo;
