/**
 * codigos-convite.js — CRUD de Códigos de Convite
 * Usa Supabase como banco de dados.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

// GET /api/codigos-convite — listar todos (Pastor)
router.get('/', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('codigos_convite')
            .select('*, criador:usuarios!codigos_convite_id_criador_fkey(nome)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data.map(c => ({
            id: c.id,
            codigo: c.codigo,
            perfil: c.perfil,
            usado: c.usos_realizados >= c.usos_maximo,
            usosMaximo: c.usos_maximo,
            usosRealizados: c.usos_realizados,
            usosRestantes: c.usos_maximo - c.usos_realizados,
            dataExpiracao: c.data_expiracao,
            idCriador: c.id_criador,
            nomeCriador: c.criador ? c.criador.nome : null,
            created_at: c.created_at
        })));
    } catch (err) {
        console.error('Erro ao listar códigos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/codigos-convite — criar (Pastor)
router.post('/', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const { perfil, usosMaximo, dataExpiracao } = req.body;
        const perfilCodigo = perfil || 'padrao';

        if (!['admin', 'padrao'].includes(perfilCodigo)) {
            return res.status(400).json({ error: 'Perfil deve ser "admin" ou "padrao"' });
        }

        const usos = Math.max(1, Math.min(100, parseInt(usosMaximo) || 1));

        // Gerar código aleatório de 8 caracteres
        const codigo = gerar_codigo();

        const insertData = {
            codigo,
            perfil: perfilCodigo,
            id_criador: req.usuario.id,
            usos_maximo: usos
        };
        if (dataExpiracao) insertData.data_expiracao = dataExpiracao;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('codigos_convite')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({
            id: data.id,
            codigo: data.codigo,
            perfil: data.perfil,
            usado: false,
            usosMaximo: data.usos_maximo,
            usosRealizados: data.usos_realizados,
            usosRestantes: data.usos_maximo - data.usos_realizados,
            dataExpiracao: data.data_expiracao,
            created_at: data.created_at
        });
    } catch (err) {
        console.error('Erro ao criar código de convite:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/codigos-convite/:id — excluir (Pastor)
router.delete('/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('codigos_convite').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Código de convite excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir código:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Gerar código alfanumérico de 8 caracteres
function gerar_codigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

module.exports = router;
