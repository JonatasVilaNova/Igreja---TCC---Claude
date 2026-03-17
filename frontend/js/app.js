// Funções de Autenticação (Mock)
const PERFIS = {
    PASTOR: 'pastor',
    ADMIN: 'admin',
    PADRAO: 'padrao'
};

// Configuração global: define se usamos mocks ou API real.
// Para usar a API real, defina `window.APP_CONFIG = { USE_MOCK: false, API_BASE: 'https://<seu-projeto>.cloudfunctions.net' }` antes de carregar `app.js`.
window.APP_CONFIG = window.APP_CONFIG || { USE_MOCK: true, API_BASE: '' };

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
    } catch (e) {
        // ignore
    }
    
    // Atualizar nome do usuário na interface
    document.querySelectorAll('.nome-usuario').forEach(el => {
        el.textContent = usuario.nome;
    });
    
    // Mostrar/ocultar elementos baseados no perfil
    if (usuario.tipoPerfil === PERFIS.PASTOR) {
        document.querySelectorAll('.pastor-only').forEach(el => {
            el.style.display = 'block';
        });
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    } else if (usuario.tipoPerfil === PERFIS.ADMIN) {
        document.querySelectorAll('.pastor-only').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.pastor-only').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    
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

// Função para fazer login (mock)
async function fazerLogin(email, senha) {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Usuários de teste fixos
    const usuariosFixos = [
        {
            id: 1,
            nome: 'Pastor João Silva',
            email: 'pastor@igreja.com',
            senha: 'pastor123',
            tipoPerfil: PERFIS.PASTOR
        },
        {
            id: 2,
            nome: 'Líder Maria Oliveira',
            email: 'lider@igreja.com',
            senha: 'lider123',
            tipoPerfil: PERFIS.ADMIN
        },
        {
            id: 3,
            nome: 'Membro José Santos',
            email: 'membro@igreja.com',
            senha: 'membro123',
            tipoPerfil: PERFIS.PADRAO
        }
    ];

    // Usuários registrados via tela de registro
    let usuariosRegistrados = [];
    try {
        usuariosRegistrados = JSON.parse(localStorage.getItem('usuarios') || '[]');
    } catch (e) { /* ignore */ }

    const todos = [...usuariosFixos, ...usuariosRegistrados];
    const usuario = todos.find(u => u.email === email && u.senha === senha);

    if (!usuario) {
        throw new Error('Credenciais inválidas');
    }

    // Não enviar a senha para o localStorage
    const { senha: _, ...usuarioSemSenha } = usuario;

    // Salvar no localStorage
    localStorage.setItem('usuario', JSON.stringify(usuarioSemSenha));

    return usuarioSemSenha;
}

// Função para comunicação com a API (mock ou real, controlado por window.APP_CONFIG)
async function fetchAPI(endpoint, method = 'GET', data = null) {
    // Se estiver usando API real, encaminhar a requisição para o backend
    if (window.APP_CONFIG && window.APP_CONFIG.USE_MOCK === false) {
        const base = (window.APP_CONFIG.API_BASE || '').replace(/\/$/, '');
        const url = base ? `${base}/${endpoint}` : `/${endpoint}`;
        const options = { method };
        options.headers = {};
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

    // Dados mockados
    const mockData = {
        usuarios: [
            {
                id: 1,
                nome: 'Pastor João Silva',
                email: 'pastor@igreja.com',
                tipoPerfil: PERFIS.PASTOR
            },
            {
                id: 2,
                nome: 'Líder Maria Oliveira',
                email: 'lider@igreja.com',
                tipoPerfil: PERFIS.ADMIN
            },
            {
                id: 3,
                nome: 'Membro José Santos',
                email: 'membro@igreja.com',
                tipoPerfil: PERFIS.PADRAO
            },
            {
                id: 4,
                nome: 'Líder Ana Costa',
                email: 'ana@igreja.com',
                tipoPerfil: PERFIS.ADMIN
            },
            {
                id: 5,
                nome: 'Membro Carlos Pereira',
                email: 'carlos@igreja.com',
                tipoPerfil: PERFIS.PADRAO
            }
        ],
        ministerios: [
            {
                id: 1,
                nome: 'Louvor',
                descricao: 'Ministério de música e adoração',
                idLider: 2
            },
            {
                id: 2,
                nome: 'Infantil',
                descricao: 'Ministério para crianças',
                idLider: 4
            },
            {
                id: 3,
                nome: 'Jovens',
                descricao: 'Ministério para jovens e adolescentes',
                idLider: 2
            },
            {
                id: 4,
                nome: 'Recepção',
                descricao: 'Ministério de recepção e acolhimento',
                idLider: 4
            },
            {
                id: 5,
                nome: 'Mídia',
                descricao: 'Ministério de comunicação e mídias sociais',
                idLider: null
            }
        ],
        membros: [
            {
                id: 1,
                idUsuario: 2,
                idMinisterio: 1,
                funcao: 'Líder'
            },
            {
                id: 2,
                idUsuario: 3,
                idMinisterio: 1,
                funcao: 'Guitarrista'
            },
            {
                id: 3,
                idUsuario: 5,
                idMinisterio: 1,
                funcao: 'Vocalista'
            },
            {
                id: 4,
                idUsuario: 4,
                idMinisterio: 2,
                funcao: 'Líder'
            },
            {
                id: 5,
                idUsuario: 3,
                idMinisterio: 2,
                funcao: 'Auxiliar'
            },
            {
                id: 6,
                idUsuario: 2,
                idMinisterio: 3,
                funcao: 'Líder'
            },
            {
                id: 7,
                idUsuario: 5,
                idMinisterio: 3,
                funcao: 'Auxiliar'
            },
            {
                id: 8,
                idUsuario: 4,
                idMinisterio: 4,
                funcao: 'Líder'
            },
            {
                id: 9,
                idUsuario: 3,
                idMinisterio: 4,
                funcao: 'Recepcionista'
            }
        ],
        escalas: [
            {
                id: 1,
                idMinisterio: 1,
                data: '2025-06-01',
                descricao: 'Culto de Domingo - Manhã',
                membros: [1, 2, 3],
                conteudos: [
                    {
                        tipo: 'musica',
                        titulo: 'Grande é o Senhor',
                        detalhes: 'Tom: E, BPM: 75',
                        link: 'https://drive.google.com/file/grande-senhor'
                    },
                    {
                        tipo: 'musica',
                        titulo: 'Maravilhosa Graça',
                        detalhes: 'Tom: G, BPM: 72',
                        link: 'https://drive.google.com/file/maravilhosa-graca'
                    },
                    {
                        tipo: 'arquivo',
                        titulo: 'Playbacks',
                        detalhes: 'Pasta com todos os playbacks',
                        link: 'https://drive.google.com/folder/playbacks-culto-manha'
                    }
                ]
            },
            {
                id: 2,
                idMinisterio: 1,
                data: '2025-06-01',
                descricao: 'Culto de Domingo - Noite',
                membros: [1, 3],
                conteudos: [
                    {
                        tipo: 'musica',
                        titulo: 'Rei do Meu Coração',
                        detalhes: 'Tom: D, BPM: 68',
                        link: 'https://drive.google.com/file/rei-coracao'
                    },
                    {
                        tipo: 'musica',
                        titulo: 'Teu Santo Nome',
                        detalhes: 'Tom: A, BPM: 74',
                        link: 'https://drive.google.com/file/teu-santo-nome'
                    }
                ]
            },
            {
                id: 3,
                idMinisterio: 1,
                data: '2025-06-08',
                descricao: 'Culto de Domingo - Manhã',
                membros: [1, 2],
                conteudos: []
            },
            {
                id: 4,
                idMinisterio: 1,
                data: '2025-06-08',
                descricao: 'Culto de Domingo - Noite',
                membros: [1, 3],
                conteudos: []
            },
            {
                id: 5,
                idMinisterio: 2,
                data: '2025-06-01',
                descricao: 'Escola Dominical',
                membros: [4, 5],
                conteudos: [
                    {
                        tipo: 'arquivo',
                        titulo: 'Lição do Dia',
                        detalhes: 'Material para aula',
                        link: 'https://drive.google.com/file/licao-junho-01'
                    },
                    {
                        tipo: 'arquivo',
                        titulo: 'Atividades',
                        detalhes: 'Folhas para colorir',
                        link: 'https://drive.google.com/file/atividades-junho-01'
                    }
                ]
            },
            {
                id: 6,
                idMinisterio: 2,
                data: '2025-06-08',
                descricao: 'Escola Dominical',
                membros: [4, 5],
                conteudos: []
            },
            {
                id: 7,
                idMinisterio: 3,
                data: '2025-06-06',
                descricao: 'Encontro de Jovens',
                membros: [6, 7],
                conteudos: [
                    {
                        tipo: 'arquivo',
                        titulo: 'Tema do Encontro',
                        detalhes: 'Slides da apresentação',
                        link: 'https://drive.google.com/file/slides-jovens-junho'
                    },
                    {
                        tipo: 'arquivo',
                        titulo: 'Dinâmica',
                        detalhes: 'Instruções para dinâmica em grupo',
                        link: 'https://drive.google.com/file/dinamica-jovens-junho'
                    }
                ]
            },
            {
                id: 8,
                idMinisterio: 4,
                data: '2025-06-01',
                descricao: 'Recepção - Culto Matutino',
                membros: [8, 9],
                conteudos: []
            },
            {
                id: 9,
                idMinisterio: 4,
                data: '2025-06-01',
                descricao: 'Recepção - Culto Noturno',
                membros: [8],
                conteudos: []
            }
        ],
        conteudos: [
            {
                id: 1,
                idMinisterio: 1,
                titulo: 'Cifras - Junho 2025',
                linkArquivo: 'https://drive.google.com/file/cifras-junho-2025',
                dataPublicacao: '2025-05-20'
            },
            {
                id: 2,
                idMinisterio: 1,
                titulo: 'Escalas de Louvor - Junho 2025',
                linkArquivo: 'https://drive.google.com/file/escalas-louvor-junho-2025',
                dataPublicacao: '2025-05-22'
            },
            {
                id: 3,
                idMinisterio: 2,
                titulo: 'Material Infantil - Junho 2025',
                linkArquivo: 'https://drive.google.com/file/material-infantil-junho-2025',
                dataPublicacao: '2025-05-21'
            },
            {
                id: 4,
                idMinisterio: 3,
                titulo: 'Programação Jovem - Junho 2025',
                linkArquivo: 'https://drive.google.com/file/programacao-jovem-junho-2025',
                dataPublicacao: '2025-05-23'
            },
            {
                id: 5,
                idMinisterio: 4,
                titulo: 'Manual de Recepção',
                linkArquivo: 'https://drive.google.com/file/manual-recepcao',
                dataPublicacao: '2025-05-15'
            }
        ]
    };
    
    // Simular diferentes endpoints e métodos
    if (method === 'GET') {
        // Endpoint especial para membros por ministério
        if (endpoint.startsWith('membros/ministerio/')) {
            const ministerioId = parseInt(endpoint.split('/').pop());
            return mockData.membros.filter(membro => membro.idMinisterio === ministerioId);
        }
        // Endpoint especial para escalas por membro
        else if (endpoint.startsWith('escalas/membro/')) {
            const membroId = parseInt(endpoint.split('/').pop());
            return mockData.escalas.filter(escala => escala.membros.includes(membroId));
        }
        // Endpoint especial para escalas por usuário
        else if (endpoint.startsWith('escalas/usuario/')) {
            const usuarioId = parseInt(endpoint.split('/').pop());
            // Encontrar todos os IDs de membros deste usuário
            const membroIds = mockData.membros
                .filter(membro => membro.idUsuario === usuarioId)
                .map(membro => membro.id);
            
            // Encontrar todas as escalas que incluem esses membros
            return mockData.escalas.filter(escala => 
                escala.membros.some(membroId => membroIds.includes(membroId))
            );
        }
        // Endpoint especial para conteúdos de escala
        else if (endpoint.startsWith('escalas/conteudos/')) {
            const escalaId = parseInt(endpoint.split('/').pop());
            const escala = mockData.escalas.find(e => e.id === escalaId);
            return escala ? escala.conteudos : [];
        }
        // Endpoints padrão
        else if (endpoint.includes('/')) {
            // Obter um item específico
            const [resource, id] = endpoint.split('/');
            const item = mockData[resource].find(item => item.id === parseInt(id));
            return item || null;
        } else {
            // Obter lista completa
            return mockData[endpoint] || [];
        }
    } else if (method === 'POST') {
        // Endpoint especial para adicionar conteúdo a uma escala
        if (endpoint.startsWith('escalas/conteudos/')) {
            const escalaId = parseInt(endpoint.split('/').pop());
            const escala = mockData.escalas.find(e => e.id === escalaId);
            
            if (escala) {
                if (!escala.conteudos) {
                    escala.conteudos = [];
                }
                
                const novoConteudo = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
                escala.conteudos.push(novoConteudo);
                return novoConteudo;
            }
            
            throw new Error('Escala não encontrada');
        }
        // Endpoints padrão
        else {
            // Criar novo item
            const newItem = { ...data, id: Math.floor(Math.random() * 1000) + 10 };
            mockData[endpoint].push(newItem);
            return newItem;
        }
    } else if (method === 'PUT') {
        // Endpoint especial para atualizar conteúdo de escala
        if (endpoint.startsWith('escalas/conteudos/')) {
            const parts = endpoint.split('/');
            const escalaId = parseInt(parts[parts.length - 2]);
            const conteudoId = parseInt(parts[parts.length - 1]);
            
            const escala = mockData.escalas.find(e => e.id === escalaId);
            
            if (escala && escala.conteudos) {
                const index = escala.conteudos.findIndex(c => c.id === conteudoId);
                
                if (index !== -1) {
                    escala.conteudos[index] = { ...escala.conteudos[index], ...data };
                    return escala.conteudos[index];
                }
            }
            
            throw new Error('Conteúdo não encontrado');
        }
        // Endpoints padrão
        else {
            // Atualizar item existente
            const [resource, id] = endpoint.split('/');
            const index = mockData[resource].findIndex(item => item.id === parseInt(id));
            
            if (index !== -1) {
                mockData[resource][index] = { ...mockData[resource][index], ...data };
                return mockData[resource][index];
            }
            
            throw new Error('Item não encontrado');
        }
    } else if (method === 'DELETE') {
        // Endpoint especial para excluir conteúdo de escala
        if (endpoint.startsWith('escalas/conteudos/')) {
            const parts = endpoint.split('/');
            const escalaId = parseInt(parts[parts.length - 2]);
            const conteudoId = parseInt(parts[parts.length - 1]);
            
            const escala = mockData.escalas.find(e => e.id === escalaId);
            
            if (escala && escala.conteudos) {
                const index = escala.conteudos.findIndex(c => c.id === conteudoId);
                
                if (index !== -1) {
                    escala.conteudos.splice(index, 1);
                    return { success: true };
                }
            }
            
            throw new Error('Conteúdo não encontrado');
        }
        // Endpoints padrão
        else {
            // Excluir item
            const [resource, id] = endpoint.split('/');
            const index = mockData[resource].findIndex(item => item.id === parseInt(id));
            
            if (index !== -1) {
                mockData[resource].splice(index, 1);
                return { success: true };
            }
            
            throw new Error('Item não encontrado');
        }
    }
    
    throw new Error('Método não suportado');
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
