import BadgeCard from '../components/BadgeCard';

export default function HomePage({ badges, requirements, progress }) {
  if (badges.length === 0) {
    return <p className="empty-state">No badges available yet.</p>;
  }

  return (
    <div className="badge-grid">
      {badges.map((badge) => (
        <BadgeCard
          key={badge.badge_id}
          badge={badge}
          requirements={requirements}
          progress={progress}
        />
      ))}
    </div>
  );
}
