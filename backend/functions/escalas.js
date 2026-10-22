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

        const supabase = getClient();

        // Criar escala
        const { data: escala, error: errEscala } = await supabase
            .from('escalas')
            .insert({ id_ministerio: idMinisterio, data, descricao })
            .select()
            .single();

        if (errEscala) throw errEscala;

        // Associar membros
        if (membros && membros.length > 0) {
            const relacoes = membros.map(idMembro => ({
                id_escala: escala.id,
                id_membro: idMembro
            }));
            const { error: errMembros } = await supabase
                .from('escalas_membros')
                .insert(relacoes);
            if (errMembros) throw errMembros;
        }

        res.status(201).json(mapEscala({ ...escala, escalas_membros: (membros || []).map(id => ({ id_membro: id })) }));
    } catch (err) {
        console.error('Erro ao criar escala:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/escalas/:id — atualizar (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { idMinisterio, data, descricao, membros } = req.body;
        const updateData = {};
        if (idMinisterio) updateData.id_ministerio = idMinisterio;
        if (data) updateData.data = data;
        if (descricao) updateData.descricao = descricao;

        const supabase = getClient();

        const { data: escala, error: errEscala } = await supabase
            .from('escalas')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (errEscala) throw errEscala;

        // Atualizar membros: remover todos e reinserir
        if (membros !== undefined) {
            await supabase.from('escalas_membros').delete().eq('id_escala', req.params.id);
            if (membros.length > 0) {
                const relacoes = membros.map(idMembro => ({
                    id_escala: parseInt(req.params.id),
                    id_membro: idMembro
                }));
                await supabase.from('escalas_membros').insert(relacoes);
            }
        }

        // Recarregar com membros
        const { data: escalaFinal } = await supabase
            .from('escalas')
            .select('*, escalas_membros(id_membro)')
            .eq('id', req.params.id)
            .single();

        res.json(mapEscala(escalaFinal));
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
