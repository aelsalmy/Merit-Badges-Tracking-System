import { useParams, useNavigate } from 'react-router-dom';
import RequirementRow from '../components/RequirementRow';

export default function BadgePage({ badges, requirements, progress, onToggle, markedBy, memberId }) {
  const { badgeId } = useParams();
  const navigate = useNavigate();

  const badge = badges.find((b) => b.badge_id === badgeId);
  const badgeReqs = requirements
    .filter((r) => r.badge_id === badgeId)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (!badge) {
    return (
      <div className="badge-page">
        <button className="back-btn" onClick={() => navigate('/')}>Back</button>
        <p className="empty-state">Badge not found.</p>
      </div>
    );
  }

  const completed = badgeReqs.filter((r) =>
    progress.some((p) => p.requirement_id === r.requirement_id && String(p.completed) === 'TRUE')
  ).length;
  const total = badgeReqs.length;
  const earned = total > 0 && completed === total;

  return (
    <div className="badge-page">
      <button className="back-btn" onClick={() => navigate('/')}>&#8592; Back</button>
      <div className="badge-header">
        <h2>{badge.badge_name}</h2>
        <p className="badge-desc">{badge.description}</p>
        <div className="badge-page-status">
          {earned ? (
            <span className="badge-status earned">Earned</span>
          ) : (
            <span className="badge-status in-progress">{completed}/{total} completed</span>
          )}
        </div>
      </div>
      <div className="requirement-list">
        {badgeReqs.map((req) => {
          const entry = progress.find((p) => p.requirement_id === req.requirement_id);
          return (
            <RequirementRow
              key={req.requirement_id}
              requirement={req}
              progressEntry={entry}
              disabled={!memberId || !markedBy}
              onToggle={onToggle}
            />
          );
        })}
      </div>
      {(!memberId || !markedBy) && (
        <p className="hint">Select a scout and enter your name to check off requirements.</p>
      )}
    </div>
  );
}
