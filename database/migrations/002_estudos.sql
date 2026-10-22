-- ============================================================
-- Migration 002 — Estudos e Pregações
-- Idempotente: seguro rodar mais de uma vez em um banco já existente.
-- Execute no SQL Editor do Supabase (ou via psql) do projeto
-- "intranet-ib-nova-cintra".
-- ============================================================

CREATE TABLE IF NOT EXISTS estudos (
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

CREATE INDEX IF NOT EXISTS idx_estudos_publicado ON estudos(publicado, data_publicacao);
CREATE INDEX IF NOT EXISTS idx_estudos_tipo      ON estudos(tipo);
