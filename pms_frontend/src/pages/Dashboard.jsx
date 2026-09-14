import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import AdminDashboard from './AdminDashboard';
import LeadDashboard from './LeadDashboard';
import MemberDashboard from './MemberDashboard';

export default function Dashboard() {
  const { user, organization } = useAuth();
  const [ledTeams, setLedTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && organization) {
      apiCall(`/iam/organizations/${organization.id}/teams`)
        .then(teams => {
          const led = teams.filter(t => t.leadId === user.id);
          setLedTeams(led);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, organization]);

  if (loading) return <div style={{ padding: '40px' }}>Loading dashboard...</div>;

  // 1. Organization Admin / Owner gets the graphing visualization and logs
  if (user?.role === 'owner' || user?.role === 'admin') {
    return <AdminDashboard />;
  }
  
  // 2. Team Leads get a dashboard to manage their specific teams and projects
  if (ledTeams.length > 0) {
    return <LeadDashboard ledTeams={ledTeams} />;
  }

  // 3. Regular Members / Guests get the standard task-focused dashboard
  return <MemberDashboard />;
}
