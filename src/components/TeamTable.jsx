export default function TeamTable({ members, requirements, progress, onToggle, disabled }) {
  function isCompleted(memberId, requirementId) {
    return progress.some(
      (p) => p.member_id === memberId && p.requirement_id === requirementId &&
        String(p.completed).toUpperCase() === 'TRUE'
    );
  }

  function countCompleted(memberId) {
    return requirements.filter((r) => isCompleted(memberId, r.requirement_id)).length;
  }

  return (
    <div className="team-table-wrapper">
      <table className="team-table">
        <thead>
          <tr>
            <th className="sticky-col">Scout</th>
            {requirements.map((r) => (
              <th key={r.requirement_id} title={r.requirement_text}>
                {r.requirement_text.length > 25
                  ? r.requirement_text.substring(0, 22) + '...'
                  : r.requirement_text}
              </th>
            ))}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const done = countCompleted(member.member_id);
            const total = requirements.length;
            const earned = total > 0 && done === total;
            return (
              <tr key={member.member_id} className={earned ? 'earned-row' : ''}>
                <td className="sticky-col member-name">{member.full_name}</td>
                {requirements.map((r) => {
                  const checked = isCompleted(member.member_id, r.requirement_id);
                  return (
                    <td key={r.requirement_id} className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(member.member_id, r.requirement_id, !checked)}
                      />
                    </td>
                  );
                })}
                <td className={`status-cell ${earned ? 'earned' : ''}`}>
                  {earned ? 'Earned' : `${done}/${total}`}
                </td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={requirements.length + 2} className="empty-cell">
                No scouts in this team yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
