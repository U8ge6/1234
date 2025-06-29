import { useState, useEffect } from 'react';
import { AppData, Building, BuildingSettings, defaultWhatsappTemplate } from '../types';
import { useDailyBackup } from './useDailyBackup';

const STORAGE_KEY = 'building-management-data';

const createDefaultBuilding = (id: string, name: string): Building => ({
  id,
  name: name || 'בניין חדש',
  settings: {
    name: name || 'בניין חדש',
    monthlyAmount: 300,
    pettyCashTransfer: 50,
    entranceCodes: {},
    elevator: { company: '', phone: '' },
    electricity: {}
  },
  tenants: [],
  payments: [],
  expenses: [],
  pettyCash: [],
  issues: []
});

const getInitialData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // וידוא תקינות המבנה
      if (parsed.buildings && parsed.buildings.length > 0) {
        // הוספת globalEmployees אם לא קיים
        if (!parsed.globalEmployees) {
          parsed.globalEmployees = [];
        }
        // הוספת autoBackupEnabled אם לא קיים
        if (parsed.settings && typeof parsed.settings.autoBackupEnabled === 'undefined') {
          parsed.settings.autoBackupEnabled = true;
        }
        // הוספת whatsappTemplate גלובלי אם לא קיים
        if (parsed.settings && !parsed.settings.whatsappTemplate) {
          parsed.settings.whatsappTemplate = defaultWhatsappTemplate;
        }
        // הוספת מערכת מלאי אם לא קיימת
        if (!parsed.inventoryProducts) {
          parsed.inventoryProducts = [];
        }
        if (!parsed.inventoryTransactions) {
          parsed.inventoryTransactions = [];
        }
        // הסרת inventoryLocations אם קיים
        if (parsed.inventoryLocations) {
          delete parsed.inventoryLocations;
        }
        // הסרת whatsappTemplate מהגדרות בניינים (אם קיים)
        parsed.buildings = parsed.buildings.map((building: Building) => {
          if (building.settings && 'whatsappTemplate' in building.settings) {
            const { whatsappTemplate, ...settingsWithoutTemplate } = building.settings as any;
            return { ...building, settings: settingsWithoutTemplate };
          }
          return building;
        });
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }

  // יצירת נתונים ברירת מחדל
  const defaultBuilding = createDefaultBuilding('1', 'בניין ראשי');
  return {
    settings: {
      title: 'מערכת ניהול ועד בית',
      tabOrder: ['dashboard', 'inventory', 'tenants', 'payments', 'expenses', 'pettyCash', 'employees', 'issues', 'settings'],
      autoBackupEnabled: true,
      whatsappTemplate: defaultWhatsappTemplate
    },
    buildings: [defaultBuilding],
    currentBuildingId: '1',
    globalEmployees: [],
    inventoryProducts: [],
    inventoryTransactions: []
  };
};

export const useLocalStorage = () => {
  const [data, setData] = useState<AppData>(getInitialData);

  // הוק הגיבוי האוטומטי
  const { 
    shouldBackupToday, 
    lastBackupDate, 
    forceBackup,
    getStoredBackups,
    downloadStoredBackup,
    cleanOldBackups
  } = useDailyBackup(data, data.settings.autoBackupEnabled);

  // שמירה אוטומטית בכל שינוי
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [data]);

  const updateData = (updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const newData = updater(prev);
      return newData;
    });
  };

  const getCurrentBuilding = (): Building | undefined => {
    return data.buildings.find(b => b.id === data.currentBuildingId);
  };

  const updateCurrentBuilding = (updater: (building: Building) => Building) => {
    updateData(prev => ({
      ...prev,
      buildings: prev.buildings.map(building =>
        building.id === prev.currentBuildingId ? updater(building) : building
      )
    }));
  };

  const switchBuilding = (buildingId: string) => {
    updateData(prev => ({
      ...prev,
      currentBuildingId: buildingId
    }));
  };

  const addBuilding = (name: string) => {
    const newId = Date.now().toString();
    const newBuilding = createDefaultBuilding(newId, name);
    updateData(prev => ({
      ...prev,
      buildings: [...prev.buildings, newBuilding],
      currentBuildingId: newId
    }));
  };

  const deleteBuilding = (buildingId: string) => {
    updateData(prev => {
      const remainingBuildings = prev.buildings.filter(b => b.id !== buildingId);
      if (remainingBuildings.length === 0) {
        // לא ניתן למחוק את הבניין האחרון
        return prev;
      }
      return {
        ...prev,
        buildings: remainingBuildings,
        currentBuildingId: prev.currentBuildingId === buildingId 
          ? remainingBuildings[0].id 
          : prev.currentBuildingId
      };
    });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `building-management-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          // בדיקה מקיפה של המבנה ותיקון אוטומטי
          if (importedData && typeof importedData === 'object') {
            
            // וידוא קיום buildings
            if (!importedData.buildings || !Array.isArray(importedData.buildings)) {
              importedData.buildings = [createDefaultBuilding('1', 'בניין ראשי')];
            }
            
            // וידוא קיום currentBuildingId
            if (!importedData.currentBuildingId || !importedData.buildings.find((b: Building) => b.id === importedData.currentBuildingId)) {
              importedData.currentBuildingId = importedData.buildings[0].id;
            }
            
            // וידוא קיום settings
            if (!importedData.settings || typeof importedData.settings !== 'object') {
              importedData.settings = {
                title: 'מערכת ניהול ועד בית',
                tabOrder: ['dashboard', 'inventory', 'tenants', 'payments', 'expenses', 'pettyCash', 'employees', 'issues', 'settings'],
                autoBackupEnabled: true,
                whatsappTemplate: defaultWhatsappTemplate
              };
            } else {
              // השלמת שדות חסרים בהגדרות
              if (!importedData.settings.title) {
                importedData.settings.title = 'מערכת ניהול ועד בית';
              }
              if (!importedData.settings.tabOrder || !Array.isArray(importedData.settings.tabOrder)) {
                importedData.settings.tabOrder = ['dashboard', 'inventory', 'tenants', 'payments', 'expenses', 'pettyCash', 'employees', 'issues', 'settings'];
              }
              if (typeof importedData.settings.autoBackupEnabled === 'undefined') {
                importedData.settings.autoBackupEnabled = true;
              }
              if (!importedData.settings.whatsappTemplate) {
                importedData.settings.whatsappTemplate = defaultWhatsappTemplate;
              }
            }
            
            // וידוא קיום globalEmployees
            if (!importedData.globalEmployees || !Array.isArray(importedData.globalEmployees)) {
              importedData.globalEmployees = [];
            }
            
            // וידוא קיום מערכת מלאי
            if (!importedData.inventoryProducts || !Array.isArray(importedData.inventoryProducts)) {
              importedData.inventoryProducts = [];
            }
            if (!importedData.inventoryTransactions || !Array.isArray(importedData.inventoryTransactions)) {
              importedData.inventoryTransactions = [];
            }
            
            // הסרת inventoryLocations אם קיים (מערכת ישנה)
            if (importedData.inventoryLocations) {
              delete importedData.inventoryLocations;
            }
            
            // תיקון מבנה בניינים
            importedData.buildings = importedData.buildings.map((building: any) => {
              // וידוא מבנה בסיסי של בניין
              if (!building.id) building.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              if (!building.name) building.name = 'בניין ללא שם';
              
              // וידוא הגדרות בניין
              if (!building.settings || typeof building.settings !== 'object') {
                building.settings = {
                  name: building.name,
                  monthlyAmount: 300,
                  pettyCashTransfer: 50,
                  entranceCodes: {},
                  elevator: { company: '', phone: '' },
                  electricity: {}
                };
              } else {
                // השלמת שדות חסרים בהגדרות בניין
                if (!building.settings.name) building.settings.name = building.name;
                if (typeof building.settings.monthlyAmount !== 'number') building.settings.monthlyAmount = 300;
                if (typeof building.settings.pettyCashTransfer !== 'number') building.settings.pettyCashTransfer = 50;
                if (!building.settings.entranceCodes || typeof building.settings.entranceCodes !== 'object') {
                  building.settings.entranceCodes = {};
                }
                if (!building.settings.elevator || typeof building.settings.elevator !== 'object') {
                  building.settings.elevator = { company: '', phone: '' };
                }
                if (!building.settings.electricity || typeof building.settings.electricity !== 'object') {
                  building.settings.electricity = {};
                }
              }
              
              // הסרת whatsappTemplate מהגדרות בניין (אם קיים)
              if (building.settings && 'whatsappTemplate' in building.settings) {
                const { whatsappTemplate, ...settingsWithoutTemplate } = building.settings;
                building.settings = settingsWithoutTemplate;
              }
              
              // וידוא מערכים של בניין
              if (!building.tenants || !Array.isArray(building.tenants)) building.tenants = [];
              if (!building.payments || !Array.isArray(building.payments)) building.payments = [];
              if (!building.expenses || !Array.isArray(building.expenses)) building.expenses = [];
              if (!building.pettyCash || !Array.isArray(building.pettyCash)) building.pettyCash = [];
              if (!building.issues || !Array.isArray(building.issues)) building.issues = [];
              
              return building;
            });
            
            console.log('Import successful - data structure validated and fixed:', importedData);
            setData(importedData);
            resolve();
          } else {
            reject(new Error('קובץ לא תקין - מבנה נתונים שגוי'));
          }
        } catch (error) {
          console.error('Import error:', error);
          reject(new Error('שגיאה בפענוח הקובץ - ייתכן שהקובץ פגום'));
        }
      };
      reader.onerror = () => {
        reject(new Error('שגיאה בקריאת הקובץ'));
      };
      reader.readAsText(file);
    });
  };

  const clearAllData = () => {
    // מחיקת כל הנתונים מ-localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('last-backup-date'); // מחיקת תאריך הגיבוי האחרון
    
    // מחיקת גיבויים אוטומטיים
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('auto-backup-')) {
        localStorage.removeItem(key);
      }
    }
    
    // יצירת נתונים חדשים לגמרי
    const defaultBuilding = createDefaultBuilding('1', 'בניין ראשי');
    const newData: AppData = {
      settings: {
        title: 'מערכת ניהול ועד בית',
        tabOrder: ['dashboard', 'inventory', 'tenants', 'payments', 'expenses', 'pettyCash', 'employees', 'issues', 'settings'],
        autoBackupEnabled: true,
        whatsappTemplate: defaultWhatsappTemplate
      },
      buildings: [defaultBuilding],
      currentBuildingId: '1',
      globalEmployees: [],
      inventoryProducts: [],
      inventoryTransactions: []
    };
    setData(newData);
    
    // רענון הדף כדי להבטיח שכל הקומפוננטים יתאפסו
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleAutoBackup = (enabled: boolean) => {
    updateData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        autoBackupEnabled: enabled
      }
    }));
  };

  return {
    data,
    updateData,
    getCurrentBuilding,
    updateCurrentBuilding,
    switchBuilding,
    addBuilding,
    deleteBuilding,
    exportData,
    importData,
    clearAllData,
    toggleAutoBackup,
    // נתוני גיבוי אוטומטי
    shouldBackupToday,
    lastBackupDate,
    forceBackup,
    getStoredBackups,
    downloadStoredBackup,
    cleanOldBackups
  };
};