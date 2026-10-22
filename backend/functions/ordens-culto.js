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
        const { titulo, data, horaInicio, horaFim, local, dirigente, itens } = req.body;
        if (!titulo) {
            return res.status(400).json({ error: 'Título é obrigatório' });
        }

        const supabase = getClient();
        const { data: ordem, error: errOrdem } = await supabase
            .from('ordens_culto')
            .insert({
                titulo,
                data: data || null,
                hora_inicio: horaInicio || null,
                hora_fim: horaFim || null,
                local_culto: local || null,
                dirigente: dirigente || null
            })
            .select()
            .single();

        if (errOrdem) throw errOrdem;

        // Inserir itens
        if (itens && itens.length > 0) {
            const itensInsert = itens.map((item, index) => ({
                id_ordem: ordem.id,
                titulo: item.titulo,
                tipo: item.tipo,
                responsavel: item.responsavel || null,
                duracao: item.duracao || 5,
                descricao: item.descricao || null,
                ordem: item.ordem !== undefined ? item.ordem : index + 1
            }));
            await supabase.from('itens_ordem_culto').insert(itensInsert);
        }

        // Recarregar com itens
        const { data: ordemFinal } = await supabase
            .from('ordens_culto')
            .select('*, itens_ordem_culto(*)')
            .eq('id', ordem.id)
            .single();

        res.status(201).json(mapOrdem(ordemFinal));
    } catch (err) {
        console.error('Erro ao criar ordem de culto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/ordens-culto/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { titulo, data, horaInicio, horaFim, local, dirigente, itens } = req.body;
        const updateData = {};
        if (titulo !== undefined) updateData.titulo = titulo;
        if (data !== undefined) updateData.data = data;
        if (horaInicio !== undefined) updateData.hora_inicio = horaInicio;
        if (horaFim !== undefined) updateData.hora_fim = horaFim;
        if (local !== undefined) updateData.local_culto = local;
        if (dirigente !== undefined) updateData.dirigente = dirigente;

        const supabase = getClient();

        if (Object.keys(updateData).length > 0) {
            const { error } = await supabase
                .from('ordens_culto')
                .update(updateData)
                .eq('id', req.params.id);
            if (error) throw error;
        }

        // Atualizar itens: remover todos e reinserir
        if (itens !== undefined) {
            await supabase.from('itens_ordem_culto').delete().eq('id_ordem', req.params.id);
            if (itens.length > 0) {
                const itensInsert = itens.map((item, index) => ({
                    id_ordem: parseInt(req.params.id),
                    titulo: item.titulo,
                    tipo: item.tipo,
                    responsavel: item.responsavel || null,
                    duracao: item.duracao || 5,
                    descricao: item.descricao || null,
                    ordem: item.ordem !== undefined ? item.ordem : index + 1
                }));
                await supabase.from('itens_ordem_culto').insert(itensInsert);
            }
        }

        // Recarregar
        const { data: ordemFinal } = await supabase
            .from('ordens_culto')
            .select('*, itens_ordem_culto(*)')
            .eq('id', req.params.id)
            .single();

        res.json(mapOrdem(ordemFinal));
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
