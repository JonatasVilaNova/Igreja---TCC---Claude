-- ============================================================
-- Schema PostgreSQL (Supabase) — Sistema de Gestão de Igrejas
-- ============================================================

-- Tabela de Usuários
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    senha       TEXT NOT NULL,
    tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('pastor', 'admin', 'padrao')),
    -- Flag de acesso ao módulo de Tesouraria. NÃO é editável por nenhuma tela do
    -- sistema — só pode ser ativada/desativada com um UPDATE direto no banco.
    -- Ex.: UPDATE usuarios SET acesso_tesouraria = true WHERE email = 'tesoureiro@igreja.com';
    acesso_tesouraria BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Ministérios
CREATE TABLE ministerios (
    id        SERIAL PRIMARY KEY,
    nome      TEXT NOT NULL,
    descricao TEXT NOT NULL,
    id_lider  INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Membros de Ministérios
CREATE TABLE membros_ministerio (
    id             SERIAL PRIMARY KEY,
    id_usuario     INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_ministerio  INT NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
    funcao         TEXT NOT NULL,
    instrumento    TEXT,
    UNIQUE (id_usuario, id_ministerio)
);

-- Tabela de Escalas
CREATE TABLE escalas (
    id             SERIAL PRIMARY KEY,
    id_ministerio  INT NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
    data           DATE NOT NULL,
    descricao      TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Relação N:N — Escalas ↔ Membros
CREATE TABLE escalas_membros (
    id         SERIAL PRIMARY KEY,
    id_escala  INT NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
    id_membro  INT NOT NULL REFERENCES membros_ministerio(id) ON DELETE CASCADE,
    UNIQUE (id_escala, id_membro)
);

-- Tabela de Conteúdos (biblioteca central por ministério)
CREATE TABLE conteudos (
    id              SERIAL PRIMARY KEY,
    id_ministerio   INT NOT NULL REFERENCES ministerios(id) ON DELETE CASCADE,
    titulo          TEXT NOT NULL,
    link_arquivo    TEXT NOT NULL,
    data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Conteúdos de Escala (músicas, arquivos, links vinculados a uma escala)
CREATE TABLE conteudos_escala (
    id         SERIAL PRIMARY KEY,
    id_escala  INT NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
    tipo       TEXT NOT NULL CHECK (tipo IN ('musica', 'arquivo', 'link', 'texto')),
    titulo     TEXT NOT NULL,
    detalhes   TEXT,
    link       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Plataformas de Música
CREATE TABLE plataformas (
    id        SERIAL PRIMARY KEY,
    nome      TEXT NOT NULL,
    url       TEXT NOT NULL,
    icone     TEXT NOT NULL DEFAULT 'fa-music',
    cor       TEXT NOT NULL DEFAULT '#0d6efd',
    descricao TEXT,
    ativo     BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Ordens de Culto
CREATE TABLE ordens_culto (
    id           SERIAL PRIMARY KEY,
    titulo       TEXT NOT NULL,
    data         DATE,
    hora_inicio  TEXT,
    hora_fim     TEXT,
    local_culto  TEXT,
    dirigente    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Itens da Ordem de Culto
CREATE TABLE itens_ordem_culto (
    id          SERIAL PRIMARY KEY,
    id_ordem    INT NOT NULL REFERENCES ordens_culto(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    tipo        TEXT NOT NULL CHECK (tipo IN ('louvor','oracao','leitura','oferta','mensagem','comunhao','anuncios','bencao','outro')),
    responsavel TEXT,
    duracao     INT NOT NULL DEFAULT 5,
    descricao   TEXT,
    ordem       INT NOT NULL DEFAULT 0
);

-- Tabela de Códigos de Convite
CREATE TABLE codigos_convite (
    id              SERIAL PRIMARY KEY,
    codigo          TEXT NOT NULL UNIQUE,
    perfil          TEXT NOT NULL CHECK (perfil IN ('admin', 'padrao')) DEFAULT 'padrao',
    usado           BOOLEAN NOT NULL DEFAULT false,
    usos_maximo     INT NOT NULL DEFAULT 1,
    usos_realizados INT NOT NULL DEFAULT 0,
    data_expiracao  DATE,
    id_criador      INT REFERENCES usuarios(id) ON DELETE SET NULL,
    usado_por       INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Categorias Financeiras (Tesouraria)
CREATE TABLE categorias_financeiras (
    id         SERIAL PRIMARY KEY,
    nome       TEXT NOT NULL,
    tipo       TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    cor        TEXT NOT NULL DEFAULT '#1b5e3f',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Lançamentos Financeiros (Tesouraria)
-- Todos os lançamentos são manuais (sem integração bancária / Open Finance).
CREATE TABLE lancamentos_financeiros (
    id              SERIAL PRIMARY KEY,
    tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    id_categoria    INT REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
    descricao       TEXT NOT NULL,
    valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data            DATE NOT NULL DEFAULT CURRENT_DATE,
    forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'transferencia', 'boleto', 'outro')),
    observacoes     TEXT,
    id_usuario      INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Estudos e Pregações
-- Escritos na intranet (Pastor e Admin/Líder) e exibidos publicamente no site
-- institucional (ibnc-website) via rota pública /api/estudos/public quando publicado = true.
CREATE TABLE estudos (
    id              SERIAL PRIMARY KEY,
    titulo          TEXT NOT NULL,
    tipo            TEXT NOT NULL CHECK (tipo IN ('estudo', 'pregacao')) DEFAULT 'estudo',
    tema            TEXT,
    texto_base      TEXT,
    resumo          TEXT,
    conteudo_html   TEXT NOT NULL DEFAULT '',
    id_autor        INT REFERENCES usuarios(id) ON DELETE SET NULL,
    autor_nome      TEXT,
    publicado       BOOLEAN NOT NULL DEFAULT false,
    data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_ministerios_id_lider         ON ministerios(id_lider);
CREATE INDEX idx_membros_min_id_usuario       ON membros_ministerio(id_usuario);
CREATE INDEX idx_membros_min_id_ministerio    ON membros_ministerio(id_ministerio);
CREATE INDEX idx_escalas_id_ministerio        ON escalas(id_ministerio);
CREATE INDEX idx_escalas_data                 ON escalas(data);
CREATE INDEX idx_escalas_membros_id_escala    ON escalas_membros(id_escala);
CREATE INDEX idx_escalas_membros_id_membro    ON escalas_membros(id_membro);
CREATE INDEX idx_conteudos_id_ministerio      ON conteudos(id_ministerio);
CREATE INDEX idx_conteudos_data_pub           ON conteudos(data_publicacao);
CREATE INDEX idx_conteudos_escala_id_escala   ON conteudos_escala(id_escala);
CREATE INDEX idx_itens_ordem_id_ordem         ON itens_ordem_culto(id_ordem);
CREATE INDEX idx_itens_ordem_ordem            ON itens_ordem_culto(ordem);
CREATE INDEX idx_codigos_convite_codigo       ON codigos_convite(codigo);
CREATE INDEX idx_lancamentos_data             ON lancamentos_financeiros(data);
CREATE INDEX idx_lancamentos_tipo             ON lancamentos_financeiros(tipo);
CREATE INDEX idx_lancamentos_categoria        ON lancamentos_financeiros(id_categoria);
CREATE INDEX idx_categorias_financeiras_tipo  ON categorias_financeiras(tipo);
CREATE INDEX idx_estudos_publicado            ON estudos(publicado, data_publicacao);
CREATE INDEX idx_estudos_tipo                 ON estudos(tipo);
