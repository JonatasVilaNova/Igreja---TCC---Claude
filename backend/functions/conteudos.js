/**
 * conteudos.js — CRUD de Conteúdos (biblioteca central)
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// Helper
function mapConteudo(c) {
    return {
        id: c.id,
        idMinisterio: c.id_ministerio,
        titulo: c.titulo,
        linkArquivo: c.link_arquivo,
        dataPublicacao: c.data_publicacao,
        nomeMinisterio: c.ministerios ? c.ministerios.nome : undefined,
        created_at: c.created_at
    };
}

// GET /api/conteudos — listar todos
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos')
            .select('*, ministerios(nome)')
            .order('data_publicacao', { ascending: false });

        if (error) throw error;
        res.json(data.map(mapConteudo));
    } catch (err) {
        console.error('Erro ao listar conteúdos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/conteudos/ministerio/:idMinisterio
router.get('/ministerio/:idMinisterio', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos')
            .select('*, ministerios(nome)')
            .eq('id_ministerio', req.params.idMinisterio)
            .order('data_publicacao', { ascending: false });

        if (error) throw error;
        res.json(data.map(mapConteudo));
    } catch (err) {
        console.error('Erro ao listar conteúdos do ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/conteudos/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos')
            .select('*, ministerios(nome)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Conteúdo não encontrado' });

        res.json(mapConteudo(data));
    } catch (err) {
        console.error('Erro ao obter conteúdo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/conteudos — criar (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { idMinisterio, titulo, linkArquivo, dataPublicacao } = req.body;
        if (!idMinisterio || !titulo || !linkArquivo) {
            return res.status(400).json({ error: 'idMinisterio, titulo e linkArquivo são obrigatórios' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos')
            .insert({
                id_ministerio: idMinisterio,
                titulo,
                link_arquivo: linkArquivo,
                data_publicacao: dataPublicacao || new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(mapConteudo(data));
    } catch (err) {
        console.error('Erro ao criar conteúdo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/conteudos/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { titulo, linkArquivo, dataPublicacao, idMinisterio } = req.body;
        const updateData = {};
        if (titulo) updateData.titulo = titulo;
        if (linkArquivo) updateData.link_arquivo = linkArquivo;
        if (dataPublicacao) updateData.data_publicacao = dataPublicacao;
        if (idMinisterio) updateData.id_ministerio = idMinisterio;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('conteudos')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapConteudo(data));
    } catch (err) {
        console.error('Erro ao atualizar conteúdo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/conteudos/:id — excluir (Admin+)
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('conteudos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Conteúdo excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir conteúdo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
