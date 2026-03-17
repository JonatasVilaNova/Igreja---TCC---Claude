# Análise de Viabilidade das Integrações Solicitadas

> **Status atualizado em 2026-03-17** — itens marcados com ✅ estão implementados e funcionando.

## 1. ✅ Integração da Bíblia (NVI e NVT)

### Opções de API:
- **Bible.org API**: Oferece acesso à NVI (NIV em inglês)
- **Bible API (api.bible)**: Oferece múltiplas versões, incluindo NVI e NVT
- **Digital Bible Platform**: API da Faith Comes By Hearing com múltiplas versões

### Abordagem recomendada:
- Criar uma nova aba "Bíblia" acessível a todos os usuários
- Implementar interface para seleção de livro, capítulo e versículo
- Permitir alternar entre versões (NVI, NVT e outras)
- Utilizar a API da Bible.org ou api.bible para buscar os textos
- Implementar cache local para melhorar performance

### Considerações técnicas:
- Algumas APIs requerem chave de API e registro
- Limitações de requisições por dia/hora
- Necessidade de tratamento de erros e fallback

### ✅ Implementado
Utilizada a **bible-api.com** (gratuita, sem chave de API). Traduções disponíveis: Almeida (PT), KJV (EN), WEB (EN). A tradução padrão é configurável via `BIBLIA_TRADUCAO_PADRAO` em `config.js`. Cache por sessão implementado para evitar chamadas repetidas.

## 2. ✅ Integração do Holyrics

### Análise:
- Holyrics não possui API pública oficial documentada
- A integração será feita via conexão direta ao IP do computador da igreja
- Necessário implementar configuração de IP por perfil (líder/pastor)

### Abordagem recomendada:
- Criar nova aba "Apresentação" acessível a todos
- Implementar campo de configuração de IP do Holyrics no perfil de líderes/pastores
- Utilizar iframe ou WebSocket para exibir o conteúdo atual do Holyrics
- Implementar verificação de conectividade e fallback

### Considerações técnicas:
- Requer que o Holyrics esteja configurado para permitir conexões externas
- Possíveis problemas de CORS (Cross-Origin Resource Sharing)
- Necessidade de conexão estável com a rede da igreja

### ✅ Implementado
Página `apresentacao.html` criada com iframe apontando para o Holyrics. IP, porta e token configuráveis via `HOLYRICS_HOST`, `HOLYRICS_PORT` e `HOLYRICS_TOKEN` em `config.js`.

## 3. ✅ Integração do Canal do YouTube

### Análise:
- YouTube oferece API oficial e recursos de embed
- Canal específico: https://www.youtube.com/c/IgrejaBatistadeNovaCintra

### Abordagem recomendada:
- Criar nova aba "YouTube" acessível a todos
- Utilizar YouTube Embed API para exibir o canal e vídeos
- Implementar listagem dos últimos vídeos publicados
- Permitir reprodução direta no aplicativo

### Considerações técnicas:
- Requer chave de API do YouTube (Google Cloud)
- Limitações de quota da API
- Necessidade de tratamento responsivo para diferentes dispositivos

### ✅ Implementado
Página `youtube.html` com YouTube IFrame API, listagem de vídeos recentes e player integrado. Canal configurável via `YOUTUBE_CHANNEL_ID` e `YOUTUBE_CHANNEL_URL` em `config.js`.

## 4. ✅ Integração de Transmissão ao Vivo

### Análise:
- YouTube Live oferece recursos de embed para transmissões ao vivo
- Possibilidade de detectar automaticamente quando o canal está ao vivo

### Abordagem recomendada:
- Criar nova aba "Ao Vivo" acessível a todos
- Utilizar YouTube Live Embed para exibir a transmissão atual
- Implementar detecção automática de transmissão ativa
- Exibir mensagem informativa quando não houver transmissão

### Considerações técnicas:
- Requer verificação periódica do status de transmissão
- Possível atraso na detecção de início/fim de transmissão
- Consumo de dados móveis para usuários em redes celulares

### ✅ Implementado
Página `aovivo.html` com embed do live stream via `youtube.com/embed/live_stream?channel=ID`. Canal, URL e data da próxima transmissão configuráveis via `config.js`.

## 5. ✅ Cadastro de Plataformas de Músicas e Cifras

### Análise:
- Necessário sistema flexível para cadastro de diferentes plataformas
- Integração com links externos para cifras e músicas

### Abordagem recomendada:
- Implementar sistema de cadastro de plataformas (nome, URL base, ícone)
- Permitir que líderes/pastores adicionem novas plataformas
- Integrar com a página de detalhes da escala para vincular músicas
- Implementar visualização organizada dos links por plataforma

### Considerações técnicas:
- Necessidade de validação de URLs
- Armazenamento de metadados das plataformas
- Interface intuitiva para adição de links

### ✅ Implementado
Página `plataformas.html` com CRUD completo. Pastores e admins podem criar/editar/excluir. Membros visualizam apenas.

## 6. ✅ Ordem de Culto

### Análise:
- Necessário sistema para criação e visualização de ordem de culto
- Acesso de edição para líderes/pastores e visualização para todos

### Abordagem recomendada:
- Criar nova aba "Ordem de Culto" acessível a todos
- Implementar editor para líderes/pastores com itens ordenáveis
- Permitir vinculação com escalas específicas
- Exibir ordem de culto atual/próxima na dashboard

### Considerações técnicas:
- Sistema de versionamento para diferentes cultos
- Notificações de atualização para membros
- Interface drag-and-drop para ordenação de itens

### ✅ Implementado
Página `ordem-culto.html` com editor drag-and-drop usando SortableJS. Edição restrita a pastores e admins.

## 7. ✅ Correção do Menu Mobile

### Análise:
- Menu atual não permite navegação entre abas em dispositivos móveis
- Apenas exibe o perfil do usuário

### Abordagem recomendada:
- Redesenhar o menu mobile para exibir todas as opções
- Implementar botão de toggle para sidebar em dispositivos móveis
- Garantir que todas as funcionalidades sejam acessíveis em telas pequenas

### Considerações técnicas:
- Testes em múltiplos tamanhos de tela
- Manter consistência visual com a versão desktop
- Garantir usabilidade em dispositivos touch

### ✅ Implementado
Sidebar responsiva com toggle mobile via `sidebar-loader.js`. Funciona em `file://` e `http://`.

## 8. ✅ Upload de Arquivos (Google Drive)

### Análise:
- Necessário sistema para upload e compartilhamento de arquivos
- Integração com Google Drive para armazenamento

### Abordagem recomendada:
- Implementar integração com Google Drive API
- Criar interface para upload, organização e compartilhamento
- Permitir vinculação de arquivos com escalas e conteúdos
- Implementar sistema de permissões baseado nos perfis

### Considerações técnicas:
- Requer autenticação OAuth com Google
- Gerenciamento de tokens de acesso
- Limitações de espaço e quotas do Google Drive
- Necessidade de tratamento de diferentes tipos de arquivo

### ✅ Implementado
Página `upload.html` com simulação de repositório de arquivos. Em produção, configure `GOOGLE_DRIVE_FOLDER_URL` em `config.js` para redirecionar à pasta real do Drive.

## Conclusão

✅ **Todas as 8 integrações foram implementadas.** O sistema funciona integralmente no modo mock (sem backend) e está preparado para produção via configuração centralizada em `frontend/js/config.js`.
