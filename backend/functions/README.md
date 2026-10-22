# Backend — Express API

API REST para o Sistema de Gestão de Igrejas.

## Módulos

| Arquivo | Rotas | Acesso |
|---------|-------|--------|
| `auth.js` | `/api/auth/login`, `/api/auth/me`, CRUD `/api/auth/usuarios` | Login: público. Usuários: Pastor |
| `ministerios.js` | CRUD `/api/ministerios` | Leitura: todos. Escrita: Admin+ |
| `membros.js` | CRUD `/api/membros` | Admin+ |
| `escalas.js` | CRUD `/api/escalas` | Admin+ |
| `conteudos.js` | CRUD `/api/conteudos` | Admin+ |

## Executar localmente

```powershell
cd backend/functions
npm install
copy .env.example .env   # editar com credenciais do banco
npm run dev               # inicia em http://localhost:8080
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DB_USER` | Usuário do banco de dados |
| `DB_PASSWORD` | Senha do banco de dados |
| `DB_SERVER` | Host do servidor SQL |
| `DB_NAME` | Nome do banco |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `NODE_ENV` | `development` ou `production` |

## Deploy

O `index.js` exporta como Firebase Cloud Function (`exports.api`) e também suporta execução direta (`node index.js`).

> **Nota:** O sistema atualmente opera em modo mock no frontend. Este backend precisa ser conectado a um banco SQL real para funcionar.
