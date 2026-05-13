# 📚 Studium - Plataforma de Gestão Acadêmica

<div align="center">

![Studium](https://img.shields.io/badge/Studium-v1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)

**Studium é uma plataforma livre e gratuita que ajuda universitários a organizar suas atividades acadêmicas, gerenciar professores, tarefas e arquivos de forma intuitiva e eficiente.**

[Características](#-características) • [Instalação](#-instalação) • [Como Usar](#-como-usar) • [Roadmap](#-roadmap) • [Contribuir](#-contribuir)

</div>

---

## 🎯 Sobre

 é uma aplicação web desenvolvida para **universitários de todos os tipos** - seja você estudante de graduação, pós-graduação ou cursos técnicos. Nossa missão é simplificar a gestão acadêmica através de uma interface intuitiva e funcionalidades práticas.

A plataforma permite que você:
- Organize seus cursos e matérias
- Gerencie múltiplos professores por disciplina com suas diferentes metodologias
- Acompanhe tarefas, prazos e rotinas de estudo
- Armazene e organize arquivos de aulas
- Visualize um cronograma completo das suas atividades

### 🚀 Visão Futura

Em breve,  contará com um **módulo de compartilhamento comunitário**, permitindo que alunos compartilhem:
- Provas e exercícios anteriores
- Resumos e materiais de estudo
- Atividades e desafios por disciplina
- Experiências sobre diferentes professores e suas metodologias

Assim, gerações futuras de alunos poderão aprender com o conhecimento coletivo de quem veio antes! 🌍

---

## ✨ Características

### 📖 Gestão de Cursos e Matérias
- Crie e organize múltiplos cursos com universidade
- Matérias organizadas por período e tipo (obrigatória, eletiva, etc.)
- **Status acadêmico** por matéria: Ativa, Aprovada, Reprovada, Pendente, Trancada, Dispensada
- **Histórico de status** com semestre e observações
- **Configuração Rápida** — classifica todas as matérias pelo período atual automaticamente

### 🤖 Importação Inteligente via PDF
- Upload do atestado de matrícula (UFOP/SIGAA e outros formatos)
- Extração de matérias **determinística via coordenadas X,Y do PDF** — sem IA, sem erros
- Extração de horários **100% precisa** lendo a posição real de cada célula na tabela
- Fallback com **Groq LLM** para formatos de outras universidades
- Criação automática de matérias não cadastradas
- Geração automática de rotinas a partir dos horários detectados

### 👨‍🏫 Múltiplos Professores por Matéria
- Registre quantos professores quiser por disciplina
- Organize atividades separadas por professor e semestre
- Histórico de quem lecionou cada matéria

### 📋 Gestão de Tarefas e Avaliações
- Atividades, trabalhos e provas com prazo, peso e prioridade
- Marque tarefas como concluídas
- Registro de notas e avaliações com pesos percentuais
- Alertas visuais por urgência (hoje, amanhã, próximos 3 dias)

### 📚 Organização de Arquivos
- Upload de materiais de aula (PDF, DOCX, imagens)
- Armazenamento no Cloudinary com nomeação customizável
- Organização por professor e disciplina

### ⏰ Rotinas de Estudo
- Crie rotinas recorrentes por dia da semana
- Geração em lote a partir de horários de aula
- Visualize no cronograma semanal

### 📅 Cronograma
- Visualização semanal e mensal
- Tarefas e rotinas integradas em uma única view
- Indicadores visuais de urgência e conclusão

### 🔔 Notificações
- Notificações in-app, push e por e-mail
- Alertas configuráveis por dias/horas antes do prazo
- Horário de silêncio respeitado automaticamente

### 🔐 Autenticação Segura
- Login e registro com JWT
- Proteção IDOR em todos os endpoints
- Dados completamente privativos por usuário

---

## 🛠️ Tecnologias

### Frontend
- **React** 18+ - Interface moderna e responsiva
- **React Router** - Roteamento de páginas
- **Axios** - Requisições HTTP
- **Lucide React** - Ícones elegantes
- **Vite** - Build rápido e eficiente
- **CSS3** - Estilos responsivos

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Bcryptjs** - Hash de senhas

### IA & Parsing
- **pdf-parse** - Extração de texto e coordenadas de PDFs
- **Groq SDK** - LLM open-source (Llama 3.3) para parsing de formatos variados
- **Algoritmo de coordenadas X,Y** - Parser determinístico para SIGAA/UFOP

### DevOps & Infra
- **npm** - Gerenciador de pacotes
- **Git** - Controle de versão
- **Cloudinary** - Armazenamento de arquivos
- **node-schedule** - Agendamento de notificações

---

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn
- PostgreSQL instalado e rodando

### 1. Clone o Repositório
```bash
git clone https://github.com/daviif/StudyHub.git
cd StudyHub
```

### 2. Configuração do Backend

```bash
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do PostgreSQL

# Execute as migrações do banco
npx prisma migrate deploy

# (Opcional) Gere os tipos do Prisma
npx prisma generate

# Inicie o servidor
npm start
```

O backend rodará em `http://localhost:3001`

### 3. Configuração do Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend abrirá em `http://localhost:5173`

---

## 🚀 Como Usar

### 1. Criar uma Conta
- Clique em "Registrar" na página de login
- Informe email, senha e nome
- Confirme e faça login

### 2. Criar um Curso
- Na tela inicial (Visão Geral), clique em "Novo Curso"
- Informe o nome do curso e universidade
- Clique em "Salvar Curso"

### 3. Adicionar Matérias
- Abra um curso
- Clique em "Nova Matéria"
- Informe o nome, período e tipo (obrigatória, eletiva, etc.)
- Clique em "Salvar Matéria"

### 4. Gerenciar Professores
- Abra uma matéria
- Clique no botão "Professores"
- Selecione um professor existente ou crie um novo
- Informe o semestre em que o professor leciona
- Clique em "Adicionar"

### 5. Criar Tarefas
- Na página da matéria, selecione um professor
- Clique em "Nova Tarefa"
- Preencha título, descrição e data de entrega
- Clique em "Criar Tarefa"

### 6. Fazer Upload de Arquivos
- Na página da matéria, selecione um professor
- Clique em "Upload"
- Selecione um arquivo (PDF, DOCX, imagens, etc.)
- (Opcional) Nomeie o arquivo
- Clique em "Enviar Arquivo"

### 7. Visualizar Cronograma
- Clique em "Cronograma" na barra lateral
- Escolha visualizar por semana ou mês
- Navegue entre períodos
- Veja suas tarefas e rotinas organizadas

---

## 📅 Roadmap

### ✅ v1.0 — Base
- [x] Autenticação e registro de usuários (JWT)
- [x] Gestão de cursos e matérias (períodos, tipos)
- [x] Múltiplos professores por matéria e semestre
- [x] Sistema de tarefas com prazos e prioridades
- [x] Avaliações e notas com pesos percentuais
- [x] Upload e organização de arquivos (Cloudinary)
- [x] Cronograma semanal e mensal
- [x] Rotinas de estudo recorrentes

### ✅ v1.1 — Notificações & Cursos Padrão
- [x] Notificações in-app, push e por e-mail
- [x] Preferências de notificação configuráveis por usuário
- [x] Horário de silêncio (quiet hours)
- [x] Cursos padrão pré-configurados (UFOP — Sistemas de Informação)
- [x] Agendamento automático via node-schedule

### ✅ v1.2 — Inteligência Acadêmica *(atual)*
- [x] **Status de matéria** — Ativa, Aprovada, Reprovada, Pendente, Trancada, Dispensada
- [x] **Histórico de status** — rastreamento completo com semestre e observações
- [x] **Configuração Rápida** — classifica todas as matérias automaticamente pelo período informado
- [x] **Importação de atestado de matrícula** (PDF da UFOP/SIGAA)
  - [x] Extração de matérias por regex (determinístico)
  - [x] Extração de horários via **coordenadas X,Y do PDF** — preciso e sem custo de IA
  - [x] Fallback com **Groq / Llama 3.3** para outros formatos universitários
  - [x] Criação automática de matérias ainda não cadastradas
  - [x] Geração automática de rotinas a partir dos horários extraídos
- [x] **Landing page** — apresentação pública do sistema
- [x] Correções de segurança (IDOR em todos os endpoints sensíveis)
- [x] Geração de rotinas em lote por horário de aula

### 🔄 v1.3 — Grade Curricular & Pré-Requisitos *(em desenvolvimento)*
- [ ] Upload da grade curricular em PDF
- [ ] Extração de pré-requisitos entre matérias
- [ ] Bloqueio de matérias por pré-requisito reprovado
- [ ] Quebra de pré-requisito com aprovação da coordenação
- [ ] Armazenamento de horário de aula vinculado à matéria
- [ ] Criação automática de rotinas ao associar professor (quando horário já importado)
- [ ] Suporte a PDFs de outras universidades que usam SIGAA

### 🌍 v2.0 — Módulo Comunitário *(futuro)*
- [ ] Compartilhamento de provas e materiais entre alunos
- [ ] Avaliação comunitária de professores por disciplina
- [ ] Sistema de comentários e fórum por matéria
- [ ] Favoritos e bookmarks de materiais
- [ ] Filtros por professor, instituição e período letivo

### 🎯 Visões de Longo Prazo
- [ ] Tema escuro
- [ ] Integração com Google Calendar e iCal
- [ ] Análise de desempenho acadêmico com gráficos
- [ ] Aplicativo mobile (React Native)
- [ ] Grupos de estudo colaborativos
- [ ] Integração com Moodle e Google Classroom
- [ ] Suporte multi-idioma

---

## 🤝 Contribuir

Contribuições são bem-vindas!  é um projeto de código aberto e cresce com a ajuda da comunidade.

### Como Contribuir

1. **Faça um Fork** do repositório
2. **Crie uma Branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a Branch (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Diretrizes
- Mantenha o código limpo e bem documentado
- Siga o padrão de código existente
- Adicione testes quando possível
- Atualize a documentação se necessário

### Reportar Bugs
Se encontrar um bug:
1. Verifique se já não foi reportado nas [Issues](https://github.com/daviif/StudyHub/issues)
2. Se não, abra uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)

---

## 📝 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

 é software livre. Você é livre para usar, copiar, modificar e distribuir, desde que inclua a licença MIT.

---

## 📞 Contato & Suporte

- **Issues**: [GitHub Issues](https://github.com/daviif/StudyHub/issues)
- **Discussões**: [GitHub Discussions](https://github.com/daviif/StudyHub/discussions)
- **Email**: [studyhub@example.com]

---

## 🙌 Agradecimentos

Obrigado a todos que contribuem para fazer  melhor! Este projeto existe graças a:
- Comunidade de desenvolvedores
- Feedbacks de usuários universitários
- Inspiração em ferramentas acadêmicas existentes

---

## 📊 Estatísticas do Projeto

![Stars](https://img.shields.io/github/stars/daviif/StudyHub?style=social)
![Forks](https://img.shields.io/github/forks/daviif/StudyHub?style=social)
![Issues](https://img.shields.io/github/issues/daviif/StudyHub)

---

<div align="center">

**Feito com ❤️ para universitários** 

[Voltar ao Topo](#-studyhub---plataforma-de-gestão-acadêmica)

</div>