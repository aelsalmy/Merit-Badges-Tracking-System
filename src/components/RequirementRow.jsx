export default function RequirementRow({ requirement, progressEntry, onToggle, disabled }) {
  const isCompleted = progressEntry && String(progressEntry.completed) === 'TRUE';

  return (
    <label className={`requirement-row ${isCompleted ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={isCompleted}
        disabled={disabled}
        onChange={() => onToggle(requirement.requirement_id, !isCompleted)}
      />
      <div className="requirement-content">
        <span className="requirement-text">{requirement.requirement_text}</span>
        {isCompleted && progressEntry && (
          <span className="requirement-meta">
            {progressEntry.date_completed}
            {progressEntry.marked_by ? ` — ${progressEntry.marked_by}` : ''}
          </span>
        )}
      </div>
    </label>
  );
}
