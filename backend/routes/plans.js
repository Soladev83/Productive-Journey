import express from 'express';
import { Plan } from '../models/schemas.js';

const router = express.Router();

// GET all planned schedules (with optional filter by date/weekId)
router.get('/', async (req, res) => {
  const { date } = req.query; // date can represent YYYY-MM-DD or week ID like YYYY-WW
  const filter = {};
  if (date) {
    filter.date = date;
  }
  
  try {
    const plans = await Plan.find(filter);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch planned schedules', details: error.message });
  }
});

// POST create a new planned task/goal
router.post('/', async (req, res) => {
  const { date, title, notes, category, completed } = req.body;
  if (!date || !title) {
    return res.status(400).json({ error: 'Date and Title are required' });
  }
  
  try {
    const newPlan = await Plan.create({
      date,
      title,
      notes: notes || '',
      category: category || 'work',
      completed: completed || false
    });
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan task', details: error.message });
  }
});

// PUT update an existing plan task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, notes, category, completed, date } = req.body;
  
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { title, notes, category, completed, date },
      { new: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ error: 'Plan task not found' });
    }
    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan task', details: error.message });
  }
});

// DELETE remove a plan task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await Plan.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Plan task not found' });
    }
    res.json({ message: 'Plan task successfully deleted', id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plan task', details: error.message });
  }
});

export default router;
