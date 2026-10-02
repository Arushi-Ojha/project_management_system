import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BasicSettings() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('create_pm'); // 'create_pm', 'create_emp', 'bulk_upload', 'directory'
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [customEmployeeId, setCustomEmployeeId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Bulk upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [user?.organizationId]);

  const loadUsers = async () => {
    if (!user?.organizationId) return;
    try {
      setLoadingUsers(true);
      const data = await apiCall(`/iam/organizations/${user.organizationId}/users`);
      setUsersList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (role) => {
    setFeedback(null);
    try {
      setFormLoading(true);
      const payload = {
        name,
        email,
        role,
        position: position || (role === 'project_manager' ? 'Lead Project Manager' : 'Software Engineer'),
        organizationId: user.organizationId,
        ...(customEmployeeId ? { employeeId: customEmployeeId } : {})
      };

      const res = await apiCall('/iam/users', {
        method: 'POST',
        body: payload
      });

      setFeedback({
        type: 'success',
        text: `Provisioned ${role}: ${res.name}. Auto-generated password and Employee ID (${res.employeeId}) have been dispatched via email to ${res.email}.`
      });

      setName('');
      setEmail('');
      setPosition('');
      setCustomEmployeeId('');
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Creation failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setBulkResult(null);
    try {
      setBulkLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await apiCall(`/iam/organizations/${user.organizationId}/users/bulk-upload`, {
        method: 'POST',
        body: formData
      });

      setBulkResult(res);
      setSelectedFile(null);
      loadUsers();
    } catch (err) {
      setBulkResult({ error: err.message || 'Bulk upload failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user?.organizationId) return;
    try {
      const blob = await apiCall(`/iam/organizations/${user.organizationId}/users/export`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  return (
    <div className="flex-col gap-20" style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px' }}>
      
      {/* Title */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h1>Basic Settings: Staff Creation & Mass Excel Onboarding</h1>
        <p style={{ fontSize: '13px' }}>
          Create Project Managers, create individual Employees (with position and auto ID), or upload an Excel/CSV sheet. This will auto-start a reaction of generating credentials and emailing each staff member.
        </p>
      </div>

      {/* Navigation Buttons for Sections */}
      <div className="flex-row gap-8 flex-wrap">
        <button
          type="button"
          onClick={() => { setActiveTab('create_pm'); setFeedback(null); }}
          className={activeTab === 'create_pm' ? 'btn-active' : ''}
        >
          Create Project Manager
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('create_emp'); setFeedback(null); }}
          className={activeTab === 'create_emp' ? 'btn-active' : ''}
        >
          Create Employee (Auto ID & Position)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('bulk_upload'); setBulkResult(null); }}
          className={activeTab === 'bulk_upload' ? 'btn-active' : ''}
        >
          Bulk Excel / CSV Sheet Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={activeTab === 'directory' ? 'btn-active' : ''}
        >
          Staff Directory ({usersList.length})
        </button>
      </div>

      {feedback && (
        <div style={{ border: '2px solid #000', padding: '10px', background: '#fff' }}>
          <p><strong>{feedback.type === 'success' ? 'Notice:' : 'Error:'}</strong> {feedback.text}</p>
        </div>
      )}

      {/* TAB 1: CREATE PROJECT MANAGER */}
      {activeTab === 'create_pm' && (
        <div className="panel flex-col gap-12" style={{ maxWidth: '600px' }}>
          <h2>Create Project Manager</h2>
          <p style={{ fontSize: '13px' }}>
            Will receive an automated welcome email containing temporary login password.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleCreateUser('project_manager'); }} className="flex-col gap-12">
            <div>
              <label>Full Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Manager Name"
              />
            </div>

            <div>
              <label>Work Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="manager@company.com"
              />
            </div>

            <div>
              <label>Position / Role Title:</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="e.g. Lead Project Manager"
              />
            </div>

            <div style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
              <strong>Reaction:</strong> Submitting will automatically generate a password and dispatch login credentials to the email address.
            </div>

            <button type="submit" disabled={formLoading} style={{ fontWeight: 'bold' }}>
              {formLoading ? 'Creating...' : 'Create Project Manager & Dispatch Email'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CREATE EMPLOYEE */}
      {activeTab === 'create_emp' && (
        <div className="panel flex-col gap-12" style={{ maxWidth: '600px' }}>
          <h2>Create Employee (Auto ID & Position)</h2>
          <p style={{ fontSize: '13px' }}>
            Assigns position and auto-generates employee ID like EMP-001. Dispatches login email.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleCreateUser('employee'); }} className="flex-col gap-12">
            <div>
              <label>Full Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Employee Name"
              />
            </div>

            <div>
              <label>Work Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="employee@company.com"
              />
            </div>

            <div className="flex-row gap-12">
              <div style={{ flex: 1 }}>
                <label>Position:</label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="e.g. Backend Dev, QA"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>Employee ID (Leave blank to auto-generate):</label>
                <input
                  type="text"
                  value={customEmployeeId}
                  onChange={e => setCustomEmployeeId(e.target.value)}
                  placeholder="Auto-generated e.g. EMP-9124"
                />
              </div>
            </div>

            <div style={{ border: '1px solid #000', padding: '8px', fontSize: '12px' }}>
              <strong>Reaction:</strong> Submitting will auto-create ID, generate credentials, and dispatch login instructions via email.
            </div>

            <button type="submit" disabled={formLoading} style={{ fontWeight: 'bold' }}>
              {formLoading ? 'Creating...' : 'Create Employee & Dispatch Email'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: BULK EXCEL / CSV UPLOAD */}
      {activeTab === 'bulk_upload' && (
        <div className="panel flex-col gap-12" style={{ maxWidth: '680px' }}>
          <h2>Bulk Staff Creation via Excel Sheet (.xlsx) or CSV</h2>
          <p style={{ fontSize: '13px' }}>
            Upload an Excel sheet (.xlsx/.xls) or CSV sheet with headers: <strong>Name, Email, Role, Position</strong>. This will auto-start a reaction creating credentials and sending them to the email of each employee in the sheet.
          </p>

          <form onSubmit={handleBulkUpload} className="flex-col gap-12">
            <div>
              <label>Select Excel (.xlsx) or CSV (.csv) File:</label>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={e => setSelectedFile(e.target.files[0])}
              />
            </div>

            <button type="submit" disabled={!selectedFile || bulkLoading} style={{ fontWeight: 'bold' }}>
              {bulkLoading ? 'Processing Bulk Creation & Sending Emails...' : 'Upload Sheet & Start Reaction'}
            </button>
          </form>

          {bulkResult && (
            <div style={{ border: '1px solid #000', padding: '10px', marginTop: '12px' }}>
              {bulkResult.error ? (
                <p><strong>Error:</strong> {bulkResult.error}</p>
              ) : (
                <>
                  <p><strong>{bulkResult.message}</strong></p>
                  <p>Created: {bulkResult.createdCount} | Skipped: {bulkResult.skippedCount}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="panel flex-col gap-12">
          <div className="flex-row justify-between items-center flex-wrap gap-8">
            <h3>Staff Directory ({usersList.length} Members)</h3>
            <div className="flex-row gap-8">
              <button type="button" onClick={loadUsers}>Refresh List</button>
              <button type="button" onClick={handleExportCSV}>Export to CSV</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Position</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={6}>No staff members found in directory.</td>
                </tr>
              ) : (
                usersList.map(u => (
                  <tr key={u.id}>
                    <td>{u.employeeId || 'None'}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>[{u.role}]</td>
                    <td>{u.position || 'Specialist'}</td>
                    <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
