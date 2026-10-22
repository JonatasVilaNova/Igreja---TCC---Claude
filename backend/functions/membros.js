/**
 * membros.js — CRUD de Membros de Ministérios
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// Helper: mapear snake_case → camelCase
function mapMembro(m) {
    return {
        id: m.id,
        idUsuario: m.id_usuario,
        idMinisterio: m.id_ministerio,
        funcao: m.funcao,
        instrumento: m.instrumento,
        // Incluir dados do join se existirem
        nomeUsuario: m.usuarios ? m.usuarios.nome : undefined,
        emailUsuario: m.usuarios ? m.usuarios.email : undefined,
        nomeMinisterio: m.ministerios ? m.ministerios.nome : undefined
    };
}

// GET /api/membros — listar todos
router.get('/', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('membros_ministerio')
            .select('*, usuarios(id, nome, email), ministerios(id, nome)')
            .order('id');

        if (error) throw error;
        res.json(data.map(mapMembro));
    } catch (err) {
        console.error('Erro ao listar membros:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/membros/ministerio/:idMinisterio — membros de um ministério
router.get('/ministerio/:idMinisterio', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('membros_ministerio')
            .select('*, usuarios(id, nome, email)')
            .eq('id_ministerio', req.params.idMinisterio)
            .order('funcao');

        if (error) throw error;
        res.json(data.map(mapMembro));
    } catch (err) {
        console.error('Erro ao listar membros do ministério:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/membros/:id
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('membros_ministerio')
            .select('*, usuarios(id, nome, email), ministerios(id, nome)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Membro não encontrado' });

        res.json(mapMembro(data));
    } catch (err) {
        console.error('Erro ao obter membro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/membros — adicionar membro (Admin+)
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { idUsuario, idMinisterio, funcao, instrumento } = req.body;
        if (!idUsuario || !idMinisterio || !funcao) {
            return res.status(400).json({ error: 'idUsuario, idMinisterio e funcao são obrigatórios' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('membros_ministerio')
            .insert({
                id_usuario: idUsuario,
                id_ministerio: idMinisterio,
                funcao,
                instrumento: instrumento || null
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Este usuário já é membro deste ministério' });
            }
            throw error;
        }

        res.status(201).json(mapMembro(data));
    } catch (err) {
        console.error('Erro ao adicionar membro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/membros/:id — atualizar membro (Admin+)
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { funcao, instrumento } = req.body;
        const updateData = {};
        if (funcao) updateData.funcao = funcao;
        if (instrumento !== undefined) updateData.instrumento = instrumento;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('membros_ministerio')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapMembro(data));
    } catch (err) {
        console.error('Erro ao atualizar membro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/membros/:id — remover membro (Admin+)
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('membros_ministerio').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Membro removido com sucesso' });
    } catch (err) {
        console.error('Erro ao remover membro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
