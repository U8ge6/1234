import React, { useState } from 'react';
import { Building, Issue } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

interface IssuesProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const Issues: React.FC<IssuesProps> = ({ building, onUpdateBuilding }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [statusModalOpen, setStatusModalOpen] = useState<string | null>(null);
  const [statusModalPosition, setStatusModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [formData, setFormData] = useState<Partial<Issue>>({
    date: new Date().toISOString().split('T')[0],
    reporterName: '',
    description: '',
    cost: 0,
    status: 'open'
  });

  const filteredIssues = building.issues.filter(issue => 
    selectedStatus === 'all' || issue.status === selectedStatus
  );

  const statusCounts = {
    open: building.issues.filter(i => i.status === 'open').length,
    inProgress: building.issues.filter(i => i.status === 'in-progress').length,
    resolved: building.issues.filter(i => i.status === 'resolved').length
  };

  const totalCost = building.issues
    .filter(i => i.status === 'resolved')
    .reduce((sum, i) => sum + i.cost, 0);

  const openModal = (issue?: Issue) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData(issue);
    } else {
      setEditingIssue(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reporterName: '',
        description: '',
        cost: 0,
        status: 'open'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const issue: Issue = {
      id: editingIssue?.id || Date.now().toString(),
      date: formData.date!,
      reporterName: formData.reporterName!,
      description: formData.description!,
      cost: formData.cost!,
      status: formData.status!
    };

    updateIssueAndExpenses(issue);
    setIsModalOpen(false);
  };

  const updateIssueAndExpenses = (issue: Issue) => {
    onUpdateBuilding(prev => {
      // עדכון רשימת התקלות
      let updatedIssues = prev.issues.map(existingIssue =>
        existingIssue.id === issue.id ? issue : existingIssue
      );

      // אם זו תקלה חדשה (לא נמצאה ברשימה), הוסף אותה
      if (!prev.issues.find(i => i.id === issue.id)) {
        updatedIssues = [...prev.issues, issue];
      }

      let updatedExpenses = [...prev.expenses];

      // אם התקלה הועברה לסטטוס "טופל" ויש לה עלות
      if (issue.status === 'resolved' && issue.cost > 0) {
        // בדיקה אם כבר קיימת הוצאה עבור התקלה הזו
        const existingExpense = prev.expenses.find(e => e.issueId === issue.id);
        
        if (!existingExpense) {
          // יצירת הוצאה חדשה
          const newExpense = {
            id: `issue-${issue.id}`,
            date: new Date().toISOString().split('T')[0],
            description: `תיקון תקלה: ${issue.description}`,
            category: 'תיקונים',
            amount: issue.cost,
            notes: `דווח על ידי: ${issue.reporterName}`,
            fromIssue: true,
            issueId: issue.id
          };
          updatedExpenses.push(newExpense);
        } else {
          // עדכון הוצאה קיימת
          updatedExpenses = updatedExpenses.map(e => 
            e.issueId === issue.id 
              ? { ...e, amount: issue.cost, description: `תיקון תקלה: ${issue.description}` }
              : e
          );
        }
      }

      // אם התקלה הוחזרה לסטטוס שאינו "טופל", מחיקת ההוצאה
      if (issue.status !== 'resolved') {
        updatedExpenses = updatedExpenses.filter(e => e.issueId !== issue.id);
      }

      return {
        ...prev,
        issues: updatedIssues,
        expenses: updatedExpenses
      };
    });
  };

  const openStatusModal = (issueId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusModalPosition({
      x: rect.left + rect.width + 10, // ליד הכפתור
      y: rect.top
    });
    setStatusModalOpen(issueId);
  };

  const quickStatusChange = (issueId: string, newStatus: Issue['status']) => {
    const issue = building.issues.find(i => i.id === issueId);
    if (!issue) return;

    const updatedIssue = { ...issue, status: newStatus };
    updateIssueAndExpenses(updatedIssue);
    setStatusModalOpen(null);
  };

  const deleteIssue = (issueId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תקלה זו? ההוצאה הקשורה אליה תימחק גם כן.')) {
      onUpdateBuilding(prev => ({
        ...prev,
        issues: prev.issues.filter(i => i.id !== issueId),
        expenses: prev.expenses.filter(e => e.issueId !== issueId)
      }));
    }
  };

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusText = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return 'פתוח';
      case 'in-progress':
        return 'בטיפול';
      case 'resolved':
        return 'טופל';
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
    }
  };

  // סגירת המודל בלחיצה על Escape או מחוץ למודל
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStatusModalOpen(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (statusModalOpen && !(e.target as Element).closest('.status-modal')) {
        setStatusModalOpen(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusModalOpen]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">ניהול תקלות</h2>
        <Button onClick={() => openModal()}>
          <Plus size={16} className="ml-1" />
          דווח על תקלה
        </Button>
      </div>

      {/* סיכום תקלות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">תקלות פתוחות</p>
              <p className="text-2xl font-bold text-red-700">{statusCounts.open}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">בטיפול</p>
              <p className="text-2xl font-bold text-orange-700">{statusCounts.inProgress}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">טופלו</p>
              <p className="text-2xl font-bold text-green-700">{statusCounts.resolved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">עלות כוללת</p>
              <p className="text-2xl font-bold text-blue-700">₪{totalCost.toLocaleString()}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* פילטר סטטוס */}
      <Card>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">סינון לפי סטטוס:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">כל התקלות</option>
            <option value="open">פתוחות</option>
            <option value="in-progress">בטיפול</option>
            <option value="resolved">טופלו</option>
          </select>
        </div>
      </Card>

      {/* רשימת תקלות */}
      <Card title="רשימת תקלות">
        <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מדווח</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">עלות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(issue.date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.reporterName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={issue.description}>
                      {issue.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {issue.cost > 0 ? `₪${issue.cost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => openStatusModal(issue.id, e)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${getStatusColor(issue.status)}`}
                    >
                      {getStatusIcon(issue.status)}
                      <span>{getStatusText(issue.status)}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal(issue)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ערוך"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteIssue(issue.id)}
                        className="text-red-600 hover:text-red-800"
                        title="מחק"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIssues.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין תקלות להצגה</p>
            </div>
          )}
        </div>
      </Card>

      {/* מודל שינוי סטטוס */}
      {statusModalOpen && (
        <div
          className="status-modal fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[200px]"
          style={{
            left: `${statusModalPosition.x}px`,
            top: `${statusModalPosition.y}px`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">שנה סטטוס</h4>
            <button
              onClick={() => setStatusModalOpen(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => quickStatusChange(statusModalOpen, 'open')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">פתוח</span>
            </button>
            
            <button
              onClick={() => quickStatusChange(statusModalOpen, 'in-progress')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-orange-700">בטיפול</span>
            </button>
            
            <button
              onClick={() => quickStatusChange(statusModalOpen, 'resolved')}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700">טופל</span>
            </button>
          </div>
        </div>
      )}

      {/* הסבר על שינוי סטטוס מהיר */}
      <Card title="הסבר - שינוי סטטוס מהיר">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">!</span>
            </div>
            <span>לחץ על הסטטוס הנוכחי של התקלה לפתיחת חלון שינוי מהיר</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">סטטוסי תקלות:</h4>
            <ul className="space-y-1 text-blue-700">
              <li className="flex items-center space-x-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span><strong>פתוח</strong> - תקלה חדשה שטרם טופלה</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock size={14} className="text-orange-500" />
                <span><strong>בטיפול</strong> - התקלה נמצאת בתהליך טיפול</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle size={14} className="text-green-500" />
                <span><strong>טופל</strong> - התקלה נפתרה (יוצר הוצאה אוטומטית)</span>
              </li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">💡 תוקן:</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• ✅ תקלות לא משתכפלות יותר</li>
              <li>• ✅ שינוי סטטוס מעדכן את השורה הקיימת</li>
              <li>• ✅ מחיקה של תקלה מוחקת גם את ההוצאה</li>
              <li>• ✅ חלון קטן ונוח לשינוי מהיר</li>
            </ul>
          </div>
          <p className="text-xs">
            כאשר מעבירים תקלה לסטטוס "טופל" עם עלות, המערכת תיצור אוטומטית הוצאה תואמת.
          </p>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIssue ? 'ערוך תקלה' : 'דווח על תקלה חדשה'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך דיווח</label>
              <input
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם המדווח</label>
              <input
                type="text"
                required
                value={formData.reporterName || ''}
                onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="שם המדווח על התקלה"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור התקלה</label>
            <textarea
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="תיאור מפורט של התקלה"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">עלות תיקון</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
              <select
                value={formData.status || 'open'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">פתוח</option>
                <option value="in-progress">בטיפול</option>
                <option value="resolved">טופל</option>
              </select>
            </div>
          </div>

          {formData.status === 'resolved' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>שים לב:</strong> כאשר מסמנים תקלה כ"טופל" עם עלות, המערכת תיצור אוטומטית הוצאה תואמת בלשונית "הוצאות כלליות".
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingIssue ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};