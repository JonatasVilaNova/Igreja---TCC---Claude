# Lista de Tarefas — Sistema de Gestão de Igreja

## ✅ Concluído

### Estrutura
- [x] Estrutura de pastas (`frontend/`, `backend/`, `database/`)
- [x] 18 páginas HTML completas
- [x] Backend Express com 5 módulos de rotas
- [x] Schema SQL e dados de seed
- [x] Configuração centralizada (`config.js`)
- [x] Firebase Hosting configurado

### Funcionalidades
- [x] Login / Registro com código de convite
- [x] CRUD de Ministérios, Escalas, Conteúdos
- [x] 3 perfis de acesso (Pastor / Admin / Membro)
- [x] Bíblia (integração bible-api.com)
- [x] Canal do YouTube + Transmissão ao Vivo
- [x] Apresentação Holyrics
- [x] Ordem de Culto (drag-and-drop)
- [x] Plataformas de Música
- [x] Upload de Arquivos
- [x] Sidebar responsiva + mobile toggle
- [x] Detecção de conflitos de escalas

### Correções (2026-03)
- [x] Normalização de perfil no localStorage
- [x] Bug de permissão `'lider'` → `'admin'`
- [x] `formatarData()` corrigida para UTC-3
- [x] Login verifica usuários registrados via localStorage
- [x] Dashboard mostra ministérios do usuário (não todos)

---

## 🔲 Pendente para Produção

- [ ] **Escolher banco de dados** — Supabase (recomendado), Firebase ou outro
- [ ] **Completar schema SQL** — Faltam tabelas: EscalasMembros (N:N), ConteudosEscala, Plataformas, OrdemCulto, CodigosConvite
- [ ] **Conectar backend ao banco real** — Testar todas as queries SQL
- [ ] **Configurar auth de produção** — Remover fallback do JWT_SECRET hardcoded
- [ ] **Restringir CORS** — Trocar `cors({ origin: true })` por domínio específico
- [ ] **Remover dados de teste** — Tirar credenciais mock do login.html
- [ ] **Atualizar dependências** — Bootstrap 5.1→5.3, Font Awesome beta→stable
- [ ] **Testes** — Adicionar testes básicos (pelo menos login + CRUD)
- [ ] **Deploy** — `firebase deploy --only hosting`
