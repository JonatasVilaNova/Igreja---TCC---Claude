-- ============================================================
-- Migration 003 — Investimentos da Tesouraria
-- Idempotente: seguro rodar mais de uma vez em um banco já existente.
-- Aportes saem do saldo principal (lançamento tipo 'saida') e resgates
-- voltam pro saldo principal (lançamento tipo 'entrada') — o saldo do
-- investimento é derivado da soma dos próprios movimentos, nunca
-- armazenado em cache, então nunca fica dessincronizado.
-- ============================================================

CREATE TABLE IF NOT EXISTS investimentos (
    id          SERIAL PRIMARY KEY,
    nome        TEXT NOT NULL,
    tipo        TEXT NOT NULL DEFAULT 'outro' CHECK (tipo IN ('poupanca', 'cdb', 'fundo', 'tesouro_direto', 'outro')),
    instituicao TEXT,
    observacoes TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lancamentos_financeiros
    ADD COLUMN IF NOT EXISTS id_investimento INT REFERENCES investimentos(id) ON DELETE SET NULL;

ALTER TABLE lancamentos_financeiros
    ADD COLUMN IF NOT EXISTS movimento_investimento TEXT CHECK (movimento_investimento IN ('aporte', 'resgate'));

CREATE INDEX IF NOT EXISTS idx_lancamentos_investimento ON lancamentos_financeiros(id_investimento);
