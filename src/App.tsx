import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/layout/Header';
import { TabNavigation, TabId } from './components/layout/TabNavigation';
import { Dashboard } from './components/tabs/Dashboard';
import { Inventory } from './components/tabs/Inventory';
import { Tenants } from './components/tabs/Tenants';
import { Payments } from './components/tabs/Payments';
import { Expenses } from './components/tabs/Expenses';
import { PettyCash } from './components/tabs/PettyCash';
import { Employees } from './components/tabs/Employees';
import { Issues } from './components/tabs/Issues';
import { Settings } from './components/tabs/Settings';

function App() {
  const { data, getCurrentBuilding, updateCurrentBuilding, switchBuilding, updateData } = useLocalStorage();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  const currentBuilding = getCurrentBuilding();

  if (!currentBuilding) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">שגיאה: לא נמצא בניין פעיל</p>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'inventory':
        return (
          <Inventory
            products={data.inventoryProducts}
            transactions={data.inventoryTransactions}
            currentBuilding={currentBuilding}
            onUpdateProducts={(updater) => updateData(prev => ({ ...prev, inventoryProducts: updater(prev.inventoryProducts) }))}
            onUpdateTransactions={(updater) => updateData(prev => ({ ...prev, inventoryTransactions: updater(prev.inventoryTransactions) }))}
          />
        );
      case 'tenants':
        return <Tenants building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'payments':
        return <Payments building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'expenses':
        return <Expenses building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'pettyCash':
        return <PettyCash building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'employees':
        return <Employees globalEmployees={data.globalEmployees} onUpdateEmployees={(updater) => updateData(prev => ({ ...prev, globalEmployees: updater(prev.globalEmployees) }))} />;
      case 'issues':
        return <Issues building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      case 'settings':
        return <Settings building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
      default:
        return <Dashboard building={currentBuilding} onUpdateBuilding={updateCurrentBuilding} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        title={data.settings.title}
        buildings={data.buildings}
        currentBuildingId={data.currentBuildingId}
        onBuildingChange={switchBuilding}
      />
      
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabOrder={data.settings.tabOrder}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;