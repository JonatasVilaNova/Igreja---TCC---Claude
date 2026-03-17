// Script para carregar o sidebar de forma consistente em todas as páginas
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa comportamentos/handlers da sidebar (toggle, permissões, logout, ativo)
    function initializeSidebarBehavior() {
        // Obtém o usuário a partir de várias chaves possíveis e normaliza propriedades
        function obterUsuarioDoLocalStorage() {
            const raw = localStorage.getItem('usuario') || localStorage.getItem('usuario_logado') || localStorage.getItem('usuario-logado');
            if (!raw) return null;
            try {
                const u = JSON.parse(raw);
                if (!u.tipoPerfil && u.perfil) u.tipoPerfil = u.perfil;
                return u;
            } catch (e) {
                return null;
            }
        }

        const usuario = obterUsuarioDoLocalStorage();

        // Mostrar/esconder itens baseado no perfil
        if (usuario) {
            const isPastor = usuario.tipoPerfil === 'pastor';
            const isAdmin = usuario.tipoPerfil === 'admin' || usuario.tipoPerfil === 'lider';

            document.querySelectorAll('.pastor-admin-only').forEach(item => {
                item.style.display = (isPastor || isAdmin) ? 'block' : 'none';
            });

            document.querySelectorAll('.pastor-only').forEach(item => {
                item.style.display = isPastor ? 'block' : 'none';
            });
        }

        // Garantir que as abas públicas estejam sempre visíveis
        document.querySelectorAll('.public-tab').forEach(item => {
            item.style.display = 'block';
        });

        // Forçar visibilidade das abas públicas após qualquer alteração de DOM
        const observer = new MutationObserver(function() {
            document.querySelectorAll('.public-tab').forEach(item => {
                item.style.display = 'block';
            });
        });

        const sidebarElement = document.querySelector('.sidebar');
        if (sidebarElement) {
            observer.observe(sidebarElement, { childList: true, subtree: true });
        }

        // Configurar toggle da sidebar em mobile
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggleBtn && sidebar) {
            // Remove event listeners duplicates by cloning
            const newToggle = sidebarToggleBtn.cloneNode(true);
            sidebarToggleBtn.parentNode.replaceChild(newToggle, sidebarToggleBtn);
            const realToggle = document.getElementById('sidebar-toggle-btn');
            realToggle.addEventListener('click', function() {
                sidebar.classList.toggle('show');
            });

            // Fechar sidebar ao clicar em um link (em mobile)
            document.querySelectorAll('.sidebar .nav-link').forEach(link => {
                // remove old handlers by cloning
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                newLink.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('show');
                    }
                });
            });

            // Fechar sidebar ao clicar fora dela (em mobile)
            document.addEventListener('click', function(event) {
                if (window.innerWidth <= 768 && !sidebar.contains(event.target) && event.target !== realToggle && !realToggle.contains(event.target)) {
                    sidebar.classList.remove('show');
                }
            });
        }

        // Configurar botão de logout na sidebar mobile
        const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
        if (sidebarLogoutBtn) {
            // evitar múltiplos handlers
            const btn = sidebarLogoutBtn.cloneNode(true);
            sidebarLogoutBtn.parentNode.replaceChild(btn, sidebarLogoutBtn);
            btn.addEventListener('click', function() {
                localStorage.removeItem('usuario');
                localStorage.removeItem('usuario_logado');
                localStorage.removeItem('usuario-logado');
                window.location.href = 'login.html';
            });
        }

        // Marcar item ativo no menu
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                link.classList.add('active');
            }
        });
    }
    // Função para carregar o sidebar
    function carregarSidebar() {
        // Verificar se já existe um sidebar estático na página
        const sidebarEstatico = document.querySelector('.sidebar:not(#sidebar-container .sidebar)');
        
        // Se já existe um sidebar estático, não precisamos carregar dinamicamente
        if (sidebarEstatico) {
            console.log('Sidebar estático encontrado, não é necessário carregar dinamicamente');
            return;
        }
        
        // Verificar se existe o container para o sidebar dinâmico
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) {
            console.log('Container do sidebar não encontrado');
            return;
        }
        
        // Verificar se estamos rodando em ambiente local (file://)
        const isLocalFile = window.location.protocol === 'file:';
        
        if (isLocalFile) {
            // Em ambiente local, inserir o HTML do sidebar diretamente
            console.log('Ambiente local detectado, inserindo HTML do sidebar diretamente');
            
            // Inserir o conteúdo do sidebar diretamente no DOM
            sidebarContainer.innerHTML = `
<!-- Componente de Sidebar -->
<div class="sidebar">
    <ul class="nav flex-column">
        <!-- Itens de menu para todos os perfis -->
        <li class="nav-item">
            <a class="nav-link" href="dashboard.html">
                <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="ministerios.html">
                <i class="fas fa-users"></i> Ministérios
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="escalas.html">
                <i class="fas fa-calendar-alt"></i> Escalas
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="conteudos.html">
                <i class="fas fa-file-alt"></i> Conteúdos
            </a>
        </li>
        
        <!-- Itens de menu apenas para Pastor -->
        <li class="nav-item pastor-only">
            <a class="nav-link" href="usuarios.html">
                <i class="fas fa-user-cog"></i> Gestão de Usuários
            </a>
        </li>
        
        <!-- Separador -->
        <li class="nav-item">
            <hr class="dropdown-divider">
        </li>
        
        <!-- Abas públicas (acessíveis a todos) -->
        <li class="nav-item public-tab">
            <a class="nav-link" href="biblia.html">
                <i class="fas fa-bible"></i> Bíblia
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="apresentacao.html">
                <i class="fas fa-tv"></i> Apresentação
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="youtube.html">
                <i class="fab fa-youtube"></i> Canal da Igreja
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="aovivo.html">
                <i class="fas fa-broadcast-tower"></i> Ao Vivo
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="ordem-culto.html">
                <i class="fas fa-list-ol"></i> Ordem de Culto
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="plataformas.html">
                <i class="fas fa-music"></i> Plataformas
            </a>
        </li>
        <li class="nav-item public-tab">
            <a class="nav-link" href="upload.html">
                <i class="fas fa-cloud-upload-alt"></i> Upload
            </a>
        </li>
    </ul>
    
    <!-- Rodapé da sidebar para mobile -->
    <div class="sidebar-footer mt-auto p-3">
        <a href="perfil.html" class="btn btn-outline-light btn-sm w-100 mb-2">
            <i class="fas fa-user-circle me-2"></i> Meu Perfil
        </a>
        <button id="sidebar-logout-btn" class="btn btn-outline-danger btn-sm w-100">
            <i class="fas fa-sign-out-alt me-2"></i> Sair
        </button>
    </div>
</div>

<!-- Botão de toggle para sidebar mobile -->
<button class="sidebar-toggle" id="sidebar-toggle-btn">
    <i class="fas fa-bars"></i>
</button>`;

            // Inicializar comportamento da sidebar (handlers, toggle, permissões)
            initializeSidebarBehavior();
        } else {
            // Usar fetch para ambiente de servidor
            fetch('../components/sidebar.html')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar o sidebar');
                    }
                    return response.text();
                })
                .then(html => {
                    sidebarContainer.innerHTML = html;
                    // Garantir que as abas públicas estejam sempre visíveis e inicializar handlers
                    document.querySelectorAll('.public-tab').forEach(item => item.style.display = 'block');
                    initializeSidebarBehavior();
                })
                .catch(error => {
                    console.error('Erro ao carregar o sidebar:', error);
                    carregarSidebarFallback(sidebarContainer);
                });
        }
    }
    
    // Função para carregar sidebar de fallback em caso de erro
    function carregarSidebarFallback(container) {
        container.innerHTML = `
        <div class="sidebar">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link" href="dashboard.html">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="ministerios.html">
                        <i class="fas fa-users"></i> Ministérios
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="escalas.html">
                        <i class="fas fa-calendar-alt"></i> Escalas
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="conteudos.html">
                        <i class="fas fa-file-alt"></i> Conteúdos
                    </a>
                </li>
                <li class="nav-item">
                    <hr class="dropdown-divider">
                </li>
                <li class="nav-item public-tab">
                    <a class="nav-link" href="biblia.html">
                        <i class="fas fa-bible"></i> Bíblia
                    </a>
                </li>
                <li class="nav-item public-tab">
                    <a class="nav-link" href="youtube.html">
                        <i class="fab fa-youtube"></i> Canal da Igreja
                    </a>
                </li>
                <li class="nav-item public-tab">
                    <a class="nav-link" href="aovivo.html">
                        <i class="fas fa-broadcast-tower"></i> Ao Vivo
                    </a>
                </li>
            </ul>
        </div>`;
    }
    
    // Compatibilidade com ambas as chaves do localStorage
    function obterUsuarioLogado() {
        let usuario = localStorage.getItem('usuario_logado');
        if (!usuario) {
            usuario = localStorage.getItem('usuario-logado');
            // Se encontrou com hífen, migrar para o padrão com underscore
            if (usuario) {
                localStorage.setItem('usuario_logado', usuario);
                localStorage.removeItem('usuario-logado');
            }
        }
        return usuario ? JSON.parse(usuario) : null;
    }
    
    // Carregar o sidebar
    carregarSidebar();
    
    // Verificar login e atualizar interface
    const usuario = obterUsuarioLogado();
    if (usuario) {
        // Atualizar nome do usuário na navbar
        const nomeUsuarioElement = document.querySelector('.nome-usuario');
        if (nomeUsuarioElement) {
            nomeUsuarioElement.textContent = usuario.nome;
        }
    }
});
