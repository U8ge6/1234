// סוגי נתונים למערכת הניהול
export interface Tenant {
  id: string;
  apartment: string;
  floor: number;
  name: string;
  ownership: 'owner' | 'renter';
  ownerName?: string;
  ownerPhone?: string;
  entrance: 'A' | 'B' | 'C' | 'D';
  phone: string;
  phone2?: string;
  monthlyAmount?: number; // אם לא מוגדר, משתמש בסכום הכללי
  paymentMethod: 'cash' | 'credit';
  creditDay?: number; // יום החיוב בחודש אם תשלום באשראי
}

export interface Payment {
  tenantId: string;
  month: number; // 1-12
  year: number;
  paid: boolean;
  amount: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  notes?: string;
  fromIssue?: boolean; // האם נוצר מתקלה
  issueId?: string;
}

export interface PettyCashTransaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
}

// עובד גלובלי - לא קשור לבניין מסוים
export interface GlobalEmployee {
  id: string;
  name: string;
  phone: string;
  startDate: string;
  baseSalary: number;
  workDaysPerMonth: number;
  absenceDays: number; // מספר ימי היעדרות פשוט
}

export interface Issue {
  id: string;
  date: string;
  reporterName: string;
  description: string;
  cost: number;
  status: 'open' | 'in-progress' | 'resolved';
}

// מערכת ניהול מלאי - פשוטה ללא מיקומים
export interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  buildingId: string; // הבניין שבו נעשה השימוש
  buildingName: string; // שם הבניין לתצוגה
  type: 'add' | 'use' | 'create';
  quantity: number;
  cost: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface BuildingSettings {
  name: string;
  monthlyAmount: number;
  pettyCashTransfer: number;
  entranceCodes: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
  };
  elevator: {
    company: string;
    phone: string;
  };
  electricity: {
    A?: { contract: string; meter: string };
    B?: { contract: string; meter: string };
    C?: { contract: string; meter: string };
    D?: { contract: string; meter: string };
  };
}

export interface Building {
  id: string;
  name: string;
  settings: BuildingSettings;
  tenants: Tenant[];
  payments: Payment[];
  expenses: Expense[];
  pettyCash: PettyCashTransaction[];
  issues: Issue[];
}

export interface AppSettings {
  title: string;
  tabOrder: string[];
  autoBackupEnabled: boolean;
  whatsappTemplate: string; // הועבר לכאן - גלובלי לכל הבניינים
}

export interface AppData {
  settings: AppSettings;
  buildings: Building[];
  currentBuildingId: string;
  globalEmployees: GlobalEmployee[]; // עובדים גלובליים
  // מערכת מלאי גלובלית (ללא מיקומים)
  inventoryProducts: InventoryProduct[];
  inventoryTransactions: InventoryTransaction[];
}

export const expenseCategories = [
  'ניקיון',
  'גינון',
  'חשמל',
  'מים',
  'תיקונים',
  'אבטחה',
  'ביטוח',
  'משפטי',
  'אחר'
];

export const defaultWhatsappTemplate = `שלום {שם},
אנו מזכירים כי עליך תשלום של {סכום_כולל} ש"ח עבור החודשים: {חודשים}.
אנא פנה אלינו לתיאום התשלום.
תודה, ועד הבית`;