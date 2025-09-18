const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// 認証チェックミドルウェア
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// TODO一覧取得
router.get('/api/todos', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;
    const result = await pool.query(
      'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// TODO作成
router.post('/api/todos', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING *',
      [userId, title.trim()]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// TODO更新（完了状態の切り替え）
router.put('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;
    const todoId = req.params.id;
    const { completed } = req.body;

    // 所有者チェック
    const checkResult = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const result = await pool.query(
      'UPDATE todos SET completed = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [completed, todoId, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// TODO削除
router.delete('/api/todos/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.sub;
    const todoId = req.params.id;

    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *',
      [todoId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
