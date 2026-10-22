/**
 * estudos.js — CRUD de Estudos e Pregações
 * Usa Supabase como banco de dados.
 *
 * Escrita: Pastor e Admin (Líder de Ministérios).
 * Leitura completa (inclusive rascunhos): Pastor e Admin, dentro da intranet.
 * Leitura pública (só publicados): rotas /public e /public/:id, SEM autenticação —
 * consumidas pelo site institucional (ibnc-website), que não tem login.
 */
const express = require('express');
const router = express.Router();
const { verificarToken, verificarPermissao } = require('./auth');
const { getClient } = require('./utils/db');

function mapEstudo(e, { incluirConteudo = true } = {}) {
    const base = {
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        tema: e.tema,
        textoBase: e.texto_base,
        resumo: e.resumo,
        autorNome: e.autor_nome,
        idAutor: e.id_autor,
        publicado: e.publicado,
        dataPublicacao: e.data_publicacao,
        created_at: e.created_at,
        updated_at: e.updated_at
    };
    if (incluirConteudo) base.conteudoHtml = e.conteudo_html;
    return base;
}

// ══════════════════════════════════════════
// Rotas PÚBLICAS (sem autenticação) — consumidas pelo site institucional
// Precisam vir ANTES de "/:id" para não colidir com a rota genérica.
// ══════════════════════════════════════════

// GET /api/estudos/public — lista resumida dos publicados
router.get('/public', async (req, res) => {
    try {
        const supabase = getClient();
        let query = supabase
            .from('estudos')
            .select('id, titulo, tipo, tema, texto_base, resumo, autor_nome, data_publicacao, created_at')
            .eq('publicado', true)
            .order('data_publicacao', { ascending: false });

        if (req.query.tipo && ['estudo', 'pregacao'].includes(req.query.tipo)) {
            query = query.eq('tipo', req.query.tipo);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data.map(e => mapEstudo(e, { incluirConteudo: false })));
    } catch (err) {
        console.error('Erro ao listar estudos públicos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/estudos/public/:id — conteúdo completo de um estudo publicado
router.get('/public/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('estudos')
            .select('*')
            .eq('id', req.params.id)
            .eq('publicado', true)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Estudo não encontrado' });
        res.json(mapEstudo(data));
    } catch (err) {
        console.error('Erro ao obter estudo público:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ══════════════════════════════════════════
// Rotas privadas (intranet) — Pastor e Admin (Líder de Ministérios)
// ══════════════════════════════════════════

// GET /api/estudos — lista completa (inclui rascunhos)
router.get('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('estudos')
            .select('*')
            .order('data_publicacao', { ascending: false });

        if (error) throw error;
        res.json(data.map(e => mapEstudo(e, { incluirConteudo: false })));
    } catch (err) {
        console.error('Erro ao listar estudos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/estudos/:id
router.get('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('estudos')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Estudo não encontrado' });

        res.json(mapEstudo(data));
    } catch (err) {
        console.error('Erro ao obter estudo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/estudos — criar
router.post('/', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { titulo, tipo, tema, textoBase, resumo, conteudoHtml, publicado, dataPublicacao } = req.body;
        if (!titulo) {
            return res.status(400).json({ error: 'Título é obrigatório' });
        }
        if (tipo && !['estudo', 'pregacao'].includes(tipo)) {
            return res.status(400).json({ error: "Tipo deve ser 'estudo' ou 'pregacao'" });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('estudos')
            .insert({
                titulo,
                tipo: tipo || 'estudo',
                tema: tema || null,
                texto_base: textoBase || null,
                resumo: resumo || null,
                conteudo_html: conteudoHtml || '',
                id_autor: req.usuario.id,
                autor_nome: req.usuario.nome,
                publicado: publicado === true,
                data_publicacao: dataPublicacao || new Date().toISOString().split('T')[0]
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(mapEstudo(data));
    } catch (err) {
        console.error('Erro ao criar estudo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/estudos/:id — atualizar
router.put('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const { titulo, tipo, tema, textoBase, resumo, conteudoHtml, publicado, dataPublicacao } = req.body;
        const updateData = { updated_at: new Date().toISOString() };

        if (titulo !== undefined) updateData.titulo = titulo;
        if (tipo !== undefined) {
            if (!['estudo', 'pregacao'].includes(tipo)) {
                return res.status(400).json({ error: "Tipo deve ser 'estudo' ou 'pregacao'" });
            }
            updateData.tipo = tipo;
        }
        if (tema !== undefined) updateData.tema = tema;
        if (textoBase !== undefined) updateData.texto_base = textoBase;
        if (resumo !== undefined) updateData.resumo = resumo;
        if (conteudoHtml !== undefined) updateData.conteudo_html = conteudoHtml;
        if (publicado !== undefined) updateData.publicado = publicado === true;
        if (dataPublicacao !== undefined) updateData.data_publicacao = dataPublicacao;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('estudos')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapEstudo(data));
    } catch (err) {
        console.error('Erro ao atualizar estudo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/estudos/:id
router.delete('/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('estudos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Estudo excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir estudo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
