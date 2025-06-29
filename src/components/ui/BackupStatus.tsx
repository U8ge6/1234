import React from 'react';
import { Shield, Download, Calendar, Archive, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface BackupStatusProps {
  shouldBackupToday: boolean;
  lastBackupDate: string | null;
  onForceBackup: () => void;
  getStoredBackups?: () => { date: string; size: number }[];
  downloadStoredBackup?: (date: string) => void;
  cleanOldBackups?: () => void;
}

export const BackupStatus: React.FC<BackupStatusProps> = ({
  shouldBackupToday,
  lastBackupDate,
  onForceBackup,
  getStoredBackups,
  downloadStoredBackup,
  cleanOldBackups
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'אף פעם';
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const getStatusColor = () => {
    if (!lastBackupDate) return 'text-red-600';
    const today = new Date().toISOString().split('T')[0];
    return lastBackupDate === today ? 'text-green-600' : 'text-orange-600';
  };

  const getStatusText = () => {
    if (!lastBackupDate) return 'לא בוצע גיבוי';
    const today = new Date().toISOString().split('T')[0];
    return lastBackupDate === today ? 'בוצע גיבוי היום (ברקע)' : 'טעון גיבוי';
  };

  const storedBackups = getStoredBackups ? getStoredBackups() : [];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-medium text-gray-900">גיבוי אוטומטי יומי (ברקע)</h4>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">גיבוי אחרון:</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {formatDate(lastBackupDate)}
              </span>
            </div>
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={onForceBackup}
          size="sm"
          variant="secondary"
        >
          <Download size={16} className="ml-1" />
          הורד גיבוי עכשיו
        </Button>
      </div>
      
      {/* רשימת גיבויים שמורים */}
      {storedBackups.length > 0 && (
        <div className="border-t border-blue-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Archive className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">גיבויים שמורים ({storedBackups.length})</span>
            </div>
            {cleanOldBackups && (
              <Button
                onClick={cleanOldBackups}
                size="sm"
                variant="secondary"
                className="text-xs"
              >
                <Trash2 size={12} className="ml-1" />
                נקה ישנים
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {storedBackups.slice(0, 5).map((backup) => (
              <div key={backup.date} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{formatDate(backup.date)}</span>
                  <span className="text-xs text-gray-400">({formatSize(backup.size)})</span>
                </div>
                {downloadStoredBackup && (
                  <button
                    onClick={() => downloadStoredBackup(backup.date)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                    title="הורד גיבוי זה"
                  >
                    <Download size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          <strong>גיבוי שקט:</strong> הגיבוי האוטומטי כעת פועל ברקע ולא פותח חלון הורדה. הנתונים נשמרים במחשב שלך ותוכל להוריד אותם בכל עת.
        </p>
      </div>
    </div>
  );
};