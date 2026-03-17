// Rotas para gestão de membros de ministérios
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { verificarToken, verificarPermissao } = require('./auth');

// Listar todos os membros de ministérios
router.get('/', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      ORDER BY m.nome, u.nome
    `;
    
    const membros = await db.executeQuery(query);
    res.status(200).json(membros);
  } catch (error) {
    console.error('Erro ao listar membros:', error);
    res.status(500).json({ error: 'Erro ao listar membros.' });
  }
});

// Obter um membro específico
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      WHERE mm.id = @param0
    `;
    
    const membros = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (membros.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }
    
    res.status(200).json(membros[0]);
  } catch (error) {
    console.error('Erro ao obter membro:', error);
    res.status(500).json({ error: 'Erro ao obter membro.' });
  }
});

// Listar membros de um ministério específico
router.get('/ministerio/:idMinisterio', verificarToken, async (req, res) => {
  try {
    const { idMinisterio } = req.params;
    
    const query = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      WHERE mm.idMinisterio = @param0
      ORDER BY u.nome
    `;
    
    const membros = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(idMinisterio) }
    ]);
    
    res.status(200).json(membros);
  } catch (error) {
    console.error('Erro ao listar membros do ministério:', error);
    res.status(500).json({ error: 'Erro ao listar membros do ministério.' });
  }
});

// Listar ministérios de um usuário específico
router.get('/usuario/:idUsuario', verificarToken, async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    const query = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      WHERE mm.idUsuario = @param0
      ORDER BY m.nome
    `;
    
    const membros = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(idUsuario) }
    ]);
    
    res.status(200).json(membros);
  } catch (error) {
    console.error('Erro ao listar ministérios do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar ministérios do usuário.' });
  }
});

// Adicionar um membro a um ministério (apenas para admin ou pastor)
router.post('/', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { idUsuario, idMinisterio, funcao } = req.body;
    
    if (!idUsuario || !idMinisterio || !funcao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // Verificar se o usuário existe
    const queryVerificarUsuario = `
      SELECT COUNT(*) as count
      FROM Usuarios
      WHERE id = @param0
    `;
    
    const resultadoUsuario = await db.executeQuery(queryVerificarUsuario, [
      { placeholder: '@param0', value: idUsuario }
    ]);
    
    if (resultadoUsuario[0].count === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }
    
    // Verificar se o ministério existe
    const queryVerificarMinisterio = `
      SELECT COUNT(*) as count
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const resultadoMinisterio = await db.executeQuery(queryVerificarMinisterio, [
      { placeholder: '@param0', value: idMinisterio }
    ]);
    
    if (resultadoMinisterio[0].count === 0) {
      return res.status(400).json({ error: 'Ministério não encontrado.' });
    }
    
    // Verificar se o usuário já é membro deste ministério
    const queryVerificarMembro = `
      SELECT COUNT(*) as count
      FROM MembrosMinisterio
      WHERE idUsuario = @param0 AND idMinisterio = @param1
    `;
    
    const resultadoMembro = await db.executeQuery(queryVerificarMembro, [
      { placeholder: '@param0', value: idUsuario },
      { placeholder: '@param1', value: idMinisterio }
    ]);
    
    if (resultadoMembro[0].count > 0) {
      return res.status(400).json({ error: 'Este usuário já é membro deste ministério.' });
    }
    
    // Inserir novo membro
    const queryInserir = `
      INSERT INTO MembrosMinisterio (idUsuario, idMinisterio, funcao)
      VALUES (@param0, @param1, @param2);
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const resultadoInsercao = await db.executeQuery(queryInserir, [
      { placeholder: '@param0', value: idUsuario },
      { placeholder: '@param1', value: idMinisterio },
      { placeholder: '@param2', value: funcao }
    ]);
    
    const id = resultadoInsercao[0].id;
    
    // Obter informações completas do membro
    const queryObterMembro = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      WHERE mm.id = @param0
    `;
    
    const membros = await db.executeQuery(queryObterMembro, [
      { placeholder: '@param0', value: id }
    ]);
    
    res.status(201).json(membros[0]);
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ error: 'Erro ao adicionar membro.' });
  }
});

// Atualizar um membro (apenas para admin ou pastor)
router.put('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { funcao } = req.body;
    
    if (!funcao) {
      return res.status(400).json({ error: 'A função é obrigatória.' });
    }
    
    // Verificar se o membro existe
    const queryVerificar = `
      SELECT *
      FROM MembrosMinisterio
      WHERE id = @param0
    `;
    
    const membros = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (membros.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }
    
    // Atualizar membro
    const queryAtualizar = `
      UPDATE MembrosMinisterio
      SET funcao = @param0
      WHERE id = @param1
    `;
    
    await db.executeQuery(queryAtualizar, [
      { placeholder: '@param0', value: funcao },
      { placeholder: '@param1', value: parseInt(id) }
    ]);
    
    // Obter membro atualizado
    const queryObterAtualizado = `
      SELECT mm.id, mm.idUsuario, mm.idMinisterio, mm.funcao,
             u.nome as nomeUsuario, m.nome as nomeMinisterio
      FROM MembrosMinisterio mm
      JOIN Usuarios u ON mm.idUsuario = u.id
      JOIN Ministerios m ON mm.idMinisterio = m.id
      WHERE mm.id = @param0
    `;
    
    const membrosAtualizados = await db.executeQuery(queryObterAtualizado, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json(membrosAtualizados[0]);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    res.status(500).json({ error: 'Erro ao atualizar membro.' });
  }
});

// Remover um membro de um ministério (apenas para admin ou pastor)
router.delete('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o membro existe
    const queryVerificar = `
      SELECT *
      FROM MembrosMinisterio
      WHERE id = @param0
    `;
    
    const membros = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (membros.length === 0) {
      return res.status(404).json({ error: 'Membro não encontrado.' });
    }
    
    // Excluir o membro
    const queryExcluir = `
      DELETE FROM MembrosMinisterio
      WHERE id = @param0
    `;
    
    await db.executeQuery(queryExcluir, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json({ message: 'Membro removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro ao remover membro.' });
  }
});

module.exports = router;
