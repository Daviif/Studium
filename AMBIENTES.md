# 🌍 Configuração de Ambientes - StudyHub

## 📋 Resumo

O StudyHub possui dois ambientes isolados para evitar quebrar o software em produção:

| Ambiente | Backend | Frontend | Comando |
|----------|---------|----------|---------|
| **DESENVOLVIMENTO** | `localhost:3001` | `localhost:5173` | `npm run dev` |
| **PRODUÇÃO** | Railway (https://...) | Vercel (https://...) | `npm run build` |

---

## 🔧 Configuração do Frontend

### 1️⃣ Arquivo de Desenvolvimento (`.env.local`)

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:3001/api
```

**Quando usar:** `npm run dev` (desenvolvimento local)

### 2️⃣ Arquivo de Produção (`.env.production`)

```bash
# frontend/.env.production
VITE_API_URL=https://studyhub-production-06a4.up.railway.app/api
```

**Quando usar:** `npm run build` (build para produção)

---

## 🚀 Como Usar

### Desenvolvimento Local

```bash
cd frontend
npm run dev
```

✅ Vite carrega **`.env.local`**  
✅ Frontend conecta em `http://localhost:3001/api`  
✅ Backend deve estar rodando: `npm run dev` em `/backend`

### Build para Produção

```bash
cd frontend
npm run build
```

✅ Vite carrega **`.env.production`**  
✅ Frontend conecta em `https://studyhub-production-06a4.up.railway.app/api`  
✅ Deploy para Vercel com `git push`

---

## 🔒 Segurança

✅ `.env.local` e `.env.production` estão no `.gitignore`  
✅ Não será versionado acidentalmente  
✅ Cada desenvolvedor pode ter suas próprias variáveis  

---

## 🐛 Troubleshooting

**Problema:** Frontend em dev conectando no backend errado  
**Solução:** Verifique se `.env.local` existe e tem a URL correta

**Problema:** Build de produção conectando no localhost  
**Solução:** Verifique `.env.production` e rode `npm run build` novamente

---

## 📂 Estrutura de Arquivos

```
frontend/
├── .env.example      ← Template (versiona no git)
├── .env.local        ← Desenvolvimento (NÃO versiona)
├── .env.production   ← Produção (NÃO versiona)
└── .gitignore        ← Bloqueia *.env e *.local
```

---

## Backend também tem ambientes?

Sim! O backend usa:

- **Desenvolvimento:** `.env` (local)
- **Produção:** Variáveis do Railway

Verifique em `/backend/.env` e `/backend/.env.example`
