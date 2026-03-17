/**
 * ============================================================
 *  ARQUIVO DE CONFIGURAÇÃO CENTRAL — SISTEMA DE GESTÃO DE IGREJA
 * ============================================================
 *
 * COMO USAR:
 *   1. Edite apenas este arquivo para personalizar o sistema.
 *   2. Para publicar em produção, altere USE_MOCK para false
 *      e preencha os campos marcados com "→ PREENCHER".
 *   3. Salve e faça o deploy — nenhum outro arquivo precisa
 *      ser editado para as configurações básicas.
 *
 * ESTE ARQUIVO DEVE SER INCLUÍDO ANTES DE app.js EM TODAS AS PÁGINAS.
 * ============================================================
 */

window.IGREJA_CONFIG = {

    // ----------------------------------------------------------
    // 1. MODO DE DADOS
    // ----------------------------------------------------------

    /**
     * true  → usa dados simulados (mock) — não precisa de backend.
     * false → faz chamadas reais à sua API (configure API_BASE abaixo).
     */
    USE_MOCK: true,


    // ----------------------------------------------------------
    // 2. API BACKEND
    // ----------------------------------------------------------

    /**
     * URL base do seu backend Express / Firebase Cloud Functions.
     * Exemplos:
     *   'https://minha-api.cloudfunctions.net'
     *   'https://minha-api.azurewebsites.net/api'
     *   'http://localhost:3000/api'  (desenvolvimento local)
     *
     * Ignorado quando USE_MOCK: true.
     */
    API_BASE: '',  // → PREENCHER se USE_MOCK: false


    // ----------------------------------------------------------
    // 3. IDENTIDADE DA IGREJA
    // ----------------------------------------------------------

    /** Nome exibido no cabeçalho, títulos e rodapés das páginas. */
    NOME_IGREJA: 'Igreja Batista de Nova Cintra',

    /**
     * URL do logotipo da igreja (relativa ou absoluta).
     * Deixe em branco ('') para usar o ícone padrão de igreja.
     * Exemplo: '../img/logo.png' ou 'https://minha-igreja.com/logo.png'
     */
    LOGO_URL: '',


    // ----------------------------------------------------------
    // 4. YOUTUBE
    // ----------------------------------------------------------

    /**
     * ID do canal do YouTube (começa com "UC").
     * Acesse seu canal → URL do tipo youtube.com/channel/UC...
     *  → PREENCHER com o ID real do canal da sua igreja.
     */
    YOUTUBE_CHANNEL_ID: 'UCIgrejaBatistadeNovaCintra',

    /**
     * URL pública do canal (usada no botão "Abrir no YouTube").
     * Pode ser a URL customizada do canal (youtube.com/@SuaIgreja)
     * ou a URL padrão (youtube.com/channel/UC...).
     */
    YOUTUBE_CHANNEL_URL: 'https://www.youtube.com/c/IgrejaBatistadeNovaCintra',

    /**
     * URL da transmissão ao vivo.
     * Geralmente é a URL do canal + /live.
     */
    YOUTUBE_LIVE_URL: 'https://www.youtube.com/c/IgrejaBatistadeNovaCintra/live',

    /**
     * Texto exibido quando não há transmissão ao vivo.
     * Ex.: 'Domingo, 18/05/2025 às 10:00'
     */
    PROXIMA_TRANSMISSAO: 'Domingo, 31/05/2025 às 10:00',


    // ----------------------------------------------------------
    // 5. BÍBLIA
    // ----------------------------------------------------------

    /**
     * Tradução padrão ao abrir a página da Bíblia.
     * Opções disponíveis via bible-api.com (gratuito, sem chave):
     *   'almeida'  → João Ferreira de Almeida (Português)
     *   'kjv'      → King James Version (Inglês)
     *   'web'      → World English Bible (Inglês)
     */
    BIBLIA_TRADUCAO_PADRAO: 'almeida',


    // ----------------------------------------------------------
    // 6. GOOGLE DRIVE / UPLOAD
    // ----------------------------------------------------------

    /**
     * URL da pasta do Google Drive usada como repositório de arquivos.
     * Exemplo: 'https://drive.google.com/drive/folders/ABC123'
     * Deixe em branco para usar o modo simulado (mock).
     */
    GOOGLE_DRIVE_FOLDER_URL: '',  // → PREENCHER (opcional)


    // ----------------------------------------------------------
    // 7. HOLYRICS (SOFTWARE DE APRESENTAÇÃO)
    // ----------------------------------------------------------

    /**
     * IP ou URL do computador que roda o Holyrics na sua rede local.
     * Usado para integração com a página de Apresentação/Projeção.
     * Exemplo: '192.168.1.100'  ou  'holyrics.minhaigreja.local'
     * Deixe em branco para desabilitar a integração.
     */
    HOLYRICS_HOST: '',  // → PREENCHER (opcional)

    /**
     * Porta HTTP do Holyrics (padrão: 8091).
     */
    HOLYRICS_PORT: 8091,

    /**
     * Token de autenticação do Holyrics (configurado no software).
     */
    HOLYRICS_TOKEN: '',  // → PREENCHER (opcional)

};

// ----------------------------------------------------------
// Sincroniza com window.APP_CONFIG (lido por app.js)
// Não altere este bloco.
// ----------------------------------------------------------
window.APP_CONFIG = {
    USE_MOCK: window.IGREJA_CONFIG.USE_MOCK,
    API_BASE: window.IGREJA_CONFIG.API_BASE,
};
