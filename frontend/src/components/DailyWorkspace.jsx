import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  BookOpen, 
  Save, 
  ClipboardList,
  Smile
} from 'lucide-react';

function DailyWorkspace({ selectedDate }) {
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journalLearned, setJournalLearned] = useState('');
  const [percent, setPercent] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load daily data whenever date changes
  useEffect(() => {
    const fetchDailyLog = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/logs/${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
          setJournalText(data.journal?.text || '');
          setJournalLearned(data.journal?.learned || '');
          setPercent(data.productivityPercent || 0);
        }
      } catch (error) {
        console.error('Error fetching daily log:', error);
      }
    };
    
    fetchDailyLog();
  }, [selectedDate]);

  // Recalculate productivity percentage whenever tasks checklist updates
  useEffect(() => {
    if (tasks.length === 0) {
      setPercent(0);
      return;
    }
    const completedCount = tasks.filter(t => t.completed).length;
    const computedPercent = Math.round((completedCount / tasks.length) * 100);
    setPercent(computedPercent);
  }, [tasks]);

  // Handle adding a task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTasks = [
      ...tasks,
      {
        id: Date.now().toString(),
        text: taskText.trim(),
        completed: false
      }
    ];
    setTasks(newTasks);
    setTaskText('');
    
    // Auto-save update
    saveLog(newTasks, journalText, journalLearned);
  };

  // Toggle task complete status
  const handleToggleTask = (id) => {
    const newTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    
    // Auto-save update
    saveLog(newTasks, journalText, journalLearned);
  };

  // Delete a task
  const handleDeleteTask = (id) => {
    const newTasks = tasks.filter(task => task.id !== id);
    setTasks(newTasks);
    
    // Auto-save update
    saveLog(newTasks, journalText, journalLearned);
  };

  // API Call to Save/Update Database
  const saveLog = async (currentTasks = tasks, currentJournal = journalText, currentLearned = journalLearned) => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Compute current percentage to save
    let currentPercent = 0;
    if (currentTasks.length > 0) {
      const completedCount = currentTasks.filter(t => t.completed).length;
      currentPercent = Math.round((completedCount / currentTasks.length) * 100);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/logs/${selectedDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: currentTasks,
          productivityPercent: currentPercent,
          journal: {
            text: currentJournal,
            learned: currentLearned
          }
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

  // Manual save for Journal updates
  const handleManualSave = (e) => {
    e.preventDefault();
    saveLog(tasks, journalText, journalLearned);
  };

  // Radial Ring progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.4
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Custom feedback evaluation message
  const getProductivityMessage = () => {
    if (tasks.length === 0) return { title: 'Empty Slate', desc: 'No tasks scheduled for today. Add some above to start tracking!' };
    if (percent === 0) return { title: 'Zeroing In', desc: 'Ready to start? Tick off your first completed task to get rolling!' };
    if (percent < 40) return { title: 'Laying Foundations', desc: 'Good start! Small steps build giant progress. Keep going!' };
    if (percent < 70) return { title: 'Gaining Momentum', desc: 'Over halfway! You are making steady, active progress.' };
    if (percent < 100) return { title: 'Highly Effective', desc: 'Superb focus! Almost a perfect completion. Wrap up strong!' };
    return { title: 'Perfect Synergy! 🎉', desc: 'Absolute masterclass! Every daily target checked. Take a bow!' };
  };

  const feedback = getProductivityMessage();

  return (
    <div className="workspace-view">
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
            {tasks.length === 0 ? (
              <div className="empty-placeholder">
                <ClipboardList className="empty-placeholder-icon" />
                <span>No targets scheduled yet. Let's outline some steps for today!</span>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <div 
                    className="task-item-left"
                    onClick={() => handleToggleTask(task.id)}
                  >
                    <div className="custom-checkbox">
                      {task.completed && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="task-text">{task.text}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="task-delete-btn"
                    title="Delete goal"
                  >
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
              <circle 
                className="radial-track"
                cx="90"
                cy="90"
                r={radius}
              />
              <circle 
                className="radial-progress-bar"
                cx="90"
                cy="90"
                r={radius}
                style={{ 
                  strokeDashoffset,
                  strokeDasharray: circumference
                }}
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
              borderColor: saveSuccess ? 'var(--accent-green)' : 'hsla(0, 0%, 100%, 0.08)',
              background: saveSuccess ? 'var(--accent-green-glow)' : 'hsla(0, 0%, 100%, 0.05)',
              color: saveSuccess ? 'var(--accent-green)' : 'var(--text-primary)',
              minWidth: '120px',
              justifyContent: 'center'
            }}
          >
            {saveSuccess ? (
              <>
                <Check size={16} />
                <span>Saved Log!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Reflections'}</span>
              </>
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
