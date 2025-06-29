import React, { useState, useRef } from 'react';
import { Building, BuildingSettings } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { BackupStatus } from '../ui/BackupStatus';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Download, 
  Upload, 
  Trash2, 
  Plus,
  Save,
  AlertTriangle,
  Shield,
  MessageCircle,
  Edit
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface SettingsProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const Settings: React.FC<SettingsProps> = ({ building, onUpdateBuilding }) => {
  const { 
    data, 
    updateData, 
    addBuilding, 
    deleteBuilding, 
    exportData, 
    importData, 
    clearAllData,
    toggleAutoBackup,
    shouldBackupToday,
    lastBackupDate,
    forceBackup,
    getStoredBackups,
    downloadStoredBackup,
    cleanOldBackups
  } = useLocalStorage();
  
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [editBuildingName, setEditBuildingName] = useState('');
  const [buildingSettings, setBuildingSettings] = useState<BuildingSettings>(building.settings);
  const [appTitle, setAppTitle] = useState(data.settings.title);
  const [whatsappTemplate, setWhatsappTemplate] = useState(data.settings.whatsappTemplate);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBuildingSettings = () => {
    onUpdateBuilding(prev => ({
      ...prev,
      settings: buildingSettings
    }));
    alert('הגדרות הבניין נשמרו בהצלחה!');
  };

  const handleSaveAppTitle = () => {
    updateData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        title: appTitle
      }
    }));
    alert('כותרת המערכת עודכנה בהצלחה!');
  };

  const handleSaveWhatsappTemplate = () => {
    updateData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        whatsappTemplate: whatsappTemplate
      }
    }));
    alert('תבנית WhatsApp נשמרה בהצלחה!');
  };

  const handleAddBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBuildingName.trim()) {
      addBuilding(newBuildingName.trim());
      setNewBuildingName('');
      setIsAddBuildingModalOpen(false);
    }
  };

  const openEditBuildingModal = (buildingId: string, currentName: string) => {
    setEditingBuildingId(buildingId);
    setEditBuildingName(currentName);
    setIsEditBuildingModalOpen(true);
  };

  const handleEditBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (editBuildingName.trim() && editingBuildingId) {
      updateData(prev => ({
        ...prev,
        buildings: prev.buildings.map(building =>
          building.id === editingBuildingId
            ? { 
                ...building, 
                name: editBuildingName.trim(),
                settings: {
                  ...building.settings,
                  name: editBuildingName.trim()
                }
              }
            : building
        )
      }));
      setEditBuildingName('');
      setEditingBuildingId(null);
      setIsEditBuildingModalOpen(false);
      alert('שם הבניין עודכן בהצלחה!');
    }
  };

  const handleDeleteBuilding = (buildingId: string) => {
    const buildingToDelete = data.buildings.find(b => b.id === buildingId);
    if (buildingToDelete && confirm(`האם אתה בטוח שברצונך למחוק את הבניין "${buildingToDelete.name}"? כל הנתונים יימחקו לצמיתות.`)) {
      deleteBuilding(buildingId);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        alert('הנתונים יובאו בהצלחה!');
        // עדכון המצב המקומי אחרי הייבוא
        setAppTitle(data.settings.title);
        setWhatsappTemplate(data.settings.whatsappTemplate);
      } catch (error) {
        alert('שגיאה בייבוא הנתונים. אנא בדוק שהקובץ תקין.');
      }
      // איפוס הקלט
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearAllData = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו אינה ניתנת לביטול!')) {
      if (confirm('זוהי אזהרה אחרונה! כל הנתונים של כל הבניינים יימחקו לצמיתות. האם להמשיך?')) {
        clearAllData();
        alert('כל הנתונים נמחקו בהצלחה.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">הגדרות מערכת</h2>
      </div>

      {/* גיבוי אוטומטי */}
      <Card title="גיבוי אוטומטי יומי">
        <div className="space-y-4">
          <BackupStatus
            shouldBackupToday={shouldBackupToday}
            lastBackupDate={lastBackupDate}
            onForceBackup={forceBackup}
            getStoredBackups={getStoredBackups}
            downloadStoredBackup={downloadStoredBackup}
            cleanOldBackups={cleanOldBackups}
          />
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">הפעלת גיבוי אוטומטי</h4>
                <p className="text-sm text-gray-600">המערכת תיצור גיבוי אוטומטי פעם ביום (ברקע)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.autoBackupEnabled}
                onChange={(e) => toggleAutoBackup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* ניהול בניינים */}
      <Card title="ניהול בניינים">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">בניינים במערכת</h4>
            <Button onClick={() => setIsAddBuildingModalOpen(true)}>
              <Plus size={16} className="ml-1" />
              הוסף בניין
            </Button>
          </div>
          
          <div className="space-y-2">
            {data.buildings.map((bldg) => (
              <div key={bldg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{bldg.name}</span>
                  {bldg.id === data.currentBuildingId && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">פעיל</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditBuildingModal(bldg.id, bldg.name)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="ערוך שם בניין"
                  >
                    <Edit size={16} />
                  </button>
                  {data.buildings.length > 1 && (
                    <button
                      onClick={() => handleDeleteBuilding(bldg.id)}
                      className="text-red-600 hover:text-red-800"
                      title="מחק בניין"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* הגדרות הבניין הנוכחי */}
      <Card title={`הגדרות בניין: ${building.name}`}>
        <div className="space-y-6">
          {/* הגדרות כספיות */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">הגדרות כספיות</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">סכום גבייה חודשי (ברירת מחדל)</label>
                <input
                  type="number"
                  min="0"
                  value={buildingSettings.monthlyAmount}
                  onChange={(e) => setBuildingSettings({
                    ...buildingSettings,
                    monthlyAmount: parseInt(e.target.value) || 0
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">העברה לקופה קטנה מכל תשלום</label>
                <input
                  type="number"
                  min="0"
                  value={buildingSettings.pettyCashTransfer}
                  onChange={(e) => setBuildingSettings({
                    ...buildingSettings,
                    pettyCashTransfer: parseInt(e.target.value) || 0
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* קודי כניסה */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">קודי כניסה</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['A', 'B', 'C', 'D'].map((entrance) => (
                <div key={entrance}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כניסה {entrance}</label>
                  <input
                    type="text"
                    value={buildingSettings.entranceCodes[entrance as keyof typeof buildingSettings.entranceCodes] || ''}
                    onChange={(e) => setBuildingSettings({
                      ...buildingSettings,
                      entranceCodes: {
                        ...buildingSettings.entranceCodes,
                        [entrance]: e.target.value
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="קוד כניסה"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* פרטי מעלית */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">פרטי מעלית</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">חברת מעליות</label>
                <input
                  type="text"
                  value={buildingSettings.elevator.company}
                  onChange={(e) => setBuildingSettings({
                    ...buildingSettings,
                    elevator: {
                      ...buildingSettings.elevator,
                      company: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="שם החברה"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון חירום</label>
                <input
                  type="tel"
                  value={buildingSettings.elevator.phone}
                  onChange={(e) => setBuildingSettings({
                    ...buildingSettings,
                    elevator: {
                      ...buildingSettings.elevator,
                      phone: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="מספר טלפון"
                />
              </div>
            </div>
          </div>

          {/* פרטי חשמל */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">פרטי חשמל</h4>
            {['A', 'B', 'C', 'D'].map((entrance) => (
              <div key={entrance} className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">כניסה {entrance}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">מספר חוזה</label>
                    <input
                      type="text"
                      value={buildingSettings.electricity[entrance as keyof typeof buildingSettings.electricity]?.contract || ''}
                      onChange={(e) => setBuildingSettings({
                        ...buildingSettings,
                        electricity: {
                          ...buildingSettings.electricity,
                          [entrance]: {
                            ...buildingSettings.electricity[entrance as keyof typeof buildingSettings.electricity],
                            contract: e.target.value
                          }
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="מספר חוזה"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">מספר מונה</label>
                    <input
                      type="text"
                      value={buildingSettings.electricity[entrance as keyof typeof buildingSettings.electricity]?.meter || ''}
                      onChange={(e) => setBuildingSettings({
                        ...buildingSettings,
                        electricity: {
                          ...buildingSettings.electricity,
                          [entrance]: {
                            ...buildingSettings.electricity[entrance as keyof typeof buildingSettings.electricity],
                            meter: e.target.value
                          }
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="מספר מונה"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveBuildingSettings} className="w-full">
            <Save size={16} className="ml-1" />
            שמור הגדרות בניין
          </Button>
        </div>
      </Card>

      {/* גיבוי ושחזור */}
      <Card title="גיבוי ושחזור נתונים">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={exportData} variant="secondary">
              <Download size={16} className="ml-1" />
              ייצא נתונים (גיבוי)
            </Button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="secondary"
                className="w-full"
              >
                <Upload size={16} className="ml-1" />
                ייבא נתונים (שחזור)
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-700">אזור מסוכן</span>
            </div>
            <Button 
              onClick={handleClearAllData} 
              variant="danger"
              className="w-full"
            >
              <Trash2 size={16} className="ml-1" />
              מחק את כל הנתונים
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              פעולה זו תמחק את כל הנתונים של כל הבניינים ולא ניתן לבטלה!
            </p>
          </div>
        </div>
      </Card>

      {/* הגדרות כלליות - הועבר לתחתית */}
      <Card title="הגדרות כלליות">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">כותרת המערכת</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="כותרת המערכת"
              />
              <Button onClick={handleSaveAppTitle}>
                <Save size={16} className="ml-1" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* תבנית WhatsApp גלובלית - הועבר לתחתית */}
      <Card title="תבנית הודעת WhatsApp (כללית לכל הבניינים)">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">תבנית גלובלית</h4>
            </div>
            <p className="text-sm text-blue-700">
              תבנית זו תשמש לכל הבניינים במערכת. שינוי כאן ישפיע על כל הודעות WhatsApp שיישלחו.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תבנית ההודעה</label>
            <textarea
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="תבנית ההודעה..."
            />
            <div className="mt-2 text-xs text-gray-500">
              <p className="mb-1">ניתן להשתמש בתגים הבאים:</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 px-2 py-1 rounded">{'{שם}'}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{'{חודשים}'}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{'{סכום_כולל}'}</span>
              </div>
            </div>
          </div>
          
          <Button onClick={handleSaveWhatsappTemplate} className="w-full">
            <Save size={16} className="ml-1" />
            שמור תבנית WhatsApp
          </Button>
        </div>
      </Card>

      {/* הסבר על השינויים */}
      <Card title="הסבר - גיבוי שקט">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <Shield size={16} className="text-green-600" />
            <span><strong>גיבוי שקט:</strong> הגיבוי האוטומטי כעת פועל ברקע ולא פותח חלון הורדה</span>
          </div>
          <div className="flex items-center space-x-3">
            <Download size={16} className="text-blue-600" />
            <span><strong>גיבויים שמורים:</strong> תוכל לראות ולהוריד גיבויים קודמים מהרשימה</span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">✅ תוקן:</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• ✅ גיבוי אוטומטי פועל ברקע ללא הפרעה</li>
              <li>• ✅ שמירת עד 7 גיבויים אחרונים במחשב</li>
              <li>• ✅ אפשרות להוריד גיבויים קודמים בכל עת</li>
              <li>• ✅ ניקוי אוטומטי של גיבויים ישנים</li>
              <li>• ✅ כפתור "הורד גיבוי עכשיו" לגיבוי ידני</li>
            </ul>
          </div>
          <p className="text-xs">
            כעת הגיבוי האוטומטי לא יפריע לעבודה שלך ויפעל בשקט ברקע.
          </p>
        </div>
      </Card>

      {/* מודל הוספת בניין */}
      <Modal
        isOpen={isAddBuildingModalOpen}
        onClose={() => setIsAddBuildingModalOpen(false)}
        title="הוסף בניין חדש"
      >
        <form onSubmit={handleAddBuilding} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הבניין</label>
            <input
              type="text"
              required
              value={newBuildingName}
              onChange={(e) => setNewBuildingName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="שם הבניין החדש"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddBuildingModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              הוסף בניין
            </Button>
          </div>
        </form>
      </Modal>

      {/* מודל עריכת שם בניין */}
      <Modal
        isOpen={isEditBuildingModalOpen}
        onClose={() => setIsEditBuildingModalOpen(false)}
        title="ערוך שם בניין"
      >
        <form onSubmit={handleEditBuilding} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם הבניין</label>
            <input
              type="text"
              required
              value={editBuildingName}
              onChange={(e) => setEditBuildingName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="שם הבניין"
              autoFocus
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>שים לב:</strong> שינוי שם הבניין יתעדכן בכל המקומות במערכת.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditBuildingModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              שמור שינויים
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};