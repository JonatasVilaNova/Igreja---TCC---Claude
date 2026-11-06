/**
 * escalas.js — CRUD de Escalas + Escalas-Membros + Conteúdos de Escala
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// Helper: mapear escala
function mapEscala(e) {
    return {
        id: e.id,
        idMinisterio: e.id_ministerio,
        data: e.data,
        descricao: e.descricao,
        membros: e.escalas_membros ? e.escalas_membros.map(em => em.id_membro) : [],
        created_at: e.created_at
    };
}

// Valida a lista de participantes: undefined = não informada; false = inválida.
// Remove repetições, que antes faziam a escala perder todos os participantes.
function normalizarMembros(membros) {
    if (membros === undefined || membros === null) return undefined;
    if (!Array.isArray(membros)) return false;
    const ids = membros.map(m => parseInt(m));
    if (ids.some(isNaN)) return false;
    return [...new Set(ids)];
}

// Converte os erros levantados pela função salvar_escala em respostas claras
function responderErroEscala(res, error) {
    const msg = (error && error.message) || '';
    if (msg.includes('ESCALA_NAO_ENCONTRADA')) return res.status(404).json({ error: 'Escala não encontrada' });
    if (msg.includes('MEMBRO_INVALIDO')) {
        return res.status(400).json({ error: 'Há participantes inexistentes ou de outro ministério' });
    }
    if (error && (error.code === '23503' || error.code === '22007' || error.code === '22008')) {
        return res.status(400).json({ error: 'Ministério ou data inválidos' });
    }
    console.error('Erro ao salvar escala:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
}

async function carregarEscala(supabase, id) {
    const { data, error } = await supabase
        .from('escalas')
        .select('*, escalas_membros(id_membro)')
        .eq('id', id)
        .single();
    if (error) throw error;
    return mapEscala(data);
}

// ════════════════════════════════════════════
// ESCALAS
// ════════════════════════════════════════════

// GET /api/escalas — listar todas
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('escalas')
            .select('*, escalas_membros(id_membro)')
            .order('data', { ascending: false });

        if (error) throw error;
        res.json(data.map(mapEscala));
    } catch (err) {
        console.error('Erro ao listar escalas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/escalas/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const supabase = getClient();
        const { data, error } = await supabase
            .from('escalas')
            .select('*, escalas_membros(id_membro)')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Escala não encontrada' });

        res.json(mapEscala(data));
    } catch (err) {
        console.error('Erro ao obter escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/escalas/usuario/:idUsuario — escalas de um usuário
router.get('/usuario/:idUsuario', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();

        // Buscar IDs dos membros_ministerio desse usuário
        const { data: membros, error: errMembros } = await supabase
            .from('membros_ministerio')
            .select('id')
            .eq('id_usuario', req.params.idUsuario);

        if (errMembros) throw errMembros;
        if (!membros || membros.length === 0) return res.json([]);

        const membroIds = membros.map(m => m.id);

        // Buscar escalas que contêm esses membros
        const { data: relacoes, error: errRelacoes } = await supabase
            .from('escalas_membros')
            .select('id_escala')
            .in('id_membro', membroIds);

        if (errRelacoes) throw errRelacoes;
        if (!relacoes || relacoes.length === 0) return res.json([]);

        const escalaIds = [...new Set(relacoes.map(r => r.id_escala))];

        const { data: escalas, error: errEscalas } = await supabase
            .from('escalas')
            .select('*, escalas_membros(id_membro)')
            .in('id', escalaIds)
            .order('data', { ascending: false });

        if (errEscalas) throw errEscalas;
        res.json(escalas.map(mapEscala));
    } catch (err) {
        console.error('Erro ao listar escalas do usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/escalas — criar (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { idMinisterio, data, descricao, membros } = req.body;
        if (!idMinisterio || !data || !descricao) {
            return res.status(400).json({ error: 'idMinisterio, data e descricao são obrigatórios' });
        }
        const lista = normalizarMembros(membros);
        if (lista === false) {
            return res.status(400).json({ error: 'membros deve ser uma lista de identificadores numéricos' });
        }

        // Escala e participantes gravados em uma única transação (migração 005)
        const supabase = getClient();
        const { data: idEscala, error } = await supabase.rpc('salvar_escala', {
            p_id: null,
            p_id_ministerio: parseInt(idMinisterio),
            p_data: data,
            p_descricao: descricao,
            p_membros: lista || []
        });
        if (error) return responderErroEscala(res, error);

        res.status(201).json(await carregarEscala(supabase, idEscala));
    } catch (err) {
        console.error('Erro ao criar escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/escalas/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const { idMinisterio, data, descricao, membros } = req.body;
        const lista = normalizarMembros(membros);
        if (lista === false) {
            return res.status(400).json({ error: 'membros deve ser uma lista de identificadores numéricos' });
        }

        // Atualização e substituição dos participantes na mesma transação:
        // se a nova lista falhar, os participantes anteriores são preservados.
        const supabase = getClient();
        const { error } = await supabase.rpc('salvar_escala', {
            p_id: id,
            p_id_ministerio: idMinisterio ? parseInt(idMinisterio) : null,
            p_data: data || null,
            p_descricao: descricao || null,
            p_membros: lista === undefined ? null : lista
        });
        if (error) return responderErroEscala(res, error);

        res.json(await carregarEscala(supabase, id));
    } catch (err) {
        console.error('Erro ao atualizar escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/escalas/:id — excluir (Admin+)
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('escalas').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Escala excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ════════════════════════════════════════════
// CONTEÚDOS DE ESCALA
// ════════════════════════════════════════════

// GET /api/escalas/conteudos/:idEscala
router.get('/conteudos/:idEscala', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos_escala')
            .select('*')
            .eq('id_escala', req.params.idEscala)
            .order('created_at');

        if (error) throw error;
        res.json(data.map(c => ({
            id: c.id,
            idEscala: c.id_escala,
            tipo: c.tipo,
            titulo: c.titulo,
            detalhes: c.detalhes,
            link: c.link
        })));
    } catch (err) {
        console.error('Erro ao listar conteúdos da escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/escalas/conteudos/:idEscala
router.post('/conteudos/:idEscala', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { tipo, titulo, detalhes, link } = req.body;
        if (!tipo || !titulo) {
            return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos_escala')
            .insert({
                id_escala: parseInt(req.params.idEscala),
                tipo, titulo,
                detalhes: detalhes || null,
                link: link || null
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({
            id: data.id,
            idEscala: data.id_escala,
            tipo: data.tipo,
            titulo: data.titulo,
            detalhes: data.detalhes,
            link: data.link
        });
    } catch (err) {
        console.error('Erro ao criar conteúdo da escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/escalas/conteudos/:idEscala/:id
router.put('/conteudos/:idEscala/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { tipo, titulo, detalhes, link } = req.body;
        const updateData = {};
        if (tipo) updateData.tipo = tipo;
        if (titulo) updateData.titulo = titulo;
        if (detalhes !== undefined) updateData.detalhes = detalhes;
        if (link !== undefined) updateData.link = link;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos_escala')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({
            id: data.id,
            idEscala: data.id_escala,
            tipo: data.tipo,
            titulo: data.titulo,
            detalhes: data.detalhes,
            link: data.link
        });
    } catch (err) {
        console.error('Erro ao atualizar conteúdo da escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/escalas/conteudos/:idEscala/:id
router.delete('/conteudos/:idEscala/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('conteudos_escala').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Conteúdo excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir conteúdo da escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
