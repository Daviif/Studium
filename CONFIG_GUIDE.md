# 🔧 Guia de Configuração - Frontend & Backend

## 🚀 Desenvolvimento Local

### Backend
1. Backend roda em `http://localhost:3001`
2. CORS configurado para aceitar:
   - `http://localhost:5173` (Vite dev)
   - `http://localhost:3000` (dev alternativo)
   - `http://127.0.0.1:5173`
   - Qualquer `*.vercel.app` (produção Vercel)

### Frontend
1. Frontend roda em `http://localhost:5173` (Vite)
2. Arquivo `.env.local` configura a URL da API:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

### Como Testar Localmente

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Acesse: `http://localhost:5173`

## 📦 Produção (Vercel)

### Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

**Frontend:**
```
VITE_API_URL=https://seu-backend-url.com/api
```

**Backend:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=sua-chave-secreta
PORT=3001
```

### Atualizando Backend URL

Quando colocar seu backend em produção:

1. Obtenha a URL do seu backend em produção
2. Atualize `frontend/.env.production`:
   ```
   VITE_API_URL=https://seu-backend-em-producao.com/api
   ```
3. Adicione a URL ao CORS do backend (`backend/src/index.js`):
   ```javascript
   const ALLOWED_ORIGINS = [
     // ... existing origins
     'https://seu-backend-em-producao.com',
   ];
   ```

## 🔌 CORS - Como Funciona

O CORS (Cross-Origin Resource Sharing) permite requisições HTTP entre domínios diferentes.

### Quando Você Vê Erros de CORS:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows 
reading the remote resource at http://localhost:3001/api/...
```

**Significa:** O frontend está tentando acessar o backend de uma origem diferente.

### Soluções:

1. **Desenvolvimento Local**: Frontend e Backend devem estar na mesma rede
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`
   - ✅ Mesmo host (localhost), portas diferentes = OK

2. **Produção**: Ambos devem estar em domínios diferentes
   - Frontend: `https://study-hub-delta-roan.vercel.app`
   - Backend: `https://seu-backend-producao.com`
   - ✅ Configurado no CORS = OK

## 🧪 Testando Configuração

Use o debug info para verificar:

```javascript
// No console do navegador
window.debugInfo.testHealth()
// Esperado: { status: "OK", message: "Backend está funcionando" }
```

Se der erro de CORS:
1. Verifique se backend está rodando em `http://localhost:3001`
2. Verifique se frontend tem `VITE_API_URL=http://localhost:3001/api` em `.env.local`
3. Reinicie ambos

## 📝 Checklist de Deploy

- [ ] Backend URL está correta em `.env.production`
- [ ] CORS do backend inclui a origem do Vercel
- [ ] Variáveis de ambiente do Vercel estão configuradas
- [ ] Database URL está acessível
- [ ] JWT_SECRET está seguro (gerar novo para produção)
- [ ] Teste health check: `https://seu-backend.com/api/health`
- [ ] Teste login no frontend Vercel

## 🆘 Troubleshooting

### "CORS request did not succeed"
```
❌ Backend não está rodando
❌ URL da API está incorreta
❌ Backend URL não está no CORS whitelist
```

**Solução:**
1. Verifique se backend está em execução
2. Verifique `VITE_API_URL` no `.env.local`
3. Verifique CORS no backend

### "NetworkError when attempting to fetch resource"
```
❌ Não conseguiu conectar ao backend
❌ Backend pode estar offline
```

**Solução:**
```javascript
// No console
window.debugInfo.testHealth()
// Mosstra qual URL está sendo testada
```

### Token inválido em produção
```
❌ JWT_SECRET é diferente entre frontend e backend
❌ Token foi gerado com chave diferente
```

**Solução:**
- Garanta que `JWT_SECRET` é o mesmo no deploy

## 🔐 Segurança

### Não faça isso em produção:
```
❌ VITE_API_URL=http://localhost:3001/api
❌ JWT_SECRET=sua-chave-secreta
❌ app.use(cors()); // Permite todos os origins
❌ DATABASE_URL com senha em plain text
```

### Faça isso em produção:
```
✅ VITE_API_URL=https://seu-dominio-seguro.com/api
✅ JWT_SECRET=gerar-nova-chave-aleatoria-forte
✅ CORS whitelist com origins específicas
✅ DATABASE_URL em variáveis de ambiente seguras
```

---

**Dúvidas?** Consulte `DEBUG_GUIDE.md` para ferramentas de debug.
