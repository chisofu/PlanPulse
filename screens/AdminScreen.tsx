import React from 'react';

const AdminScreen: React.FC = () => {
  const panels = [
    {
      title: 'User Management',
      description: 'Invite, suspend, or update roles for organization users.',
    },
    {
      title: 'Compliance Rules',
      description: 'Configure procurement thresholds, approvers, and audit settings.',
    },
    {
      title: 'Data Connections',
      description: 'Manage ERP integrations and export schedules.',
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Admin Control Center</h2>
      <p className="text-slate-600 mb-6">
        Configure enterprise-wide controls and integrations to keep BudgetPulse aligned with governance policies.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {panels.map((panel) => (
          <div key={panel.title} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{panel.title}</h3>
            <p className="text-sm text-slate-600">{panel.description}</p>
            <button className="mt-4 text-sm font-semibold text-budgetpulse">Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminScreen;
