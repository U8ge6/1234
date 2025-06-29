import React, { useState } from 'react';
import { Building, Expense } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { expenseCategories } from '../../types';

interface ExpensesProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ building, onUpdateBuilding }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: expenseCategories[0],
    amount: 0,
    notes: ''
  });

  const filteredExpenses = building.expenses.filter(expense => {
    const expenseYear = new Date(expense.date).getFullYear();
    const categoryMatch = selectedCategory === 'all' || expense.category === selectedCategory;
    const yearMatch = expenseYear === selectedYear;
    return categoryMatch && yearMatch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const availableYears = Array.from(
    new Set(building.expenses.map(e => new Date(e.date).getFullYear()))
  ).sort((a, b) => b - a);

  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData(expense);
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: expenseCategories[0],
        amount: 0,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expense: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      date: formData.date!,
      description: formData.description!,
      category: formData.category!,
      amount: formData.amount!,
      notes: formData.notes,
      fromIssue: editingExpense?.fromIssue || false,
      issueId: editingExpense?.issueId
    };

    onUpdateBuilding(prev => ({
      ...prev,
      expenses: editingExpense
        ? prev.expenses.map(e => e.id === editingExpense.id ? expense : e)
        : [...prev.expenses, expense]
    }));

    setIsModalOpen(false);
  };

  const deleteExpense = (expenseId: string) => {
    const expense = building.expenses.find(e => e.id === expenseId);
    if (expense?.fromIssue) {
      alert('לא ניתן למחוק הוצאה שנוצרה מתקלה. יש למחוק את התקלה עצמה.');
      return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) {
      onUpdateBuilding(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== expenseId)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">הוצאות כלליות</h2>
        <Button onClick={() => openModal()}>
          <Plus size={16} className="ml-1" />
          הוסף הוצאה
        </Button>
      </div>

      {/* סיכום כספי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">סך הוצאות {selectedYear}</p>
            <p className="text-2xl font-bold text-red-700">₪{totalExpenses.toLocaleString()}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">מספר הוצאות</p>
            <p className="text-2xl font-bold text-blue-700">{filteredExpenses.length}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <p className="text-sm font-medium text-purple-600">ממוצע חודשי</p>
            <p className="text-2xl font-bold text-purple-700">
              ₪{Math.round(totalExpenses / 12).toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* פילטרים */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">כל הקטגוריות</option>
              {expenseCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">שנה</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* התפלגות לפי קטגוריות */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card title="התפלגות הוצאות לפי קטגוריה">
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / totalExpenses) * 100;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-gray-900">₪{amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* רשימת הוצאות */}
      <Card title="רשימת הוצאות">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קטגוריה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סכום</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">הערות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center">
                      {expense.fromIssue && (
                        <AlertCircle size={16} className="text-orange-500 ml-2" title="נוצר מתקלה" />
                      )}
                      {expense.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₪{expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {expense.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal(expense)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ערוך"
                        disabled={expense.fromIssue}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800"
                        title="מחק"
                        disabled={expense.fromIssue}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">אין הוצאות להצגה</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'ערוך הוצאה' : 'הוסף הוצאה חדשה'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
              <select
                value={formData.category || expenseCategories[0]}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
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
              placeholder="תיאור ההוצאה"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="הערות נוספות (אופציונלי)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingExpense ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};