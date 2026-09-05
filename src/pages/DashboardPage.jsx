import { useState, useEffect, useMemo } from 'react';
import { fetchDashboardData } from '../api/sheets';
import Loader from '../components/Loader';

const TEAMS = [
  'Smurfs', 'Cubs', 'Sea Scouts', 'Senior Scouts', 'Rovers',
  'Fairies', 'Brownies', 'Girl Guide', 'Senior Guides',
];

export default function DashboardPage() {
  const [members, setMembers] = useState([]);
  const [badges, setBadges] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardData();
        setMembers(data.members || []);
        setBadges(data.badges || []);
        setRequirements(data.requirements || []);
        setProgress(data.progress || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const teamSummary = useMemo(() => {
    return TEAMS.map((team) => {
      const teamMembers = members.filter((m) => m.team === team);
      const memberIds = new Set(teamMembers.map((m) => m.member_id));

      let totalEarned = 0;
      badges.forEach((badge) => {
        const badgeReqs = requirements.filter((r) => r.badge_id === badge.badge_id);
        if (badgeReqs.length === 0) return;
        teamMembers.forEach((member) => {
          const allDone = badgeReqs.every((req) => {
            const p = progress.find(
              (pr) => pr.member_id === member.member_id && pr.requirement_id === req.requirement_id
            );
            return p && String(p.completed).toUpperCase() === 'TRUE';
          });
          if (allDone) totalEarned++;
        });
      });

      return {
        team,
        memberCount: teamMembers.length,
        totalEarned,
      };
    });
  }, [members, badges, requirements, progress]);

  const teamDetail = useMemo(() => {
    if (!selectedTeam) return null;
    const teamMembers = members.filter((m) => m.team === selectedTeam);

    return badges.map((badge) => {
      const badgeReqs = requirements.filter((r) => r.badge_id === badge.badge_id);
      if (badgeReqs.length === 0) {
        return { badge, earned: 0, inProgress: 0, notStarted: teamMembers.length, total: teamMembers.length };
      }

      let earned = 0;
      let inProgress = 0;
      let notStarted = 0;

      teamMembers.forEach((member) => {
        let completedCount = 0;
        badgeReqs.forEach((req) => {
          const p = progress.find(
            (pr) => pr.member_id === member.member_id && pr.requirement_id === req.requirement_id
          );
          if (p && String(p.completed).toUpperCase() === 'TRUE') completedCount++;
        });

        if (completedCount === badgeReqs.length) earned++;
        else if (completedCount > 0) inProgress++;
        else notStarted++;
      });

      return { badge, earned, inProgress, notStarted, total: teamMembers.length };
    });
  }, [selectedTeam, members, badges, requirements, progress]);

  if (loading) return <Loader />;
  if (error) return <div className="error-state"><p>Failed to load: {error}</p></div>;

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>

      <div className="dashboard-grid">
        {teamSummary.map(({ team, memberCount, totalEarned }) => (
          <div
            key={team}
            className={`dashboard-card ${selectedTeam === team ? 'selected' : ''}`}
            onClick={() => setSelectedTeam(selectedTeam === team ? '' : team)}
          >
            <h3 className="dashboard-card-team">{team}</h3>
            <div className="dashboard-card-stats">
              <div className="dashboard-stat">
                <span className="stat-value">{memberCount}</span>
                <span className="stat-label">Scouts</span>
              </div>
              <div className="dashboard-stat">
                <span className="stat-value">{totalEarned}</span>
                <span className="stat-label">Badges Earned</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTeam && teamDetail && (
        <div className="dashboard-detail">
          <h3>{selectedTeam} — Badge Breakdown</h3>
          <div className="detail-table-wrapper">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Badge</th>
                  <th>Earned</th>
                  <th>In Progress</th>
                  <th>Not Started</th>
                </tr>
              </thead>
              <tbody>
                {teamDetail.map(({ badge, earned, inProgress, notStarted, total }) => (
                  <tr key={badge.badge_id}>
                    <td className="detail-badge-name">{badge.badge_name}</td>
                    <td>
                      <span className="detail-earned">{earned}</span>
                      <span className="detail-total">/{total}</span>
                    </td>
                    <td>
                      <span className="detail-in-progress">{inProgress}</span>
                      <span className="detail-total">/{total}</span>
                    </td>
                    <td>
                      <span className="detail-not-started">{notStarted}</span>
                      <span className="detail-total">/{total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
