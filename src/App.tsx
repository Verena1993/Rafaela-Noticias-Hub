import React, { useState } from 'react';
import { HubProvider, useHub } from './context/HubContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CoverageDetail } from './components/CoverageDetail';
import { Tasks } from './components/Tasks';
import { Calendar } from './components/Calendar';
import { ActivityLog } from './components/ActivityLog';
import { Proposals } from './components/Proposals';
import { InstagramPlanner } from './components/InstagramPlanner';
import { NewsRadar } from './components/NewsRadar';
import { ProductionTable } from './components/ProductionTable';
import { Publications } from './components/Publications';
import { Coverages } from './components/Coverages';

const AppContent: React.FC = () => {
  const { currentUser } = useHub();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCoverageId, setSelectedCoverageId] = useState<string | null>(null);
  const [autoOpenCreateModal, setAutoOpenCreateModal] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCoverageId(null); // Clean coverage selection to allow navigation
  };

  if (!currentUser) {
    return <Login />;
  }

  // CoverageDetail opens as overlay from any tab
  if (selectedCoverageId) {
    return (
      <Layout
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        setSelectedCoverageId={setSelectedCoverageId}
      >
        <CoverageDetail
          coverageId={selectedCoverageId}
          onBack={() => setSelectedCoverageId(null)}
        />
      </Layout>
    );
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
        return (
          <Coverages
            setSelectedCoverageId={setSelectedCoverageId}
            onViewDetail={() => {}}
            autoOpenCreateModal={autoOpenCreateModal}
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
      case 'production':
        return <ProductionTable />;
      case 'proposals':
        return (
          <Proposals />
        );
      case 'instagram':
        return <InstagramPlanner />;
      case 'publications':
        return <Publications />;
      case 'tasks':
        return <Tasks />;
      case 'calendar':
        return (
          <Calendar
            setSelectedCoverageId={setSelectedCoverageId}
          />
        );
      case 'radar':
        return <NewsRadar />;
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
      setActiveTab={handleTabChange}
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
