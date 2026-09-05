const TEAM_ORDER = [
  'Smurfs', 'Cubs', 'Sea Scouts', 'Senior Scouts', 'Rovers',
  'Fairies', 'Brownies', 'Girl Guide', 'Senior Guides',
];

export default function MemberSelector({ members, selectedId, onChange }) {
  const grouped = {};
  for (const m of members) {
    const team = m.team || 'Other';
    if (!grouped[team]) grouped[team] = [];
    grouped[team].push(m);
  }

  const teams = TEAM_ORDER.filter((t) => grouped[t]);
  const extra = Object.keys(grouped).filter((t) => !TEAM_ORDER.includes(t));

  return (
    <select
      className="member-selector"
      value={selectedId || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a scout...</option>
      {[...teams, ...extra].map((team) => (
        <optgroup key={team} label={team}>
          {grouped[team].map((m) => (
            <option key={m.member_id} value={m.member_id}>
              {m.full_name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
