import React, { useState, useRef } from 'react';
import { Building, Tenant } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, MessageCircle, Upload, Filter, Phone, FileText, Download } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface TenantsProps {
  building: Building;
  onUpdateBuilding: (updater: (building: Building) => Building) => void;
}

export const Tenants: React.FC<TenantsProps> = ({ building, onUpdateBuilding }) => {
  const { data } = useLocalStorage(); // לקבלת תבנית WhatsApp הגלובלית
  const [selectedEntrance, setSelectedEntrance] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importEntrance, setImportEntrance] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({
    apartment: '',
    floor: 1,
    name: '',
    ownership: 'owner',
    entrance: 'A',
    phone: '',
    paymentMethod: 'cash'
  });

  const filteredTenants = building.tenants.filter(tenant => 
    selectedEntrance === 'all' || tenant.entrance === selectedEntrance
  );

  const openModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData(tenant);
    } else {
      setEditingTenant(null);
      setFormData({
        apartment: '',
        floor: 1,
        name: '',
        ownership: 'owner',
        entrance: 'A',
        phone: '',
        paymentMethod: 'cash'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tenant: Tenant = {
      id: editingTenant?.id || Date.now().toString(),
      apartment: formData.apartment!,
      floor: formData.floor!,
      name: formData.name!,
      ownership: formData.ownership!,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      entrance: formData.entrance!,
      phone: formData.phone!,
      phone2: formData.phone2,
      monthlyAmount: formData.monthlyAmount,
      paymentMethod: formData.paymentMethod!,
      creditDay: formData.creditDay
    };

    onUpdateBuilding(prev => ({
      ...prev,
      tenants: editingTenant
        ? prev.tenants.map(t => t.id === editingTenant.id ? tenant : t)
        : [...prev.tenants, tenant]
    }));

    setIsModalOpen(false);
  };

  const deleteTenant = (tenantId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק דייר זה?')) {
      onUpdateBuilding(prev => ({
        ...prev,
        tenants: prev.tenants.filter(t => t.id !== tenantId),
        payments: prev.payments.filter(p => p.tenantId !== tenantId)
      }));
    }
  };

  const openWhatsApp = (tenant: Tenant, phoneNumber: string, phoneType: 'main' | 'secondary' | 'owner') => {
    // חישוב חודשים חסרים
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const tenantPayments = building.payments.filter(p => 
      p.tenantId === tenant.id && p.year === currentYear && p.paid
    );
    
    const paidMonths = tenantPayments.map(p => p.month);
    const missingMonths = [];
    for (let month = 1; month <= currentMonth; month++) {
      if (!paidMonths.includes(month)) {
        missingMonths.push(month);
      }
    }

    if (missingMonths.length === 0) {
      alert('הדייר לא חייב כסף');
      return;
    }

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    
    const missingMonthNames = missingMonths.map(m => monthNames[m - 1]).join(', ');
    const monthlyAmount = tenant.monthlyAmount || building.settings.monthlyAmount;
    const totalAmount = missingMonths.length * monthlyAmount;

    // קביעת שם הנמען לפי סוג הטלפון
    let recipientName = tenant.name;
    if (phoneType === 'owner' && tenant.ownerName) {
      recipientName = tenant.ownerName;
    }

    // שימוש בתבנית הגלובלית
    let message = data.settings.whatsappTemplate
      .replace('{שם}', recipientName)
      .replace('{חודשים}', missingMonthNames)
      .replace('{סכום_כולל}', totalAmount.toString());

    // הוספת הערה אם זה טלפון של בעלים
    if (phoneType === 'owner') {
      message += `\n\n(הודעה זו נשלחת לבעלים של דירה ${tenant.apartment})`;
    }

    // ניקוי מספר הטלפון - הסרת רווחים, מקפים ותווים מיוחדים
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // אם המספר מתחיל ב-0, נחליף ל-972
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '972' + cleanPhone.substring(1);
    }
    // אם המספר לא מתחיל ב-972, נוסיף את זה
    else if (!cleanPhone.startsWith('972')) {
      cleanPhone = '972' + cleanPhone;
    }

    // יצירת קישור WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    console.log('Opening WhatsApp with:', {
      originalPhone: phoneNumber,
      cleanPhone: cleanPhone,
      url: whatsappUrl
    });
    
    window.open(whatsappUrl, '_blank');
  };

  const getTenantStatus = (tenant: Tenant) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const tenantPayments = building.payments.filter(p => 
      p.tenantId === tenant.id && p.year === currentYear && p.paid
    );
    return tenantPayments.length >= currentMonth ? 'שולם' : 'חייב';
  };

  // פונקציית ייבוא CSV
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // דילוג על השורה הראשונה (כותרות)
      const dataLines = lines.slice(1);
      
      const newTenants: Tenant[] = [];
      
      for (const line of dataLines) {
        const columns = line.split(',').map(col => col.trim());
        
        // בדיקה שיש מספיק עמודות ושהשורה לא ריקה
        if (columns.length < 4 || !columns[1] || !columns[2]) continue;
        
        const apartment = columns[1]; // מס' דירה
        const name = columns[2]; // שם מלא
        const ownershipText = columns[3]; // שכירות / בעלים
        const phone = columns[4] || ''; // טלפון
        const phone2 = columns[5] || ''; // טלפון נוסף
        const ownerName = columns[6] && columns[6] !== '*' ? columns[6] : undefined; // שם בעל הדירה
        const ownerPhone = columns[7] && columns[7] !== '*' ? columns[7] : undefined; // טלפון בעלים
        
        // קביעת סוג הבעלות
        const ownership: 'owner' | 'renter' = ownershipText.includes('שכירות') ? 'renter' : 'owner';
        
        // חילוץ קומה מהמידע (אם קיים)
        let floor = 1;
        if (columns[0]) {
          const floorMatch = columns[0].match(/(\d+)/);
          if (floorMatch) {
            floor = parseInt(floorMatch[1]);
          }
        }
        
        const tenant: Tenant = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          apartment,
          floor,
          name,
          ownership,
          ownerName,
          ownerPhone,
          entrance: importEntrance,
          phone,
          phone2: phone2 || undefined,
          paymentMethod: 'cash'
        };
        
        newTenants.push(tenant);
      }
      
      if (newTenants.length > 0) {
        onUpdateBuilding(prev => ({
          ...prev,
          tenants: [...prev.tenants, ...newTenants]
        }));
        
        alert(`יובאו בהצלחה ${newTenants.length} דיירים לכניסה ${importEntrance}`);
      } else {
        alert('לא נמצאו נתונים תקינים בקובץ');
      }
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('שגיאה בייבוא הקובץ. אנא בדוק שהקובץ תקין.');
    }
    
    // איפוס הקלט
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsImportModalOpen(false);
  };

  // פונקציית ייצוא CSV
  const exportToCSV = () => {
    const csvHeader = 'קומה,מס\' דירה,שם מלא,שכירות / בעלים,טלפון,טלפון נוסף,שם בעל הדירה,טלפון בעלים,כניסה\n';
    
    const csvData = building.tenants.map(tenant => {
      const ownershipText = tenant.ownership === 'owner' ? 'בעלים' : 'שכירות';
      const ownerName = tenant.ownerName || '*';
      const ownerPhone = tenant.ownerPhone || '*';
      const phone2 = tenant.phone2 || '';
      
      return `קומה ${tenant.floor},${tenant.apartment},${tenant.name},${ownershipText},${tenant.phone},${phone2},${ownerName},${ownerPhone},${tenant.entrance}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `דיירים-${building.name}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PhoneWithWhatsApp: React.FC<{ 
    phone: string; 
    tenant: Tenant; 
    type: 'main' | 'secondary' | 'owner';
    label?: string;
  }> = ({ phone, tenant, type, label }) => (
    <div className="flex items-center space-x-2">
      <Phone size={14} className="text-gray-400" />
      <span className="text-sm">{phone}</span>
      {label && <span className="text-xs text-gray-500">({label})</span>}
      <button
        onClick={() => openWhatsApp(tenant, phone, type)}
        className="text-green-600 hover:text-green-800 transition-colors p-1 rounded hover:bg-green-50"
        title={`שלח WhatsApp ל${label || 'מספר זה'}`}
      >
        <MessageCircle size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">ניהול דיירים</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedEntrance}
              onChange={(e) => setSelectedEntrance(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">כל הכניסות</option>
              <option value="A">כניסה א'</option>
              <option value="B">כניסה ב'</option>
              <option value="C">כניסה ג'</option>
              <option value="D">כניסה ד'</option>
            </select>
          </div>
          
          {/* כפתורי ייבוא וייצוא */}
          <div className="flex items-center space-x-2">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} className="ml-1" />
              ייבא CSV
            </Button>
            <Button variant="secondary" onClick={exportToCSV}>
              <Download size={16} className="ml-1" />
              ייצא CSV
            </Button>
          </div>
          
          <Button onClick={() => openModal()}>
            <Plus size={16} className="ml-1" />
            הוסף דייר
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">דירה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קומה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סוג בעלות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">כניסה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפונים</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סכום חודשי</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אמצעי תשלום</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tenant.apartment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.floor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tenant.name}
                    {tenant.ownership === 'renter' && tenant.ownerName && (
                      <div className="text-xs text-gray-500">בעלים: {tenant.ownerName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tenant.ownership === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {tenant.ownership === 'owner' ? 'בעלים' : 'שוכר'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tenant.entrance}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 min-w-[200px]">
                    <div className="space-y-1">
                      {/* טלפון ראשי */}
                      <PhoneWithWhatsApp 
                        phone={tenant.phone} 
                        tenant={tenant} 
                        type="main"
                        label="ראשי"
                      />
                      
                      {/* טלפון נוסף */}
                      {tenant.phone2 && (
                        <PhoneWithWhatsApp 
                          phone={tenant.phone2} 
                          tenant={tenant} 
                          type="secondary"
                          label="נוסף"
                        />
                      )}
                      
                      {/* טלפון בעלים */}
                      {tenant.ownership === 'renter' && tenant.ownerPhone && (
                        <PhoneWithWhatsApp 
                          phone={tenant.ownerPhone} 
                          tenant={tenant} 
                          type="owner"
                          label="בעלים"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₪{(tenant.monthlyAmount || building.settings.monthlyAmount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      tenant.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {tenant.paymentMethod === 'cash' ? 'מזומן' : `אשראי (יום ${tenant.creditDay || 1})`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getTenantStatus(tenant) === 'שולם' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getTenantStatus(tenant)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openModal(tenant)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ערוך"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteTenant(tenant.id)}
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
          
          {filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">אין דיירים להצגה</p>
            </div>
          )}
        </div>
      </Card>

      {/* מודל ייבוא CSV */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="ייבוא דיירים מקובץ CSV"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">הוראות ייבוא:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• הקובץ צריך להיות בפורמט CSV</li>
              <li>• העמודות צריכות להיות: קומה, מס' דירה, שם מלא, שכירות/בעלים, טלפון, טלפון נוסף, שם בעל הדירה, טלפון בעלים</li>
              <li>• השורה הראשונה (כותרות) תתעלם</li>
              <li>• כל הדיירים ייובאו לכניסה שתבחר למטה</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר כניסה לייבוא:</label>
            <select
              value={importEntrance}
              onChange={(e) => setImportEntrance(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="A">כניסה א'</option>
              <option value="B">כניסה ב'</option>
              <option value="C">כניסה ג'</option>
              <option value="D">כניסה ד'</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר קובץ CSV:</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>שים לב:</strong> הייבוא יוסיף דיירים חדשים ולא יחליף דיירים קיימים.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>
              ביטול
            </Button>
          </div>
        </div>
      </Modal>

      {/* מודל הוספת/עריכת דייר */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? 'ערוך דייר' : 'הוסף דייר חדש'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דירה</label>
              <input
                type="text"
                required
                value={formData.apartment || ''}
                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קומה</label>
              <input
                type="number"
                required
                min="0"
                value={formData.floor || 1}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג בעלות</label>
              <select
                value={formData.ownership || 'owner'}
                onChange={(e) => setFormData({ ...formData, ownership: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="owner">בעלים</option>
                <option value="renter">שוכר</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כניסה</label>
              <select
                value={formData.entrance || 'A'}
                onChange={(e) => setFormData({ ...formData, entrance: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="A">א'</option>
                <option value="B">ב'</option>
                <option value="C">ג'</option>
                <option value="D">ד'</option>
              </select>
            </div>
          </div>

          {formData.ownership === 'renter' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם בעל הדירה</label>
                <input
                  type="text"
                  value={formData.ownerName || ''}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון בעל הדירה</label>
                <input
                  type="tel"
                  value={formData.ownerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון ראשי</label>
              <input
                type="tel"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון נוסף</label>
              <input
                type="tel"
                value={formData.phone2 || ''}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סכום חודשי מותאם אישית</label>
              <input
                type="number"
                min="0"
                value={formData.monthlyAmount || ''}
                onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder={`ברירת מחדל: ₪${building.settings.monthlyAmount}`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמצעי תשלום</label>
              <select
                value={formData.paymentMethod || 'cash'}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">מזומן</option>
                <option value="credit">אשראי</option>
              </select>
            </div>
          </div>

          {formData.paymentMethod === 'credit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">יום חיוב בחודש</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.creditDay || 1}
                onChange={(e) => setFormData({ ...formData, creditDay: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingTenant ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* הסבר על תכונות חדשות */}
      <Card title="הסבר - תיקון קישורי WhatsApp">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <MessageCircle size={16} className="text-green-600" />
            <span><strong>קישור מתוקן:</strong> כעת הקישור ל-WhatsApp פועל נכון ופותח את הצ'אט</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone size={16} className="text-blue-600" />
            <span><strong>ניקוי מספרים:</strong> המערכת מנקה אוטומטית מספרי טלפון ומוסיפה קידומת ישראל</span>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-medium text-green-800 mb-1">✅ תוקן:</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• ✅ קישור WhatsApp פועל נכון</li>
              <li>• ✅ ניקוי אוטומטי של מספרי טלפון</li>
              <li>• ✅ הוספת קידומת ישראל (972) אוטומטית</li>
              <li>• ✅ הודעה מותאמת אישית עם פרטי החוב</li>
              <li>• ✅ זיהוי אוטומטי של סוג הטלפון (ראשי/נוסף/בעלים)</li>
            </ul>
          </div>
          <p className="text-xs">
            כעת כשתלחץ על סמל WhatsApp, הוא יפתח את האפליקציה עם המספר הנכון וההודעה המוכנה.
          </p>
        </div>
      </Card>
    </div>
  );
};