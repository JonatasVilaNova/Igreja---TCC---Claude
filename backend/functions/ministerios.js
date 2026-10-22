/**
 * ministerios.js — CRUD de Ministérios
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// GET /api/ministerios — listar todos
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ministerios')
            .select('*, lider:usuarios!ministerios_id_lider_fkey(id, nome, email)')
            .order('nome');

        if (error) throw error;

        const result = data.map(m => ({
            id: m.id,
            nome: m.nome,
            descricao: m.descricao,
            idLider: m.id_lider,
            lider: m.lider ? m.lider.nome : null,
            created_at: m.created_at
        }));

        res.json(result);
    } catch (err) {
        console.error('Erro ao listar ministérios:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/ministerios/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('ministerios')
            .select('*, lider:usuarios!ministerios_id_lider_fkey(id, nome, email)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Ministério não encontrado' });

        res.json({
            id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            idLider: data.id_lider,
            lider: data.lider ? data.lider.nome : null
        });
    } catch (err) {
        console.error('Erro ao obter ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/ministerios — criar (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { nome, descricao, idLider } = req.body;
        if (!nome || !descricao) {
            return res.status(400).json({ error: 'Nome e descrição são obrigatórios' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('ministerios')
            .insert({ nome, descricao, id_lider: idLider || null })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({
            id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            idLider: data.id_lider
        });
    } catch (err) {
        console.error('Erro ao criar ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/ministerios/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { nome, descricao, idLider } = req.body;
        const updateData = {};
        if (nome) updateData.nome = nome;
        if (descricao) updateData.descricao = descricao;
        if (idLider !== undefined) updateData.id_lider = idLider;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('ministerios')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json({
            id: data.id,
            nome: data.nome,
            descricao: data.descricao,
            idLider: data.id_lider
        });
    } catch (err) {
        console.error('Erro ao atualizar ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/ministerios/:id — excluir (Pastor)
router.delete('/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('ministerios').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Ministério excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
