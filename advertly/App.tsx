
import React from 'react';
import { AppProvider, useApp } from './AppContext';
import Header from './components/Header';
import BackgroundProgressIndicator from './components/BackgroundProgressIndicator';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CampaignsPage from './pages/CampaignsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import StrategyWizard from './pages/StrategyWizard';
import StrategyResultPage from './pages/StrategyResultPage';
import LandingPageEditor from './pages/LandingPageEditor';
import AuthPage from './pages/AuthPage';
import OnboardingWizard from './pages/OnboardingWizard';
import ChatOnboarding from './pages/ChatOnboarding';


const MainContent: React.FC = () => {
  const { currentPage, profiles, setPage, isAuthenticated, hasCompletedOnboarding, onboardingSkipped } = useApp();

  // Increment key when entering new-strategy page to force component remount
  const [strategyKeyCounter, setStrategyKeyCounter] = React.useState(0);
  const [onboardingKeyCounter, setOnboardingKeyCounter] = React.useState(0);
  
  React.useEffect(() => {
    if (currentPage === 'new-strategy') {
      setStrategyKeyCounter(prev => prev + 1);
    }
  }, [currentPage]);

  React.useEffect(() => {
    if (currentPage === 'resume-onboarding' || (!hasCompletedOnboarding && !onboardingSkipped && isAuthenticated)) {
      setOnboardingKeyCounter(prev => prev + 1);
      // Mark this as a new onboarding session (not resuming)
      if (currentPage === 'resume-onboarding') {
        sessionStorage.setItem('onboarding_new_session', 'true');
      }
    }
  }, [currentPage, hasCompletedOnboarding, onboardingSkipped, isAuthenticated]);

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Authenticated but hasn't completed onboarding and didn't skip - show onboarding wizard
  if (!hasCompletedOnboarding && !onboardingSkipped) {
    return <ChatOnboarding key={`onboarding-${onboardingKeyCounter}`} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'new-strategy':
        return <StrategyWizard key={`strategy-wizard-${strategyKeyCounter}`} />;
      case 'strategy':
        return <StrategyResultPage />;
      case 'landing-editor':
        return <LandingPageEditor />;
      case 'resume-onboarding':
        // return <OnboardingWizard key={`onboarding-resume-${onboardingKeyCounter}`} />;
        return <ChatOnboarding key={`onboarding-resume-${onboardingKeyCounter}`} />;

      case 'profile':
        return (
            <div className="max-w-screen-2xl mx-auto py-8 px-6 md:px-10 2xl:px-14">
                <ProfilePage />
            </div>
        );
      case 'campaigns':
        return (
            <div className="max-w-screen-2xl mx-auto py-8 px-6 md:px-10 2xl:px-14">
                <CampaignsPage />
            </div>
        );
      case 'analytics':
        return (
            <div className="max-w-screen-2xl mx-auto py-8 px-6 md:px-10 2xl:px-14">
                <AnalyticsPage />
            </div>
        );
      case 'settings':
        return (
            <div className="max-w-screen-2xl mx-auto py-8 px-6 md:px-10 2xl:px-14">
                <SettingsPage />
            </div>
        );
      default:
        return <DashboardPage />;
    }
  };

  // Check if we should hide the global header (for fullscreen focus mode)
  const isFocusMode = currentPage === 'new-strategy' || currentPage === 'resume-onboarding';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {!isFocusMode && <Header />}
      <main className="flex-1 overflow-x-hidden bg-white">
           <div key={currentPage} className="animate-in fade-in duration-300 w-full">
                {renderPage()}
           </div>
      </main>
      <BackgroundProgressIndicator />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
