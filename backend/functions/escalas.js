// Rotas para gestão de escalas
const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { verificarToken, verificarPermissao } = require('./auth');

// Listar todas as escalas
router.get('/', verificarToken, async (req, res) => {
  try {
    const query = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      ORDER BY e.data DESC
    `;
    
    const escalas = await db.executeQuery(query);
    res.status(200).json(escalas);
  } catch (error) {
    console.error('Erro ao listar escalas:', error);
    res.status(500).json({ error: 'Erro ao listar escalas.' });
  }
});

// Obter uma escala específica
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      WHERE e.id = @param0
    `;
    
    const escalas = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (escalas.length === 0) {
      return res.status(404).json({ error: 'Escala não encontrada.' });
    }
    
    res.status(200).json(escalas[0]);
  } catch (error) {
    console.error('Erro ao obter escala:', error);
    res.status(500).json({ error: 'Erro ao obter escala.' });
  }
});

// Listar escalas de um ministério específico
router.get('/ministerio/:idMinisterio', verificarToken, async (req, res) => {
  try {
    const { idMinisterio } = req.params;
    
    const query = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      WHERE e.idMinisterio = @param0
      ORDER BY e.data DESC
    `;
    
    const escalas = await db.executeQuery(query, [
      { placeholder: '@param0', value: parseInt(idMinisterio) }
    ]);
    
    res.status(200).json(escalas);
  } catch (error) {
    console.error('Erro ao listar escalas do ministério:', error);
    res.status(500).json({ error: 'Erro ao listar escalas do ministério.' });
  }
});

// Listar escalas por período
router.get('/periodo/:dataInicio/:dataFim', verificarToken, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.params;
    
    const query = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      WHERE e.data BETWEEN @param0 AND @param1
      ORDER BY e.data
    `;
    
    const escalas = await db.executeQuery(query, [
      { placeholder: '@param0', value: dataInicio },
      { placeholder: '@param1', value: dataFim }
    ]);
    
    res.status(200).json(escalas);
  } catch (error) {
    console.error('Erro ao listar escalas por período:', error);
    res.status(500).json({ error: 'Erro ao listar escalas por período.' });
  }
});

// Criar uma nova escala (apenas para admin ou pastor)
router.post('/', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { idMinisterio, data, descricao } = req.body;
    
    if (!idMinisterio || !data || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
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
    
    // Inserir nova escala
    const queryInserir = `
      INSERT INTO Escalas (idMinisterio, data, descricao)
      VALUES (@param0, @param1, @param2);
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const resultadoInsercao = await db.executeQuery(queryInserir, [
      { placeholder: '@param0', value: idMinisterio },
      { placeholder: '@param1', value: data },
      { placeholder: '@param2', value: descricao }
    ]);
    
    const id = resultadoInsercao[0].id;
    
    // Obter informações completas da escala
    const queryObterEscala = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      WHERE e.id = @param0
    `;
    
    const escalas = await db.executeQuery(queryObterEscala, [
      { placeholder: '@param0', value: id }
    ]);
    
    res.status(201).json(escalas[0]);
  } catch (error) {
    console.error('Erro ao criar escala:', error);
    res.status(500).json({ error: 'Erro ao criar escala.' });
  }
});

// Atualizar uma escala (apenas para admin ou pastor)
router.put('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { idMinisterio, data, descricao } = req.body;
    
    if (!idMinisterio || !data || !descricao) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }
    
    // Verificar se a escala existe
    const queryVerificar = `
      SELECT *
      FROM Escalas
      WHERE id = @param0
    `;
    
    const escalas = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (escalas.length === 0) {
      return res.status(404).json({ error: 'Escala não encontrada.' });
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
    
    // Atualizar escala
    const queryAtualizar = `
      UPDATE Escalas
      SET idMinisterio = @param0, data = @param1, descricao = @param2
      WHERE id = @param3
    `;
    
    await db.executeQuery(queryAtualizar, [
      { placeholder: '@param0', value: idMinisterio },
      { placeholder: '@param1', value: data },
      { placeholder: '@param2', value: descricao },
      { placeholder: '@param3', value: parseInt(id) }
    ]);
    
    // Obter escala atualizada
    const queryObterAtualizada = `
      SELECT e.id, e.idMinisterio, e.data, e.descricao,
             m.nome as nomeMinisterio
      FROM Escalas e
      JOIN Ministerios m ON e.idMinisterio = m.id
      WHERE e.id = @param0
    `;
    
    const escalasAtualizadas = await db.executeQuery(queryObterAtualizada, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json(escalasAtualizadas[0]);
  } catch (error) {
    console.error('Erro ao atualizar escala:', error);
    res.status(500).json({ error: 'Erro ao atualizar escala.' });
  }
});

// Excluir uma escala (apenas para admin ou pastor)
router.delete('/:id', verificarToken, verificarPermissao('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a escala existe
    const queryVerificar = `
      SELECT *
      FROM Escalas
      WHERE id = @param0
    `;
    
    const escalas = await db.executeQuery(queryVerificar, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    if (escalas.length === 0) {
      return res.status(404).json({ error: 'Escala não encontrada.' });
    }
    
    // Excluir a escala
    const queryExcluir = `
      DELETE FROM Escalas
      WHERE id = @param0
    `;
    
    await db.executeQuery(queryExcluir, [
      { placeholder: '@param0', value: parseInt(id) }
    ]);
    
    res.status(200).json({ message: 'Escala excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir escala:', error);
    res.status(500).json({ error: 'Erro ao excluir escala.' });
  }
});

module.exports = router;
