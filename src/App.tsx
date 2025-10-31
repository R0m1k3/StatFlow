import React, { useState } from 'react';
import { AnalyticsIcon } from './components/Icons';
import SheetAnalysis from './components/SheetAnalysis';

const TABS = [
  { 
    name: 'Analyse Famille', 
    sheetId: '1tFCeunQtTq-v3OTOM6EraSBLCUlgkhajSEjwdKfSQj4'
  },
  { 
    name: 'Hit Parade', 
    sheetId: '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374'
  },
  { 
    name: 'Analyse Fournisseurs', 
    sheetId: '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4'
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].name);

  const activeTabData = TABS.find(tab => tab.name === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-4">
              <AnalyticsIcon className="w-10 h-10 text-sky-600" />
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                {activeTab}
              </h1>
            </div>
            <p className="mt-2 text-lg text-gray-600">
              Visualisation des statistiques de ventes
            </p>
          </div>

           <div className="mb-8 border-b border-gray-200 flex justify-center">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                    activeTab === tab.name
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main>
          {activeTabData && <SheetAnalysis key={activeTabData.sheetId} sheetId={activeTabData.sheetId} />}
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Powered by React & Gemini</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
