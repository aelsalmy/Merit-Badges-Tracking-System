import { useState, useEffect, useCallback } from 'react';
import { fetchTeamData, markRequirement, addMember } from '../api/sheets';
import TeamSelector from '../components/TeamSelector';
import BadgeSelector from '../components/BadgeSelector';
import TeamTable from '../components/TeamTable';
import AddMemberForm from '../components/AddMemberForm';
import Loader from '../components/Loader';

function getStored(key, fallback = '') {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function setStored(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

export default function TeamPage({ markedBy }) {
  const [team, setTeam] = useState(() => getStored('teamView_team'));
  const [badgeId, setBadgeId] = useState(() => getStored('teamView_badge'));
  const [members, setMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (t) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeamData(t);
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
    loadData(team);
  }, [team, loadData]);

  function handleTeamChange(t) {
    setTeam(t);
    setStored('teamView_team', t);
  }

  function handleBadgeChange(id) {
    setBadgeId(id);
    setStored('teamView_badge', id);
  }

  async function handleToggle(memberId, requirementId, completed) {
    if (!markedBy) return;

    const prev = [...progress];
    setProgress((p) => {
      const existing = p.findIndex(
        (x) => x.member_id === memberId && x.requirement_id === requirementId
      );
      const entry = {
        member_id: memberId,
        requirement_id: requirementId,
        completed: completed ? 'TRUE' : 'FALSE',
        date_completed: new Date().toISOString().split('T')[0],
        marked_by: markedBy,
      };
      if (existing >= 0) {
        const updated = [...p];
        updated[existing] = entry;
        return updated;
      }
      return [...p, entry];
    });

    try {
      await markRequirement({ memberId, requirementId, completed, markedBy });
      const data = await fetchTeamData(team);
      setProgress(data.progress || []);
    } catch {
      setProgress(prev);
    }
  }

  async function handleAddMember({ fullName, team: memberTeam }) {
    const member = await addMember({ fullName, team: memberTeam });
    if (memberTeam === team) {
      setMembers((m) => [...m, member]);
    }
    return member;
  }

  const badgeReqs = badgeId
    ? requirements.filter((r) => r.badge_id === badgeId).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="team-page">
      <div className="team-filters">
        <div className="filter-field">
          <label>Team</label>
          <TeamSelector selectedTeam={team} onChange={handleTeamChange} />
        </div>
        {team && (
          <div className="filter-field">
            <label>Badge</label>
            <BadgeSelector badges={badges} selectedBadgeId={badgeId} onChange={handleBadgeChange} />
          </div>
        )}
        {team && (
          <AddMemberForm defaultTeam={team} onSave={handleAddMember} />
        )}
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-state">
          <p>Failed to load data: {error}</p>
          <button onClick={() => loadData(team)}>Retry</button>
        </div>
      ) : !team ? (
        <p className="empty-state">Select a team to view scout progress.</p>
      ) : !badgeId ? (
        <p className="empty-state">Select a badge to see requirements.</p>
      ) : (
        <TeamTable
          members={members}
          requirements={badgeReqs}
          progress={progress}
          onToggle={handleToggle}
          disabled={!markedBy}
        />
      )}
      {team && badgeId && !markedBy && (
        <p className="hint">Enter your name in the Leader field to check off requirements.</p>
      )}
    </div>
  );
}
