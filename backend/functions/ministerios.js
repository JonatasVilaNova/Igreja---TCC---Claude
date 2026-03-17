// Rotas para gestão de ministérios
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { verificarToken, verificarPermissao } = require('./auth');

// Listar todos os ministérios
router.get('/', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT id, nome, descricao, idLider
      FROM Ministerios
      ORDER BY nome
    `;
    
    const ministerios = await db.executeQuery(query);
    res.status(200).json(ministerios);
  } catch (error) {
    console.error('Erro ao listar ministérios:', error);
    res.status(500).json({ error: 'Erro ao listar ministérios.' });
  }
});

// Obter um ministério específico
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, nome, descricao, idLider
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const ministerios = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (ministerios.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }
    
    res.status(200).json(ministerios[0]);
  } catch (error) {
    console.error('Erro ao obter ministério:', error);
    res.status(500).json({ error: 'Erro ao obter ministério.' });
  }
});

// Criar um novo ministério (apenas para admin ou pastor)
router.post('/', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { nome, descricao, idLider } = req.body;
    
    if (!nome || !descricao) {
      return res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
    }
    
    // Verificar se o líder existe (se fornecido)
    if (idLider) {
      const queryVerificarLider = `
        SELECT COUNT(*) as count
        FROM Usuarios
        WHERE id = @param0
      `;
      
      const resultadoLider = await db.executeQuery(queryVerificarLider, [
        { placeholder: '@param0', value: idLider }
      ]);
      
      if (resultadoLider[0].count === 0) {
        return res.status(400).json({ error: 'Líder não encontrado.' });
      }
    }
    
    // Inserir novo ministério
    const queryInserir = `
      INSERT INTO Ministerios (nome, descricao, idLider)
      VALUES (@param0, @param1, @param2);
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const resultadoInsercao = await db.executeQuery(queryInserir, [
      { placeholder: '@param0', value: nome },
      { placeholder: '@param1', value: descricao },
      { placeholder: '@param2', value: idLider || null }
    ]);
    
    const id = resultadoInsercao[0].id;
    
    res.status(201).json({
      id,
      nome,
      descricao,
      idLider: idLider || null
    });
  } catch (error) {
    console.error('Erro ao criar ministério:', error);
    res.status(500).json({ error: 'Erro ao criar ministério.' });
  }
});

// Atualizar um ministério (apenas para admin ou pastor)
router.put('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, idLider } = req.body;
    
    // Verificar se o ministério existe
    const queryVerificar = `
      SELECT *
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const ministerios = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (ministerios.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }
    
    // Verificar se o líder existe (se fornecido)
    if (idLider) {
      const queryVerificarLider = `
        SELECT COUNT(*) as count
        FROM Usuarios
        WHERE id = @param0
      `;
      
      const resultadoLider = await db.executeQuery(queryVerificarLider, [
        { placeholder: '@param0', value: idLider }
      ]);
      
      if (resultadoLider[0].count === 0) {
        return res.status(400).json({ error: 'Líder não encontrado.' });
      }
    }
    
    // Atualizar ministério
    const queryAtualizar = `
      UPDATE Ministerios
      SET nome = @param0, descricao = @param1, idLider = @param2
      WHERE id = @param3
    `;
    
    await db.executeQuery(queryAtualizar, [
      { placeholder: '@param0', value: nome || ministerios[0].nome },
      { placeholder: '@param1', value: descricao || ministerios[0].descricao },
      { placeholder: '@param2', value: idLider !== undefined ? idLider : ministerios[0].idLider },
      { placeholder: '@param3', value: parseInt(id) }
    ]);
    
    // Obter ministério atualizado
    const queryObterAtualizado = `
      SELECT id, nome, descricao, idLider
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const ministeriosAtualizados = await db.executeQuery(queryObterAtualizado, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json(ministeriosAtualizados[0]);
  } catch (error) {
    console.error('Erro ao atualizar ministério:', error);
    res.status(500).json({ error: 'Erro ao atualizar ministério.' });
  }
});

// Excluir um ministério (apenas para admin ou pastor)
router.delete('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o ministério existe
    const queryVerificar = `
      SELECT *
      FROM Ministerios
      WHERE id = @param0
    `;
    
    const ministerios = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (ministerios.length === 0) {
      return res.status(404).json({ error: 'Ministério não encontrado.' });
    }
    
    // Verificar se existem membros, escalas ou conteúdos associados
    const queryVerificarDependencias = `
      SELECT 
        (SELECT COUNT(*) FROM MembrosMinisterio WHERE idMinisterio = @param0) as membros,
        (SELECT COUNT(*) FROM Escalas WHERE idMinisterio = @param0) as escalas,
        (SELECT COUNT(*) FROM Conteudos WHERE idMinisterio = @param0) as conteudos
    `;
    
    const dependencias = await db.executeQuery(queryVerificarDependencias, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (dependencias[0].membros > 0 || dependencias[0].escalas > 0 || dependencias[0].conteudos > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir este ministério pois existem membros, escalas ou conteúdos associados a ele.',
        dependencias: {
          membros: dependencias[0].membros,
          escalas: dependencias[0].escalas,
          conteudos: dependencias[0].conteudos
        }
      });
    }
    
    // Excluir o ministério
    const queryExcluir = `
      DELETE FROM Ministerios
      WHERE id = @param0
    `;
    
    await db.executeQuery(queryExcluir, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json({ message: 'Ministério excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir ministério:', error);
    res.status(500).json({ error: 'Erro ao excluir ministério.' });
  }
});

module.exports = router;
