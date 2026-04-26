# 📚 StudyHub - Plataforma de Gestão Acadêmica

<div align="center">

![StudyHub](https://img.shields.io/badge/StudyHub-v1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)

**StudyHub é uma plataforma livre e gratuita que ajuda universitários a organizar suas atividades acadêmicas, gerenciar professores, tarefas e arquivos de forma intuitiva e eficiente.**

[Características](#-características) • [Instalação](#-instalação) • [Como Usar](#-como-usar) • [Roadmap](#-roadmap) • [Contribuir](#-contribuir)

</div>

---

## 🎯 Sobre

StudyHub é uma aplicação web desenvolvida para **universitários de todos os tipos** - seja você estudante de graduação, pós-graduação ou cursos técnicos. Nossa missão é simplificar a gestão acadêmica através de uma interface intuitiva e funcionalidades práticas.

A plataforma permite que você:
- Organize seus cursos e matérias
- Gerencie múltiplos professores por disciplina com suas diferentes metodologias
- Acompanhe tarefas, prazos e rotinas de estudo
- Armazene e organize arquivos de aulas
- Visualize um cronograma completo das suas atividades

### 🚀 Visão Futura

Em breve, StudyHub contará com um **módulo de compartilhamento comunitário**, permitindo que alunos compartilhem:
- Provas e exercícios anteriores
- Resumos e materiais de estudo
- Atividades e desafios por disciplina
- Experiências sobre diferentes professores e suas metodologias

Assim, gerações futuras de alunos poderão aprender com o conhecimento coletivo de quem veio antes! 🌍

---

## ✨ Características

### 📖 Gestão de Cursos
- Crie e organize múltiplos cursos
- Associe universidades e instituições
- Acompanhe todas as matérias do seu curso

### 👨‍🏫 Múltiplos Professores por Matéria
- Registre quantos professores quiser para cada disciplina
- Diferencie as metodologias de cada professor
- Organize atividades por professor
- Histórico de semestres lecionados

### 📋 Gestão de Tarefas
- Crie tarefas com prazos de entrega
- Marque tarefas como concluídas
- Gerencie tarefas por professor
- Visualize prazos em um cronograma

### 📚 Organização de Arquivos
- Upload de materiais de aula (PDF, DOCX, imagens, etc.)
- Nomeação customizável de arquivos
- Organização por professor e disciplina
- Download e gerenciamento fácil

### ⏰ Rotinas de Estudo
- Crie rotinas recorrentes
- Organize horários de estudo
- Visualize no cronograma semanal

### 📅 Cronograma
- Visualização por semana ou mês
- Veja todas as suas tarefas e rotinas
- Destaque para tarefas concluídas
- Indicadores visuais claros

### 🔐 Autenticação Segura
- Login e registro seguros
- Autenticação por JWT
- Seus dados são privativos

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

### DevOps
- **npm** - Gerenciador de pacotes
- **Git** - Controle de versão

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

### ✅ v1.0 (Atual)
- [x] Autenticação e registro de usuários
- [x] Gestão de cursos e matérias
- [x] Múltiplos professores por matéria
- [x] Sistema de tarefas com prazos
- [x] Upload e organização de arquivos
- [x] Cronograma semanal e mensal
- [x] Rotinas de estudo

### 🔄 v1.1 (Próximas Semanas)
- [ ] Edição de professores
- [ ] Filtros avançados no cronograma
- [ ] Notificações de prazos próximos
- [ ] Exportação de cronograma (iCal, PDF)
- [ ] Tema escuro

### 🌍 v2.0 (Futuro - Compartilhamento Comunitário)
- [ ] **Módulo de Compartilhamento**
  - [ ] Usuários podem compartilhar provas
  - [ ] Compartilhamento de resumos e materiais
  - [ ] Avaliação comunitária (5 estrelas)
  - [ ] Filtrar compartilhamentos por professor
  - [ ] Sistema de comentários
  - [ ] Favoritos e bookmarks

### 🎯 Visões Futuras
- [ ] Integração com Google Calendar
- [ ] Aplicativo mobile (React Native)
- [ ] Análise de desempenho acadêmico
- [ ] Sistema de notas e boletins
- [ ] Grupos de estudo colaborativos
- [ ] Integração com plataformas de aprendizado (Moodle, Classroom)

---

## 🤝 Contribuir

Contribuições são bem-vindas! StudyHub é um projeto de código aberto e cresce com a ajuda da comunidade.

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

StudyHub é software livre. Você é livre para usar, copiar, modificar e distribuir, desde que inclua a licença MIT.

---

## 📞 Contato & Suporte

- **Issues**: [GitHub Issues](https://github.com/daviif/StudyHub/issues)
- **Discussões**: [GitHub Discussions](https://github.com/daviif/StudyHub/discussions)
- **Email**: [seu-email@example.com]

---

## 🙌 Agradecimentos

Obrigado a todos que contribuem para fazer StudyHub melhor! Este projeto existe graças a:
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