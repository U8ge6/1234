import React from 'react';
import { Building, Payment } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Check, X } from 'lucide-react';

interface PaymentsProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const Payments: React.FC<PaymentsProps> = ({ building, onUpdateBuilding }) => {
  const currentYear = new Date().getFullYear();
  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const getPayment = (tenantId: string, month: number): Payment | undefined => {
    return building.payments.find(p => 
      p.tenantId === tenantId && p.month === month && p.year === currentYear
    );
  };

  const togglePayment = (tenantId: string, month: number) => {
    const existingPayment = getPayment(tenantId, month);
    const tenant = building.tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const amount = tenant.monthlyAmount || building.settings.monthlyAmount;

    onUpdateBuilding(prev => {
      let updatedPayments = [...prev.payments];
      let updatedPettyCash = [...prev.pettyCash];

      if (existingPayment) {
        if (existingPayment.paid) {
          // ביטול תשלום
          updatedPayments = updatedPayments.map(p =>
            p.tenantId === tenantId && p.month === month && p.year === currentYear
              ? { ...p, paid: false }
              : p
          );
          // הסרה מקופה קטנה
          updatedPettyCash = updatedPettyCash.filter(t => 
            !(t.description === `תשלום ${tenant.name} - ${months[month - 1]}` && t.type === 'income')
          );
        } else {
          // סימון כמושלם
          updatedPayments = updatedPayments.map(p =>
            p.tenantId === tenantId && p.month === month && p.year === currentYear
              ? { ...p, paid: true }
              : p
          );
          // הוספה לקופה קטנה
          updatedPettyCash.push({
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            description: `תשלום ${tenant.name} - ${months[month - 1]}`,
            type: 'income',
            amount: prev.settings.pettyCashTransfer
          });
        }
      } else {
        // יצירת תשלום חדש
        updatedPayments.push({
          tenantId,
          month,
          year: currentYear,
          paid: true,
          amount
        });
        // הוספה לקופה קטנה
        updatedPettyCash.push({
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: `תשלום ${tenant.name} - ${months[month - 1]}`,
          type: 'income',
          amount: prev.settings.pettyCashTransfer
        });
      }

      return {
        ...prev,
        payments: updatedPayments,
        pettyCash: updatedPettyCash
      };
    });
  };

  const markAllPaid = () => {
    if (!confirm('האם אתה בטוח שברצונך לסמן את כל התשלומים החסרים כמושלמים?')) {
      return;
    }

    const currentMonth = new Date().getMonth() + 1;
    
    onUpdateBuilding(prev => {
      let updatedPayments = [...prev.payments];
      let updatedPettyCash = [...prev.pettyCash];

      prev.tenants.forEach(tenant => {
        for (let month = 1; month <= currentMonth; month++) {
          const existingPayment = getPayment(tenant.id, month);
          if (!existingPayment || !existingPayment.paid) {
            const amount = tenant.monthlyAmount || prev.settings.monthlyAmount;
            
            if (existingPayment) {
              updatedPayments = updatedPayments.map(p =>
                p.tenantId === tenant.id && p.month === month && p.year === currentYear
                  ? { ...p, paid: true }
                  : p
              );
            } else {
              updatedPayments.push({
                tenantId: tenant.id,
                month,
                year: currentYear,
                paid: true,
                amount
              });
            }

            // הוספה לקופה קטנה אם לא קיים כבר
            const pettyCashExists = updatedPettyCash.some(t => 
              t.description === `תשלום ${tenant.name} - ${months[month - 1]}` && t.type === 'income'
            );
            
            if (!pettyCashExists) {
              updatedPettyCash.push({
                id: `${Date.now()}-${tenant.id}-${month}`,
                date: new Date().toISOString().split('T')[0],
                description: `תשלום ${tenant.name} - ${months[month - 1]}`,
                type: 'income',
                amount: prev.settings.pettyCashTransfer
              });
            }
          }
        }
      });

      return {
        ...prev,
        payments: updatedPayments,
        pettyCash: updatedPettyCash
      };
    });
  };

  // פונקציה לעדכון רטרואקטיבי של סכומי קופה קטנה
  const updatePettyCashAmountsRetroactively = () => {
    if (!confirm('האם אתה בטוח שברצונך לעדכן את כל סכומי הקופה הקטנה בהתאם לסכום הנוכחי? פעולה זו תשנה את כל התנועות הקיימות מתשלומי דיירים.')) {
      return;
    }

    onUpdateBuilding(prev => {
      const updatedPettyCash = prev.pettyCash.map(transaction => {
        // בדיקה אם זו תנועת הכנסה מתשלום דייר
        if (transaction.type === 'income' && transaction.description.includes('תשלום')) {
          return {
            ...transaction,
            amount: prev.settings.pettyCashTransfer
          };
        }
        return transaction;
      });

      return {
        ...prev,
        pettyCash: updatedPettyCash
      };
    });

    alert('כל סכומי הקופה הקטנה עודכנו בהצלחה!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">מעקב גבייה {currentYear}</h2>
        <div className="flex items-center space-x-3">
          <Button onClick={updatePettyCashAmountsRetroactively} variant="secondary">
            עדכן קופה קטנה רטרואקטיבי
          </Button>
          <Button onClick={markAllPaid} variant="success">
            סמן הכל כמושלם
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-4 font-medium text-gray-900 sticky right-0 bg-white z-10">
                  דייר
                </th>
                {months.map((month, index) => (
                  <th key={month} className="text-center py-3 px-2 font-medium text-gray-900 min-w-[80px]">
                    <div className="text-xs">{month}</div>
                    <div className="text-xs text-gray-500">{index + 1}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {building.tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900 sticky right-0 bg-white">
                    <div>{tenant.name}</div>
                    <div className="text-xs text-gray-500">דירה {tenant.apartment}</div>
                  </td>
                  {months.map((_, monthIndex) => {
                    const month = monthIndex + 1;
                    const payment = getPayment(tenant.id, month);
                    const isPaid = payment?.paid || false;
                    const currentMonth = new Date().getMonth() + 1;
                    const isCurrentOrPast = month <= currentMonth;

                    return (
                      <td 
                        key={month} 
                        className="text-center py-3 px-2"
                      >
                        {isCurrentOrPast && (
                          <button
                            onClick={() => togglePayment(tenant.id, month)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isPaid 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                            title={isPaid ? 'לחץ לביטול תשלום' : 'לחץ לסימון כמושלם'}
                          >
                            {isPaid ? <Check size={16} /> : <X size={16} />}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {building.tenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">אין דיירים במערכת</p>
            </div>
          )}
        </div>
      </Card>

      <Card title="הסבר">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check size={12} className="text-green-600" />
            </div>
            <span>תשלום בוצע</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <X size={12} className="text-red-600" />
            </div>
            <span>תשלום לא בוצע</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <h4 className="font-medium text-blue-800 mb-2">✨ חדש - עדכון רטרואקטיבי:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• ✅ כפתור "עדכן קופה קטנה רטרואקטיבי" מעדכן את כל התנועות הקיימות</li>
              <li>• ✅ השינוי חל על כל תשלומי הדיירים שכבר בוצעו בעבר</li>
              <li>• ✅ הסכום החדש יחול על כל התנועות מתשלומי דיירים</li>
            </ul>
          </div>
          <p className="mt-4 text-xs">
            לחיצה על הסמל תשנה את סטטוס התשלום. כאשר מסמנים תשלום כמושלם, ₪{building.settings.pettyCashTransfer} יועברו אוטומטית לקופה הקטנה.
          </p>
        </div>
      </Card>
    </div>
  );
};