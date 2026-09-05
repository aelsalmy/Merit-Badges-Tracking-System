import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBadge } from '../api/sheets';

export default function CreateBadgePage() {
  const navigate = useNavigate();
  const [badgeName, setBadgeName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function addRequirement() {
    setRequirements((r) => [...r, '']);
  }

  function removeRequirement(index) {
    setRequirements((r) => r.filter((_, i) => i !== index));
  }

  function updateRequirement(index, text) {
    setRequirements((r) => r.map((val, i) => (i === index ? text : val)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const reqs = requirements.map((r) => r.trim()).filter(Boolean);
    if (!badgeName.trim()) return;
    if (reqs.length === 0) {
      setError('Add at least one requirement.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createBadge({
        badgeName: badgeName.trim(),
        description: description.trim(),
        requirements: reqs,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="create-badge-page">
      <h2>Create Badge</h2>
      <form className="create-badge-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="badge-name">Badge Name</label>
          <input
            id="badge-name"
            type="text"
            value={badgeName}
            onChange={(e) => setBadgeName(e.target.value)}
            placeholder="e.g. Digital Guardian"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="badge-desc">Description</label>
          <textarea
            id="badge-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of what this badge is about"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Requirements</label>
          <div className="requirements-builder">
            {requirements.map((req, i) => (
              <div key={i} className="req-input-row">
                <span className="req-number">{i + 1}.</span>
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(i, e.target.value)}
                  placeholder="Requirement description"
                />
                {requirements.length > 1 && (
                  <button type="button" className="remove-req-btn" onClick={() => removeRequirement(i)}>
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-req-btn" onClick={addRequirement}>
              + Add Requirement
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Creating...' : 'Create Badge'}
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
