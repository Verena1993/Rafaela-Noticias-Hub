import React, { useState } from 'react';
import { HubProvider, useHub } from './context/HubContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Coverages } from './components/Coverages';
import { CoverageDetail } from './components/CoverageDetail';
import { Tasks } from './components/Tasks';
import { Calendar } from './components/Calendar';
import { ActivityLog } from './components/ActivityLog';
import { Proposals } from './components/Proposals';
import { InstagramPlanner } from './components/InstagramPlanner';

const AppContent: React.FC = () => {
  const { currentUser } = useHub();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCoverageId, setSelectedCoverageId] = useState<string | null>(null);
  const [autoOpenCreateModal, setAutoOpenCreateModal] = useState(false);

  if (!currentUser) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedCoverageId={setSelectedCoverageId} 
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
      case 'coverages':
        if (selectedCoverageId) {
          return (
            <CoverageDetail 
              coverageId={selectedCoverageId} 
              onBack={() => setSelectedCoverageId(null)} 
            />
          );
        }
        return (
          <Coverages 
            setSelectedCoverageId={setSelectedCoverageId}
            onViewDetail={() => {}}
            autoOpenCreateModal={autoOpenCreateModal}
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
      case 'proposals':
        return <Proposals />;
      case 'instagram':
        return <InstagramPlanner />;
      case 'tasks':
        return <Tasks />;
      case 'calendar':
        return (
          <Calendar 
            setSelectedCoverageId={setSelectedCoverageId} 
            setActiveTab={setActiveTab} 
          />
        );
      case 'activity':
        return <ActivityLog />;
      default:
        return (
          <Dashboard 
            setActiveTab={setActiveTab} 
            setSelectedCoverageId={setSelectedCoverageId} 
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      setSelectedCoverageId={setSelectedCoverageId}
    >
      {renderActiveView()}
    </Layout>
  );
};

function App() {
  return (
    <HubProvider>
      <AppContent />
    </HubProvider>
  );
}

export default App;
