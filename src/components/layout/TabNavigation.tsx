import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Receipt, 
  Wallet, 
  UserCheck, 
  AlertTriangle, 
  Settings,
  Package
} from 'lucide-react';

export type TabId = 'dashboard' | 'inventory' | 'tenants' | 'payments' | 'expenses' | 'pettyCash' | 'employees' | 'issues' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'לוח בקרה', icon: <LayoutDashboard size={20} /> },
  { id: 'inventory', label: 'ניהול מלאי', icon: <Package size={20} /> },
  { id: 'tenants', label: 'דיירים', icon: <Users size={20} /> },
  { id: 'payments', label: 'גבייה', icon: <CreditCard size={20} /> },
  { id: 'expenses', label: 'הוצאות כלליות', icon: <Receipt size={20} /> },
  { id: 'pettyCash', label: 'קופה קטנה', icon: <Wallet size={20} /> },
  { id: 'employees', label: 'עובדים', icon: <UserCheck size={20} /> },
  { id: 'issues', label: 'תקלות', icon: <AlertTriangle size={20} /> },
  { id: 'settings', label: 'הגדרות', icon: <Settings size={20} /> },
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabOrder: string[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  tabOrder 
}) => {
  // סידור הטאבים לפי הסדר המותאם אישית
  const orderedTabs = tabOrder
    .map(id => tabs.find(tab => tab.id === id))
    .filter(Boolean) as Tab[];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 min-w-max">
          {orderedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};