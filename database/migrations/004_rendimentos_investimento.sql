-- ============================================================
-- Migration 004 — Rendimentos de Investimento
-- Idempotente: seguro rodar mais de uma vez em um banco já existente.
-- Rendimento (juros/valorização) soma no saldo do investimento mas
-- NUNCA vira lançamento em lancamentos_financeiros — o dinheiro não
-- saiu nem voltou para o saldo principal, só rendeu dentro da própria
-- aplicação.
-- ============================================================

CREATE TABLE IF NOT EXISTS investimentos_rendimentos (
    id              SERIAL PRIMARY KEY,
    id_investimento INT NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
    valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    data            DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes     TEXT,
    id_usuario      INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investimentos_rendimentos_investimento ON investimentos_rendimentos(id_investimento);
