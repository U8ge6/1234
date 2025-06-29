import React, { useState } from 'react';
import { Building, Payment, Expense, Issue, Tenant } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Wallet, Zap, Building2, Edit, Save } from 'lucide-react';

interface DashboardProps {
  building: Building;
  onUpdateBuilding?: (updater: (building: Building) => Building) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ building, onUpdateBuilding }) => {
  const [editingMeter, setEditingMeter] = useState<string | null>(null);
  const [meterValues, setMeterValues] = useState<Record<string, string>>({});
  
  const currentYear = new Date().getFullYear();
  
  // חישובים כספיים
  const yearlyIncome = building.payments
    .filter(p => p.year === currentYear && p.paid)
    .reduce((sum, p) => sum + p.amount, 0);
  
  const yearlyExpenses = building.expenses
    .filter(e => new Date(e.date).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const yearlyBalance = yearlyIncome - yearlyExpenses;
  
  const pettyCashBalance = building.pettyCash
    .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
  
  // חישוב דיירים חייבים
  const debtorTenants = building.tenants.filter(tenant => {
    const tenantPayments = building.payments.filter(p => p.tenantId === tenant.id && p.year === currentYear);
    const paidMonths = tenantPayments.filter(p => p.paid).length;
    const currentMonth = new Date().getMonth() + 1;
    return paidMonths < currentMonth;
  }).length;
  
  // תקלות פתוחות
  const openIssues = building.issues.filter(i => i.status !== 'resolved').length;
  
  // התפלגות הוצאות לפי קטגוריה
  const expensesByCategory = building.expenses
    .filter(e => new Date(e.date).getFullYear() === currentYear)
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  // פונקציות עריכת מונה חשמל
  const startEditingMeter = (entrance: string) => {
    const currentMeter = building.settings.electricity[entrance as keyof typeof building.settings.electricity]?.meter || '';
    setMeterValues({ ...meterValues, [entrance]: currentMeter });
    setEditingMeter(entrance);
  };

  const saveMeterValue = (entrance: string) => {
    if (!onUpdateBuilding) return;
    
    const newMeterValue = meterValues[entrance] || '';
    onUpdateBuilding(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        electricity: {
          ...prev.settings.electricity,
          [entrance]: {
            ...prev.settings.electricity[entrance as keyof typeof prev.settings.electricity],
            meter: newMeterValue
          }
        }
      }
    }));
    
    setEditingMeter(null);
    setMeterValues({ ...meterValues, [entrance]: '' });
  };

  const cancelEditingMeter = () => {
    setEditingMeter(null);
    setMeterValues({});
  };

  return (
    <div className="space-y-6">
      {/* כרטיסיות סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">יתרה שנתית</p>
              <p className={`text-2xl font-bold ${yearlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₪{yearlyBalance.toLocaleString()}
              </p>
            </div>
            {yearlyBalance >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">קופה קטנה</p>
              <p className="text-2xl font-bold text-green-700">₪{pettyCashBalance.toLocaleString()}</p>
            </div>
            <Wallet className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">דיירים חייבים</p>
              <p className="text-2xl font-bold text-orange-700">{debtorTenants}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">תקלות פתוחות</p>
              <p className="text-2xl font-bold text-red-700">{openIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* סטטוס גבייה שנתי (הועבר למקום הראשון) */}
      <Card title="סטטוס גבייה שנתי">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{building.tenants.length - debtorTenants}</p>
              <p className="text-sm text-green-700">דיירים ששילמו</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{debtorTenants}</p>
              <p className="text-sm text-red-700">דיירים חייבים</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{building.tenants.length}</p>
              <p className="text-sm text-blue-700">סך הכל דיירים</p>
            </div>
          </div>
          
          {building.tenants.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>אחוז גבייה</span>
                <span>{Math.round(((building.tenants.length - debtorTenants) / building.tenants.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((building.tenants.length - debtorTenants) / building.tenants.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* סיכום כספי שנתי (הועבר למקום השני) */}
      <Card title="סיכום כספי שנתי">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
            <span className="font-medium text-green-800">הכנסות</span>
            <span className="font-bold text-green-600">₪{yearlyIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
            <span className="font-medium text-red-800">הוצאות</span>
            <span className="font-bold text-red-600">₪{yearlyExpenses.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between items-center p-3 rounded-lg ${yearlyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <span className={`font-bold ${yearlyBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>מאזן</span>
            <span className={`font-bold text-lg ${yearlyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              ₪{yearlyBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* התפלגות הוצאות */}
      <Card title="התפלגות הוצאות">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.entries(expensesByCategory).map(([category, amount]) => (
            <div key={category} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{category}</span>
              <span className="text-sm font-bold text-gray-900">₪{amount.toLocaleString()}</span>
            </div>
          ))}
          {Object.keys(expensesByCategory).length === 0 && (
            <p className="text-center text-gray-500 py-8">אין הוצאות השנה</p>
          )}
        </div>
      </Card>

      {/* פרטי הבניין (הועבר לכאן - מתחת להתפלגות הוצאות) */}
      <Card title="פרטי הבניין">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">קודי כניסה</h4>
            <div className="grid grid-cols-4 gap-2">
              {['A', 'B', 'C', 'D'].map(entrance => (
                <div key={entrance} className="text-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-500">כניסה {entrance}</span>
                  <p className="text-lg font-bold text-gray-900">
                    {building.settings.entranceCodes[entrance as keyof typeof building.settings.entranceCodes] || 'לא הוגדר'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {building.settings.elevator.company && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">מעלית</h4>
              <p className="text-sm text-gray-600">חברה: {building.settings.elevator.company}</p>
              <p className="text-sm text-gray-600">טלפון: {building.settings.elevator.phone}</p>
            </div>
          )}
        </div>
      </Card>

      {/* חשמל - מונים */}
      <Card title="חשמל - מונים">
        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map(entrance => {
            const electricInfo = building.settings.electricity[entrance as keyof typeof building.settings.electricity];
            const isEditing = editingMeter === entrance;
            
            return electricInfo && (
              <div key={entrance} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">כניסה {entrance}</span>
                  </div>
                  {onUpdateBuilding && !isEditing && (
                    <button
                      onClick={() => startEditingMeter(entrance)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="ערוך מספר מונה"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-1">חוזה: {electricInfo.contract}</p>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">מונה:</span>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={meterValues[entrance] || ''}
                        onChange={(e) => setMeterValues({ ...meterValues, [entrance]: e.target.value })}
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="מספר מונה"
                        autoFocus
                      />
                      <button
                        onClick={() => saveMeterValue(entrance)}
                        className="text-green-600 hover:text-green-800"
                        title="שמור"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={cancelEditingMeter}
                        className="text-gray-600 hover:text-gray-800"
                        title="ביטול"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {electricInfo.meter || 'לא הוגדר'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {!onUpdateBuilding && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">עריכת מונים זמינה רק בעמוד הגדרות</p>
            </div>
          )}
        </div>
      </Card>

      {/* הסבר על עריכת מונים */}
      {onUpdateBuilding && (
        <Card title="הסבר - עריכת מונה חשמל">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center space-x-3">
              <Edit size={16} className="text-blue-600" />
              <span><strong>עריכה מהירה:</strong> לחץ על סמל העריכה ליד מספר המונה לעדכון מהיר</span>
            </div>
            <div className="flex items-center space-x-3">
              <Save size={16} className="text-green-600" />
              <span><strong>שמירה:</strong> לחץ על סמל השמירה לאחר עדכון המספר</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">✨ חדש:</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• ✅ עריכה ישירה של מספרי מונה מלוח הבקרה</li>
                <li>• ✅ שמירה מהירה ללא צורך לעבור להגדרות</li>
                <li>• ✅ עדכון בזמן אמת</li>
                <li>• ✅ ביטול שינויים אם נדרש</li>
              </ul>
            </div>
            <p className="text-xs">
              עכשיו תוכל לעדכן מספרי מונה ישירות מלוח הבקרה ללא צורך לעבור להגדרות.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};