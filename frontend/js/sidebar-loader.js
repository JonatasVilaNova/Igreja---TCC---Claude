/**
 * sidebar-loader.js
 * Fonte ÚNICA do sidebar — funciona com file:// e http:// sem fetch.
 */
(function () {
    'use strict';

    // ───────────────────────────────────────────────
    //  Template HTML do Sidebar (fonte única de verdade)
    // ───────────────────────────────────────────────
    var SIDEBAR_HTML = [
        '<div class="sidebar">',
        '  <ul class="nav flex-column">',
        '    <li class="nav-item">',
        '      <a class="nav-link" href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a>',
        '    </li>',
        '    <li class="nav-item">',
        '      <a class="nav-link" href="ministerios.html"><i class="fas fa-users"></i> Ministérios</a>',
        '    </li>',
        '    <li class="nav-item">',
        '      <a class="nav-link" href="escalas.html"><i class="fas fa-calendar-alt"></i> Escalas</a>',
        '    </li>',
        '    <li class="nav-item">',
        '      <a class="nav-link" href="conteudos.html"><i class="fas fa-file-alt"></i> Conteúdos</a>',
        '    </li>',
        '    <li class="nav-item admin-only" style="display:none">',
        '      <a class="nav-link" href="estudos.html"><i class="fas fa-book-bible"></i> Estudos e Pregações</a>',
        '    </li>',
        '',
        '    <!-- Apenas usuários com a flag acesso_tesouraria habilitada no banco -->',
        '    <li class="nav-item tesouraria-only" style="display:none">',
        '      <a class="nav-link" href="tesouraria.html"><i class="fas fa-hand-holding-dollar"></i> Tesouraria</a>',
        '    </li>',
        '',
        '    <!-- Apenas Pastor -->',
        '    <li class="nav-item pastor-only">',
        '      <a class="nav-link" href="usuarios.html"><i class="fas fa-user-cog"></i> Gestão de Usuários</a>',
        '    </li>',
        '',
        '    <li class="nav-item"><hr class="dropdown-divider"></li>',
        '',
        '    <!-- Abas públicas -->',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="biblia.html"><i class="fas fa-bible"></i> Bíblia</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="apresentacao.html"><i class="fas fa-tv"></i> Apresentação</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="youtube.html"><i class="fab fa-youtube"></i> Canal da Igreja</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="aovivo.html"><i class="fas fa-broadcast-tower"></i> Ao Vivo</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="ordem-culto.html"><i class="fas fa-list-ol"></i> Ordem de Culto</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="plataformas.html"><i class="fas fa-music"></i> Plataformas</a>',
        '    </li>',
        '    <li class="nav-item public-tab">',
        '      <a class="nav-link" href="upload.html"><i class="fas fa-cloud-upload-alt"></i> Upload</a>',
        '    </li>',
        '  </ul>',
        '',
        '  <div class="sidebar-footer mt-auto p-3">',
        '    <a href="perfil.html" class="btn btn-outline-light btn-sm w-100 mb-2">',
        '      <i class="fas fa-user-circle me-2"></i> Meu Perfil',
        '    </a>',
        '    <button id="sidebar-logout-btn" class="btn btn-outline-danger btn-sm w-100">',
        '      <i class="fas fa-sign-out-alt me-2"></i> Sair',
        '    </button>',
        '  </div>',
        '</div>',
        '',
        '<div class="sidebar-overlay" id="sidebar-overlay"></div>',
        '',
        '<button class="sidebar-toggle" id="sidebar-toggle-btn">',
        '  <i class="fas fa-bars"></i>',
        '</button>'
    ].join('\n');

    // ───────────────────────────────────────────────
    //  Obter usuário do localStorage (compatibilidade)
    // ───────────────────────────────────────────────
    function obterUsuario() {
        var raw = localStorage.getItem('usuario')
            || localStorage.getItem('usuario_logado')
            || localStorage.getItem('usuario-logado');
        if (!raw) return null;
        try {
            var u = JSON.parse(raw);
            if (!u.tipoPerfil && u.perfil) u.tipoPerfil = u.perfil;
            if (!u.perfil && u.tipoPerfil) u.perfil = u.tipoPerfil;
            return u;
        } catch (e) {
            return null;
        }
    }

    // ───────────────────────────────────────────────
    //  Aplicar permissões de perfil
    // ───────────────────────────────────────────────
    function aplicarPermissoes(usuario) {
        if (!usuario) return;

        var isPastor = usuario.tipoPerfil === 'pastor';
        var isAdmin = usuario.tipoPerfil === 'admin' || usuario.tipoPerfil === 'lider';

        document.querySelectorAll('.pastor-admin-only').forEach(function (el) {
            el.style.display = (isPastor || isAdmin) ? 'block' : 'none';
        });
        document.querySelectorAll('.admin-only').forEach(function (el) {
            el.style.display = (isPastor || isAdmin) ? 'block' : 'none';
        });
        document.querySelectorAll('.pastor-only').forEach(function (el) {
            el.style.display = isPastor ? 'block' : 'none';
        });
        document.querySelectorAll('.public-tab').forEach(function (el) {
            el.style.display = 'block';
        });
        // Tesouraria: visibilidade só decidida pela flag acesso_tesouraria vinda do
        // banco (login/me) — independe do tipoPerfil, mesmo para o Pastor.
        document.querySelectorAll('.tesouraria-only').forEach(function (el) {
            el.style.display = usuario.acessoTesouraria === true ? 'block' : 'none';
        });
    }

    // ───────────────────────────────────────────────
    //  Marcar link ativo
    // ───────────────────────────────────────────────
    function marcarLinkAtivo() {
        var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.sidebar .nav-link').forEach(function (link) {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // ───────────────────────────────────────────────
    //  Configurar toggle mobile + fechar ao clicar fora
    // ───────────────────────────────────────────────
    function configurarToggleMobile() {
        var toggleBtn = document.getElementById('sidebar-toggle-btn');
        var sidebar = document.querySelector('.sidebar');
        var overlay = document.getElementById('sidebar-overlay');
        if (!toggleBtn || !sidebar) return;

        function abrirSidebar() {
            sidebar.classList.add('show');
            if (overlay) overlay.classList.add('show');
        }
        function fecharSidebar() {
            sidebar.classList.remove('show');
            if (overlay) overlay.classList.remove('show');
        }

        toggleBtn.addEventListener('click', function () {
            if (sidebar.classList.contains('show')) {
                fecharSidebar();
            } else {
                abrirSidebar();
            }
        });

        // Fechar sidebar ao clicar em um link (mobile)
        document.querySelectorAll('.sidebar .nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    fecharSidebar();
                }
            });
        });

        // Fechar sidebar ao clicar no overlay
        if (overlay) {
            overlay.addEventListener('click', function () {
                fecharSidebar();
            });
        }

        // Fechar sidebar ao clicar fora (mobile)
        document.addEventListener('click', function (event) {
            if (window.innerWidth <= 768
                && !sidebar.contains(event.target)
                && event.target !== toggleBtn
                && !toggleBtn.contains(event.target)
                && event.target !== overlay) {
                fecharSidebar();
            }
        });
    }

    // ───────────────────────────────────────────────
    //  Configurar logout no sidebar
    // ───────────────────────────────────────────────
    function configurarLogout() {
        var btn = document.getElementById('sidebar-logout-btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            localStorage.removeItem('usuario');
            localStorage.removeItem('usuario_logado');
            localStorage.removeItem('usuario-logado');
            window.location.href = 'login.html';
        });
    }

    // ───────────────────────────────────────────────
    //  Inicialização principal
    // ───────────────────────────────────────────────
    function init() {
        // Se já existe um sidebar estático, não injetar
        if (document.querySelector('.sidebar:not(#sidebar-container .sidebar)')) return;

        var container = document.getElementById('sidebar-container');
        if (!container) return;

        // Injetar HTML — funciona com file:// e http://
        container.innerHTML = SIDEBAR_HTML;

        var usuario = obterUsuario();
        aplicarPermissoes(usuario);
        marcarLinkAtivo();
        configurarToggleMobile();
        configurarLogout();

        // Atualizar nome do usuário na navbar (se presente)
        if (usuario) {
            document.querySelectorAll('.nome-usuario').forEach(function (el) {
                el.textContent = usuario.nome;
            });
        }
    }

    // Executar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
