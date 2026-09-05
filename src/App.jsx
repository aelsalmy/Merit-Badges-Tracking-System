import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { fetchAllData, fetchProgress, markRequirement } from './api/sheets';
import MemberSelector from './components/MemberSelector';
import Loader from './components/Loader';
import HomePage from './pages/HomePage';
import BadgePage from './pages/BadgePage';
import TeamPage from './pages/TeamPage';
import CreateBadgePage from './pages/CreateBadgePage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function getStored(key, fallback = '') {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function setStored(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function AppContent() {
  const location = useLocation();
  const isScoutView = location.pathname === '/' || location.pathname.startsWith('/badge/');

  const [members, setMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState([]);
  const [memberId, setMemberId] = useState(() => getStored('memberId'));
  const [markedBy, setMarkedBy] = useState(() => getStored('markedBy'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = useCallback(async (mid) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllData(mid || undefined);
      setMembers(data.members || []);
      setBadges(data.badges || []);
      setRequirements(data.requirements || []);
      setProgress(data.progress || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isScoutView) {
      loadData(memberId);
    }
  }, [memberId, isScoutView, loadData]);

  function handleMemberChange(id) {
    setMemberId(id);
    setStored('memberId', id);
  }

  function handleMarkedByChange(name) {
    setMarkedBy(name);
    setStored('markedBy', name);
  }

  async function handleToggle(requirementId, completed) {
    if (!memberId || !markedBy) return;

    const prev = [...progress];
    setProgress((p) => {
      const existing = p.findIndex((x) => x.requirement_id === requirementId);
      if (existing >= 0) {
        const updated = [...p];
        updated[existing] = {
          ...updated[existing],
          completed: completed ? 'TRUE' : 'FALSE',
          date_completed: new Date().toISOString().split('T')[0],
          marked_by: markedBy,
        };
        return updated;
      }
      return [...p, {
        member_id: memberId,
        requirement_id: requirementId,
        completed: completed ? 'TRUE' : 'FALSE',
        date_completed: new Date().toISOString().split('T')[0],
        marked_by: markedBy,
      }];
    });

    try {
      await markRequirement({ memberId, requirementId, completed, markedBy });
      const fresh = await fetchProgress(memberId);
      setProgress(fresh);
    } catch {
      setProgress(prev);
    }
  }

  return (
    <div className="app-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">Badge Tracker</h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setSidebarOpen(false)}>
            Scout View
          </NavLink>
          <NavLink to="/team" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setSidebarOpen(false)}>
            Team View
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setSidebarOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/create-badge" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'} onClick={() => setSidebarOpen(false)}>
            Create Badge
          </NavLink>
        </nav>

        <div className="sidebar-fields">
          <div className="sidebar-field">
            <label htmlFor="leader-name">Leader</label>
            <input
              id="leader-name"
              type="text"
              placeholder="Your name"
              value={markedBy}
              onChange={(e) => handleMarkedByChange(e.target.value)}
            />
          </div>
          {isScoutView && (
            <div className="sidebar-field">
              <label htmlFor="member-select">Scout</label>
              <MemberSelector
                members={members}
                selectedId={memberId}
                onChange={handleMemberChange}
              />
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <Loader />
              ) : error ? (
                <div className="error-state">
                  <p>Failed to load data: {error}</p>
                  <button onClick={() => loadData(memberId)}>Retry</button>
                </div>
              ) : !memberId ? (
                <p className="empty-state">Select a scout from the sidebar to view their badge progress.</p>
              ) : (
                <HomePage
                  badges={badges}
                  requirements={requirements}
                  progress={progress}
                />
              )
            }
          />
          <Route
            path="/badge/:badgeId"
            element={
              <BadgePage
                badges={badges}
                requirements={requirements}
                progress={progress}
                onToggle={handleToggle}
                markedBy={markedBy}
                memberId={memberId}
              />
            }
          />
          <Route
            path="/team"
            element={<TeamPage markedBy={markedBy} />}
          />
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          <Route
            path="/create-badge"
            element={<CreateBadgePage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
