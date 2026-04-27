# 🔍 Guia de Debug - StudyHub

## Como usar as ferramentas de debug

Quando você abre o frontend em `http://localhost:5173`, a ferramenta de debug automaticamente:

1. **Limpa o console** para melhor visualização
2. **Exibe informações do frontend**: URL da API, ambiente, host e porta
3. **Testa conexão com backend**: Faz uma requisição GET `/api/health`
4. **Lista todas as rotas disponíveis**: Rotas públicas e protegidas
5. **Mostra informações de autenticação**: Token e dados do usuário armazenados

## Acessar o Console do Navegador

- **Chrome/Edge**: `F12` ou `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Firefox**: `F12` ou `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Safari**: `Cmd+Option+I` (precisa ativar DevTools nas Preferências)

## Funções de Debug Disponíveis

Após abrir o console, você pode usar as seguintes funções:

### 1. **Testar conexão com backend**
```javascript
window.debugInfo.testHealth()
```
Retorna o status de conexão e a resposta do backend.

### 2. **Ver token armazenado**
```javascript
window.debugInfo.showToken()
```
Mostra o token JWT completo armazenado em localStorage.

### 3. **Ver dados do usuário**
```javascript
window.debugInfo.showUser()
```
Mostra os dados do usuário logado (id, email, name).

### 4. **Ver configurações**
```javascript
window.debugInfo.showConfig()
```
Mostra URL da API, ambiente, host e porta.

### 5. **Limpar localStorage**
```javascript
window.debugInfo.clearStorage()
```
Remove token e dados de usuário, e recarrega a página (útil para deslogar sem interface).

### 6. **Testar uma rota específica**
```javascript
window.debugInfo.testRoute(METHOD, PATH, DATA)
```

**Exemplos:**
```javascript
// Obter perfil do usuário (GET)
window.debugInfo.testRoute('GET', '/auth/profile')

// Criar um novo curso (POST)
window.debugInfo.testRoute('POST', '/courses', {
  name: 'Engenharia de Software',
  university: 'USP'
})

// Atualizar nome (PATCH)
window.debugInfo.testRoute('PATCH', '/auth/profile', {
  name: 'Novo Nome'
})
```

## Informações Exibidas no Console

### 📱 FRONTEND
- **URL da API**: Para qual backend o frontend está apontando
- **Ambiente**: desenvolvimento/produção
- **Host**: localhost ou outro domínio
- **Porta**: porta do frontend (geralmente 5173)

### 🚀 BACKEND
- **Status**: OK/ERROR
- **Mensagem**: Status da conexão
- **URL testada**: A URL usada no health check

### 📍 ROTAS DISPONÍVEIS
Listadas em duas categorias:
- **🔓 Públicas**: Rotas que não precisam de autenticação (register, login)
- **🔒 Protegidas**: Rotas que requerem token JWT (courses, tasks, etc)

### 🔐 AUTENTICAÇÃO
- **Token**: Primeiros 20 caracteres + reticências
- **Token Completo**: Token JWT inteiro
- **Usuário**: Email do usuário logado
- **ID**: ID do usuário
- **Nome**: Nome do usuário

## 💡 Dicas Úteis

1. **Verificar se o backend está rodando**:
   ```javascript
   window.debugInfo.testHealth()
   ```
   Se retornar erro, verificar se o backend está em execução na porta 3001.

2. **Debugar requisições de API**:
   ```javascript
   window.debugInfo.testRoute('GET', '/courses')
   ```
   Isso mostra exatamente o que a API está retornando.

3. **Ver exatamente qual token está sendo usado**:
   ```javascript
   window.debugInfo.showToken()
   ```
   Copie e cole em https://jwt.io para decodificar.

4. **Deslogar sem usar a interface**:
   ```javascript
   window.debugInfo.clearStorage()
   ```

## 🚨 Troubleshooting Comum

### "Erro ao conectar com backend"
```javascript
window.debugInfo.showConfig()
// Verifique se API_URL está correta
// Verifique se backend está rodando em http://localhost:3001
```

### "Token não definido"
```javascript
window.debugInfo.showToken()
// Se retornar null, faça login novamente
```

### "Erro 401/403 em rotas protegidas"
```javascript
window.debugInfo.testRoute('GET', '/auth/profile')
// Verifica se o token é válido
// Válido = retorna dados do usuário
// Inválido = retorna erro 401/403
```

### "response.data is not a function" ou "courses.map is not a function"
Significa que o backend retornou algo que não é um array. Use:
```javascript
window.debugInfo.testRoute('GET', '/courses')
// Veja exatamente o que o backend está retornando
```

## 📊 Exemplo Completo de Debug

```javascript
// 1. Verificar conexão
window.debugInfo.testHealth()
// Esperado: { status: "OK", message: "Backend está funcionando" }

// 2. Ver config
window.debugInfo.showConfig()
// Esperado: { API_URL: "http://localhost:3001/api", ... }

// 3. Testar rota protegida
window.debugInfo.testRoute('GET', '/auth/profile')
// Esperado: { status: 200, data: { user: {...} } }

// 4. Testar criação de recurso
window.debugInfo.testRoute('POST', '/courses', {
  name: 'Meu Curso',
  university: 'Minha Universidade'
})
// Esperado: { status: 201, data: { id: 1, name: "Meu Curso", ... } }
```

---

**Dúvidas?** Verifique o arquivo `/frontend/src/utils/debugInfo.js` para ver o código completo.
