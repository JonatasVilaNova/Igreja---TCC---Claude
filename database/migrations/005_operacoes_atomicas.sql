-- ============================================================
-- 005_operacoes_atomicas.sql
-- Torna atômicas as operações que gravam em mais de uma tabela.
--
-- Problema corrigido: as rotas de escalas e de ordens de culto
-- apagavam os registros filhos (participantes / itens) e depois
-- reinseriam a nova lista em chamadas separadas. Se a reinserção
-- falhasse, os dados antigos já tinham sido apagados e a API ainda
-- respondia sucesso.
--
-- Uma função PL/pgSQL executa dentro de uma única transação:
-- se qualquer etapa falhar, TODAS as alterações são desfeitas.
-- Executar no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- Escala + participantes
--   p_id = NULL  -> cria a escala
--   p_id = id    -> atualiza; campos NULL são mantidos
--   p_membros = NULL -> não altera os participantes
-- Retorna o id da escala.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION salvar_escala(
    p_id            INT,
    p_id_ministerio INT,
    p_data          DATE,
    p_descricao     TEXT,
    p_membros       INT[]
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id         INT;
    v_ministerio INT;
    v_invalidos  INT;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO escalas (id_ministerio, data, descricao)
        VALUES (p_id_ministerio, p_data, p_descricao)
        RETURNING id, id_ministerio INTO v_id, v_ministerio;
    ELSE
        UPDATE escalas
           SET id_ministerio = COALESCE(p_id_ministerio, id_ministerio),
               data          = COALESCE(p_data, data),
               descricao     = COALESCE(p_descricao, descricao)
         WHERE id = p_id
        RETURNING id, id_ministerio INTO v_id, v_ministerio;

        IF v_id IS NULL THEN
            RAISE EXCEPTION 'ESCALA_NAO_ENCONTRADA';
        END IF;
    END IF;

    IF p_membros IS NOT NULL THEN
        -- Todos os vínculos precisam existir e pertencer ao ministério da escala
        SELECT COUNT(*) INTO v_invalidos
          FROM (SELECT DISTINCT unnest(p_membros) AS id_membro) m
          LEFT JOIN membros_ministerio mm
                 ON mm.id = m.id_membro AND mm.id_ministerio = v_ministerio
         WHERE mm.id IS NULL;

        IF v_invalidos > 0 THEN
            RAISE EXCEPTION 'MEMBRO_INVALIDO';
        END IF;

        DELETE FROM escalas_membros WHERE id_escala = v_id;

        INSERT INTO escalas_membros (id_escala, id_membro)
        SELECT v_id, m FROM (SELECT DISTINCT unnest(p_membros) AS m) s;
    END IF;

    RETURN v_id;
END;
$$;

-- ------------------------------------------------------------
-- Ordem de culto + itens
--   p_id = NULL -> cria a ordem (p_dados deve conter "titulo")
--   p_id = id   -> atualiza apenas as chaves presentes em p_dados
--   p_itens = NULL -> não altera os itens
-- p_dados: {"titulo","data","horaInicio","horaFim","local","dirigente"}
-- p_itens: [{"titulo","tipo","responsavel","duracao","descricao","ordem"}]
-- Retorna o id da ordem.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION salvar_ordem_culto(
    p_id    INT,
    p_dados JSONB,
    p_itens JSONB
) RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INT;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO ordens_culto (titulo, data, hora_inicio, hora_fim, local_culto, dirigente)
        VALUES (
            p_dados->>'titulo',
            NULLIF(p_dados->>'data', '')::DATE,
            NULLIF(p_dados->>'horaInicio', ''),
            NULLIF(p_dados->>'horaFim', ''),
            NULLIF(p_dados->>'local', ''),
            NULLIF(p_dados->>'dirigente', '')
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE ordens_culto SET
            titulo      = CASE WHEN p_dados ? 'titulo'     THEN p_dados->>'titulo' ELSE titulo END,
            data        = CASE WHEN p_dados ? 'data'       THEN NULLIF(p_dados->>'data', '')::DATE ELSE data END,
            hora_inicio = CASE WHEN p_dados ? 'horaInicio' THEN NULLIF(p_dados->>'horaInicio', '') ELSE hora_inicio END,
            hora_fim    = CASE WHEN p_dados ? 'horaFim'    THEN NULLIF(p_dados->>'horaFim', '') ELSE hora_fim END,
            local_culto = CASE WHEN p_dados ? 'local'      THEN NULLIF(p_dados->>'local', '') ELSE local_culto END,
            dirigente   = CASE WHEN p_dados ? 'dirigente'  THEN NULLIF(p_dados->>'dirigente', '') ELSE dirigente END
         WHERE id = p_id
        RETURNING id INTO v_id;

        IF v_id IS NULL THEN
            RAISE EXCEPTION 'ORDEM_NAO_ENCONTRADA';
        END IF;
    END IF;

    IF p_itens IS NOT NULL THEN
        DELETE FROM itens_ordem_culto WHERE id_ordem = v_id;

        INSERT INTO itens_ordem_culto (id_ordem, titulo, tipo, responsavel, duracao, descricao, ordem)
        SELECT v_id,
               i.item->>'titulo',
               i.item->>'tipo',
               NULLIF(i.item->>'responsavel', ''),
               COALESCE(NULLIF(i.item->>'duracao', '')::INT, 5),
               NULLIF(i.item->>'descricao', ''),
               COALESCE(NULLIF(i.item->>'ordem', '')::INT, i.pos::INT)
          FROM jsonb_array_elements(p_itens) WITH ORDINALITY AS i(item, pos);
        -- Se algum item violar uma restrição (tipo inválido, título nulo...),
        -- a exceção desfaz também o DELETE acima.
    END IF;

    RETURN v_id;
END;
$$;

-- Atualiza o cache da API do Supabase para reconhecer as novas funções
NOTIFY pgrst, 'reload schema';
