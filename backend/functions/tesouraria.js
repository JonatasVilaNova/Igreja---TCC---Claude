/**
 * tesouraria.js — Módulo de Tesouraria (lançamentos financeiros manuais)
 * Usa Supabase como banco de dados.
 *
 * Controle de acesso: diferente dos outros módulos (que confiam no
 * `tipoPerfil` gravado no JWT), aqui a flag `acesso_tesouraria` é
 * reconferida no banco a CADA requisição. Isso garante que, se o Pastor
 * revogar o acesso de um usuário direto no banco, a revogação vale
 * imediatamente — sem esperar o token expirar (24h).
 */
const express = require('express');
const router = express.Router();
const { verificarToken } = require('./auth');
const { getClient } = require('./utils/db');

// ──────────────────────────────────────────
// Middleware: verificar acesso à tesouraria (fresh, direto no banco)
// ──────────────────────────────────────────
async function verificarAcessoTesouraria(req, res, next) {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('acesso_tesouraria')
            .eq('id', req.usuario.id)
            .single();

        if (error) throw error;
        if (!data || data.acesso_tesouraria !== true) {
            return res.status(403).json({ error: 'Acesso à Tesouraria não autorizado para este usuário' });
        }
        next();
    } catch (err) {
        console.error('Erro ao verificar acesso à tesouraria:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// Todas as rotas deste módulo exigem token válido + flag habilitada no banco
router.use(verificarToken, verificarAcessoTesouraria);

// Helpers
function corValida(cor) {
    return typeof cor === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(cor);
}

function mapCategoria(c) {
    return { id: c.id, nome: c.nome, tipo: c.tipo, cor: c.cor };
}

function mapLancamento(l) {
    return {
        id: l.id,
        tipo: l.tipo,
        idCategoria: l.id_categoria,
        categoriaNome: l.categorias_financeiras ? l.categorias_financeiras.nome : undefined,
        categoriaCor: l.categorias_financeiras ? l.categorias_financeiras.cor : undefined,
        descricao: l.descricao,
        valor: Number(l.valor),
        data: l.data,
        formaPagamento: l.forma_pagamento,
        observacoes: l.observacoes,
        idUsuario: l.id_usuario,
        usuarioNome: l.usuarios ? l.usuarios.nome : undefined,
        idInvestimento: l.id_investimento,
        investimentoNome: l.investimentos ? l.investimentos.nome : undefined,
        movimentoInvestimento: l.movimento_investimento,
        created_at: l.created_at
    };
}

function mapInvestimento(inv) {
    return {
        id: inv.id,
        nome: inv.nome,
        tipo: inv.tipo,
        instituicao: inv.instituicao,
        observacoes: inv.observacoes,
        created_at: inv.created_at
    };
}

const LANCAMENTO_SELECT = '*, categorias_financeiras(nome, cor), usuarios(nome), investimentos(nome)';

function mapRendimento(r) {
    return {
        id: r.id,
        idInvestimento: r.id_investimento,
        valor: Number(r.valor),
        data: r.data,
        observacoes: r.observacoes,
        idUsuario: r.id_usuario,
        usuarioNome: r.usuarios ? r.usuarios.nome : undefined,
        created_at: r.created_at
    };
}

// ══════════════════════════════════════════
// Categorias
// ══════════════════════════════════════════

// GET /api/tesouraria/categorias
router.get('/categorias', async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('categorias_financeiras')
            .select('*')
            .order('tipo')
            .order('nome');

        if (error) throw error;
        res.json(data.map(mapCategoria));
    } catch (err) {
        console.error('Erro ao listar categorias:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/tesouraria/categorias
router.post('/categorias', async (req, res) => {
    try {
        const { nome, tipo, cor } = req.body;
        if (!nome || !tipo) {
            return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        }
        if (!['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({ error: "Tipo deve ser 'entrada' ou 'saida'" });
        }
        if (cor !== undefined && cor !== null && cor !== '' && !corValida(cor)) {
            return res.status(400).json({ error: 'Cor deve ser um código hexadecimal válido (ex: #1b5e3f)' });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('categorias_financeiras')
            .insert({ nome, tipo, cor: cor || '#1b5e3f' })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(mapCategoria(data));
    } catch (err) {
        console.error('Erro ao criar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/tesouraria/categorias/:id
router.put('/categorias/:id', async (req, res) => {
    try {
        const { nome, tipo, cor } = req.body;
        const updateData = {};
        if (nome) updateData.nome = nome;
        if (tipo) {
            if (!['entrada', 'saida'].includes(tipo)) {
                return res.status(400).json({ error: "Tipo deve ser 'entrada' ou 'saida'" });
            }
            updateData.tipo = tipo;
        }
        if (cor) {
            if (!corValida(cor)) {
                return res.status(400).json({ error: 'Cor deve ser um código hexadecimal válido (ex: #1b5e3f)' });
            }
            updateData.cor = cor;
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('categorias_financeiras')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapCategoria(data));
    } catch (err) {
        console.error('Erro ao atualizar categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/tesouraria/categorias/:id
router.delete('/categorias/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('categorias_financeiras').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Categoria excluída com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ══════════════════════════════════════════
// Resumo (KPIs de um mês/ano + saldo acumulado total)
// ══════════════════════════════════════════

// GET /api/tesouraria/resumo?mes=7&ano=2026
router.get('/resumo', async (req, res) => {
    try {
        const hoje = new Date();
        const mes = parseInt(req.query.mes) || (hoje.getMonth() + 1);
        const ano = parseInt(req.query.ano) || hoje.getFullYear();

        const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const proximoMes = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;

        const supabase = getClient();

        const { data: doMes, error: errMes } = await supabase
            .from('lancamentos_financeiros')
            .select('tipo, valor')
            .gte('data', inicioMes)
            .lt('data', proximoMes);
        if (errMes) throw errMes;

        const { data: todos, error: errTodos } = await supabase
            .from('lancamentos_financeiros')
            .select('tipo, valor');
        if (errTodos) throw errTodos;

        const somar = (lista, tipo) => lista.filter(l => l.tipo === tipo).reduce((acc, l) => acc + Number(l.valor), 0);

        const entradasMes = somar(doMes, 'entrada');
        const saidasMes = somar(doMes, 'saida');
        const entradasTotal = somar(todos, 'entrada');
        const saidasTotal = somar(todos, 'saida');

        res.json({
            mes,
            ano,
            entradasMes,
            saidasMes,
            saldoMes: entradasMes - saidasMes,
            saldoTotal: entradasTotal - saidasTotal
        });
    } catch (err) {
        console.error('Erro ao calcular resumo da tesouraria:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ══════════════════════════════════════════
// Investimentos
//
// Aportar tira dinheiro do saldo principal (cria um lançamento tipo
// 'saida' vinculado); resgatar devolve pro saldo principal (lançamento
// tipo 'entrada'). O saldo de cada investimento é sempre calculado a
// partir da soma desses lançamentos — nunca fica dessincronizado, e
// editar/excluir um lançamento de aporte/resgate já corrige o saldo
// automaticamente, sem código extra.
// ══════════════════════════════════════════

function calcularSaldosInvestimentos(movimentos) {
    const porInvestimento = {};
    for (const m of movimentos) {
        if (!m.id_investimento) continue;
        if (!porInvestimento[m.id_investimento]) {
            porInvestimento[m.id_investimento] = { totalAportado: 0, totalResgatado: 0 };
        }
        const valor = Number(m.valor);
        if (m.movimento_investimento === 'aporte') porInvestimento[m.id_investimento].totalAportado += valor;
        else if (m.movimento_investimento === 'resgate') porInvestimento[m.id_investimento].totalResgatado += valor;
    }
    return porInvestimento;
}

function somarRendimentosPorInvestimento(rendimentos) {
    const porInvestimento = {};
    for (const r of rendimentos) {
        porInvestimento[r.id_investimento] = (porInvestimento[r.id_investimento] || 0) + Number(r.valor);
    }
    return porInvestimento;
}

// GET /api/tesouraria/investimentos
router.get('/investimentos', async (req, res) => {
    try {
        const supabase = getClient();
        const [{ data: investimentos, error: errInv }, { data: movimentos, error: errMov }, { data: rendimentos, error: errRend }] = await Promise.all([
            supabase.from('investimentos').select('*').order('nome'),
            supabase.from('lancamentos_financeiros').select('id_investimento, movimento_investimento, valor').not('id_investimento', 'is', null),
            supabase.from('investimentos_rendimentos').select('id_investimento, valor')
        ]);
        if (errInv) throw errInv;
        if (errMov) throw errMov;
        if (errRend) throw errRend;

        const saldos = calcularSaldosInvestimentos(movimentos);
        const rendimentosPorInv = somarRendimentosPorInvestimento(rendimentos);
        const resultado = investimentos.map(inv => {
            const s = saldos[inv.id] || { totalAportado: 0, totalResgatado: 0 };
            const totalRendimentos = rendimentosPorInv[inv.id] || 0;
            return {
                ...mapInvestimento(inv),
                totalAportado: s.totalAportado,
                totalResgatado: s.totalResgatado,
                totalRendimentos,
                saldoAtual: s.totalAportado - s.totalResgatado + totalRendimentos
            };
        });
        res.json(resultado);
    } catch (err) {
        console.error('Erro ao listar investimentos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/tesouraria/investimentos/:id/movimentacoes
// Retorna aportes, resgates (de lancamentos_financeiros) e rendimentos
// (de investimentos_rendimentos) juntos, ordenados por data.
router.get('/investimentos/:id/movimentacoes', async (req, res) => {
    try {
        const supabase = getClient();
        const [{ data: lancamentos, error: errLanc }, { data: rendimentos, error: errRend }] = await Promise.all([
            supabase.from('lancamentos_financeiros').select(LANCAMENTO_SELECT).eq('id_investimento', req.params.id),
            supabase.from('investimentos_rendimentos').select('*, usuarios(nome)').eq('id_investimento', req.params.id)
        ]);
        if (errLanc) throw errLanc;
        if (errRend) throw errRend;

        const movimentos = [
            ...lancamentos.map(l => ({ ...mapLancamento(l), origem: 'lancamento', movimento: l.movimento_investimento })),
            ...rendimentos.map(r => ({ ...mapRendimento(r), origem: 'rendimento', movimento: 'rendimento' }))
        ].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : b.id - a.id));

        res.json(movimentos);
    } catch (err) {
        console.error('Erro ao listar movimentações do investimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/tesouraria/investimentos
router.post('/investimentos', async (req, res) => {
    try {
        const { nome, tipo, instituicao, observacoes } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const tiposValidos = ['poupanca', 'cdb', 'fundo', 'tesouro_direto', 'outro'];
        if (tipo && !tiposValidos.includes(tipo)) {
            return res.status(400).json({ error: `Tipo deve ser um de: ${tiposValidos.join(', ')}` });
        }

        const supabase = getClient();
        const { data, error } = await supabase
            .from('investimentos')
            .insert({ nome, tipo: tipo || 'outro', instituicao: instituicao || null, observacoes: observacoes || null })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ ...mapInvestimento(data), totalAportado: 0, totalResgatado: 0, saldoAtual: 0 });
    } catch (err) {
        console.error('Erro ao criar investimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/tesouraria/investimentos/:id
router.put('/investimentos/:id', async (req, res) => {
    try {
        const { nome, tipo, instituicao, observacoes } = req.body;
        const updateData = { updated_at: new Date().toISOString() };

        if (nome !== undefined) updateData.nome = nome;
        if (tipo !== undefined) {
            const tiposValidos = ['poupanca', 'cdb', 'fundo', 'tesouro_direto', 'outro'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({ error: `Tipo deve ser um de: ${tiposValidos.join(', ')}` });
            }
            updateData.tipo = tipo;
        }
        if (instituicao !== undefined) updateData.instituicao = instituicao || null;
        if (observacoes !== undefined) updateData.observacoes = observacoes || null;

        const supabase = getClient();
        const { data, error } = await supabase
            .from('investimentos')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(mapInvestimento(data));
    } catch (err) {
        console.error('Erro ao atualizar investimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/tesouraria/investimentos/:id
// Bloqueia só se o SALDO ATUAL (aportes - resgates + rendimentos) for
// diferente de zero — um investimento com histórico mas já totalmente
// resgatado/zerado pode ser excluído normalmente.
router.delete('/investimentos/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const [{ data: movimentos, error: errMov }, { data: rendimentos, error: errRend }] = await Promise.all([
            supabase.from('lancamentos_financeiros').select('movimento_investimento, valor').eq('id_investimento', req.params.id),
            supabase.from('investimentos_rendimentos').select('valor').eq('id_investimento', req.params.id)
        ]);
        if (errMov) throw errMov;
        if (errRend) throw errRend;

        const totalAportado = movimentos.filter(m => m.movimento_investimento === 'aporte').reduce((acc, m) => acc + Number(m.valor), 0);
        const totalResgatado = movimentos.filter(m => m.movimento_investimento === 'resgate').reduce((acc, m) => acc + Number(m.valor), 0);
        const totalRendimentos = rendimentos.reduce((acc, r) => acc + Number(r.valor), 0);
        const saldoAtual = totalAportado - totalResgatado + totalRendimentos;

        if (Math.round(saldoAtual * 100) !== 0) {
            return res.status(400).json({ error: `Não é possível excluir: este investimento ainda tem saldo de R$ ${saldoAtual.toFixed(2)}. Zere o saldo (resgate o valor restante) antes de excluir.` });
        }

        const { error } = await supabase.from('investimentos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Investimento excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir investimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/tesouraria/investimentos/:id/rendimento
// Rendimento (juros/valorização) soma no saldo do investimento mas NÃO
// gera lançamento em lancamentos_financeiros — não passa pela conta geral.
router.post('/investimentos/:id/rendimento', async (req, res) => {
    try {
        const { valor, data, observacoes } = req.body;
        const valorNum = Number(valor);
        if (!valorNum || valorNum <= 0) {
            return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        }

        const supabase = getClient();
        const { data: investimento, error: errInv } = await supabase
            .from('investimentos')
            .select('id')
            .eq('id', req.params.id)
            .single();
        if (errInv || !investimento) return res.status(404).json({ error: 'Investimento não encontrado' });

        const { data: novo, error } = await supabase
            .from('investimentos_rendimentos')
            .insert({
                id_investimento: investimento.id,
                valor: valorNum,
                data: data || new Date().toISOString().split('T')[0],
                observacoes: observacoes || null,
                id_usuario: req.usuario.id
            })
            .select('*, usuarios(nome)')
            .single();

        if (error) throw error;
        res.status(201).json({ ...mapRendimento(novo), origem: 'rendimento', movimento: 'rendimento' });
    } catch (err) {
        console.error('Erro ao registrar rendimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/tesouraria/investimentos/:id/rendimento/:rendimentoId
router.delete('/investimentos/:id/rendimento/:rendimentoId', async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase
            .from('investimentos_rendimentos')
            .delete()
            .eq('id', req.params.rendimentoId)
            .eq('id_investimento', req.params.id);
        if (error) throw error;
        res.json({ message: 'Rendimento excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir rendimento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Helper compartilhado por /aportar e /resgatar
async function registrarMovimentoInvestimento(req, res, { movimento, tipoLancamento, descricaoPrefixo }) {
    try {
        const { valor, data, observacoes } = req.body;
        const valorNum = Number(valor);
        if (!valorNum || valorNum <= 0) {
            return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        }

        const supabase = getClient();
        const { data: investimento, error: errInv } = await supabase
            .from('investimentos')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (errInv || !investimento) return res.status(404).json({ error: 'Investimento não encontrado' });

        const { data: novo, error } = await supabase
            .from('lancamentos_financeiros')
            .insert({
                tipo: tipoLancamento,
                id_categoria: null,
                descricao: `${descricaoPrefixo}: ${investimento.nome}`,
                valor: valorNum,
                data: data || new Date().toISOString().split('T')[0],
                forma_pagamento: null,
                observacoes: observacoes || null,
                id_usuario: req.usuario.id,
                id_investimento: investimento.id,
                movimento_investimento: movimento
            })
            .select(LANCAMENTO_SELECT)
            .single();

        if (error) throw error;
        res.status(201).json(mapLancamento(novo));
    } catch (err) {
        console.error(`Erro ao registrar ${movimento} de investimento:`, err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// POST /api/tesouraria/investimentos/:id/aportar — tira do saldo principal (saida)
router.post('/investimentos/:id/aportar', (req, res) =>
    registrarMovimentoInvestimento(req, res, { movimento: 'aporte', tipoLancamento: 'saida', descricaoPrefixo: 'Aporte em investimento' })
);

// POST /api/tesouraria/investimentos/:id/resgatar — volta pro saldo principal (entrada)
router.post('/investimentos/:id/resgatar', (req, res) =>
    registrarMovimentoInvestimento(req, res, { movimento: 'resgate', tipoLancamento: 'entrada', descricaoPrefixo: 'Resgate de investimento' })
);

// ══════════════════════════════════════════
// Lançamentos
// ══════════════════════════════════════════

// GET /api/tesouraria?mes=7&ano=2026&tipo=entrada&idCategoria=1
// ou   /api/tesouraria?dataInicio=2026-01-01&dataFim=2026-12-31 (usado pelo Relatório)
router.get('/', async (req, res) => {
    try {
        const supabase = getClient();
        let query = supabase
            .from('lancamentos_financeiros')
            .select(LANCAMENTO_SELECT)
            .order('data', { ascending: false })
            .order('id', { ascending: false });

        const { mes, ano, tipo, idCategoria, dataInicio, dataFim } = req.query;
        if (mes && ano) {
            const m = parseInt(mes), a = parseInt(ano);
            const inicioMes = `${a}-${String(m).padStart(2, '0')}-01`;
            const proximoMes = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
            query = query.gte('data', inicioMes).lt('data', proximoMes);
        } else {
            if (dataInicio) query = query.gte('data', dataInicio);
            if (dataFim) query = query.lte('data', dataFim);
        }
        if (tipo) query = query.eq('tipo', tipo);
        if (idCategoria) query = query.eq('id_categoria', idCategoria);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data.map(mapLancamento));
    } catch (err) {
        console.error('Erro ao listar lançamentos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/tesouraria/:id
router.get('/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('lancamentos_financeiros')
            .select(LANCAMENTO_SELECT)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Lançamento não encontrado' });

        res.json(mapLancamento(data));
    } catch (err) {
        console.error('Erro ao obter lançamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/tesouraria
router.post('/', async (req, res) => {
    try {
        const { tipo, idCategoria, descricao, valor, data, formaPagamento, observacoes } = req.body;

        if (!tipo || !['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({ error: "Tipo é obrigatório e deve ser 'entrada' ou 'saida'" });
        }
        if (!descricao) {
            return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        const valorNum = Number(valor);
        if (!valorNum || valorNum <= 0) {
            return res.status(400).json({ error: 'Valor deve ser maior que zero' });
        }

        const supabase = getClient();
        const { data: novo, error } = await supabase
            .from('lancamentos_financeiros')
            .insert({
                tipo,
                id_categoria: idCategoria || null,
                descricao,
                valor: valorNum,
                data: data || new Date().toISOString().split('T')[0],
                forma_pagamento: formaPagamento || null,
                observacoes: observacoes || null,
                id_usuario: req.usuario.id
            })
            .select(LANCAMENTO_SELECT)
            .single();

        if (error) throw error;
        res.status(201).json(mapLancamento(novo));
    } catch (err) {
        console.error('Erro ao criar lançamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/tesouraria/:id
router.put('/:id', async (req, res) => {
    try {
        const { tipo, idCategoria, descricao, valor, data, formaPagamento, observacoes } = req.body;
        const updateData = { updated_at: new Date().toISOString() };

        if (tipo !== undefined) {
            if (!['entrada', 'saida'].includes(tipo)) {
                return res.status(400).json({ error: "Tipo deve ser 'entrada' ou 'saida'" });
            }
            updateData.tipo = tipo;
        }
        if (idCategoria !== undefined) updateData.id_categoria = idCategoria || null;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (valor !== undefined) {
            const valorNum = Number(valor);
            if (!valorNum || valorNum <= 0) {
                return res.status(400).json({ error: 'Valor deve ser maior que zero' });
            }
            updateData.valor = valorNum;
        }
        if (data !== undefined) updateData.data = data;
        if (formaPagamento !== undefined) updateData.forma_pagamento = formaPagamento || null;
        if (observacoes !== undefined) updateData.observacoes = observacoes || null;

        const supabase = getClient();
        const { data: atualizado, error } = await supabase
            .from('lancamentos_financeiros')
            .update(updateData)
            .eq('id', req.params.id)
            .select(LANCAMENTO_SELECT)
            .single();

        if (error) throw error;
        res.json(mapLancamento(atualizado));
    } catch (err) {
        console.error('Erro ao atualizar lançamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/tesouraria/:id
router.delete('/:id', async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Lançamento excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir lançamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
