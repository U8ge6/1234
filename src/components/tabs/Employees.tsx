import React, { useState } from 'react';
import { GlobalEmployee } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, UserCheck, Calendar, Phone, Calculator } from 'lucide-react';

interface EmployeesProps {
  globalEmployees: GlobalEmployee[];
  onUpdateEmployees: (updater: (employees: GlobalEmployee[]) => GlobalEmployee[]) => void;
}

export const Employees: React.FC<EmployeesProps> = ({ globalEmployees, onUpdateEmployees }) => {
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<GlobalEmployee | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState<Partial<GlobalEmployee>>({
    name: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    baseSalary: 0,
    workDaysPerMonth: 21.67,
    absenceDays: 0
  });

  const calculateSalary = (employee: GlobalEmployee) => {
    const dailyWage = employee.baseSalary / employee.workDaysPerMonth;
    const totalDeduction = employee.absenceDays * dailyWage;
    const finalSalary = employee.baseSalary - totalDeduction;
    
    return {
      baseSalary: employee.baseSalary,
      dailyWage,
      absenceDays: employee.absenceDays,
      totalDeduction,
      finalSalary: Math.max(0, finalSalary) // לא יכול להיות שלילי
    };
  };

  const openEmployeeModal = (employee?: GlobalEmployee) => {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeFormData(employee);
    } else {
      setEditingEmployee(null);
      setEmployeeFormData({
        name: '',
        phone: '',
        startDate: new Date().toISOString().split('T')[0],
        baseSalary: 0,
        workDaysPerMonth: 21.67,
        absenceDays: 0 // ברירת מחדל 0 לעובד חדש
      });
    }
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employee: GlobalEmployee = {
      id: editingEmployee?.id || Date.now().toString(),
      name: employeeFormData.name!,
      phone: employeeFormData.phone!,
      startDate: employeeFormData.startDate!,
      baseSalary: employeeFormData.baseSalary!,
      workDaysPerMonth: employeeFormData.workDaysPerMonth!,
      absenceDays: editingEmployee ? employeeFormData.absenceDays! : 0 // עובד חדש מתחיל עם 0 ימי היעדרות
    };

    onUpdateEmployees(prev => 
      editingEmployee
        ? prev.map(e => e.id === editingEmployee.id ? employee : e)
        : [...prev, employee]
    );

    setIsEmployeeModalOpen(false);
  };

  const deleteEmployee = (employeeId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק עובד זה?')) {
      onUpdateEmployees(prev => prev.filter(e => e.id !== employeeId));
    }
  };

  const updateAbsenceDays = (employeeId: string, absenceDays: number) => {
    onUpdateEmployees(prev => 
      prev.map(e => e.id === employeeId ? { ...e, absenceDays } : e)
    );
  };

  const totalMonthlySalary = globalEmployees.reduce((sum, emp) => sum + calculateSalary(emp).finalSalary, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול עובדים</h2>
          <p className="text-sm text-gray-600 mt-1">עובדים גלובליים - עובדים בכל הבניינים</p>
        </div>
        <Button onClick={() => openEmployeeModal()}>
          <Plus size={16} className="ml-1" />
          הוסף עובד
        </Button>
      </div>

      {/* סיכום עובדים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">סך עובדים</p>
              <p className="text-2xl font-bold text-blue-700">{globalEmployees.length}</p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">שכר כולל חודשי</p>
              <p className="text-2xl font-bold text-green-700">
                ₪{Math.round(totalMonthlySalary).toLocaleString()}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">סך ימי היעדרות</p>
              <p className="text-2xl font-bold text-orange-700">
                {globalEmployees.reduce((sum, emp) => sum + emp.absenceDays, 0)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* כרטיסי עובדים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {globalEmployees.map((employee) => {
          const salary = calculateSalary(employee);
          
          return (
            <Card key={employee.id} title={employee.name}>
              <div className="space-y-4">
                {/* פרטי עובד */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{employee.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEmployeeModal(employee)}
                      className="text-blue-600 hover:text-blue-800"
                      title="ערוך עובד"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="text-red-600 hover:text-red-800"
                      title="מחק עובד"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>תחילת עבודה: {new Date(employee.startDate).toLocaleDateString('he-IL')}</p>
                  <p>ימי עבודה בחודש: {employee.workDaysPerMonth}</p>
                </div>

                {/* עדכון ימי היעדרות */}
                <div className="bg-orange-50 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ימי היעדרות החודש</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={employee.absenceDays}
                      onChange={(e) => updateAbsenceDays(employee.id, parseInt(e.target.value) || 0)}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-600">ימים</span>
                  </div>
                </div>

                {/* מחשבון שכר */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Calculator size={16} className="ml-2" />
                    חישוב שכר חודשי
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">שכר בסיס:</span>
                      <span className="font-medium text-gray-900 mr-2">₪{salary.baseSalary.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">שכר יומי:</span>
                      <span className="font-medium text-gray-900 mr-2">₪{Math.round(salary.dailyWage).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ימי היעדרות:</span>
                      <span className="font-medium text-orange-600 mr-2">{salary.absenceDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ניכוי:</span>
                      <span className="font-medium text-red-600 mr-2">₪{Math.round(salary.totalDeduction).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">שכר לתשלום:</span>
                      <span className="font-bold text-green-600 text-lg">₪{Math.round(salary.finalSalary).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {globalEmployees.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין עובדים במערכת</p>
            <p className="text-sm text-gray-400 mb-4">עובדים גלובליים עובדים בכל הבניינים</p>
            <Button className="mt-4" onClick={() => openEmployeeModal()}>
              הוסף עובד ראשון
            </Button>
          </div>
        </Card>
      )}

      {/* מודל הוספת/עריכת עובד */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={editingEmployee ? 'ערוך עובד' : 'הוסף עובד חדש'}
      >
        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם העובד</label>
            <input
              type="text"
              required
              value={employeeFormData.name || ''}
              onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="שם מלא"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
            <input
              type="tel"
              required
              value={employeeFormData.phone || ''}
              onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="מספר טלפון"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך תחילת עבודה</label>
            <input
              type="date"
              required
              value={employeeFormData.startDate || ''}
              onChange={(e) => setEmployeeFormData({ ...employeeFormData, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שכר בסיס חודשי</label>
            <input
              type="number"
              required
              min="0"
              value={employeeFormData.baseSalary || ''}
              onChange={(e) => setEmployeeFormData({ ...employeeFormData, baseSalary: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ימי עבודה בחודש</label>
            <input
              type="number"
              required
              min="1"
              max="31"
              step="0.01"
              value={employeeFormData.workDaysPerMonth || ''}
              onChange={(e) => setEmployeeFormData({ ...employeeFormData, workDaysPerMonth: parseFloat(e.target.value) || 21.67 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="21.67"
            />
          </div>

          {/* שדה ימי היעדרות רק בעריכה */}
          {editingEmployee && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ימי היעדרות החודש</label>
              <input
                type="number"
                min="0"
                max="31"
                value={employeeFormData.absenceDays || ''}
                onChange={(e) => setEmployeeFormData({ ...employeeFormData, absenceDays: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          )}

          {/* הודעה לעובד חדש */}
          {!editingEmployee && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>שים לב:</strong> עובד חדש יתחיל עם 0 ימי היעדרות. תוכל לעדכן ימי היעדרות אחרי ההוספה ישירות מהכרטיס של העובד.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEmployeeModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingEmployee ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};