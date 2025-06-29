import React, { useState } from 'react';
import { InventoryProduct, InventoryTransaction, Building } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingDown, 
  AlertTriangle,
  BarChart3,
  History,
  ShoppingCart,
  DollarSign,
  Building2
} from 'lucide-react';

interface InventoryProps {
  products: InventoryProduct[];
  transactions: InventoryTransaction[];
  currentBuilding: Building;
  onUpdateProducts: (updater: (products: InventoryProduct[]) => InventoryProduct[]) => void;
  onUpdateTransactions: (updater: (transactions: InventoryTransaction[]) => InventoryTransaction[]) => void;
}

type TabType = 'usage' | 'products' | 'history' | 'analytics';

export const Inventory: React.FC<InventoryProps> = ({
  products,
  transactions,
  currentBuilding,
  onUpdateProducts,
  onUpdateTransactions
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('usage');
  
  // מודלים
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  
  // עריכה
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<InventoryProduct | null>(null);
  
  // טפסים
  const [productForm, setProductForm] = useState({
    name: '',
    quantity: 0,
    pricePerUnit: 0
  });
  
  const [usageForm, setUsageForm] = useState({
    productId: '',
    quantity: 1,
    notes: ''
  });
  
  const [addStockForm, setAddStockForm] = useState({
    quantity: 0,
    notes: ''
  });

  // פונקציות עזר
  const getProductById = (id: string) => products.find(p => p.id === id);
  
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'text-red-600 bg-red-100', text: 'אזל' };
    if (quantity <= 5) return { color: 'text-yellow-600 bg-yellow-100', text: 'נמוך' };
    return { color: 'text-blue-600 bg-blue-100', text: 'תקין' };
  };

  // סטטיסטיקות
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.pricePerUnit), 0);
  const totalUsageCost = transactions
    .filter(t => t.type === 'use')
    .reduce((sum, t) => sum + t.cost, 0);

  // פונקציות מוצרים
  const openProductModal = (product?: InventoryProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        quantity: product.quantity,
        pricePerUnit: product.pricePerUnit
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', quantity: 0, pricePerUnit: 0 });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      // עריכת מוצר קיים
      onUpdateProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, name: productForm.name, pricePerUnit: productForm.pricePerUnit }
          : p
      ));
    } else {
      // יצירת מוצר חדש
      const newProduct: InventoryProduct = {
        id: Date.now().toString(),
        name: productForm.name,
        quantity: productForm.quantity,
        pricePerUnit: productForm.pricePerUnit,
        createdAt: new Date().toISOString()
      };
      
      onUpdateProducts(prev => [...prev, newProduct]);
      
      // יצירת תנועה ראשונית אם יש כמות
      if (productForm.quantity > 0) {
        const transaction: InventoryTransaction = {
          id: Date.now().toString() + '-create',
          productId: newProduct.id,
          buildingId: currentBuilding.id,
          buildingName: currentBuilding.name,
          type: 'create',
          quantity: productForm.quantity,
          cost: productForm.quantity * productForm.pricePerUnit,
          notes: 'יצירת מוצר חדש',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        
        onUpdateTransactions(prev => [...prev, transaction]);
      }
    }
    
    setIsProductModalOpen(false);
  };

  const deleteProduct = (productId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה? כל ההיסטוריה שלו תימחק גם כן.')) {
      onUpdateProducts(prev => prev.filter(p => p.id !== productId));
      onUpdateTransactions(prev => prev.filter(t => t.productId !== productId));
    }
  };

  // פונקציות שימוש
  const openUsageModal = () => {
    setUsageForm({ productId: '', quantity: 1, notes: '' });
    setIsUsageModalOpen(true);
  };

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = getProductById(usageForm.productId);
    if (!product || product.quantity < usageForm.quantity) {
      alert('אין מספיק מלאי למוצר זה');
      return;
    }
    
    // עדכון כמות המוצר
    onUpdateProducts(prev => prev.map(p => 
      p.id === usageForm.productId 
        ? { ...p, quantity: p.quantity - usageForm.quantity }
        : p
    ));
    
    // יצירת תנועה
    const transaction: InventoryTransaction = {
      id: Date.now().toString(),
      productId: usageForm.productId,
      buildingId: currentBuilding.id,
      buildingName: currentBuilding.name,
      type: 'use',
      quantity: usageForm.quantity,
      cost: usageForm.quantity * product.pricePerUnit,
      notes: usageForm.notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    onUpdateTransactions(prev => [...prev, transaction]);
    setIsUsageModalOpen(false);
  };

  // פונקציות הוספת מלאי
  const openAddStockModal = (product: InventoryProduct) => {
    setSelectedProductForStock(product);
    setAddStockForm({ quantity: 0, notes: '' });
    setIsAddStockModalOpen(true);
  };

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductForStock || addStockForm.quantity <= 0) return;
    
    // עדכון כמות המוצר
    onUpdateProducts(prev => prev.map(p => 
      p.id === selectedProductForStock.id 
        ? { ...p, quantity: p.quantity + addStockForm.quantity }
        : p
    ));
    
    // יצירת תנועה
    const transaction: InventoryTransaction = {
      id: Date.now().toString(),
      productId: selectedProductForStock.id,
      buildingId: currentBuilding.id,
      buildingName: currentBuilding.name,
      type: 'add',
      quantity: addStockForm.quantity,
      cost: addStockForm.quantity * selectedProductForStock.pricePerUnit,
      notes: addStockForm.notes,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    onUpdateTransactions(prev => [...prev, transaction]);
    setIsAddStockModalOpen(false);
  };

  const renderUsageTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">שימוש במוצרים</h3>
        <Button onClick={openUsageModal}>
          <ShoppingCart size={16} className="ml-1" />
          רשום שימוש
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map(product => {
            const status = getStockStatus(product.quantity);
            return (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">מלאי: {product.quantity} יחידות</p>
                <p className="text-sm text-gray-600 mb-3">מחיר: ₪{product.pricePerUnit}</p>
                <Button 
                  size="sm" 
                  onClick={() => openAddStockModal(product)}
                  variant="secondary"
                  className="w-full"
                >
                  הוסף מלאי
                </Button>
              </div>
            );
          })}
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">אין מוצרים במערכת</p>
          </div>
        )}
      </Card>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">ניהול מוצרים</h3>
        <Button onClick={() => openProductModal()}>
          <Plus size={16} className="ml-1" />
          הוסף מוצר
        </Button>
      </div>

      <Card title="מלאי נוכחי">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם המוצר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">כמות במלאי</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר ליחידה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ערך כולל</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => {
                const status = getStockStatus(product.quantity);
                const totalValue = product.quantity * product.pricePerUnit;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₪{product.pricePerUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₪{totalValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openAddStockModal(product)}
                          className="text-green-600 hover:text-green-800"
                          title="הוסף מלאי"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => openProductModal(product)}
                          className="text-blue-600 hover:text-blue-800"
                          title="ערוך"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
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
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">אין מוצרים להצגה</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">היסטוריית פעולות</h3>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">כמות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">בניין</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">עלות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">הערות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(transaction => {
                  const product = getProductById(transaction.productId);
                  const actionText = {
                    create: 'יצירת מוצר',
                    add: 'הוספת מלאי',
                    use: 'שימוש במוצר'
                  };
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product?.name || 'מוצר לא קיים'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'use' ? 'bg-red-100 text-red-800' :
                          transaction.type === 'add' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {actionText[transaction.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type === 'use' ? '-' : '+'}{transaction.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Building2 size={14} className="text-gray-400" />
                          <span>{transaction.buildingName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₪{transaction.cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">אין פעולות להצגה</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => {
    // ניתוח לפי בניין
    const buildingUsage = transactions
      .filter(t => t.type === 'use')
      .reduce((acc, t) => {
        acc[t.buildingName] = (acc[t.buildingName] || 0) + t.cost;
        return acc;
      }, {} as Record<string, number>);

    // ניתוח לפי מוצר
    const productUsage = transactions
      .filter(t => t.type === 'use')
      .reduce((acc, t) => {
        const product = getProductById(t.productId);
        if (product) {
          if (!acc[product.name]) {
            acc[product.name] = { quantity: 0, cost: 0 };
          }
          acc[product.name].quantity += t.quantity;
          acc[product.name].cost += t.cost;
        }
        return acc;
      }, {} as Record<string, { quantity: number; cost: number }>);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">ניתוח נתונים</h3>
        
        {/* סטטיסטיקות כלליות */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">סך המוצרים</p>
                <p className="text-2xl font-bold text-blue-700">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">סך היחידות במלאי</p>
                <p className="text-2xl font-bold text-green-700">{totalUnits}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">ערך המלאי הכולל</p>
                <p className="text-2xl font-bold text-purple-700">₪{totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">סך עלויות השימוש</p>
                <p className="text-2xl font-bold text-red-700">₪{totalUsageCost.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* ניתוח לפי בניין */}
        <Card title="עלויות לפי בניין">
          <div className="space-y-3">
            {Object.entries(buildingUsage)
              .sort(([,a], [,b]) => b - a)
              .map(([building, cost]) => {
                const percentage = totalUsageCost > 0 ? (cost / totalUsageCost) * 100 : 0;
                return (
                  <div key={building} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{building}</span>
                      <span className="text-gray-900">₪{cost.toLocaleString()} ({percentage.toFixed(1)}%)</span>
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
            {Object.keys(buildingUsage).length === 0 && (
              <p className="text-center text-gray-500 py-8">אין נתוני שימוש</p>
            )}
          </div>
        </Card>

        {/* ניתוח לפי מוצר */}
        <Card title="ניתוח מוצרים">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידות שנוצלו</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">עלות כוללת</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מלאי נוכחי</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(productUsage).map(([productName, usage]) => {
                  const product = products.find(p => p.name === productName);
                  return (
                    <tr key={productName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {usage.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₪{usage.cost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product?.quantity || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {Object.keys(productUsage).length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">אין נתוני שימוש להצגה</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול מלאי</h2>
          <p className="text-sm text-gray-600 mt-1">
            מוצרים גלובליים • שימוש עבור: {currentBuilding.name}
          </p>
        </div>
      </div>

      {/* טאבים */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'usage', label: 'שימוש במוצרים', icon: ShoppingCart },
            { id: 'products', label: 'ניהול מוצרים', icon: Package },
            { id: 'history', label: 'היסטוריית פעולות', icon: History },
            { id: 'analytics', label: 'ניתוח נתונים', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* תוכן הטאב */}
      {activeTab === 'usage' && renderUsageTab()}
      {activeTab === 'products' && renderProductsTab()}
      {activeTab === 'history' && renderHistoryTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* מודל הוספת/עריכת מוצר */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'ערוך מוצר' : 'הוסף מוצר חדש'}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="שם המוצר"
            />
          </div>

          {!editingProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">כמות ראשונית</label>
              <input
                type="number"
                min="0"
                value={productForm.quantity}
                onChange={(e) => setProductForm({ ...productForm, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מחיר ליחידה (₪)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={productForm.pricePerUnit}
              onChange={(e) => setProductForm({ ...productForm, pricePerUnit: parseFloat(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              {editingProduct ? 'עדכן' : 'הוסף'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* מודל שימוש במוצר */}
      <Modal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        title="רשום שימוש במוצר"
      >
        <form onSubmit={handleUsageSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">בחר מוצר</label>
            <select
              required
              value={usageForm.productId}
              onChange={(e) => setUsageForm({ ...usageForm, productId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">בחר מוצר...</option>
              {products.filter(p => p.quantity > 0).map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (מלאי: {product.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כמות לשימוש</label>
            <input
              type="number"
              required
              min="1"
              value={usageForm.quantity}
              onChange={(e) => setUsageForm({ ...usageForm, quantity: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={usageForm.notes}
              onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="הערות על השימוש (אופציונלי)"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>בניין נוכחי:</strong> {currentBuilding.name}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsUsageModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              רשום שימוש
            </Button>
          </div>
        </form>
      </Modal>

      {/* מודל הוספת מלאי */}
      <Modal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        title={`הוסף מלאי - ${selectedProductForStock?.name}`}
      >
        <form onSubmit={handleAddStockSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כמות להוספה</label>
            <input
              type="number"
              required
              min="1"
              value={addStockForm.quantity}
              onChange={(e) => setAddStockForm({ ...addStockForm, quantity: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={addStockForm.notes}
              onChange={(e) => setAddStockForm({ ...addStockForm, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="הערות על ההוספה (אופציונלי)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddStockModalOpen(false)}>
              ביטול
            </Button>
            <Button type="submit">
              הוסף מלאי
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};