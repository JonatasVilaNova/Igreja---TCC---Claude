/**
 * auth.js — Autenticação e Gestão de Usuários
 * Usa Supabase como banco de dados (PostgreSQL).
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getClient } = require('./utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'igreja_gestao_secret_key_TROCAR_EM_PRODUCAO';

// ──────────────────────────────────────────
// Middleware: verificar token JWT
// ──────────────────────────────────────────
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
}

// ──────────────────────────────────────────
// Middleware: verificar permissão de perfil
// ──────────────────────────────────────────
function verificarPermissao(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.tipoPerfil)) {
            return res.status(403).json({ error: 'Permissão negada' });
        }
        next();
    };
}

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const supabase = getClient();
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (error) throw error;
        if (!usuarios || usuarios.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const usuario = usuarios[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email, tipoPerfil: usuario.tipo_perfil },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipoPerfil: usuario.tipo_perfil,
                // Usado só para mostrar/esconder o menu — a permissão real é
                // sempre reconferida no banco a cada requisição às rotas de
                // /api/tesouraria (ver verificarAcessoTesouraria em tesouraria.js).
                acessoTesouraria: usuario.acesso_tesouraria === true
            }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// POST /api/auth/registro
// ──────────────────────────────────────────
router.post('/registro', async (req, res) => {
    try {
        const { nome, email, senha, codigoConvite } = req.body;
        if (!nome || !email || !senha || !codigoConvite) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const supabase = getClient();

        // Verificar código de convite
        const { data: codigos, error: errCodigo } = await supabase
            .from('codigos_convite')
            .select('*')
            .eq('codigo', codigoConvite)
            .limit(1);

        if (errCodigo) throw errCodigo;
        if (!codigos || codigos.length === 0) {
            return res.status(400).json({ error: 'Código de convite inválido' });
        }

        const convite = codigos[0];

        // Verificar se o código já atingiu o limite de usos
        if (convite.usos_realizados >= convite.usos_maximo) {
            return res.status(400).json({ error: 'Código de convite já atingiu o limite de usos' });
        }

        // Verificar se o código expirou
        if (convite.data_expiracao) {
            const hoje = new Date().toISOString().split('T')[0];
            if (convite.data_expiracao < hoje) {
                return res.status(400).json({ error: 'Código de convite expirado' });
            }
        }

        // Verificar se email já existe
        const { data: existente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (existente && existente.length > 0) {
            return res.status(400).json({ error: 'Este email já está cadastrado' });
        }

        // Criar usuário
        const senhaHash = await bcrypt.hash(senha, 10);
        const { data: novoUsuario, error: errInsert } = await supabase
            .from('usuarios')
            .insert({ nome, email, senha: senhaHash, tipo_perfil: convite.perfil })
            .select()
            .single();

        if (errInsert) throw errInsert;

        // Incrementar usos realizados e marcar usado_por
        const novosUsos = convite.usos_realizados + 1;
        await supabase
            .from('codigos_convite')
            .update({
                usos_realizados: novosUsos,
                usado: novosUsos >= convite.usos_maximo,
                usado_por: novoUsuario.id
            })
            .eq('id', convite.id);

        res.status(201).json({
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                tipoPerfil: novoUsuario.tipo_perfil
            }
        });
    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// GET /api/auth/me — dados do usuário logado
// ──────────────────────────────────────────
router.get('/me', verificarToken, async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, tipo_perfil, acesso_tesouraria')
            .eq('id', req.usuario.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Usuário não encontrado' });

        res.json({ ...data, tipoPerfil: data.tipo_perfil, acessoTesouraria: data.acesso_tesouraria === true });
    } catch (err) {
        console.error('Erro ao obter usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// GET /api/auth/usuarios — listar todos (Pastor)
// ──────────────────────────────────────────
router.get('/usuarios', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, tipo_perfil, created_at')
            .order('nome');

        if (error) throw error;
        res.json(data.map(u => ({ ...u, tipoPerfil: u.tipo_perfil })));
    } catch (err) {
        console.error('Erro ao listar usuários:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// GET /api/auth/usuarios/:id — obter por ID
// ──────────────────────────────────────────
router.get('/usuarios/:id', verificarToken, verificarPermissao('pastor', 'admin'), async (req, res) => {
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, tipo_perfil, created_at')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Usuário não encontrado' });

        res.json({ ...data, tipoPerfil: data.tipo_perfil });
    } catch (err) {
        console.error('Erro ao obter usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// PUT /api/auth/usuarios/:id — atualizar (Pastor)
// ──────────────────────────────────────────
router.put('/usuarios/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const { nome, email, tipoPerfil, senha } = req.body;
        const updateData = {};
        if (nome) updateData.nome = nome;
        if (email) updateData.email = email;
        if (tipoPerfil) updateData.tipo_perfil = tipoPerfil;
        if (senha) updateData.senha = await bcrypt.hash(senha, 10);

        const supabase = getClient();
        const { data, error } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', req.params.id)
            .select('id, nome, email, tipo_perfil')
            .single();

        if (error) throw error;
        res.json({ ...data, tipoPerfil: data.tipo_perfil });
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// POST /api/auth/usuarios — criar usuário (Pastor)
// ──────────────────────────────────────────
router.post('/usuarios', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const { nome, email, senha, tipoPerfil } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        const supabase = getClient();

        // Verificar se email já existe
        const { data: existente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .limit(1);

        if (existente && existente.length > 0) {
            return res.status(400).json({ error: 'Este email já está cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const { data, error } = await supabase
            .from('usuarios')
            .insert({ nome, email, senha: senhaHash, tipo_perfil: tipoPerfil || 'padrao' })
            .select('id, nome, email, tipo_perfil')
            .single();

        if (error) throw error;
        res.status(201).json({ ...data, tipoPerfil: data.tipo_perfil });
    } catch (err) {
        console.error('Erro ao criar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ──────────────────────────────────────────
// DELETE /api/auth/usuarios/:id — excluir (Pastor)
// ──────────────────────────────────────────
router.delete('/usuarios/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
    try {
        const supabase = getClient();
        const { error } = await supabase.from('usuarios').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
module.exports.verificarToken = verificarToken;
module.exports.verificarPermissao = verificarPermissao;
