import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  BookOpen, 
  Save, 
  ClipboardList,
  Smile,
  CalendarClock,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Clock
} from 'lucide-react';
import { API_URL } from '../config';

// Shared time block config
const TIME_BLOCKS = [
  { id: 'morning',   label: 'Morning',   icon: Coffee,  color: 'var(--accent-yellow)',  glow: 'hsla(42,85%,55%,0.12)' },
  { id: 'afternoon', label: 'Afternoon', icon: Sun,     color: 'var(--accent-teal)',    glow: 'hsla(182,85%,46%,0.12)' },
  { id: 'evening',   label: 'Evening',   icon: Sunset,  color: 'var(--accent-coral)',   glow: 'hsla(12,88%,59%,0.12)' },
  { id: 'night',     label: 'Night',     icon: Moon,    color: 'var(--accent-purple)',  glow: 'hsla(265,85%,64%,0.12)' },
];

const CATEGORY_COLORS = {
  work:     { color: 'var(--accent-teal)',   bg: 'var(--accent-teal-glow)' },
  personal: { color: 'var(--accent-purple)', bg: 'var(--accent-purple-glow)' },
  health:   { color: 'var(--accent-coral)',  bg: 'var(--accent-coral-glow)' },
  learning: { color: 'var(--accent-yellow)', bg: 'hsla(42,85%,55%,0.15)' },
};

function DailyWorkspace({ selectedDate }) {
  const [tasks, setTasks] = useState([]);
  const [scheduledPlans, setScheduledPlans] = useState([]); // today's plans from the planner
  const [taskText, setTaskText] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journalLearned, setJournalLearned] = useState('');
  const [percent, setPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load daily log + today's scheduled plans whenever date changes
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [logRes, plansRes] = await Promise.all([
          fetch(`${API_URL}/api/logs/${selectedDate}`),
          fetch(`${API_URL}/api/plans?date=${selectedDate}`)
        ]);

        if (logRes.ok) {
          const data = await logRes.json();
          setTasks(data.tasks || []);
          setJournalText(data.journal?.text || '');
          setJournalLearned(data.journal?.learned || '');
          setPercent(data.productivityPercent || 0);
        }

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          // Sort by time block order then startTime
          const blockOrder = { morning: 0, afternoon: 1, evening: 2, night: 3 };
          const sorted = plansData.sort((a, b) => {
            const bd = (blockOrder[a.timeBlock] ?? 0) - (blockOrder[b.timeBlock] ?? 0);
            return bd !== 0 ? bd : (a.startTime || '').localeCompare(b.startTime || '');
          });
          setScheduledPlans(sorted);
        }
      } catch (error) {
        console.error('Error fetching daily data:', error);
      }
    };
    fetchAll();
  }, [selectedDate]);

  // Recalculate productivity percentage whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) {
      setPercent(0);
      return;
    }
    const completedCount = tasks.filter(t => t.completed).length;
    setPercent(Math.round((completedCount / tasks.length) * 100));
  }, [tasks]);

  // Add a free-text task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    const newTasks = [...tasks, { id: Date.now().toString(), text: taskText.trim(), completed: false }];
    setTasks(newTasks);
    setTaskText('');
    saveLog(newTasks, journalText, journalLearned);
  };

  const handleToggleTask = (id) => {
    const newTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    saveLog(newTasks, journalText, journalLearned);
  };

  const handleDeleteTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    saveLog(newTasks, journalText, journalLearned);
  };

  // Toggle a scheduled plan's done state — writes to Plan AND mirrors into DayLog tasks
  const handleToggleScheduledPlan = async (plan) => {
    const newCompleted = !plan.completed;

    // 1. Update the plan's own completed flag
    try {
      await fetch(`${API_URL}/api/plans/${plan._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...plan, completed: newCompleted })
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      return;
    }

    // 2. Mirror into DayLog tasks: find or create the matching task entry
    const existingIdx = tasks.findIndex(t => t.planId === plan._id);
    let newTasks;
    if (existingIdx !== -1) {
      // Update existing mirrored task
      newTasks = tasks.map((t, i) => i === existingIdx ? { ...t, completed: newCompleted } : t);
    } else {
      // First-time tick: create a mirrored task from the plan
      const mirroredTask = {
        id: `plan-${plan._id}`,
        planId: plan._id,
        text: plan.title,
        completed: newCompleted,
        timeBlock: plan.timeBlock,
        startTime: plan.startTime
      };
      newTasks = [...tasks, mirroredTask];
    }
    setTasks(newTasks);
    saveLog(newTasks, journalText, journalLearned);

    // Optimistically update local scheduled plans state
    setScheduledPlans(prev => prev.map(p => p._id === plan._id ? { ...p, completed: newCompleted } : p));
  };

  const saveLog = async (currentTasks = tasks, currentJournal = journalText, currentLearned = journalLearned) => {
    setIsSaving(true);
    setSaveSuccess(false);
    let currentPercent = 0;
    if (currentTasks.length > 0) {
      currentPercent = Math.round((currentTasks.filter(t => t.completed).length / currentTasks.length) * 100);
    }
    try {
      const response = await fetch(`${API_URL}/api/logs/${selectedDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: currentTasks,
          productivityPercent: currentPercent,
          journal: { text: currentJournal, learned: currentLearned }
        })
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error saving daily log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    saveLog(tasks, journalText, journalLearned);
  };

  // Format HH:MM to 12h display
  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  // Group scheduled plans by time block
  const groupedPlans = TIME_BLOCKS.reduce((acc, block) => {
    const items = scheduledPlans.filter(p => p.timeBlock === block.id);
    if (items.length > 0) acc.push({ block, items });
    return acc;
  }, []);

  // Schedule progress
  const totalScheduled = scheduledPlans.length;
  const doneScheduled = scheduledPlans.filter(p => p.completed).length;
  const schedulePercent = totalScheduled > 0 ? Math.round((doneScheduled / totalScheduled) * 100) : 0;

  // Radial Ring
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const getProductivityMessage = () => {
    if (tasks.length === 0 && totalScheduled === 0) return { title: 'Empty Slate', desc: 'No tasks scheduled for today. Add some below or plan via the Weekly Planner!' };
    if (percent === 0) return { title: 'Zeroing In', desc: 'Ready to start? Tick off your first completed task to get rolling!' };
    if (percent < 40) return { title: 'Laying Foundations', desc: 'Good start! Small steps build giant progress. Keep going!' };
    if (percent < 70) return { title: 'Gaining Momentum', desc: 'Over halfway! You are making steady, active progress.' };
    if (percent < 100) return { title: 'Highly Effective', desc: 'Superb focus! Almost a perfect completion. Wrap up strong!' };
    return { title: 'Perfect Synergy! 🎉', desc: 'Absolute masterclass! Every daily target checked. Take a bow!' };
  };

  const feedback = getProductivityMessage();

  return (
    <div className="workspace-view">

      {/* ── TODAY'S SCHEDULE PANEL ── */}
      {totalScheduled > 0 && (
        <div className="glass-panel schedule-panel">
          <div className="schedule-panel-header">
            <div className="schedule-panel-title">
              <CalendarClock className="panel-title-icon" style={{ color: 'var(--accent-teal)' }} />
              <span>Today's Schedule</span>
            </div>
            <div className="schedule-progress-pill">
              <div
                className="schedule-progress-bar"
                style={{ width: `${schedulePercent}%` }}
              />
              <span className="schedule-progress-label">{doneScheduled} / {totalScheduled} done</span>
            </div>
          </div>

          {groupedPlans.map(({ block, items }) => {
            const BlockIcon = block.icon;
            return (
              <div key={block.id} className="schedule-block">
                <div className="schedule-block-heading" style={{ '--block-color': block.color }}>
                  <BlockIcon size={14} />
                  <span>{block.label}</span>
                </div>

                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32px' }}></th>
                      <th>Activity</th>
                      <th style={{ width: '110px' }}>Time</th>
                      <th style={{ width: '90px' }}>Category</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(plan => {
                      const cat = CATEGORY_COLORS[plan.category] || CATEGORY_COLORS.work;
                      const hasTime = plan.startTime || plan.endTime;
                      return (
                        <tr
                          key={plan._id}
                          className={`schedule-row ${plan.completed ? 'done' : ''}`}
                          onClick={() => handleToggleScheduledPlan(plan)}
                        >
                          <td>
                            <div className={`schedule-checkbox ${plan.completed ? 'checked' : ''}`}>
                              {plan.completed && <Check size={12} strokeWidth={3} />}
                            </div>
                          </td>
                          <td>
                            <span className="schedule-title">{plan.title}</span>
                            {plan.notes && <span className="schedule-notes">{plan.notes}</span>}
                          </td>
                          <td className="schedule-time">
                            {hasTime ? (
                              <>
                                <Clock size={11} />
                                <span>
                                  {plan.startTime ? formatTime12h(plan.startTime) : ''}
                                  {plan.startTime && plan.endTime ? ' – ' : ''}
                                  {plan.endTime ? formatTime12h(plan.endTime) : ''}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span
                              className="schedule-cat-tag"
                              style={{ '--tag-color': cat.color, '--tag-bg': cat.bg }}
                            >
                              {plan.category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`schedule-status-badge ${plan.completed ? 'done' : 'pending'}`}>
                              {plan.completed ? 'Done' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <div className="workspace-grid">
        {/* A. TO-DO CHECKLIST CARD */}
        <div className="glass-panel checklist-panel">
          <h2 className="panel-title">
            <ClipboardList className="panel-title-icon" />
            <span>Today's Action Objectives</span>
          </h2>
          
          <form onSubmit={handleAddTask} className="task-creator">
            <input 
              type="text" 
              placeholder="Add a new goal or work objective..." 
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="glass-input"
            />
            <button type="submit" className="glass-btn primary">
              <Plus size={18} />
              <span>Add Target</span>
            </button>
          </form>

          <div className="tasks-list">
            {tasks.filter(t => !t.planId).length === 0 ? (
              <div className="empty-placeholder">
                <ClipboardList className="empty-placeholder-icon" />
                <span>No manual targets added yet. Add some above!</span>
              </div>
            ) : (
              tasks.filter(t => !t.planId).map(task => (
                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-item-left" onClick={() => handleToggleTask(task.id)}>
                    <div className="custom-checkbox">
                      {task.completed && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="task-text">{task.text}</span>
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)} className="task-delete-btn" title="Delete goal">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* B. PRODUCTIVITY DIAL RING CARD */}
        <div className="glass-panel productivity-ring-card">
          <h2 className="panel-title" style={{ marginBottom: '10px' }}>
            <Smile className="panel-title-icon" style={{ color: 'var(--accent-teal)' }} />
            <span>Productivity Matrix</span>
          </h2>
          
          <div className="radial-progress-wrapper">
            <svg className="radial-progress-svg">
              <defs>
                <linearGradient id="radial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-teal)" />
                  <stop offset="100%" stopColor="var(--accent-purple)" />
                </linearGradient>
              </defs>
              <circle className="radial-track" cx="90" cy="90" r={radius} />
              <circle
                className="radial-progress-bar"
                cx="90" cy="90" r={radius}
                style={{ strokeDashoffset, strokeDasharray: circumference }}
              />
            </svg>
            <div className="radial-percentage-text">
              <span className="radial-number">{percent}%</span>
              <span className="radial-label">Productive</span>
            </div>
          </div>

          <h3 className="productivity-status-title" style={{
            background: 'linear-gradient(135deg, #ffffff 30%, var(--accent-teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {feedback.title}
          </h3>
          <p className="productivity-status-desc">{feedback.desc}</p>

          {/* Mini schedule progress bar inside the ring card */}
          {totalScheduled > 0 && (
            <div className="schedule-mini-stats">
              <span>Scheduled</span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{doneScheduled}/{totalScheduled}</span>
              <span style={{ color: 'var(--text-muted)' }}>{schedulePercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* C. JOURNAL REFLECTIONS CARD */}
      <div className="glass-panel journal-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="journal-header">
            <BookOpen className="journal-header-icon" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Evening Reflections & Journal</h2>
          </div>
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`glass-btn ${saveSuccess ? 'success' : ''}`}
            style={{
              borderColor: saveSuccess ? 'var(--accent-green)' : 'hsla(0,0%,100%,0.08)',
              background: saveSuccess ? 'var(--accent-green-glow)' : 'hsla(0,0%,100%,0.05)',
              color: saveSuccess ? 'var(--accent-green)' : 'var(--text-primary)',
              minWidth: '120px',
              justifyContent: 'center'
            }}
          >
            {saveSuccess ? (
              <><Check size={16} /><span>Saved Log!</span></>
            ) : (
              <><Save size={16} /><span>{isSaving ? 'Saving...' : 'Save Reflections'}</span></>
            )}
          </button>
        </div>

        <form onSubmit={handleManualSave} className="journal-textarea-group">
          <div className="journal-input-wrapper">
            <label htmlFor="reflections-input">Reflective Journal (How did your day go? Events, emotions, obstacles...)</label>
            <textarea
              id="reflections-input"
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Today was filled with... I felt focused when... I hit a roadblock doing..."
              className="glass-textarea"
            />
          </div>

          <div className="journal-input-wrapper">
            <label htmlFor="learned-input">Key Learnings (What skills did you develop, concepts did you understand, or key highlights?)</label>
            <textarea
              id="learned-input"
              value={journalLearned}
              onChange={(e) => setJournalLearned(e.target.value)}
              placeholder="I learned a new React custom hook concept... I realized that breaking down work makes it 2x faster..."
              className="glass-textarea learned"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default DailyWorkspace;
