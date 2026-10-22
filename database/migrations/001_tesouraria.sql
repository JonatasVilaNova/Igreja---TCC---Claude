-- ============================================================
-- Migration 001 — Módulo de Tesouraria
-- Idempotente: seguro rodar mais de uma vez em um banco já existente.
-- Execute no SQL Editor do Supabase (ou via psql) do projeto
-- "intranet-ib-nova-cintra".
-- ============================================================

-- Flag de acesso à Tesouraria. Default false para todo mundo — inclusive
-- pastores. Só é ativada manualmente, direto no banco (ver comando no fim).
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS acesso_tesouraria BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id         SERIAL PRIMARY KEY,
    nome       TEXT NOT NULL,
    tipo       TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    cor        TEXT NOT NULL DEFAULT '#1b5e3f',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
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

CREATE INDEX IF NOT EXISTS idx_lancamentos_data            ON lancamentos_financeiros(data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo            ON lancamentos_financeiros(tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria       ON lancamentos_financeiros(id_categoria);
CREATE INDEX IF NOT EXISTS idx_categorias_financeiras_tipo ON categorias_financeiras(tipo);

-- Categorias padrão (só insere se a tabela estiver vazia)
INSERT INTO categorias_financeiras (nome, tipo, cor)
SELECT * FROM (VALUES
    ('Dízimo',                 'entrada', '#1b5e3f'),
    ('Oferta',                 'entrada', '#27ae60'),
    ('Doação',                 'entrada', '#2ecc71'),
    ('Evento/Campanha',        'entrada', '#16a085'),
    ('Outras Entradas',        'entrada', '#6c757d'),
    ('Contas (água/luz/internet)', 'saida', '#c0392b'),
    ('Manutenção e Reformas',  'saida',   '#e74c3c'),
    ('Materiais e Suprimentos','saida',   '#d35400'),
    ('Missões',                'saida',   '#8e44ad'),
    ('Ajuda de Custo/Salários','saida',   '#2980b9'),
    ('Outras Saídas',          'saida',   '#6c757d')
) AS v(nome, tipo, cor)
WHERE NOT EXISTS (SELECT 1 FROM categorias_financeiras);

-- ────────────────────────────────────────────────────────────
-- Para autorizar um tesoureiro, rode (ajustando o e-mail):
--   UPDATE usuarios SET acesso_tesouraria = true WHERE email = 'tesoureiro@igreja.com';
-- Para revogar:
--   UPDATE usuarios SET acesso_tesouraria = false WHERE email = 'tesoureiro@igreja.com';
-- ────────────────────────────────────────────────────────────
