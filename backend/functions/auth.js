// Rotas para autenticação e gestão de usuários
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware para verificar autenticação
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'igreja_gestao_secret_key');
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Middleware para verificar permissões
const verificarPermissao = (tipoPerfilMinimo) => {
  return (req, res, next) => {
    const { tipoPerfil } = req.usuario;
    
    if (tipoPerfilMinimo === 'padrao') {
      return next();
    }
    
    if (tipoPerfilMinimo === 'admin' && (tipoPerfil === 'admin' || tipoPerfil === 'pastor')) {
      return next();
    }
    
    if (tipoPerfilMinimo === 'pastor' && tipoPerfil === 'pastor') {
      return next();
    }
    
    res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
  };
};

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    
    // Consultar usuário pelo email
    const query = `
      SELECT id, nome, email, senha, tipoPerfil
      FROM Usuarios
      WHERE email = @param0
    `;
    
    const usuarios = await db.executeQuery(query, [
      { placeholder: '@param0', value: email }
    ]);
    
    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }
    
    const usuario = usuarios[0];
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, tipoPerfil: usuario.tipoPerfil },
      process.env.JWT_SECRET || 'igreja_gestao_secret_key',
      { expiresIn: '1d' }
    );
    
    // Remover senha do objeto de resposta
    delete usuario.senha;
    
    res.status(200).json({
      usuario,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

// Rota para obter usuário atual
router.get('/me', verificarToken, (req, res) => {
  res.status(200).json(req.usuario);
});

// Rota para listar todos os usuários (apenas para pastor)
router.get('/usuarios', verificarToken, verificarPermissao('pastor'), async (req, res) => {
  try {
    const query = `
      SELECT id, nome, email, tipoPerfil
      FROM Usuarios
      ORDER BY nome
    `;
    
    const usuarios = await db.executeQuery(query);
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

// Rota para obter um usuário específico (apenas para pastor)
router.get('/usuarios/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, nome, email, tipoPerfil
      FROM Usuarios
      WHERE id = @param0
    `;
    
    const usuarios = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    res.status(200).json(usuarios[0]);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro ao obter usuário.' });
  }
});

// Rota para criar um novo usuário (apenas para pastor)
router.post('/usuarios', verificarToken, verificarPermissao('pastor'), async (req, res) => {
  try {
    const { nome, email, senha, tipoPerfil } = req.body;
    
    if (!nome || !email || !senha || !tipoPerfil) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // Verificar se o email já está em uso
    const queryVerificar = `
      SELECT COUNT(*) as count
      FROM Usuarios
      WHERE email = @param0
    `;
    
    const resultado = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: email }
    ]);
    
    if (resultado[0].count > 0) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    
    // Inserir novo usuário
    const queryInserir = `
      INSERT INTO Usuarios (nome, email, senha, tipoPerfil)
      VALUES (@param0, @param1, @param2, @param3);
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const resultadoInsercao = await db.executeQuery(queryInserir, [
      { placeholder: '@param0', value: nome },
      { placeholder: '@param1', value: email },
      { placeholder: '@param2', value: senhaHash },
      { placeholder: '@param3', value: tipoPerfil }
    ]);
    
    const id = resultadoInsercao[0].id;
    
    res.status(201).json({
      id,
      nome,
      email,
      tipoPerfil
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

// Rota para atualizar um usuário (apenas para pastor ou o próprio usuário)
router.put('/usuarios/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, tipoPerfil } = req.body;
    
    // Verificar se é o próprio usuário ou um pastor
    if (req.usuario.id !== parseInt(id) && req.usuario.tipoPerfil !== 'pastor') {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para atualizar este usuário.' });
    }
    
    // Verificar se o usuário existe
    const queryVerificar = `
      SELECT *
      FROM Usuarios
      WHERE id = @param0
    `;
    
    const usuarios = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    // Construir query de atualização
    let queryAtualizar = 'UPDATE Usuarios SET ';
    const params = [];
    let paramIndex = 0;
    
    if (nome) {
      queryAtualizar += `nome = @param${paramIndex}, `;
      params.push({ placeholder: `@param${paramIndex}`, value: nome });
      paramIndex++;
    }
    
    if (email) {
      // Verificar se o email já está em uso por outro usuário
      const queryVerificarEmail = `
        SELECT COUNT(*) as count
        FROM Usuarios
        WHERE email = @param0 AND id != @param1
      `;
      
      const resultadoEmail = await db.executeQuery(queryVerificarEmail, [
        { placeholder: '@param0', value: email },
        { placeholder: '@param1', value: parseInt(id) }
      ]);
      
      if (resultadoEmail[0].count > 0) {
        return res.status(400).json({ error: 'Este email já está em uso por outro usuário.' });
      }
      
      queryAtualizar += `email = @param${paramIndex}, `;
      params.push({ placeholder: `@param${paramIndex}`, value: email });
      paramIndex++;
    }
    
    if (senha) {
      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);
      
      queryAtualizar += `senha = @param${paramIndex}, `;
      params.push({ placeholder: `@param${paramIndex}`, value: senhaHash });
      paramIndex++;
    }
    
    // Apenas pastor pode alterar o tipo de perfil
    if (tipoPerfil && req.usuario.tipoPerfil === 'pastor') {
      queryAtualizar += `tipoPerfil = @param${paramIndex}, `;
      params.push({ placeholder: `@param${paramIndex}`, value: tipoPerfil });
      paramIndex++;
    }
    
    // Remover a vírgula final
    queryAtualizar = queryAtualizar.slice(0, -2);
    
    // Adicionar condição WHERE
    queryAtualizar += ` WHERE id = @param${paramIndex}`;
    params.push({ placeholder: `@param${paramIndex}`, value: parseInt(id) });
    
    // Executar a atualização
    await db.executeQuery(queryAtualizar, params);
    
    // Obter usuário atualizado
    const queryObterAtualizado = `
      SELECT id, nome, email, tipoPerfil
      FROM Usuarios
      WHERE id = @param0
    `;
    
    const usuariosAtualizados = await db.executeQuery(queryObterAtualizado, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json(usuariosAtualizados[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// Rota para excluir um usuário (apenas para pastor)
router.delete('/usuarios/:id', verificarToken, verificarPermissao('pastor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const queryVerificar = `
      SELECT *
      FROM Usuarios
      WHERE id = @param0
    `;
    
    const usuarios = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    
    // Verificar se o usuário é um pastor (não permitir excluir pastores)
    if (usuarios[0].tipoPerfil === 'pastor') {
      return res.status(403).json({ error: 'Não é permitido excluir usuários com perfil de Pastor.' });
    }
    
    // Excluir o usuário
    const queryExcluir = `
      DELETE FROM Usuarios
      WHERE id = @param0
    `;
    
    await db.executeQuery(queryExcluir, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

module.exports = router;
