import React, { useState } from 'react';
import SheetAnalysis from './components/SheetAnalysis';
import { LogoIcon } from './components/Icons';

const TABS = [
  { name: 'Analyse Famille', sheetId: '1tFCeunQtTq-v3OTOM6EraSBLCUlgkhajSEjwdKfSQj4' },
  { name: 'Hit Parade', sheetId: '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374' },
  { name: 'Analyse Fournisseurs', sheetId: '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS[0].name);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <LogoIcon className="h-12 w-12 text-sky-600" />
            <h1 className="text-3xl font-bold text-sky-600">Analyseur de Ventes</h1>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Onglets d'analyse">
            <div className="flex justify-center gap-2 sm:gap-4" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`py-3 px-3 sm:px-4 whitespace-nowrap text-sm sm:text-base font-medium rounded-t-md transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                    activeTab === tab.name
                      ? 'text-sky-700 border-b-2 border-sky-500'
                      : 'text-slate-500 hover:text-sky-600 hover:bg-slate-50/50 border-b-2 border-transparent'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.name}
                >
                  {tab.name}
                </button>
              ))}
            </div>
        </nav>
      </div>


      <main className="p-4 sm:p-6 lg:p-8">
        {TABS.map((tab) =>
          activeTab === tab.name ? (
            <div key={tab.sheetId}>
               <SheetAnalysis sheetId={tab.sheetId} tabName={tab.name} />
            </div>
          ) : null
        )}
      </main>
    </div>
  );
};

export default App;
