# Lista de Tarefas - Projeto Gestão de Igreja

Este arquivo acompanha o progresso da criação do projeto.

## Estrutura e Arquivos

- [x] Criar estrutura de pastas base (`/igreja-gestao-app`, `/frontend`, `/backend`, `/database`)

### Frontend (`/frontend`)
- [x] Criar `/frontend/css/styles.css`
- [x] Criar `/frontend/js/app.js`
- [x] Criar `/frontend/pages/login.html`
- [x] Criar `/frontend/pages/dashboard.html`
- [x] Criar `/frontend/pages/ministerios.html`
- [x] Criar `/frontend/pages/escalas.html`
- [x] Criar `/frontend/pages/conteudos.html`
- [x] Criar `/frontend/pages/perfil.html`
- [x] Criar `/frontend/components/navbar.html`
- [x] Criar `/frontend/components/sidebar.html`

### Backend (`/backend`)
- [x] Criar `/backend/functions/index.js` (inicializador das rotas)
- [x] Criar `/backend/functions/auth.js` (mock de autenticação)
- [x] Criar `/backend/functions/ministerios.js` (CRUD de ministérios)
- [x] Criar `/backend/functions/membros.js` (gestão de membros e atribuições)
- [x] Criar `/backend/functions/escalas.js` (CRUD de escalas)
- [x] Criar `/backend/functions/conteudos.js` (CRUD de conteúdos)
- [x] Criar `/backend/utils/db.js` (conexão com Azure SQL)
- [x] Criar `/package.json` (dependências Node.js)

### Database (`/database`)
- [x] Criar `/database/schema.sql` (DDL - estrutura das tabelas)
- [x] Criar `/database/seed.sql` (DML - dados iniciais)

### Documentação
- [x] Criar `/README.md` (instruções do projeto)

## Revisão e Validação
- [x] Revisar segurança (SQL Injection, permissões)
- [x] Revisar modularidade e boas práticas
- [x] Validar funcionalidade geral e integração

## Entrega
- [x] Empacotar projeto (se necessário)
- [x] Enviar arquivos e relatório final ao usuário

## Correções recentes (sidebar & navegação) - 2026-03-10
- [x] Padronizar leitura do usuário em `localStorage` (`usuario`, `usuario_logado`, `usuario-logado`) e normalizar `perfil`/`tipoPerfil` (`frontend/js/app.js`)
- [x] Centralizar inicialização e handlers da `sidebar` para funcionar após `fetch` ou injeção local (`frontend/js/sidebar-loader.js`)
- [x] Normalizar script do componente de sidebar e garantir logout/toggle/mobile (`frontend/components/sidebar.html`)
- [x] Incluir `sidebar-loader.js` nas páginas que não tinham o loader (`frontend/pages/*.html` — ex.: `youtube.html`, `plataformas.html`, `upload.html`, `usuarios.html`, `perfil.html`)
- [x] Corrigir checagem de permissões em `plataformas.html` e `upload.html` para usar o perfil normalizado
- [x] Remover possíveis handlers duplicados ao inicializar a sidebar dinamicamente

Notas:
- Testes manuais realizados: navegação desktop e mobile, verificação de visibilidade de itens por perfil (testado com usuário `pastor`).
- Próximo passo (opcional): criar testes automatizados de integração para navegação e carregar sidebar em CI.

## Correções e melhorias — 2026-03-17

- [x] **perfil.html** — `STORAGE_KEY` undefined (ReferenceError ao salvar perfil) → trocado por `'usuario'`
- [x] **plataformas.html** — permissão verificava `'lider'` → corrigido para `'admin'`; edições eram revertidas → separado `carregarPlataformas()` de `renderizarPlataformas()`
- [x] **upload.html** — mesmo bug de `'lider'` → corrigido para `'admin'`
- [x] **ministerios.html** — redirecionava membros (`padrao`) que deveriam poder VER a lista → removido o redirect
- [x] **app.js** — `formatarData()` causava data errada em fuso UTC-3 → parse manual sem timezone
- [x] **app.js** — `fazerLogin()` não verificava usuários registrados via localStorage → agora verifica `'usuarios'`
- [x] **Sidebar** — "Gestão de Usuários" era `pastor-admin-only` mas a página só aceita `pastor` → mudado para `pastor-only`
- [x] **dashboard.html** — "Meus Ministérios" mostrava total de ministérios → agora mostra só os do usuário
- [x] **biblia.html** — substituído texto fake por integração real com bible-api.com (Almeida PT, KJV, WEB)
- [x] **config.js** — criado arquivo central de configuração (`frontend/js/config.js`) com todos os valores configuráveis: USE_MOCK, API_BASE, NOME_IGREJA, YouTube, Bíblia, Google Drive, Holyrics
- [x] **Todas as páginas** — `config.js` incluído antes de `app.js` nas 18 páginas do sistema
- [x] **Documentação** — README.md, DOCUMENTACAO.md e todo.md atualizados

## Checklist de Deploy (ações pendentes)

- [ ] Editar `frontend/js/config.js`: `USE_MOCK: false`, preencher `API_BASE`, `YOUTUBE_CHANNEL_ID` e demais campos marcados.
- [ ] Instalar dependências: `cd backend/functions && npm install`.
- [ ] Preencher variáveis de ambiente: copie `backend/functions/.env.example` → `backend/functions/.env` (`DB_*`, `JWT_SECRET`).
- [ ] Rodar migrations: `npm run migrate` (em `backend/functions`) — requer acesso ao banco Azure.
- [ ] Rodar seed (opcional para dados de exemplo): `npm run seed`.
- [ ] Adicionar rewrite em `firebase.json` para rotear `/api/**` para a Cloud Function `api` (se usar `API_BASE: '/api'`).
- [ ] Considerar atualizar `engines.node` em `backend/functions/package.json` para `18` ou `20`.
- [ ] Validar CORS em `backend/functions/index.js` (atualmente `cors({ origin: true })` permite todas origens).
- [ ] Executar testes básicos locais: `npm run dev` em `backend/functions` e abrir `frontend/pages/login.html`.
- [ ] Executar `firebase deploy --only hosting,functions`.
