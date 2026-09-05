export default function BadgeSelector({ badges, selectedBadgeId, onChange }) {
  return (
    <select
      className="badge-selector"
      value={selectedBadgeId || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a badge...</option>
      {badges.map((b) => (
        <option key={b.badge_id} value={b.badge_id}>{b.badge_name}</option>
      ))}
    </select>
  );
}
