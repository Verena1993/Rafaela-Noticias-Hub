import React, { useState, useEffect } from 'react';
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
import { Publicidad } from './components/Publicidad';
// import { Coverages } from './components/Coverages';
import { UserManagement } from './components/UserManagement';
import { ResetPassword } from './components/ResetPassword';
import { Settings } from './components/Settings';

const AppContent: React.FC = () => {
  const { currentUser } = useHub();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCoverageId, setSelectedCoverageId] = useState<string | null>(null);
  const [, setAutoOpenCreateModal] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    // Check if the current URL hash or query params indicate a recovery redirect
    const checkRecoveryToken = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        hash.includes('type=recovery') || 
        (hash.includes('access_token=') && hash.includes('recovery')) ||
        search.includes('type=recovery')
      ) {
        // Redirect client-side to /reset-password preserving query and hash params
        window.history.pushState({}, '', '/reset-password' + search + hash);
        setPathname('/reset-password');
      }
    };
    checkRecoveryToken();

    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('locationchange'));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCoverageId(null); // Clean coverage selection to allow navigation
  };

  if (pathname === '/reset-password') {
    return <ResetPassword navigate={navigate} />;
  }

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
      case 'production':
        return (
          <ProductionTable 
            setActiveTab={setActiveTab}
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
      case 'proposals':
        return (
          <Proposals />
        );
      case 'instagram':
        return <InstagramPlanner />;
      case 'publications':
        return <Publications />;
      case 'publicity':
        return <Publicidad />;
      case 'tasks':
        return (
          <Tasks 
            setActiveTab={setActiveTab}
            setAutoOpenCreateModal={setAutoOpenCreateModal}
          />
        );
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
      case 'user-management':
        if (currentUser?.role !== 'admin') {
          setTimeout(() => handleTabChange('dashboard'), 0);
          return null;
        }
        return <UserManagement />;
      case 'settings':
        if (currentUser?.role !== 'admin') {
          setTimeout(() => handleTabChange('dashboard'), 0);
          return null;
        }
        return <Settings />;
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
