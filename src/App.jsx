import { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { fetchAllData, fetchProgress, markRequirement } from './api/sheets';
import MemberSelector from './components/MemberSelector';
import Loader from './components/Loader';
import HomePage from './pages/HomePage';
import BadgePage from './pages/BadgePage';
import './App.css';

function getStored(key, fallback = '') {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function setStored(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

export default function App() {
  const [members, setMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState([]);
  const [memberId, setMemberId] = useState(() => getStored('memberId'));
  const [markedBy, setMarkedBy] = useState(() => getStored('markedBy'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    loadData(memberId);
  }, [memberId, loadData]);

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
    <HashRouter>
      <div className="app">
        <header className="top-bar">
          <div className="top-bar-field">
            <label htmlFor="leader-name">Leader</label>
            <input
              id="leader-name"
              type="text"
              placeholder="Your name"
              value={markedBy}
              onChange={(e) => handleMarkedByChange(e.target.value)}
            />
          </div>
          <div className="top-bar-field">
            <label htmlFor="member-select">Scout</label>
            <MemberSelector
              members={members}
              selectedId={memberId}
              onChange={handleMemberChange}
            />
          </div>
        </header>

        <main className="main-content">
          {loading ? (
            <Loader />
          ) : error ? (
            <div className="error-state">
              <p>Failed to load data: {error}</p>
              <button onClick={() => loadData(memberId)}>Retry</button>
            </div>
          ) : !memberId ? (
            <p className="empty-state">Select a scout to view their badge progress.</p>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    badges={badges}
                    requirements={requirements}
                    progress={progress}
                  />
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
            </Routes>
          )}
        </main>
      </div>
    </HashRouter>
  );
}
