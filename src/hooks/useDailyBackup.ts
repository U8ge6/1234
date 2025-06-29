import { useEffect, useRef } from 'react';
import { AppData } from '../types';

const BACKUP_KEY = 'last-backup-date';

export const useDailyBackup = (data: AppData, enabled: boolean = true) => {
  const hasBackedUpToday = useRef(false);

  const createBackupFile = (silent: boolean = false) => {
    const today = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(data, null, 2);
    
    if (silent) {
      // גיבוי שקט - שמירה ב-localStorage בלבד
      try {
        localStorage.setItem(`auto-backup-${today}`, dataStr);
        localStorage.setItem(BACKUP_KEY, today);
        hasBackedUpToday.current = true;
        console.log('Auto backup completed silently for', today);
      } catch (error) {
        console.error('Silent backup failed:', error);
        // אם הגיבוי השקט נכשל, ננסה גיבוי רגיל
        createRegularBackup();
      }
    } else {
      // גיבוי רגיל עם הורדת קובץ
      createRegularBackup();
    }
  };

  const createRegularBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `גיבוי-אוטומטי-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    // שמירת תאריך הגיבוי האחרון
    localStorage.setItem(BACKUP_KEY, today);
    hasBackedUpToday.current = true;
  };

  const shouldBackupToday = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastBackup = localStorage.getItem(BACKUP_KEY);
    return lastBackup !== today && !hasBackedUpToday.current;
  };

  const getLastBackupDate = () => {
    return localStorage.getItem(BACKUP_KEY);
  };

  const forceBackup = () => {
    createBackupFile(false); // גיבוי ידני - עם הורדת קובץ
  };

  const getStoredBackups = () => {
    const backups: { date: string; size: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('auto-backup-')) {
        const date = key.replace('auto-backup-', '');
        const data = localStorage.getItem(key);
        if (data) {
          backups.push({
            date,
            size: new Blob([data]).size
          });
        }
      }
    }
    return backups.sort((a, b) => b.date.localeCompare(a.date));
  };

  const downloadStoredBackup = (date: string) => {
    const backupData = localStorage.getItem(`auto-backup-${date}`);
    if (backupData) {
      const dataBlob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `גיבוי-אוטומטי-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const cleanOldBackups = () => {
    // שמירת רק 7 גיבויים אחרונים
    const backups = getStoredBackups();
    if (backups.length > 7) {
      const oldBackups = backups.slice(7);
      oldBackups.forEach(backup => {
        localStorage.removeItem(`auto-backup-${backup.date}`);
      });
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // בדיקה אם צריך לעשות גיבוי היום
    if (shouldBackupToday()) {
      // המתנה של 3 שניות אחרי טעינת האתר
      const timer = setTimeout(() => {
        createBackupFile(true); // גיבוי שקט
        cleanOldBackups(); // ניקוי גיבויים ישנים
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [data, enabled]);

  return {
    shouldBackupToday: shouldBackupToday(),
    lastBackupDate: getLastBackupDate(),
    forceBackup,
    getStoredBackups,
    downloadStoredBackup,
    cleanOldBackups
  };
};