import express from 'express';
import { DayLog } from '../models/schemas.js';

const router = express.Router();

// GET daily log by date (format: YYYY-MM-DD)
router.get('/:date', async (req, res) => {
  const { date } = req.params;
  try {
    let log = await DayLog.findOne({ date });
    if (!log) {
      // Return a blank template if no log exists for the date yet
      return res.json({
        date,
        tasks: [],
        productivityPercent: 0,
        journal: { text: '', learned: '' }
      });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily log', details: error.message });
  }
});

// POST/PUT save or update daily log by date
router.post('/:date', async (req, res) => {
  const { date } = req.params;
  const { tasks, productivityPercent, journal } = req.body;
  
  try {
    const updatedLog = await DayLog.findOneAndUpdate(
      { date },
      { 
        tasks: tasks || [], 
        productivityPercent: typeof productivityPercent === 'number' ? productivityPercent : 0, 
        journal: journal || { text: '', learned: '' }
      },
      { new: true, upsert: true }
    );
    res.json(updatedLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save daily log', details: error.message });
  }
});

// GET aggregated stats and historical productivity chart data
router.get('/stats/summary', async (req, res) => {
  try {
    const logs = await DayLog.find({});
    
    // Sort logs chronologically by date
    const sortedLogs = logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Core aggregates
    const totalDaysTracked = sortedLogs.length;
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let averageProductivitySum = 0;
    const history = []; // array of { date, percent }
    const journals = []; // list of journals written { date, text, learned }

    sortedLogs.forEach(log => {
      averageProductivitySum += log.productivityPercent;
      
      log.tasks.forEach(task => {
        totalTasksCount++;
        if (task.completed) {
          completedTasksCount++;
        }
      });

      history.push({
        date: log.date,
        percent: log.productivityPercent
      });

      if (log.journal && (log.journal.text || log.journal.learned)) {
        journals.push({
          date: log.date,
          text: log.journal.text,
          learned: log.journal.learned
        });
      }
    });

    const averageProductivity = totalDaysTracked > 0 
      ? Math.round(averageProductivitySum / totalDaysTracked) 
      : 0;

    res.json({
      totalDaysTracked,
      averageProductivity,
      totalTasksCount,
      completedTasksCount,
      missedTasksCount: totalTasksCount - completedTasksCount,
      history: history.slice(-14), // Return last 14 days for chart view
      journals: journals.reverse() // Most recent journals first
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compile stats dashboard', details: error.message });
  }
});

export default router;
