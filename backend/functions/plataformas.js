/**
 * plataformas.js — CRUD de Plataformas de Música
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// GET /api/plataformas — listar todas
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('plataformas')
            .select('*')
            .order('nome');

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro ao listar plataformas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/plataformas/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('plataformas')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Plataforma não encontrada' });

        res.json(data);
    } catch (err) {
        console.error('Erro ao obter plataforma:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/plataformas — criar (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { nome, url, icone, cor, descricao, ativo } = req.body;
        if (!nome || !url) {
            return res.status(400).json({ error: 'Nome e URL são obrigatórios' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('plataformas')
            .insert({
                nome, url,
                icone: icone || 'fa-music',
                cor: cor || '#0d6efd',
                descricao: descricao || null,
                ativo: ativo !== undefined ? ativo : true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Erro ao criar plataforma:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/plataformas/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { nome, url, icone, cor, descricao, ativo } = req.body;
        const updateData = {};
        if (nome !== undefined) updateData.nome = nome;
        if (url !== undefined) updateData.url = url;
        if (icone !== undefined) updateData.icone = icone;
        if (cor !== undefined) updateData.cor = cor;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (ativo !== undefined) updateData.ativo = ativo;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('plataformas')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('Erro ao atualizar plataforma:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/plataformas/:id — excluir (Admin+)
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('plataformas').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Plataforma excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir plataforma:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
