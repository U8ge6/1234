import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Building } from '../../types';

interface HeaderProps {
  title: string;
  buildings: Building[];
  currentBuildingId: string;
  onBuildingChange: (buildingId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  buildings, 
  currentBuildingId, 
  onBuildingChange 
}) => {
  const currentBuilding = buildings.find(b => b.id === currentBuildingId);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
          
          {buildings.length > 1 && (
            <div className="relative">
              <select
                value={currentBuildingId}
                onChange={(e) => onBuildingChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {buildings.map(building => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};