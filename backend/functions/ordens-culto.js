/**
 * ordens-culto.js — CRUD de Ordens de Culto + Itens
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// Helper: mapear ordem de culto
function mapOrdem(o) {
    return {
        id: o.id,
        titulo: o.titulo,
        data: o.data,
        horaInicio: o.hora_inicio,
        horaFim: o.hora_fim,
        local: o.local_culto,
        dirigente: o.dirigente,
        itens: o.itens_ordem_culto
            ? o.itens_ordem_culto
                .sort((a, b) => a.ordem - b.ordem)
                .map(i => ({
                    id: i.id,
                    titulo: i.titulo,
                    tipo: i.tipo,
                    responsavel: i.responsavel,
                    duracao: i.duracao,
                    descricao: i.descricao,
                    ordem: i.ordem
                }))
            : []
    };
}

const TIPOS_ITEM = ['louvor', 'oracao', 'leitura', 'oferta', 'mensagem', 'comunhao', 'anuncios', 'bencao', 'outro'];

// Valida os itens antes de qualquer gravação
function validarItens(itens) {
    if (itens === undefined) return null;
    if (!Array.isArray(itens)) return 'itens deve ser uma lista';
    for (let i = 0; i < itens.length; i++) {
        const item = itens[i] || {};
        if (!item.titulo) return `Item ${i + 1}: título é obrigatório`;
        if (!TIPOS_ITEM.includes(item.tipo)) return `Item ${i + 1}: tipo deve ser um de: ${TIPOS_ITEM.join(', ')}`;
        if (item.duracao !== undefined && item.duracao !== null && !(parseInt(item.duracao) > 0)) {
            return `Item ${i + 1}: duração deve ser um número positivo`;
        }
    }
    return null;
}

// Envia à função apenas os campos presentes na requisição (atualização parcial)
function dadosCabecalho(body) {
    const dados = {};
    for (const campo of ['titulo', 'data', 'horaInicio', 'horaFim', 'local', 'dirigente']) {
        if (body[campo] !== undefined) dados[campo] = body[campo];
    }
    return dados;
}

function responderErroOrdem(res, error) {
    const msg = (error && error.message) || '';
    if (msg.includes('ORDEM_NAO_ENCONTRADA')) return res.status(404).json({ error: 'Ordem de culto não encontrada' });
    if (error && ['23502', '23514', '22007', '22008', '22P02'].includes(error.code)) {
        return res.status(400).json({ error: 'Dados da ordem de culto inválidos' });
    }
    console.error('Erro ao salvar ordem de culto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
}

async function carregarOrdem(supabase, id) {
    const { data, error } = await supabase
        .from('ordens_culto')
        .select('*, itens_ordem_culto(*)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return mapOrdem(data);
}

// GET /api/ordens-culto — listar todas
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ordens_culto')
            .select('*, itens_ordem_culto(*)')
            .order('data', { ascending: false, nullsFirst: false });

        if (error) throw error;
        res.json(data.map(mapOrdem));
    } catch (err) {
        console.error('Erro ao listar ordens de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/ordens-culto/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ordens_culto')
            .select('*, itens_ordem_culto(*)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Ordem de culto não encontrada' });

        res.json(mapOrdem(data));
    } catch (err) {
        console.error('Erro ao obter ordem de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/ordens-culto — criar (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { titulo, itens } = req.body;
        if (!titulo) {
            return res.status(400).json({ error: 'Título é obrigatório' });
        }
        const erroItens = validarItens(itens);
        if (erroItens) return res.status(400).json({ error: erroItens });

        // Cabeçalho e itens gravados em uma única transação (migração 005)
        const supabase = getClient();
        const { data: idOrdem, error } = await supabase.rpc('salvar_ordem_culto', {
            p_id: null,
            p_dados: dadosCabecalho(req.body),
            p_itens: itens || []
        });
        if (error) return responderErroOrdem(res, error);

        res.status(201).json(await carregarOrdem(supabase, idOrdem));
    } catch (err) {
        console.error('Erro ao criar ordem de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/ordens-culto/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const { itens } = req.body;
        const erroItens = validarItens(itens);
        if (erroItens) return res.status(400).json({ error: erroItens });

        // Se a nova lista de itens falhar, os itens anteriores são preservados
        const supabase = getClient();
        const { error } = await supabase.rpc('salvar_ordem_culto', {
            p_id: id,
            p_dados: dadosCabecalho(req.body),
            p_itens: itens === undefined ? null : itens
        });
        if (error) return responderErroOrdem(res, error);

        res.json(await carregarOrdem(supabase, id));
    } catch (err) {
        console.error('Erro ao atualizar ordem de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/ordens-culto/:id — excluir (Admin+)
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('ordens_culto').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Ordem de culto excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir ordem de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
