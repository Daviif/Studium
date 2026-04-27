# 🔧 Checklist - Corrigindo CORS Error

## ✅ Passos para Resolver

### 1. **Verificar se Backend está RODANDO**

```bash
# Terminal 1
cd backend
npm run dev
```

Você deve ver:
```
✅ Servidor rodando em http://localhost:3001
🏥 Health check: http://localhost:3001/api/health
```

### 2. **Verificar se Frontend está RODANDO**

```bash
# Terminal 2 (novo)
cd frontend
npm run dev
```

Você deve ver:
```
➜  Local:   http://localhost:5173/
```

### 3. **Testar Manualmente - Health Check**

Abra outro terminal e teste:

```bash
curl http://localhost:3001/api/health
```

Esperado:
```json
{"status":"OK","message":"Backend está funcionando"}
```

### 4. **Testar CORS Preflight**

```bash
curl -X OPTIONS http://localhost:3001/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Verifique os headers na resposta (deve ter `Access-Control-Allow-Origin: *`)

### 5. **No Console do Navegador**

Abra F12 e tente:

```javascript
fetch('http://localhost:3001/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ OK!', data))
  .catch(err => console.error('❌ Erro:', err))
```

Esperado: `✅ OK! {status: "OK", message: "Backend está funcionando"}`

## 🆘 Se ainda não funcionar

### Problema: "Backend not responding"
```bash
# Verificar se porta 3001 está em uso
lsof -i :3001

# Se sim, matar processo
kill -9 <PID>

# Reiniciar backend
npm run dev
```

### Problema: "Frontend vê .env incorreto"
```bash
# Verificar .env.local existe
cat frontend/.env.local
# Deve mostrar: VITE_API_URL=http://localhost:3001/api

# Se não, criar:
echo "VITE_API_URL=http://localhost:3001/api" > frontend/.env.local

# Limpar cache e reiniciar
rm -rf frontend/node_modules/.vite
npm run dev  # no frontend
```

### Problema: "Headers incorretos"
Abra DevTools → Network → veja requisição:
- **Request Headers** deve ter:
  ```
  Origin: http://localhost:3001
  Content-Type: application/json
  Authorization: Bearer <token> (se logado)
  ```
- **Response Headers** deve ter:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
  Access-Control-Allow-Headers: Content-Type,Authorization
  ```

## 📋 Checklist Final

- [ ] Backend rodando em `http://localhost:3001`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] `frontend/.env.local` contém `VITE_API_URL=http://localhost:3001/api`
- [ ] `curl http://localhost:3001/api/health` retorna JSON
- [ ] Console do navegador mostra logs do debug
- [ ] Network tab mostra requests com status 200/201

---

**Dúvida?** Cheque [CONFIG_GUIDE.md](CONFIG_GUIDE.md) ou [DEBUG_GUIDE.md](DEBUG_GUIDE.md)
