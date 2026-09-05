import { useState } from 'react';
import { TEAMS } from './TeamSelector';

export default function AddMemberForm({ defaultTeam, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [fullName, setFullName] = useState('');
  const [team, setTeam] = useState(defaultTeam || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleTeamDefault(newDefault) {
    if (!expanded) setTeam(newDefault);
  }

  if (defaultTeam !== team && !expanded) {
    handleTeamDefault(defaultTeam);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!fullName.trim() || !team) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ fullName: fullName.trim(), team });
      setFullName('');
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <button className="add-member-btn" onClick={() => { setTeam(defaultTeam || ''); setExpanded(true); }}>
        + Add Scout
      </button>
    );
  }

  return (
    <form className="add-member-form" onSubmit={handleSave}>
      <input
        type="text"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoFocus
        required
      />
      <select value={team} onChange={(e) => setTeam(e.target.value)} required>
        <option value="">Team...</option>
        {TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      <button type="button" className="cancel-btn" onClick={() => setExpanded(false)}>Cancel</button>
      {error && <span className="form-error">{error}</span>}
    </form>
  );
}
