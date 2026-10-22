// Funções de Autenticação (Mock)
const PERFIS = {
    PASTOR: 'pastor',
    ADMIN: 'admin',
    PADRAO: 'padrao'
};

// Configuração global: define se usamos mocks ou API real.
// Para usar a API real, defina `window.APP_CONFIG = { USE_MOCK: false, API_BASE: 'https://<seu-projeto>.cloudfunctions.net' }` antes de carregar `app.js`.
window.APP_CONFIG = window.APP_CONFIG || { USE_MOCK: true, API_BASE: '' };

// ───────────────────────────────────────────────
//  Aplicar identidade da igreja (nome + título + favicon)
// ───────────────────────────────────────────────
(function aplicarIdentidade() {
    function run() {
        var cfg = window.IGREJA_CONFIG || {};
        var nome = cfg.NOME_IGREJA || '';
        if (!nome) return;

        // 1. Substituir texto da navbar-brand
        // Nome fica dentro de um <span> próprio (não texto solto) para
        // permitir reticências (text-overflow: ellipsis) no mobile sem
        // afetar o span.navbar-logo ao lado.
        document.querySelectorAll('.navbar-brand').forEach(function(el) {
            // Preservar o span.navbar-logo se existir
            var logo = el.querySelector('.navbar-logo');
            if (!logo) {
                logo = document.createElement('span');
                logo.className = 'navbar-logo';
            }
            var texto = document.createElement('span');
            texto.className = 'navbar-brand-text';
            texto.textContent = nome;

            el.textContent = '';
            el.appendChild(logo);
            el.appendChild(texto);
        });

        // 2. Atualizar <title> do navegador
        var tituloPagina = document.title;
        if (tituloPagina.includes('Sistema de Gestão de Igreja')) {
            document.title = tituloPagina.replace(/Sistema de Gestão de Igreja/g, nome);
        } else if (tituloPagina.indexOf(nome) === -1) {
            document.title = tituloPagina + ' — ' + nome;
        }

        // 3. Favicon — usar logo.png se existir
        var logoUrl = cfg.LOGO_URL || '../images/logo.png';
        if (logoUrl && !document.querySelector('link[rel="icon"]')) {
            var link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            link.href = logoUrl;
            document.head.appendChild(link);
        }

        // 4. Substituir texto em elementos com classe .igreja-nome-display
        document.querySelectorAll('.igreja-nome-display').forEach(function(el) {
            el.textContent = el.textContent.replace(/Sistema de Gestão de Igreja/g, nome);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

// Função global para atualizar visibilidade de elementos baseados no perfil
// Pode ser chamada após renderizar conteúdo dinâmico com classes admin-only / pastor-only
function atualizarVisibilidadePerfil(usuario) {
    if (!usuario) {
        const raw = localStorage.getItem('usuario');
        if (raw) try { usuario = JSON.parse(raw); } catch(e) {}
    }
    if (!usuario) return;
    const perfil = usuario.tipoPerfil || usuario.perfil;

    if (perfil === PERFIS.PASTOR) {
        document.querySelectorAll('.pastor-only').forEach(el => { el.style.display = ''; });
        document.querySelectorAll('.admin-only').forEach(el => { el.style.display = ''; });
    } else if (perfil === PERFIS.ADMIN) {
        document.querySelectorAll('.pastor-only').forEach(el => { el.style.display = 'none'; });
        document.querySelectorAll('.admin-only').forEach(el => { el.style.display = ''; });
    } else {
        document.querySelectorAll('.pastor-only').forEach(el => { el.style.display = 'none'; });
        document.querySelectorAll('.admin-only').forEach(el => { el.style.display = 'none'; });
    }

    // Tesouraria: visibilidade decidida SÓ pela flag acesso_tesouraria vinda do
    // banco (login/me) — não depende de tipoPerfil, nem mesmo para o Pastor.
    const temAcessoTesouraria = usuario.acessoTesouraria === true;
    document.querySelectorAll('.tesouraria-only').forEach(el => {
        el.style.display = temAcessoTesouraria ? '' : 'none';
    });
}

// Verificar se o usuário está logado
function verificarLogin() {
    // Compatibilidade: procurar usuário em várias chaves e normalizar propriedades
    function obterUsuarioDoLocalStorage() {
        const raw = localStorage.getItem('usuario') || localStorage.getItem('usuario_logado') || localStorage.getItem('usuario-logado');
        if (!raw) return null;
        try {
            const u = JSON.parse(raw);
            // Normalizar propriedades
            if (!u.tipoPerfil && u.perfil) u.tipoPerfil = u.perfil;
            if (!u.perfil && u.tipoPerfil) u.perfil = u.tipoPerfil;
            return u;
        } catch (e) {
            return null;
        }
    }

    const usuario = obterUsuarioDoLocalStorage();

    if (!usuario) {
        // Redirecionar para login se não estiver logado
        if (window.location.pathname !== '/login.html' && 
            window.location.pathname !== '/registro.html' &&
            !window.location.pathname.includes('login.html') &&
            !window.location.pathname.includes('registro.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }

    // Garantir que a chave padrão 'usuario' esteja presente (migração)
    try {
        localStorage.setItem('usuario', JSON.stringify(usuario));
    } catch (e) {
        // ignore
    }

    // Expor usuário normalizado para outras páginas/scripts
    try {
        window.usuarioAtual = usuario;
        window.usuarioTemPerfil = function(...roles) {
            if (!window.usuarioAtual) return false;
            const perfil = window.usuarioAtual.tipoPerfil || window.usuarioAtual.perfil;
            return roles.includes(perfil);
        };
        window.usuarioTemAcessoTesouraria = function() {
            return !!(window.usuarioAtual && window.usuarioAtual.acessoTesouraria === true);
        };
    } catch (e) {
        // ignore
    }
    
    // Atualizar nome do usuário na interface
    document.querySelectorAll('.nome-usuario').forEach(el => {
        el.textContent = usuario.nome;
    });
    
    // Mostrar/ocultar elementos baseados no perfil
    atualizarVisibilidadePerfil(usuario);
    
    
    // Configurar evento de logout
    document.querySelectorAll('#logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    });
    
    return usuario;
}

// Função para fazer login (mock ou real)
async function fazerLogin(email, senha) {
    // Modo real: chamar API
    if (window.APP_CONFIG && window.APP_CONFIG.USE_MOCK === false) {
        const base = (window.APP_CONFIG.API_BASE || '').replace(/\/$/, '');
        const url = base ? `${base}/auth/login` : '/api/auth/login';
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || 'Credenciais inválidas');
        }
        const data = await resp.json();
        // Salvar token e usuário
        if (data.token) localStorage.setItem('auth_token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        return data.usuario;
    }

    // Modo mock
    await new Promise(resolve => setTimeout(resolve, 1000));

    const usuariosFixos = [
        { id: 1, nome: 'Pastor João Silva',    email: 'pastor@igreja.com', senha: 'pastor123', tipoPerfil: PERFIS.PASTOR },
        { id: 2, nome: 'Líder Maria Oliveira',  email: 'lider@igreja.com',  senha: 'lider123',  tipoPerfil: PERFIS.ADMIN },
        { id: 3, nome: 'Membro José Santos',    email: 'membro@igreja.com', senha: 'membro123', tipoPerfil: PERFIS.PADRAO }
    ];

    let usuariosRegistrados = [];
    try { usuariosRegistrados = JSON.parse(localStorage.getItem('usuarios') || '[]'); } catch (e) {}

    const todos = [...usuariosFixos, ...usuariosRegistrados];
    const usuario = todos.find(u => u.email === email && u.senha === senha);
    if (!usuario) throw new Error('Credenciais inválidas');

    const { senha: _, ...usuarioSemSenha } = usuario;
    localStorage.setItem('usuario', JSON.stringify(usuarioSemSenha));
    return usuarioSemSenha;
}

// Função para comunicação com a API (mock ou real, controlado por window.APP_CONFIG)
async function fetchAPI(endpoint, method = 'GET', data = null) {
    // Se estiver usando API real, encaminhar a requisição para o backend
    if (window.APP_CONFIG && window.APP_CONFIG.USE_MOCK === false) {
        const base = (window.APP_CONFIG.API_BASE || '').replace(/\/$/, '');
        const url = base ? `${base}/${endpoint}` : `/api/${endpoint}`;
        const options = { method, headers: {} };

        // Adicionar token JWT se existir
        const token = localStorage.getItem('auth_token');
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        if (method !== 'GET' && data != null) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }

        const resp = await fetch(url, options);
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error(`API error ${resp.status}: ${text}`);
        }
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) return resp.json();
        return resp.text();
    }

    // Simular delay de rede (mock)
    await new Promise(resolve => setTimeout(resolve, 500));

    // ── Mock Data ──────────────────────────────────────────────
    const mockData = {
        usuarios: [
            { id: 1, nome: 'Pastor João Silva', email: 'pastor@igreja.com', tipoPerfil: PERFIS.PASTOR },
            { id: 2, nome: 'Líder Maria Oliveira', email: 'lider@igreja.com', tipoPerfil: PERFIS.ADMIN },
            { id: 3, nome: 'Membro José Santos', email: 'membro@igreja.com', tipoPerfil: PERFIS.PADRAO },
            { id: 4, nome: 'Líder Ana Costa', email: 'ana@igreja.com', tipoPerfil: PERFIS.ADMIN },
            { id: 5, nome: 'Membro Carlos Pereira', email: 'carlos@igreja.com', tipoPerfil: PERFIS.PADRAO }
        ],
        ministerios: [
            { id: 1, nome: 'Louvor', descricao: 'Ministério de música e adoração', idLider: 2 },
            { id: 2, nome: 'Infantil', descricao: 'Ministério para crianças', idLider: 4 },
            { id: 3, nome: 'Jovens', descricao: 'Ministério para jovens e adolescentes', idLider: 2 },
            { id: 4, nome: 'Recepção', descricao: 'Ministério de recepção e acolhimento', idLider: 4 },
            { id: 5, nome: 'Mídia', descricao: 'Ministério de comunicação e mídias sociais', idLider: null }
        ],
        membros: [
            { id: 1, idUsuario: 2, idMinisterio: 1, funcao: 'Líder', instrumento: 'Teclado' },
            { id: 2, idUsuario: 3, idMinisterio: 1, funcao: 'Guitarrista', instrumento: 'Guitarra' },
            { id: 3, idUsuario: 5, idMinisterio: 1, funcao: 'Vocalista', instrumento: null },
            { id: 4, idUsuario: 4, idMinisterio: 2, funcao: 'Líder', instrumento: null },
            { id: 5, idUsuario: 3, idMinisterio: 2, funcao: 'Auxiliar', instrumento: null },
            { id: 6, idUsuario: 2, idMinisterio: 3, funcao: 'Líder', instrumento: null },
            { id: 7, idUsuario: 5, idMinisterio: 3, funcao: 'Auxiliar', instrumento: null },
            { id: 8, idUsuario: 4, idMinisterio: 4, funcao: 'Líder', instrumento: null },
            { id: 9, idUsuario: 3, idMinisterio: 4, funcao: 'Recepcionista', instrumento: null }
        ],
        escalas: [
            { id: 1, idMinisterio: 1, data: '2025-06-01', descricao: 'Culto de Domingo - Manhã', membros: [1, 2, 3] },
            { id: 2, idMinisterio: 1, data: '2025-06-01', descricao: 'Culto de Domingo - Noite', membros: [1, 3] },
            { id: 3, idMinisterio: 1, data: '2025-06-08', descricao: 'Culto de Domingo - Manhã', membros: [1, 2] },
            { id: 4, idMinisterio: 1, data: '2025-06-08', descricao: 'Culto de Domingo - Noite', membros: [1, 3] },
            { id: 5, idMinisterio: 2, data: '2025-06-01', descricao: 'Escola Dominical', membros: [4, 5] },
            { id: 6, idMinisterio: 2, data: '2025-06-08', descricao: 'Escola Dominical', membros: [4, 5] },
            { id: 7, idMinisterio: 3, data: '2025-06-06', descricao: 'Encontro de Jovens', membros: [6, 7] },
            { id: 8, idMinisterio: 4, data: '2025-06-01', descricao: 'Recepção - Culto Matutino', membros: [8, 9] },
            { id: 9, idMinisterio: 4, data: '2025-06-01', descricao: 'Recepção - Culto Noturno', membros: [8] }
        ],
        conteudos: [
            { id: 1, idMinisterio: 1, titulo: 'Cifras - Junho 2025', linkArquivo: 'https://drive.google.com/file/cifras-junho-2025', dataPublicacao: '2025-05-20' },
            { id: 2, idMinisterio: 1, titulo: 'Escalas de Louvor - Junho 2025', linkArquivo: 'https://drive.google.com/file/escalas-louvor-junho-2025', dataPublicacao: '2025-05-22' },
            { id: 3, idMinisterio: 2, titulo: 'Material Infantil - Junho 2025', linkArquivo: 'https://drive.google.com/file/material-infantil-junho-2025', dataPublicacao: '2025-05-21' },
            { id: 4, idMinisterio: 3, titulo: 'Programação Jovem - Junho 2025', linkArquivo: 'https://drive.google.com/file/programacao-jovem-junho-2025', dataPublicacao: '2025-05-23' },
            { id: 5, idMinisterio: 4, titulo: 'Manual de Recepção', linkArquivo: 'https://drive.google.com/file/manual-recepcao', dataPublicacao: '2025-05-15' }
        ],
        // ── Mock data para conteúdos de escala (separados da escala)
        conteudos_escala: {
            1: [
                { id: 1, tipo: 'musica', titulo: 'Grande é o Senhor', detalhes: 'Tom: E, BPM: 75', link: 'https://drive.google.com/file/grande-senhor' },
                { id: 2, tipo: 'musica', titulo: 'Maravilhosa Graça', detalhes: 'Tom: G, BPM: 72', link: 'https://drive.google.com/file/maravilhosa-graca' },
                { id: 3, tipo: 'arquivo', titulo: 'Playbacks', detalhes: 'Pasta com todos os playbacks', link: 'https://drive.google.com/folder/playbacks-culto-manha' }
            ],
            2: [
                { id: 4, tipo: 'musica', titulo: 'Rei do Meu Coração', detalhes: 'Tom: D, BPM: 68', link: 'https://drive.google.com/file/rei-coracao' },
                { id: 5, tipo: 'musica', titulo: 'Teu Santo Nome', detalhes: 'Tom: A, BPM: 74', link: 'https://drive.google.com/file/teu-santo-nome' }
            ],
            5: [
                { id: 6, tipo: 'arquivo', titulo: 'Lição do Dia', detalhes: 'Material para aula', link: 'https://drive.google.com/file/licao-junho-01' },
                { id: 7, tipo: 'arquivo', titulo: 'Atividades', detalhes: 'Folhas para colorir', link: 'https://drive.google.com/file/atividades-junho-01' }
            ],
            7: [
                { id: 8, tipo: 'arquivo', titulo: 'Tema do Encontro', detalhes: 'Slides da apresentação', link: 'https://drive.google.com/file/slides-jovens-junho' },
                { id: 9, tipo: 'arquivo', titulo: 'Dinâmica', detalhes: 'Instruções para dinâmica em grupo', link: 'https://drive.google.com/file/dinamica-jovens-junho' }
            ]
        },
        // ── Plataformas de música ──
        plataformas: [
            { id: 1, nome: 'Cifra Club', url: 'https://www.cifraclub.com.br', icone: 'fa-guitar', cor: '#2D9CDB', descricao: 'Plataforma de cifras e tablaturas.', ativo: true },
            { id: 2, nome: 'YouTube', url: 'https://www.youtube.com', icone: 'fa-youtube', cor: '#FF0000', descricao: 'Plataforma de vídeos com músicas e tutoriais.', ativo: true },
            { id: 3, nome: 'Spotify', url: 'https://open.spotify.com', icone: 'fa-spotify', cor: '#1DB954', descricao: 'Serviço de streaming de música.', ativo: true },
            { id: 4, nome: 'Deezer', url: 'https://www.deezer.com', icone: 'fa-music', cor: '#00C7F2', descricao: 'Serviço de streaming com playlists e rádios.', ativo: true },
            { id: 5, nome: 'Google Drive', url: 'https://drive.google.com', icone: 'fa-file-pdf', cor: '#4285F4', descricao: 'Armazenamento de partituras e letras em PDF.', ativo: true }
        ],
        // ── Ordens de culto ──
        'ordens-culto': [
            {
                id: 1, titulo: 'Culto de Celebração', data: '2025-05-31', horaInicio: '10:00', horaFim: '12:00', local: 'Templo Principal', dirigente: 'Pr. João Silva',
                itens: [
                    { id: 1, titulo: 'Prelúdio', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 5, descricao: 'Música instrumental de abertura' },
                    { id: 2, titulo: 'Boas-vindas e Oração', tipo: 'oracao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Boas-vindas aos visitantes e oração' },
                    { id: 3, titulo: 'Louvor e Adoração', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 20, descricao: 'Momento de louvor congregacional' },
                    { id: 4, titulo: 'Leitura Bíblica', tipo: 'leitura', responsavel: 'Diác. Maria Oliveira', duracao: 5, descricao: 'Salmos 100' },
                    { id: 5, titulo: 'Oferta', tipo: 'oferta', responsavel: 'Diáconos', duracao: 10, descricao: 'Momento de contribuição e gratidão' },
                    { id: 6, titulo: 'Mensagem', tipo: 'mensagem', responsavel: 'Pr. João Silva', duracao: 40, descricao: 'Tema: "O Poder da Gratidão"' },
                    { id: 7, titulo: 'Oração Final', tipo: 'oracao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Oração de encerramento' },
                    { id: 8, titulo: 'Avisos', tipo: 'anuncios', responsavel: 'Secretaria', duracao: 5, descricao: 'Informações sobre próximos eventos' },
                    { id: 9, titulo: 'Bênção Apostólica', tipo: 'bencao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Bênção final' }
                ]
            },
            {
                id: 2, titulo: 'Culto de Celebração', data: '2025-05-24', horaInicio: '10:00', horaFim: '12:00', local: 'Templo Principal', dirigente: 'Pr. João Silva',
                itens: [
                    { id: 10, titulo: 'Prelúdio', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 5, descricao: 'Música instrumental de abertura' },
                    { id: 11, titulo: 'Boas-vindas e Oração', tipo: 'oracao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Boas-vindas e oração inicial' },
                    { id: 12, titulo: 'Louvor e Adoração', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 20, descricao: 'Momento de louvor congregacional' },
                    { id: 13, titulo: 'Mensagem', tipo: 'mensagem', responsavel: 'Pr. João Silva', duracao: 40, descricao: 'Tema: "Fé em Tempos Difíceis"' },
                    { id: 14, titulo: 'Oração Final', tipo: 'oracao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Oração de encerramento' },
                    { id: 15, titulo: 'Bênção Apostólica', tipo: 'bencao', responsavel: 'Pr. João Silva', duracao: 5, descricao: 'Bênção final' }
                ]
            },
            {
                id: 3, titulo: 'Modelo Padrão de Culto', data: null, horaInicio: '10:00', horaFim: '12:00', local: 'Templo Principal', dirigente: '',
                itens: [
                    { id: 16, titulo: 'Prelúdio', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 5, descricao: 'Música instrumental de abertura' },
                    { id: 17, titulo: 'Boas-vindas e Oração', tipo: 'oracao', responsavel: '', duracao: 5, descricao: 'Boas-vindas e oração inicial' },
                    { id: 18, titulo: 'Louvor e Adoração', tipo: 'louvor', responsavel: 'Ministério de Louvor', duracao: 20, descricao: 'Momento de louvor congregacional' },
                    { id: 19, titulo: 'Leitura Bíblica', tipo: 'leitura', responsavel: '', duracao: 5, descricao: '' },
                    { id: 20, titulo: 'Mensagem', tipo: 'mensagem', responsavel: '', duracao: 40, descricao: '' },
                    { id: 21, titulo: 'Oração Final', tipo: 'oracao', responsavel: '', duracao: 5, descricao: 'Oração de encerramento' },
                    { id: 22, titulo: 'Bênção Apostólica', tipo: 'bencao', responsavel: '', duracao: 5, descricao: 'Bênção final' }
                ]
            }
        ],
        // ── Códigos de convite ──
        'codigos-convite': [
            { id: 1, codigo: 'IGREJA2025', perfil: 'padrao', usado: false, idCriador: 1 },
            { id: 2, codigo: 'LIDER2025', perfil: 'admin', usado: false, idCriador: 1 }
        ],
        // ── Tesouraria (mock — só usado com USE_MOCK: true) ──
        categorias_financeiras: [
            { id: 1, nome: 'Dízimo', tipo: 'entrada', cor: '#1b5e3f' },
            { id: 2, nome: 'Oferta', tipo: 'entrada', cor: '#27ae60' },
            { id: 3, nome: 'Contas (água/luz/internet)', tipo: 'saida', cor: '#c0392b' },
            { id: 4, nome: 'Manutenção e Reformas', tipo: 'saida', cor: '#e74c3c' }
        ],
        tesouraria: [
            { id: 1, tipo: 'entrada', idCategoria: 1, categoriaNome: 'Dízimo', descricao: 'Dízimos - Culto Domingo', valor: 3200, data: '2026-07-05', formaPagamento: 'pix', usuarioNome: 'Pastor João Silva' },
            { id: 2, tipo: 'entrada', idCategoria: 2, categoriaNome: 'Oferta', valor: 850, descricao: 'Ofertas - Culto Domingo', data: '2026-07-05', formaPagamento: 'dinheiro', usuarioNome: 'Pastor João Silva' },
            { id: 3, tipo: 'saida', idCategoria: 3, categoriaNome: 'Contas (água/luz/internet)', valor: 420, descricao: 'Conta de luz - Julho', data: '2026-07-10', formaPagamento: 'boleto', usuarioNome: 'Pastor João Silva' }
        ],
        // ── Estudos e Pregações (mock — só usado com USE_MOCK: true) ──
        estudos: [
            {
                id: 1, titulo: 'A Fé que Move Montanhas', tipo: 'pregacao', tema: 'Fé', textoBase: 'Mateus 17:20',
                resumo: 'Uma reflexão sobre o poder da fé genuína no dia a dia do cristão.',
                conteudoHtml: '<p>Conteúdo completo da pregação...</p>',
                autorNome: 'Pastor João Silva', idAutor: 1, publicado: true, dataPublicacao: '2026-07-12'
            }
        ]
    };
    
    // ── Mock Routing ──────────────────────────────────────────

    // Rota: plataformas
    if (endpoint === 'plataformas') {
        if (method === 'GET') return mockData.plataformas;
        if (method === 'POST') {
            const novo = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
            mockData.plataformas.push(novo);
            return novo;
        }
    }
    if (endpoint.startsWith('plataformas/')) {
        const id = parseInt(endpoint.split('/')[1]);
        if (method === 'GET') return mockData.plataformas.find(p => p.id === id) || null;
        if (method === 'PUT') {
            const idx = mockData.plataformas.findIndex(p => p.id === id);
            if (idx !== -1) { mockData.plataformas[idx] = { ...mockData.plataformas[idx], ...data }; return mockData.plataformas[idx]; }
        }
        if (method === 'DELETE') {
            mockData.plataformas = mockData.plataformas.filter(p => p.id !== id);
            return { success: true };
        }
    }

    // Rota: ordens-culto
    if (endpoint === 'ordens-culto') {
        if (method === 'GET') return mockData['ordens-culto'];
        if (method === 'POST') {
            const novo = { ...data, id: Math.floor(Math.random() * 1000) + 10, itens: data.itens || [] };
            mockData['ordens-culto'].push(novo);
            return novo;
        }
    }
    if (endpoint.startsWith('ordens-culto/')) {
        const id = parseInt(endpoint.split('/')[1]);
        if (method === 'GET') return mockData['ordens-culto'].find(o => o.id === id) || null;
        if (method === 'PUT') {
            const idx = mockData['ordens-culto'].findIndex(o => o.id === id);
            if (idx !== -1) { mockData['ordens-culto'][idx] = { ...mockData['ordens-culto'][idx], ...data }; return mockData['ordens-culto'][idx]; }
        }
        if (method === 'DELETE') {
            mockData['ordens-culto'] = mockData['ordens-culto'].filter(o => o.id !== id);
            return { success: true };
        }
    }

    // Rota: codigos-convite
    if (endpoint === 'codigos-convite') {
        if (method === 'GET') return mockData['codigos-convite'];
        if (method === 'POST') {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = ''; for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
            const novo = { id: Math.floor(Math.random() * 1000) + 10, codigo: code, perfil: data.perfil || 'padrao', usado: false, idCriador: 1 };
            mockData['codigos-convite'].push(novo);
            return novo;
        }
    }
    if (endpoint.startsWith('codigos-convite/')) {
        const id = parseInt(endpoint.split('/')[1]);
        if (method === 'DELETE') {
            mockData['codigos-convite'] = mockData['codigos-convite'].filter(c => c.id !== id);
            return { success: true };
        }
    }

    // Rota: tesouraria — categorias
    if (endpoint === 'tesouraria/categorias') {
        if (method === 'GET') return mockData.categorias_financeiras;
        if (method === 'POST') {
            const nova = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
            mockData.categorias_financeiras.push(nova);
            return nova;
        }
    }
    if (endpoint.startsWith('tesouraria/categorias/')) {
        const id = parseInt(endpoint.split('/')[2]);
        if (method === 'PUT') {
            const idx = mockData.categorias_financeiras.findIndex(c => c.id === id);
            if (idx !== -1) { mockData.categorias_financeiras[idx] = { ...mockData.categorias_financeiras[idx], ...data }; return mockData.categorias_financeiras[idx]; }
        }
        if (method === 'DELETE') {
            mockData.categorias_financeiras = mockData.categorias_financeiras.filter(c => c.id !== id);
            return { success: true };
        }
    }
    // Rota: tesouraria — resumo (KPIs)
    if (endpoint === 'tesouraria/resumo' || endpoint.startsWith('tesouraria/resumo?')) {
        const entradas = mockData.tesouraria.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + l.valor, 0);
        const saidas = mockData.tesouraria.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + l.valor, 0);
        const hoje = new Date();
        return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear(), entradasMes: entradas, saidasMes: saidas, saldoMes: entradas - saidas, saldoTotal: entradas - saidas };
    }
    // Rota: tesouraria — lançamentos
    if (endpoint === 'tesouraria' || endpoint.startsWith('tesouraria?')) {
        if (method === 'GET') return mockData.tesouraria;
        if (method === 'POST') {
            const categoria = mockData.categorias_financeiras.find(c => c.id === parseInt(data.idCategoria));
            const novo = { ...data, id: Math.floor(Math.random() * 1000) + 10, categoriaNome: categoria ? categoria.nome : undefined };
            mockData.tesouraria.push(novo);
            return novo;
        }
    }
    if (endpoint.startsWith('tesouraria/')) {
        const id = parseInt(endpoint.split('/')[1]);
        if (!isNaN(id)) {
            if (method === 'GET') return mockData.tesouraria.find(l => l.id === id) || null;
            if (method === 'PUT') {
                const idx = mockData.tesouraria.findIndex(l => l.id === id);
                if (idx !== -1) { mockData.tesouraria[idx] = { ...mockData.tesouraria[idx], ...data }; return mockData.tesouraria[idx]; }
            }
            if (method === 'DELETE') {
                mockData.tesouraria = mockData.tesouraria.filter(l => l.id !== id);
                return { success: true };
            }
        }
    }

    // Rota: estudos — pública (site institucional)
    if (endpoint === 'estudos/public') {
        return mockData.estudos.filter(e => e.publicado);
    }
    if (endpoint.startsWith('estudos/public/')) {
        const id = parseInt(endpoint.split('/')[2]);
        return mockData.estudos.find(e => e.id === id && e.publicado) || null;
    }
    // Rota: estudos — intranet
    if (endpoint === 'estudos') {
        if (method === 'GET') return mockData.estudos;
        if (method === 'POST') {
            const novo = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
            mockData.estudos.push(novo);
            return novo;
        }
    }
    if (endpoint.startsWith('estudos/')) {
        const id = parseInt(endpoint.split('/')[1]);
        if (!isNaN(id)) {
            if (method === 'GET') return mockData.estudos.find(e => e.id === id) || null;
            if (method === 'PUT') {
                const idx = mockData.estudos.findIndex(e => e.id === id);
                if (idx !== -1) { mockData.estudos[idx] = { ...mockData.estudos[idx], ...data }; return mockData.estudos[idx]; }
            }
            if (method === 'DELETE') {
                mockData.estudos = mockData.estudos.filter(e => e.id !== id);
                return { success: true };
            }
        }
    }

    // Rota: validar código de convite (registro)
    if (endpoint === 'auth/validar-convite' && method === 'POST') {
        const conv = mockData['codigos-convite'].find(c => c.codigo === data.codigo && !c.usado);
        if (conv) return { valido: true, perfil: conv.perfil };
        return { valido: false };
    }

    // Rota: register
    if (endpoint === 'auth/registro' && method === 'POST') {
        const conv = mockData['codigos-convite'].find(c => c.codigo === data.codigoConvite && !c.usado);
        if (!conv) throw new Error('Código de convite inválido');
        conv.usado = true;
        const novo = { id: Math.floor(Math.random() * 1000) + 10, nome: data.nome, email: data.email, tipoPerfil: conv.perfil };
        mockData.usuarios.push(novo);
        return { usuario: novo };
    }

    // Rota: membros por ministério
    if (endpoint.startsWith('membros/ministerio/')) {
        const ministerioId = parseInt(endpoint.split('/').pop());
        return mockData.membros.filter(membro => membro.idMinisterio === ministerioId);
    }
    // Rota: escalas por membro
    if (endpoint.startsWith('escalas/membro/')) {
        const membroId = parseInt(endpoint.split('/').pop());
        return mockData.escalas.filter(escala => escala.membros.includes(membroId));
    }
    // Rota: escalas por usuário
    if (endpoint.startsWith('escalas/usuario/')) {
        const usuarioId = parseInt(endpoint.split('/').pop());
        const membroIds = mockData.membros.filter(m => m.idUsuario === usuarioId).map(m => m.id);
        return mockData.escalas.filter(escala => escala.membros.some(mId => membroIds.includes(mId)));
    }
    // Rota: conteúdos de escala
    if (endpoint.startsWith('escalas/conteudos/')) {
        const parts = endpoint.split('/');
        const escalaId = parseInt(parts[2]);
        if (method === 'GET') return mockData.conteudos_escala[escalaId] || [];
        if (method === 'POST') {
            if (!mockData.conteudos_escala[escalaId]) mockData.conteudos_escala[escalaId] = [];
            const novo = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
            mockData.conteudos_escala[escalaId].push(novo);
            return novo;
        }
        if (parts.length > 3) {
            const conteudoId = parseInt(parts[3]);
            if (method === 'PUT') {
                const arr = mockData.conteudos_escala[escalaId] || [];
                const idx = arr.findIndex(c => c.id === conteudoId);
                if (idx !== -1) { arr[idx] = { ...arr[idx], ...data }; return arr[idx]; }
            }
            if (method === 'DELETE') {
                mockData.conteudos_escala[escalaId] = (mockData.conteudos_escala[escalaId] || []).filter(c => c.id !== conteudoId);
                return { success: true };
            }
        }
    }

    // Rotas genéricas (GET/POST/PUT/DELETE por resource/id)
    if (method === 'GET') {
        if (endpoint.includes('/')) {
            const [resource, id] = endpoint.split('/');
            return (mockData[resource] || []).find(item => item.id === parseInt(id)) || null;
        }
        return mockData[endpoint] || [];
    }
    if (method === 'POST') {
        const newItem = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
        if (mockData[endpoint]) mockData[endpoint].push(newItem);
        return newItem;
    }
    if (method === 'PUT') {
        const [resource, id] = endpoint.split('/');
        const index = (mockData[resource] || []).findIndex(item => item.id === parseInt(id));
        if (index !== -1) { mockData[resource][index] = { ...mockData[resource][index], ...data }; return mockData[resource][index]; }
        throw new Error('Item não encontrado');
    }
    if (method === 'DELETE') {
        const [resource, id] = endpoint.split('/');
        const index = (mockData[resource] || []).findIndex(item => item.id === parseInt(id));
        if (index !== -1) { mockData[resource].splice(index, 1); return { success: true }; }
        throw new Error('Item não encontrado');
    }
    
    throw new Error('Método não suportado');
}

// Escapa texto antes de inserir em innerHTML — usar sempre que um valor vindo
// da API (nome, descrição, título etc.) for interpolado em template strings
// de HTML, para evitar XSS armazenado.
function escapeHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Função para formatar data (evita desvio de fuso horário ao parsear ISO date)
function formatarData(dataString) {
    if (!dataString) return '';
    // Pega apenas a parte da data (YYYY-MM-DD) e constrói sem fuso horário
    const partes = dataString.split('T')[0].split('-');
    const data = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    return data.toLocaleDateString('pt-BR');
}

// Configurar eventos globais quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar login em todas as páginas (exceto login e registro)
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('registro.html')) {
        verificarLogin();
    }
});
