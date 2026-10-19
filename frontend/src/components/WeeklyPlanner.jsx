import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  Clock, 
  Tag, 
  X,
  FileText,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Coffee
} from 'lucide-react';
import { API_URL } from '../config';

// Time block config — order, icon, label, color token
const TIME_BLOCKS = [
  { id: 'morning',   label: 'Morning',   icon: Coffee,  color: 'var(--accent-yellow)',  glow: 'hsla(42,85%,55%,0.15)',  range: '5 AM – 12 PM' },
  { id: 'afternoon', label: 'Afternoon', icon: Sun,     color: 'var(--accent-teal)',    glow: 'var(--accent-teal-glow)', range: '12 PM – 5 PM' },
  { id: 'evening',   label: 'Evening',   icon: Sunset,  color: 'var(--accent-coral)',   glow: 'var(--accent-coral-glow)', range: '5 PM – 9 PM' },
  { id: 'night',     label: 'Night',     icon: Moon,    color: 'var(--accent-purple)',  glow: 'var(--accent-purple-glow)', range: '9 PM – 5 AM' },
];

function WeeklyPlanner() {
  const [plans, setPlans] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMondayOfCurrentWeek(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modal Form States
  const [targetDay, setTargetDay] = useState('Monday');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskTimeBlock, setTaskTimeBlock] = useState('morning');
  const [taskStartTime, setTaskStartTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');

  // Get Monday of the week for a given date
  function getMondayOfCurrentWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Format date to YYYY-MM-DD
  function formatDateKey(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Generate the 7 days of the week starting from currentWeekStart
  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const dayDate = new Date(currentWeekStart);
    dayDate.setDate(currentWeekStart.getDate() + idx);
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      name: dayNames[idx],
      dateObj: dayDate,
      dateKey: formatDateKey(dayDate),
      label: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Calculate standard Week ID (e.g., "2026-W21")
  const getWeekId = () => {
    const d = new Date(currentWeekStart);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const weekId = getWeekId();

  // Format HH:MM to 12h display
  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  };

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/api/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching weekly plans:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  // Submit new plan
  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    let dateKey = 'weekly-goals';
    if (targetDay !== 'weekly-goals') {
      const match = weekDays.find(d => d.name === targetDay);
      if (match) dateKey = match.dateKey;
    } else {
      dateKey = weekId;
    }

    try {
      const response = await fetch(`${API_URL}/api/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateKey,
          title: taskTitle.trim(),
          notes: taskNotes.trim(),
          category: taskCategory,
          completed: false,
          timeBlock: targetDay !== 'weekly-goals' ? taskTimeBlock : 'morning',
          startTime: targetDay !== 'weekly-goals' ? taskStartTime : '',
          endTime: targetDay !== 'weekly-goals' ? taskEndTime : ''
        })
      });

      if (response.ok) {
        fetchPlans();
        setTaskTitle('');
        setTaskNotes('');
        setTaskCategory('work');
        setTaskTimeBlock('morning');
        setTaskStartTime('');
        setTaskEndTime('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error saving plan item:', error);
    }
  };

  const handleTogglePlan = async (item) => {
    try {
      const response = await fetch(`${API_URL}/api/plans/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, completed: !item.completed })
      });
      if (response.ok) fetchPlans();
    } catch (error) {
      console.error('Error toggling plan task:', error);
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/plans/${id}`, { method: 'DELETE' });
      if (response.ok) fetchPlans();
    } catch (error) {
      console.error('Error deleting plan task:', error);
    }
  };

  // Filter and sort plans for a date key — sorted by time block order then startTime
  const getPlansForDateKey = (key) => {
    const blockOrder = { morning: 0, afternoon: 1, evening: 2, night: 3 };
    return plans
      .filter(plan => plan.date === key)
      .sort((a, b) => {
        const blockDiff = (blockOrder[a.timeBlock] ?? 0) - (blockOrder[b.timeBlock] ?? 0);
        if (blockDiff !== 0) return blockDiff;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'work':     return { color: 'var(--accent-teal)',   bg: 'var(--accent-teal-glow)',   border: 'hsla(182,85%,46%,0.3)' };
      case 'personal': return { color: 'var(--accent-purple)', bg: 'var(--accent-purple-glow)', border: 'hsla(265,85%,64%,0.3)' };
      case 'health':   return { color: 'var(--accent-coral)',  bg: 'var(--accent-coral-glow)',  border: 'hsla(12,88%,59%,0.3)' };
      case 'learning': return { color: 'var(--accent-yellow)', bg: 'hsla(42,85%,55%,0.15)',     border: 'hsla(42,85%,55%,0.3)' };
      default:         return { color: 'var(--text-secondary)', bg: 'hsla(0,0%,100%,0.05)',     border: 'hsla(0,0%,100%,0.1)' };
    }
  };

  // Render a single plan card (shared between weekly col and day cols)
  const renderPlanCard = (plan) => {
    const styles = getCategoryStyles(plan.category);
    const block = TIME_BLOCKS.find(b => b.id === plan.timeBlock);
    const hasTime = plan.startTime || plan.endTime;
    return (
      <div 
        key={plan._id} 
        className={`planner-task-card ${plan.completed ? 'completed' : ''}`}
        style={{ '--planner-card-accent': styles.color }}
      >
        <div className="planner-card-header">
          <span className="planner-card-title">{plan.title}</span>
          <div className="planner-card-check" onClick={() => handleTogglePlan(plan)}>
            <Check size={16} style={{ color: plan.completed ? 'var(--accent-teal)' : 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Time badge row */}
        {block && (
          <div className="planner-card-time-row">
            <span className="planner-card-time-badge" style={{ '--block-color': block.color, '--block-glow': block.glow }}>
              <block.icon size={10} />
              <span>{block.label}</span>
            </span>
            {hasTime && (
              <span className="planner-card-time-exact">
                <Clock size={10} />
                <span>
                  {plan.startTime ? formatTime12h(plan.startTime) : ''}
                  {plan.startTime && plan.endTime ? ' – ' : ''}
                  {plan.endTime ? formatTime12h(plan.endTime) : ''}
                </span>
              </span>
            )}
          </div>
        )}

        {plan.notes && <p className="planner-card-notes">{plan.notes}</p>}
        <div className="planner-card-footer">
          <span className="planner-card-tag" style={{ '--tag-bg': styles.bg, '--tag-color': styles.color }}>
            {plan.category}
          </span>
          <button className="planner-card-delete" onClick={() => handleDeletePlan(plan._id)}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="planner-view">
      {/* 1. WEEKLY CONTROLS */}
      <div className="planner-controls">
        <div className="planner-controls-header">
          <span className="planner-week-title">Weekly Focus Schedule</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Week ID: {weekId} ({weekDays[0].label} — {weekDays[6].label})
          </span>
        </div>
        <div className="planner-controls-actions">
          <button className="glass-btn" onClick={handlePrevWeek}>&larr; Prev Week</button>
          <button className="glass-btn primary" onClick={() => { setTargetDay('weekly-goals'); setShowAddModal(true); }}>
            <Plus size={16} />
            <span>Schedule Objective</span>
          </button>
          <button className="glass-btn" onClick={handleNextWeek}>Next Week &rarr;</button>
        </div>
      </div>

      {/* 2. PLANNER COLUMNS BOARD */}
      <div className="planner-grid">
        {/* Column A: GENERAL WEEKLY OBJECTIVES */}
        <div className="glass-panel planner-day-column" style={{ borderStyle: 'dashed', borderColor: 'hsla(0,0%,100%,0.15)' }}>
          <div className="planner-day-header">
            <span className="planner-day-name" style={{ color: 'var(--accent-purple)' }}>Weekly Priorities</span>
            <button onClick={() => { setTargetDay('weekly-goals'); setShowAddModal(true); }} className="planner-add-task-btn">
              <Plus size={16} />
            </button>
          </div>
          <div className="planner-day-tasks">
            {getPlansForDateKey(weekId).length === 0 ? (
              <div className="empty-placeholder" style={{ padding: '20px 10px', height: '100%' }}>
                <AlertCircle className="empty-placeholder-icon" />
                <span style={{ fontSize: '0.8rem' }}>Set big objectives for the whole week!</span>
              </div>
            ) : (
              getPlansForDateKey(weekId).map(plan => renderPlanCard(plan))
            )}
          </div>
        </div>

        {/* Days Monday to Sunday */}
        {weekDays.map(day => (
          <div key={day.name} className="glass-panel planner-day-column">
            <div className="planner-day-header">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="planner-day-name">{day.name}</span>
                <span className="planner-day-date">{day.label}</span>
              </div>
              <button onClick={() => { setTargetDay(day.name); setShowAddModal(true); }} className="planner-add-task-btn">
                <Plus size={16} />
              </button>
            </div>
            <div className="planner-day-tasks">
              {getPlansForDateKey(day.dateKey).length === 0 ? (
                <div className="empty-placeholder" style={{ padding: '20px 10px', height: '100%' }}>
                  <Calendar className="empty-placeholder-icon" />
                  <span style={{ fontSize: '0.8rem' }}>Clean sheet! No tasks planned.</span>
                </div>
              ) : (
                getPlansForDateKey(day.dateKey).map(plan => renderPlanCard(plan))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. POPUP MODAL FOR PLANNING ITEMS CREATION */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Schedule Target Objective</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="modal-form">
              {/* Day selection */}
              <div className="modal-field">
                <label>Target Day of Focus</label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', background: 'var(--bg-dark)' }}
                >
                  <option value="weekly-goals">🎯 General Week Priorities</option>
                  {weekDays.map(d => (
                    <option key={d.name} value={d.name}>📅 {d.name} ({d.label})</option>
                  ))}
                </select>
              </div>

              {/* Title input */}
              <div className="modal-field">
                <label>Goal Objective Title</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Project UI wireframe or Go running..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>

              {/* Time block + exact time — only for day-specific plans */}
              {targetDay !== 'weekly-goals' && (
                <>
                  <div className="modal-field">
                    <label>Time of Day</label>
                    <div className="time-block-options">
                      {TIME_BLOCKS.map(block => (
                        <div
                          key={block.id}
                          onClick={() => setTaskTimeBlock(block.id)}
                          className={`time-block-radio ${taskTimeBlock === block.id ? 'active' : ''}`}
                          style={taskTimeBlock === block.id ? { borderColor: block.color, '--block-color': block.color } : { '--block-color': block.color }}
                        >
                          <block.icon size={14} style={{ color: block.color }} />
                          <span style={{ color: taskTimeBlock === block.id ? '#fff' : block.color }}>{block.label}</span>
                          <span className="time-block-range">{block.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-field modal-field-row">
                    <div style={{ flex: 1 }}>
                      <label>Start Time (optional)</label>
                      <input
                        type="time"
                        value={taskStartTime}
                        onChange={(e) => setTaskStartTime(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>End Time (optional)</label>
                      <input
                        type="time"
                        value={taskEndTime}
                        onChange={(e) => setTaskEndTime(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes input */}
              <div className="modal-field">
                <label>Notes / Specific Instructions (Optional)</label>
                <textarea
                  placeholder="e.g. Check Figma templates, target 5 kilometers of path..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="glass-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              {/* Category radio selectors */}
              <div className="modal-field">
                <label>Activity Category Tag</label>
                <div className="category-options">
                  {['work', 'personal', 'health', 'learning'].map(cat => {
                    const styles = getCategoryStyles(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => setTaskCategory(cat)}
                        className={`category-radio ${taskCategory === cat ? 'active' : ''}`}
                        style={taskCategory === cat ? { '--tag-bg': styles.bg, '--tag-border': styles.color, borderColor: styles.color } : {}}
                      >
                        <span style={{ color: taskCategory === cat ? '#fff' : styles.color, textTransform: 'capitalize' }}>
                          {cat}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="modal-actions">
                <button type="button" className="glass-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="glass-btn primary">
                  <Check size={16} />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanner;
