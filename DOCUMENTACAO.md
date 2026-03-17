# Sistema de Gestão de Igrejas — Documentação

## Visão Geral

Aplicação web completa para administração de igrejas: ministérios, escalas, membros, conteúdos e integrações externas (YouTube, Bíblia, Holyrics, Google Drive). Funciona 100% no modo mock sem backend, e pode ser ligado a uma API real editando um único arquivo de configuração.

---

## Módulos

### Abas acessíveis a todos os perfis

| Módulo | Descrição |
|--------|-----------|
| **Bíblia** | Leitura por livro/capítulo e pesquisa de versículos. Integração real com [bible-api.com](https://bible-api.com) — sem chave de API. Traduções disponíveis: Almeida (PT), KJV (EN), WEB (EN). |
| **Apresentação (Holyrics)** | Visualização em tempo real do software de apresentação via IP local. Configure `HOLYRICS_HOST` em `config.js`. |
| **Canal do YouTube** | Player e listagem de vídeos do canal. Configure `YOUTUBE_CHANNEL_ID` e `YOUTUBE_CHANNEL_URL` em `config.js`. |
| **Transmissão ao Vivo** | Embed do live stream do YouTube. Configure `YOUTUBE_LIVE_URL` e `PROXIMA_TRANSMISSAO` em `config.js`. |
| **Ordem de Culto** | Editor drag-and-drop para organizar momentos do culto (pastores e admins podem editar). |

### Abas de gestão (Pastor e Admin)

| Módulo | Descrição |
|--------|-----------|
| **Ministérios** | CRUD completo. Membros (padrão) podem visualizar, mas não editar. |
| **Escalas** | CRUD com detalhes, conteúdos por escala e definição de instrumentos por membro. |
| **Conteúdos** | Biblioteca central de músicas, arquivos e links, organizados por ministério. |
| **Plataformas** | Cadastro de plataformas de música (Cifra Club, YouTube, Spotify, etc.) com links rápidos. |
| **Upload** | Repositório de arquivos. Em produção, integra com Google Drive (`GOOGLE_DRIVE_FOLDER_URL` em `config.js`). |

### Exclusivo do Pastor

| Módulo | Descrição |
|--------|-----------|
| **Gestão de Usuários** | Criação, edição e remoção de usuários. Geração de códigos de convite. Visualização de escalas por membro com detecção de conflitos. |

---

## Perfis de Acesso

| Perfil | Código | Permissões |
|--------|--------|------------|
| **Pastor** | `pastor` | Acesso total, incluindo Gestão de Usuários |
| **Admin (Líder)** | `admin` | Gestão de ministérios, escalas, conteúdos e plataformas |
| **Membro** | `padrao` | Visualização de escalas próprias, conteúdos e abas públicas |

---

## Arquivo de Configuração Central

**`frontend/js/config.js`** centraliza todas as variáveis configuráveis. É o único arquivo que precisa ser editado para personalizar e publicar o sistema.

```js
window.IGREJA_CONFIG = {
    // --- Modo de dados ---
    USE_MOCK: true,          // false → usa API real
    API_BASE: '',            // URL do backend (ex.: https://minha-api.cloudfunctions.net)

    // --- Igreja ---
    NOME_IGREJA: 'Igreja Batista de Nova Cintra',
    LOGO_URL: '',            // caminho para o logotipo (opcional)

    // --- YouTube ---
    YOUTUBE_CHANNEL_ID: 'UCIgrejaBatistadeNovaCintra',
    YOUTUBE_CHANNEL_URL: 'https://www.youtube.com/c/IgrejaBatistadeNovaCintra',
    YOUTUBE_LIVE_URL: 'https://www.youtube.com/c/IgrejaBatistadeNovaCintra/live',
    PROXIMA_TRANSMISSAO: 'Domingo, 31/05/2025 às 10:00',

    // --- Bíblia ---
    BIBLIA_TRADUCAO_PADRAO: 'almeida',  // almeida | kjv | web

    // --- Google Drive ---
    GOOGLE_DRIVE_FOLDER_URL: '',        // URL da pasta pública

    // --- Holyrics ---
    HOLYRICS_HOST: '',       // IP do computador com Holyrics (ex.: 192.168.1.100)
    HOLYRICS_PORT: 8091,
    HOLYRICS_TOKEN: '',
};
```

O arquivo também sincroniza automaticamente `window.APP_CONFIG` (lido por `app.js`), então **não é necessário alterar `app.js`**.

---

## Personalização Visual

### Cores

Edite as variáveis em `/frontend/css/styles.css`:
```css
:root {
  --primary-color: #28a745;
  --primary-color-dark: #218838;
  --primary-color-light: #48c774;
}
```

### Logo

Defina `LOGO_URL` em `config.js` ou substitua o arquivo `/frontend/images/logo.png`.

---

## Usuários para Teste (modo mock)

| Email | Senha | Perfil |
|-------|-------|--------|
| pastor@igreja.com | pastor123 | Pastor |
| lider@igreja.com | lider123 | Admin (Líder) |
| membro@igreja.com | membro123 | Membro (Padrão) |

Novos usuários podem se registrar usando um código de convite gerado pelo Pastor.

---

## Publicação em Produção

### Passo 1 — Configurar `config.js`
```js
USE_MOCK: false,
API_BASE: 'https://seu-projeto.cloudfunctions.net',
// ... preencher demais campos
```

### Passo 2 — Preparar o backend
```bash
cd backend/functions
cp .env.example .env   # preencher DB_*, JWT_SECRET
npm install
npm run migrate        # criar tabelas no Azure SQL
npm run seed           # opcional: dados de exemplo
```

### Passo 3 — Deploy
```bash
firebase deploy --only hosting,functions
```

Veja o checklist completo em `todo.md`.

---

## Requisitos Técnicos

- **Localmente (mock)**: qualquer navegador moderno — abrir `frontend/pages/login.html`
- **Produção**: Node.js 18+, Firebase CLI, Azure SQL, conta Google Cloud (YouTube API key opcional)
- **Holyrics**: software instalado na rede local da igreja, com conexão HTTP habilitada
