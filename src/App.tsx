import React from 'react';
import { AuraChat } from './components/aura-chat';
import AdminPanel from './Admin';
import ModelOnboarding from './Onboarding';
import './globals.css';

const App: React.FC = () => {
  const path = window.location.pathname;
  if (path === '/admin-upload') return <AdminPanel />;
  if (path === '/join') return <ModelOnboarding />;

  return <AuraChat />;
};

export default App;
