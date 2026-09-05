const TEAMS = [
  'Smurfs', 'Cubs', 'Sea Scouts', 'Senior Scouts', 'Rovers',
  'Fairies', 'Brownies', 'Girl Guide', 'Senior Guides',
];

export { TEAMS };

export default function TeamSelector({ selectedTeam, onChange }) {
  return (
    <select
      className="team-selector"
      value={selectedTeam || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select a team...</option>
      {TEAMS.map((team) => (
        <option key={team} value={team}>{team}</option>
      ))}
    </select>
  );
}
