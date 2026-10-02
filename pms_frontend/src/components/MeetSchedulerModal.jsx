import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MeetSchedulerModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('Sprint Sync & Tech Review');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [targetType, setTargetType] = useState('all');
  const [colleagues, setColleagues] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setSuccessData(null);
      loadColleagues();
    }
  }, [isOpen]);

  const loadColleagues = async () => {
    if (!user?.organizationId) return;
    try {
      const data = await apiCall(`/iam/organizations/${user.organizationId}/users`);
      setColleagues(data.filter(u => u.id !== user.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleColleague = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title,
        date,
        time,
        attendeeIds: targetType === 'selected' ? selectedIds : []
      };
      const res = await apiCall('/iam/meet/schedule', {
        method: 'POST',
        body: payload
      });
      setSuccessData(res);
    } catch (err) {
      alert(err.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex-row justify-between items-center" style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '16px' }}>
          <h2>Schedule Google Meet</h2>
          <button type="button" onClick={onClose} style={{ fontWeight: 'bold' }}>Close [X]</button>
        </div>

        {successData ? (
          <div className="flex-col gap-12">
            <h3>Meeting Scheduled Successfully!</h3>
            <p>{successData.message}</p>
            <div style={{ border: '1px solid #000', padding: '10px' }}>
              <p><strong>Generated Link:</strong> {successData.meetLink}</p>
              <p><strong>Scheduled For:</strong> {successData.date} at {successData.time}</p>
            </div>
            <div className="flex-row gap-8">
              <a href={successData.meetLink} target="_blank" rel="noreferrer" style={{ fontWeight: 'bold' }}>
                Open Google Meet Session
              </a>
              <button type="button" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col gap-16">
            <div>
              <label>Meeting Title / Subject:</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="flex-row gap-12">
              <div style={{ flex: 1 }}>
                <label>Date:</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Time:</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label>Invite Participants:</label>
              <div className="flex-row gap-16" style={{ marginBottom: '8px' }}>
                <label style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'all'}
                    onChange={() => setTargetType('all')}
                    style={{ width: 'auto', marginRight: '6px' }}
                  />
                  Invite All Workspace Members
                </label>
                <label style={{ fontWeight: 'normal', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'selected'}
                    onChange={() => setTargetType('selected')}
                    style={{ width: 'auto', marginRight: '6px' }}
                  />
                  Choose Specific People
                </label>
              </div>

              {targetType === 'selected' && (
                <div style={{ border: '1px solid #000', padding: '8px', maxHeight: '140px', overflowY: 'auto' }} className="flex-col gap-4">
                  {colleagues.length === 0 ? (
                    <p style={{ fontSize: '12px' }}>No colleagues available.</p>
                  ) : (
                    colleagues.map(c => (
                      <label key={c.id} style={{ fontWeight: 'normal', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => handleToggleColleague(c.id)}
                          style={{ width: 'auto', marginRight: '6px' }}
                        />
                        {c.name || c.email} ({c.role} - {c.position || 'Staff'})
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex-row justify-end gap-8">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={loading} style={{ fontWeight: 'bold' }}>
                {loading ? 'Dispatching Invites...' : 'Generate Meet Link & Dispatch Emails'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
