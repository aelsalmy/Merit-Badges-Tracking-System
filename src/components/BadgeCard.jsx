import { useNavigate } from 'react-router-dom';

export default function BadgeCard({ badge, requirements, progress }) {
  const navigate = useNavigate();
  const badgeReqs = requirements.filter((r) => r.badge_id === badge.badge_id);
  const total = badgeReqs.length;
  const completed = badgeReqs.filter((r) =>
    progress.some((p) => p.requirement_id === r.requirement_id && String(p.completed).toUpperCase() === 'TRUE')
  ).length;

  const earned = total > 0 && completed === total;
  const inProgress = completed > 0 && !earned;

  let statusText = 'Not Started';
  let statusClass = 'not-started';
  if (earned) {
    statusText = 'Earned';
    statusClass = 'earned';
  } else if (inProgress) {
    statusText = `In Progress (${completed}/${total})`;
    statusClass = 'in-progress';
  }

  return (
    <div
      className={`badge-card ${statusClass}`}
      onClick={() => navigate(`/badge/${badge.badge_id}`)}
    >
      <h3 className="badge-card-name">{badge.badge_name}</h3>
      <p className="badge-card-desc">{badge.description}</p>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
        />
      </div>
      <span className={`badge-status ${statusClass}`}>{statusText}</span>
    </div>
  );
}
