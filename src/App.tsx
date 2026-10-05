import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, TabId } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { PioneerListView } from './components/pioneers/PioneerListView';
import { QuickMonthEntryView } from './components/monthly/QuickMonthEntryView';
import { ReviewsView } from './components/reviews/ReviewsView';
import { ServiceYearsView } from './components/years/ServiceYearsView';
import { SettingsView } from './components/settings/SettingsView';
import { PioneerDetailModal } from './components/pioneers/PioneerDetailModal';
import { PioneerOnboardingModal } from './components/pioneers/PioneerOnboardingModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthView } from './components/auth/AuthView';
import { CongregationSetupModal } from './components/onboarding/CongregationSetupModal';
import { ExcelImportModal } from './components/import/ExcelImportModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { Toast } from './components/ui/Toast';

const DashboardContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [selectedPioneerId, setSelectedPioneerId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  const {
    isAuthModalOpen,
    closeAuthModal,
    isExcelImportModalOpen,
    closeExcelImportModal,
  } = useApp();

  // Global Ctrl+K / Cmd+K shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenNewPioneer={() => setIsOnboardingOpen(true)}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
      />

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {/* Sidebar for Desktop */}
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              onSelectPioneer={(id) => setSelectedPioneerId(id)}
              onNavigateToReviews={() => setCurrentTab('reviews')}
              onNavigateToMonthly={() => setCurrentTab('monthly')}
              onOpenNewPioneer={() => setIsOnboardingOpen(true)}
            />
          )}

          {currentTab === 'pioneers' && (
            <PioneerListView
              onSelectPioneer={(id) => setSelectedPioneerId(id)}
              onOpenNewPioneer={() => setIsOnboardingOpen(true)}
            />
          )}

          {currentTab === 'monthly' && (
            <QuickMonthEntryView onSelectPioneer={(id) => setSelectedPioneerId(id)} />
          )}

          {currentTab === 'reviews' && (
            <ReviewsView onSelectPioneer={(id) => setSelectedPioneerId(id)} />
          )}

          {currentTab === 'years' && (
            <ServiceYearsView onSelectPioneer={(id) => setSelectedPioneerId(id)} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Pioneer Detail Modal */}
      {selectedPioneerId && (
        <PioneerDetailModal
          isOpen={Boolean(selectedPioneerId)}
          onClose={() => setSelectedPioneerId(null)}
          pioneerId={selectedPioneerId}
        />
      )}

      {/* New Pioneer Onboarding Modal */}
      {isOnboardingOpen && (
        <PioneerOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      )}

      {/* Firebase Auth Modal (Google & Email/Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={() => {
          closeAuthModal();
        }}
      />

      {/* Excel Import Modal */}
      {isExcelImportModalOpen && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={closeExcelImportModal}
        />
      )}

      {/* Global Quick Search (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectPioneer={(id) => {
          setSelectedPioneerId(id);
          setIsGlobalSearchOpen(false);
        }}
      />

      {/* Toast Notification Container with Undo */}
      <Toast />
    </div>
  );
};

const MainApp: React.FC = () => {
  const {
    firebaseUser,
    isAuthLoading,
    isDemoMode,
    isCongregationSetupOpen,
    closeCongregationSetup,
  } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg animate-pulse mb-3">
          <svg className="w-6 h-6 animate-spin text-primary-foreground" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-muted-foreground animate-pulse">
          Cargando datos de congregación...
        </p>
      </div>
    );
  }

  // Mandatory Authentication
  if (!firebaseUser && !isDemoMode) {
    return <AuthView />;
  }

  return (
    <>
      <DashboardContent />
      {/* Secretary Onboarding / Congregation Setup */}
      {isCongregationSetupOpen && (
        <CongregationSetupModal
          isOpen={isCongregationSetupOpen}
          onClose={closeCongregationSetup}
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
