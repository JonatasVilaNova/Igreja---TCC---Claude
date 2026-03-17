# Sistema de Gestão de Igrejas

## Visão Geral

O Sistema de Gestão de Igrejas é uma aplicação web completa para gerenciar ministérios, escalas, membros e conteúdos de uma igreja. Desenvolvido com HTML5 + Bootstrap 5 + JavaScript puro, funciona diretamente no navegador sem necessidade de configurar banco de dados (modo mock).

## Funcionalidades Principais

- **Gestão de Ministérios**: Cadastro, edição e exclusão de ministérios da igreja
- **Gestão de Membros**: Cadastro de membros em ministérios com funções específicas
- **Escalas de Serviço**: Criação e gerenciamento de escalas, com detalhes de conteúdos e instrumentos
- **Conteúdos Personalizados**: Compartilhamento de arquivos, músicas e links por escala
- **Gestão de Usuários**: Controle de acesso com diferentes níveis de permissão (apenas Pastor)
- **Visualização de Conflitos**: Identificação automática de membros escalados em múltiplos ministérios
- **Bíblia Online**: Leitura por livro/capítulo e pesquisa de versículos — integração com bible-api.com
- **Canal do YouTube**: Listagem de vídeos e player integrado
- **Transmissão ao Vivo**: Embed do live stream do canal YouTube da igreja
- **Ordem de Culto**: Editor drag-and-drop para organizar os momentos do culto
- **Plataformas de Música**: Cadastro de links para Cifra Club, YouTube, Spotify, etc.
- **Upload de Arquivos**: Simulação de repositório de arquivos (Google Drive na versão real)
- **Apresentação (Holyrics)**: Integração com o software de apresentação via IP local

## Perfis de Acesso

| Perfil | Código interno | Acesso |
|--------|---------------|--------|
| **Pastor** | `pastor` | Completo — inclui gestão de usuários |
| **Admin (Líder)** | `admin` | Gestão de ministérios, escalas e conteúdos |
| **Membro** | `padrao` | Visualização das próprias escalas e conteúdos |

## Configuração e Personalização

### Arquivo central de configuração

Toda a personalização do sistema está em **`frontend/js/config.js`**. Edite apenas esse arquivo:

```js
window.IGREJA_CONFIG = {
    USE_MOCK: true,                    // false para usar API real
    API_BASE: '',                      // URL do backend em produção
    NOME_IGREJA: 'Nome da Sua Igreja',
    YOUTUBE_CHANNEL_ID: 'UCseuCanal',
    YOUTUBE_CHANNEL_URL: 'https://youtube.com/...',
    YOUTUBE_LIVE_URL: 'https://youtube.com/.../live',
    PROXIMA_TRANSMISSAO: 'Domingo, 01/06/2025 às 10:00',
    BIBLIA_TRADUCAO_PADRAO: 'almeida', // almeida | kjv | web
    GOOGLE_DRIVE_FOLDER_URL: '',
    HOLYRICS_HOST: '',
    HOLYRICS_PORT: 8091,
    HOLYRICS_TOKEN: '',
};
```

### Alterando as cores

1. Abra `/frontend/css/styles.css`
2. Localize a seção `:root` no início do arquivo
3. Modifique as variáveis de cor:
   ```css
   :root {
     --primary-color: #28a745;
     --primary-color-dark: #218838;
     --primary-color-light: #48c774;
   }
   ```

### Alterando a logo

Defina `LOGO_URL` em `config.js` apontando para o arquivo de imagem da sua igreja.
Alternativamente, substitua `/frontend/images/logo.png` pela logo desejada.

## Usuários para Teste (modo mock)

| Email | Senha | Perfil |
|-------|-------|--------|
| pastor@igreja.com | pastor123 | Pastor |
| lider@igreja.com | lider123 | Admin (Líder) |
| membro@igreja.com | membro123 | Membro |

## Publicação em Produção

1. Edite `frontend/js/config.js`: mude `USE_MOCK: false` e preencha `API_BASE` e as demais chaves
2. Configure o backend: `cd backend/functions && npm install`, preencha `.env` (copie `.env.example`)
3. Execute `firebase deploy --only hosting,functions`

Consulte o **Checklist de Deploy** em `todo.md` para os passos detalhados.

## Requisitos Técnicos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Para rodar localmente: basta abrir `frontend/pages/login.html` no navegador (modo mock)
- Para produção: Node.js 18+, Firebase CLI, acesso ao Azure SQL
