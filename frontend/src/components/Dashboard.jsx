import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  CalendarDays, 
  BookOpen, 
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { API_URL } from '../config';

function Dashboard({ selectedDate, setSelectedTab, setSelectedDate }) {
  const [stats, setStats] = useState({
    totalDaysTracked: 0,
    averageProductivity: 0,
    totalTasksCount: 0,
    completedTasksCount: 0,
    missedTasksCount: 0,
    history: [],
    journals: []
  });
  const [loading, setLoading] = useState(true);

  // Load compiled summary metrics from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/logs/stats/summary`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [selectedDate]);

  // Clean date formatter: e.g. "May 18"
  function formatDateLabel(dateStr) {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
  }

  // Complete date formatter: e.g. "Monday, May 18"
  function formatCompleteDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Handle clicking a journal timeline item to navigate back in history to edit/view
  const handleTimelineNavigation = (dateStr) => {
    setSelectedDate(dateStr);
    setSelectedTab('workspace'); // navigate to To-Do checklist & journal workspace
  };

  // SVGs Chart Coordinate Plotter (Pure React + SVG)
  const renderSVGChart = () => {
    const history = stats.history || [];
    if (history.length < 2) {
      return (
        <div className="empty-placeholder" style={{ height: '100%', minHeight: '180px' }}>
          <TrendingUp className="empty-placeholder-icon" />
          <span>Keep checking off daily tasks to map your productivity trends!</span>
          <span style={{ fontSize: '0.78rem', opacity: 0.8 }}>Needs at least 2 days of logs.</span>
        </div>
      );
    }

    // Chart Dimensions
    const width = 580;
    const height = 180;
    const paddingX = 45;
    const paddingY = 25;

    // Calculate coordinates for each data point
    const points = history.map((item, idx) => {
      const x = paddingX + (idx / (history.length - 1)) * (width - 2 * paddingX);
      // In SVG, y is 0 at top. Max height (100% productivity) is near top (paddingY)
      const y = height - paddingY - (item.percent / 100) * (height - 2 * paddingY);
      return { x, y, date: item.date, percent: item.percent };
    });

    // Construct path descriptions
    const pathData = points.reduce((acc, p, idx) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, '');

    // Area path filled to the bottom track line
    const areaPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : '';

    // Draw horizontal reference lines (0%, 25%, 50%, 75%, 100%)
    const refLevels = [0, 25, 50, 75, 100];

    return (
      <div className="svg-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
          <defs>
            {/* Smooth glowing line color gradient */}
            <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-teal)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
            {/* Fade background gradient */}
            <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-teal-glow)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--accent-purple-glow)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* 1. Horizontal Reference Gridlines & Y-Labels */}
          {refLevels.map((level) => {
            const y = height - paddingY - (level / 100) * (height - 2 * paddingY);
            return (
              <g key={level}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  className="chart-grid-line"
                />
                <text 
                  x={paddingX - 10} 
                  y={y + 3} 
                  className="chart-label-y"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* 2. Gradient Area Fill */}
          <path d={areaPathData} className="chart-area" />

          {/* 3. Outer Glowing Line Path */}
          <path d={pathData} className="chart-path" />

          {/* 4. Coordinate Pointer Nodes & X-Labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="5" 
                className="chart-point" 
              />
              <text 
                x={p.x} 
                y={height - 8} 
                className="chart-label-x"
              >
                {formatDateLabel(p.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-purple-glow)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Assembling productivity trends...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* 1. HIGHLIGHTS STATS GRID */}
      <div className="stats-cards-grid">
        {/* A. PRODUCTIVITY AVERAGE */}
        <div className="glass-panel stat-card" style={{ '--card-accent': 'var(--accent-purple)' }}>
          <div className="stat-card-header">
            <span>Productivity Ratio</span>
            <TrendingUp className="stat-card-icon" />
          </div>
          <span className="stat-card-value">{stats.averageProductivity}%</span>
          <p className="stat-card-footer">Average completion rate across all tracked sessions</p>
        </div>

        {/* B. COMPLETED TARGETS */}
        <div className="glass-panel stat-card" style={{ '--card-accent': 'var(--accent-teal)' }}>
          <div className="stat-card-header">
            <span>Completed Actions</span>
            <CheckCircle2 className="stat-card-icon" style={{ color: 'var(--accent-teal)' }} />
          </div>
          <span className="stat-card-value">{stats.completedTasksCount}</span>
          <p className="stat-card-footer">Total target milestones checked off successfully</p>
        </div>

        {/* C. MISSED OPPORTUNITIES */}
        <div className="glass-panel stat-card" style={{ '--card-accent': 'var(--accent-coral)' }}>
          <div className="stat-card-header">
            <span>Missed Milestones</span>
            <XCircle className="stat-card-icon" style={{ color: 'var(--accent-coral)' }} />
          </div>
          <span className="stat-card-value">{stats.missedTasksCount}</span>
          <p className="stat-card-footer">Goals left unchecked. Tomorrow is a fresh journey!</p>
        </div>

        {/* D. DAYS CONFIGURED */}
        <div className="glass-panel stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
          <div className="stat-card-header">
            <span>Days Structured</span>
            <CalendarDays className="stat-card-icon" style={{ color: 'var(--accent-green)' }} />
          </div>
          <span className="stat-card-value">{stats.totalDaysTracked}</span>
          <p className="stat-card-footer">Total daily logs populated inside your dashboard</p>
        </div>
      </div>

      {/* 2. TRENDS CHART & PAST JOURNALS TIMELINE */}
      <div className="dashboard-details-grid">
        {/* A. CHART OF PRODUCTIVITY INDEX */}
        <div className="glass-panel chart-panel">
          <h2 className="panel-title">
            <Sparkles className="panel-title-icon" style={{ color: 'var(--accent-purple)' }} />
            <span>Productivity Trend Tracker</span>
          </h2>
          {renderSVGChart()}
          
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'hsla(0, 0%, 100%, 0.02)', borderRadius: '12px', border: 'var(--border-glass)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready to structure goals for today?</span>
            <button 
              className="glass-btn primary"
              onClick={() => setSelectedTab('workspace')}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <span>Daily Checklist</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* B. HISTORICAL JOURNAL REFLECTIONS TIMELINE */}
        <div className="glass-panel chart-panel">
          <h2 className="panel-title">
            <BookOpen className="panel-title-icon" />
            <span>Reflections Timeline</span>
          </h2>

          <div className="journal-history-list">
            {stats.journals.length === 0 ? (
              <div className="empty-placeholder" style={{ padding: '30px 10px' }}>
                <BookOpen className="empty-placeholder-icon" />
                <span>No journal logs recorded yet. Reflection is key to growth!</span>
              </div>
            ) : (
              stats.journals.map((item, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel journal-history-card"
                  style={{ 
                    cursor: 'pointer',
                    background: 'hsla(0, 0%, 100%, 0.015)',
                    border: '1px solid hsla(0, 0%, 100%, 0.04)'
                  }}
                  onClick={() => handleTimelineNavigation(item.date)}
                  title="Click to view and edit this day's workspace"
                >
                  <div className="journal-history-header">
                    <span className="journal-history-date">{formatCompleteDate(item.date)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>View day</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                  
                  {item.text && (
                    <>
                      <h4 className="journal-history-label">Reflection</h4>
                      <p className="journal-history-text">{item.text}</p>
                    </>
                  )}
                  
                  {item.learned && (
                    <>
                      <h4 className="journal-history-label">What I Learned</h4>
                      <p className="journal-history-learned">{item.learned}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
