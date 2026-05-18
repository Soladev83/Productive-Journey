import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Sparkles,
  Database,
  CalendarDays
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import DailyWorkspace from './components/DailyWorkspace';
import WeeklyPlanner from './components/WeeklyPlanner';

function App() {
  const [activeTab, setActiveTab] = useState('workspace'); // default to workspace daily todo
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [dbStatus, setDbStatus] = useState({ online: false, mode: 'Checking...' });
  const [greeting, setGreeting] = useState('Welcome');

  // Format today's date into YYYY-MM-DD
  function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Generate date display text: e.g., "Monday, May 18, 2026"
  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Update dynamic time of day greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [selectedDate]);

  // Fetch API Health / DB Connection Status
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch('http://localhost:5000/');
        if (response.ok) {
          const data = await response.json();
          setDbStatus({
            online: true,
            mode: data.databaseMode
          });
        } else {
          setDbStatus({ online: false, mode: 'Server Offline' });
        }
      } catch (error) {
        setDbStatus({ online: false, mode: 'Server Offline' });
      }
    };

    checkApi();
    // Check again every 30 seconds
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* 1. FLOATING SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Sparkles size={22} className="text-white animate-pulse" />
          </div>
          <span className="logo-text">Journey</span>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="nav-item-icon" />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <CheckSquare className="nav-item-icon" />
            <span>Daily Workspace</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveTab('planner')}
          >
            <Calendar className="nav-item-icon" />
            <span>Weekly Planner</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <div className="user-avatar">D</div>
            <div className="user-detail">
              <span className="user-name">Sola pc</span>
              <span className="user-tag">Productive User</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: dbStatus.online ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
            <Database size={12} />
            <span>{dbStatus.mode}</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <main className="main-viewport">
        {/* Dynamic Page Header */}
        <header className="content-header">
          <div className="header-title-container">
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              {greeting}, Sola!
            </h1>
            <span className="header-subtitle">
              {activeTab === 'dashboard' && "Track your productivity trends and review reflections"}
              {activeTab === 'workspace' && "Organize today's list, check your scores, and journal"}
              {activeTab === 'planner' && "Schedule your weekly actions and categorize your focus"}
            </span>
          </div>

          {/* Global Date controller for statistics sync */}
          {activeTab !== 'planner' && (
            <div className="date-controller">
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 14px', borderRadius: '12px' }}>
                <CalendarDays size={18} style={{ color: 'var(--accent-teal)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {formatDateDisplay(selectedDate)}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input"
                  style={{ border: 'none', background: 'transparent', padding: '2px', cursor: 'pointer', width: '28px', color: 'transparent' }}
                />
              </div>
              <button
                className="glass-btn"
                onClick={() => setSelectedDate(getTodayString())}
              >
                Today
              </button>
            </div>
          )}
        </header>

        {/* 3. PAGE VIEW ROUTING */}
        <section className="page-view-content">
          {activeTab === 'dashboard' && (
            <Dashboard
              selectedDate={selectedDate}
              setSelectedTab={setActiveTab}
              setSelectedDate={setSelectedDate}
            />
          )}
          {activeTab === 'workspace' && (
            <DailyWorkspace
              selectedDate={selectedDate}
            />
          )}
          {activeTab === 'planner' && (
            <WeeklyPlanner />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
