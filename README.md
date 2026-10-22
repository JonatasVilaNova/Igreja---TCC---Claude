# Sistema de Gestão de Igrejas

## Visão Geral

Aplicação web completa para administração de igrejas: ministérios, escalas, membros, conteúdos e integrações externas (YouTube, Bíblia, Holyrics, Google Drive). Desenvolvida com HTML5 + Bootstrap 5 + JavaScript puro.

Atualmente funciona 100% no **modo mock** (sem backend) — basta abrir `frontend/pages/login.html` no navegador.

## Funcionalidades

### Gestão (Pastor e Admin)
- **Ministérios** — CRUD completo com atribuição de líderes
- **Escalas** — Criação e gerenciamento de escalas com detecção de conflitos
- **Conteúdos** — Biblioteca de músicas, arquivos e links por ministério
- **Plataformas** — Links para Cifra Club, YouTube, Spotify etc.
- **Upload** — Repositório de arquivos (Google Drive em produção)
- **Gestão de Usuários** — Exclusivo do Pastor: criação, edição, convites

### Integrações (todos os perfis)
- **Bíblia Online** — Leitura por livro/capítulo via [bible-api.com](https://bible-api.com) (Almeida, KJV, WEB)
- **Canal do YouTube** — Player e listagem de vídeos
- **Transmissão ao Vivo** — Embed do live stream
- **Ordem de Culto** — Editor drag-and-drop (SortableJS)
- **Apresentação (Holyrics)** — Visualização em tempo real via rede local

## Perfis de Acesso

| Perfil | Código | Acesso |
|--------|--------|--------|
| **Pastor** | `pastor` | Completo — inclui gestão de usuários |
| **Admin (Líder)** | `admin` | Gestão de ministérios, escalas e conteúdos |
| **Membro** | `padrao` | Visualização das próprias escalas e conteúdos |

## Como Executar (Modo Mock)

1. Abra `frontend/pages/login.html` no navegador
2. Use um dos usuários de teste:

| Email | Senha | Perfil |
|-------|-------|--------|
| pastor@igreja.com | pastor123 | Pastor |
| lider@igreja.com | lider123 | Admin (Líder) |
| membro@igreja.com | membro123 | Membro |

> Novos usuários podem se registrar usando um código de convite gerado pelo Pastor.

## Configuração

Toda a personalização está em **`frontend/js/config.js`**:

```js
window.IGREJA_CONFIG = {
    USE_MOCK: true,                    // false para usar API real
    API_BASE: '',                      // URL do backend em produção
    NOME_IGREJA: 'Igreja Batista de Nova Cintra',
    YOUTUBE_CHANNEL_ID: 'UCseuCanal',
    YOUTUBE_CHANNEL_URL: 'https://youtube.com/...',
    YOUTUBE_LIVE_URL: 'https://youtube.com/.../live',
    PROXIMA_TRANSMISSAO: 'Domingo às 10:00',
    BIBLIA_TRADUCAO_PADRAO: 'almeida', // almeida | kjv | web
    GOOGLE_DRIVE_FOLDER_URL: '',
    HOLYRICS_HOST: '',
    HOLYRICS_PORT: 8091,
    HOLYRICS_TOKEN: '',
};
```

### Personalização Visual

**Cores** — Edite as variáveis CSS em `frontend/css/styles.css`:
```css
:root {
  --primary-color: #28a745;
  --primary-color-dark: #218838;
  --primary-color-light: #48c774;
}
```

**Logo** — Defina `LOGO_URL` em `config.js` ou substitua `frontend/images/logo.png`.

## Estrutura do Projeto

```
├── frontend/
│   ├── pages/          # 18 páginas HTML
│   ├── js/
│   │   ├── config.js   # Configuração central
│   │   ├── app.js      # Lógica principal + mock data
│   │   └── sidebar-loader.js
│   ├── css/styles.css
│   ├── components/     # navbar.html, sidebar.html
│   └── images/
├── backend/
│   ├── functions/      # Express API (auth, ministérios, escalas, etc.)
│   ├── utils/db.js     # Conexão com banco de dados
│   └── scripts/        # Migrations e seed
├── database/
│   ├── schema.sql      # DDL — estrutura das tabelas
│   └── seed.sql        # DML — dados iniciais
└── firebase.json       # Configuração Firebase Hosting
```

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript, Bootstrap 5, Font Awesome |
| **Backend** | Node.js, Express, JWT, bcrypt |
| **Banco de dados** | Schema SQL preparado (ainda não conectado em produção) |
| **Hosting** | Firebase Hosting (configurado) |
| **Libs externas** | SortableJS (ordem de culto), YouTube IFrame API |

## Requisitos

- **Localmente (mock):** qualquer navegador moderno
- **Produção:** Node.js 18+, Firebase CLI, banco de dados SQL

## Licença

Projeto acadêmico (TCC).
