const API_URL = import.meta.env.VITE_API_URL || '';

const MOCK_DATA = {
  members: [
    { member_id: 'M001', full_name: 'Ahmad Al-Farsi', team: 'Sea Scouts' },
    { member_id: 'M002', full_name: 'Layla Hassan', team: 'Brownies' },
    { member_id: 'M003', full_name: 'Omar Khalil', team: 'Cubs' },
    { member_id: 'M004', full_name: 'Sara Nouri', team: 'Girl Guide' },
    { member_id: 'M005', full_name: 'Yusuf Mansour', team: 'Senior Scouts' },
  ],
  badges: [
    { badge_id: 'B001', badge_name: 'Digital Guardian', description: 'Learn about personal data privacy and digital footprints' },
  ],
  requirements: [
    { requirement_id: 'R001', badge_id: 'B001', requirement_text: 'Learn the basics of personal data and privacy', sort_order: 1 },
    { requirement_id: 'R002', badge_id: 'B001', requirement_text: 'Investigate their own digital footprint', sort_order: 2 },
    { requirement_id: 'R003', badge_id: 'B001', requirement_text: 'Spot common data collection tricks', sort_order: 3 },
    { requirement_id: 'R004', badge_id: 'B001', requirement_text: 'Create an awareness poster or infographic', sort_order: 4 },
    { requirement_id: 'R005', badge_id: 'B001', requirement_text: 'Share it with their community', sort_order: 5 },
  ],
};

let mockProgress = [];

function useMock() {
  return !API_URL;
}

async function request(params) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([key, val]) => {
    if (val != null) url.searchParams.set(key, val);
  });
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

export async function fetchAllData(memberId) {
  if (useMock()) {
    return {
      ...MOCK_DATA,
      progress: memberId
        ? mockProgress.filter((p) => p.member_id === memberId)
        : [],
    };
  }
  const params = { action: 'getAllData' };
  if (memberId) params.member_id = memberId;
  return request(params);
}

export async function fetchMembers() {
  if (useMock()) return MOCK_DATA.members;
  return request({ action: 'getMembers' });
}

export async function fetchProgress(memberId) {
  if (useMock()) {
    return mockProgress.filter((p) => p.member_id === memberId);
  }
  return request({ action: 'getProgress', member_id: memberId });
}

export async function markRequirement({ memberId, requirementId, completed, markedBy }) {
  if (useMock()) {
    const idx = mockProgress.findIndex(
      (p) => p.member_id === memberId && p.requirement_id === requirementId
    );
    const entry = {
      member_id: memberId,
      requirement_id: requirementId,
      completed: completed ? 'TRUE' : 'FALSE',
      date_completed: new Date().toISOString().split('T')[0],
      marked_by: markedBy,
    };
    if (idx >= 0) {
      mockProgress[idx] = entry;
    } else {
      mockProgress.push(entry);
    }
    return entry;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'markRequirement',
      member_id: memberId,
      requirement_id: requirementId,
      completed,
      marked_by: markedBy,
    }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}
