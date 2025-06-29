import React, { useState } from 'react';
import { Building, PettyCashTransaction } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface PettyCashProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const PettyCash: React.FC<PettyCashProps> = ({ building, onUpdateBuilding }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PettyCashTransaction | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<PettyCashTransaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'expense',
    amount: 0
  });

  const currentBalance = building.pettyCash.reduce((sum, t) => 
    t.type === 'income' ? sum + t.amount : sum - t.amount, 0
  );

  const currentYear = new Date().getFullYear();
  const currentYearTransactions = building.pettyCash.filter(t => 
    new Date(t.date).getFullYear() === currentYear
  );

  const filteredTransactions = currentYearTransactions.filter(transaction => {
    const typeMatch = selectedType === 'all' || transaction.type === selectedType;
    const monthMatch = selectedMonth === 'all' || 
      new Date(transaction.date).getMonth() === parseInt(selectedMonth);
    return typeMatch && monthMatch;
  });

  const totalIncome = currentYearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentYearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const openModal = (transaction?: PettyCashTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData(transaction);
    } else {
      setEditingTransaction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'expense',
        amount: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transaction: PettyCashTransaction = {
      id: editingTransaction?.id || Date.now().toString(),
      date: formData.date!,
      description: formData.description!,
      type: formData.type!,
      amount: formData.amount!
    };

    onUpdateBuilding(prev => ({
      ...prev,
      pettyCash: editingTransaction
        ? prev.pettyCash.map(t => t.id === editingTransaction.id ? transaction : t)
        : [...prev.pettyCash, transaction]
    }));

    setIsModalOpen(false);
  };

  const deleteTransaction = (transactionId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) {
      onUpdateBuilding(prev => ({
        ...prev,
        pettyCash: prev.pettyCash.filter(t => t.id !== transactionId)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">קופה קטנה</h2>
        <Button onClick={() => openModal()}>
          <Plus size={16} className="ml-1" />
          הוסף תנועה
        </Button>
      </div>

      {/* יתרה נוכחית */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Wallet className="h-8 w-8 text-green-600 ml-2" />
            <h3 className="text-lg font-semibold text-green-800">יתרה נוכחית</h3>
          </div>
          <p className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ₪{currentBalance.toLocaleString()}
          </p>
        </div>
      </Card>

      {/* סיכום שנתי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">הכנסות {currentYear}</p>
              <p className="text-2xl font-bold text-blue-700">₪{totalIncome.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">הוצאות {currentYear}</p>
              <p className="text-2xl font-bold text-red-700">₪{totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">מאזן שנתי</p>
              <p className={`text-2xl font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ₪{(totalIncome - totalExpenses).toLocaleString()}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* פילטרים */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג תנועה</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">כל התנועות</option>
              <option value="income">הכנסות</option>
              <option value="expense">הוצאות</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">חודש</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">כל החודשים</option>
              {months.map((month, index) => (
                <option key={index} value={index.toString()}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* רשימת תנועות */}
      <Card title="תנועות בקופה">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סוג</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סכום</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יתרה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction, index) => {
                  // חישוב יתרה עד לנקודה זו
                  const transactionsUntilNow = building.pettyCash
                    .filter(t => new Date(t.date) <= new Date(transaction.date))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  
                  let runningBalance = 0;
                  for (const t of transactionsUntilNow) {
                    if (t.type === 'income') {
                      runningBalance += t.amount;
                    } else {
                      runningBalance -= t.amount;
                    }
                    if (t.id === transaction.id) break;
                  }

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}₪{transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₪{runningBalance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal(transaction)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ערוך"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800"
                            title="מחק"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">אין תנועות להצגה</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'ערוך תנועה' : 'הוסף תנועה חדשה'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
              <input
                type="date"
                required
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג תנועה</label>
              <select
                value={formData.type || 'expense'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">הכנסה</option>
                <option value="expense">הוצאה</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
            <input
              type="text"
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="תיאור התנועה"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingTransaction ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};