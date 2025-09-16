'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface ShippingOption {
  frequency: string;
  default: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  frequency: string;
  discount: number;
  description: string;
}

interface Medication {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: string;
  dosages: string[];
  basePrice: number;
  cost: number;
  stock: number;
  status: 'active' | 'inactive';
  plans: Plan[];
  shippingOptions: ShippingOption[];
}

type FilterType = 'all' | 'acne' | 'hairLoss' | 'ed' | 'weightLoss';

export default function MedicationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<Set<string>>(new Set());
  const [stockFilter, setStockFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { success, error: errorToast, info } = useToast();
  
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      sku: 'TRE-025-CR',
      name: 'Tretinoin Cream',
      genericName: 'Tretinoin',
      category: 'acne',
      dosages: ['0.025%', '0.05%', '0.1%'],
      basePrice: 59,
      cost: 12,
      stock: 243,
      status: 'active',
      plans: [
        {
          id: 'p1',
          name: 'One-time Purchase',
          price: 59,
          frequency: 'once',
          discount: 0,
          description: 'Single purchase, no subscription'
        },
        {
          id: 'p2',
          name: 'Monthly Subscription',
          price: 49,
          frequency: 'monthly',
          discount: 17,
          description: 'Auto-refill every month, save 17%'
        },
        {
          id: 'p3',
          name: 'Quarterly Subscription',
          price: 44,
          frequency: 'quarterly',
          discount: 25,
          description: 'Auto-refill every 3 months, save 25%'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '60 days', default: false },
        { frequency: '90 days', default: false }
      ]
    },
    {
      id: '2',
      sku: 'DOX-100-CAP',
      name: 'Doxycycline',
      genericName: 'Doxycycline',
      category: 'acne',
      dosages: ['50mg', '100mg'],
      basePrice: 4,
      cost: 0.80,
      stock: 1250,
      status: 'active',
      plans: [
        {
          id: 'p4',
          name: 'One-time Purchase',
          price: 4,
          frequency: 'once',
          discount: 0,
          description: 'Per pill pricing'
        },
        {
          id: 'p5',
          name: 'Monthly Supply (30 pills)',
          price: 99,
          frequency: 'monthly',
          discount: 17,
          description: '30-day supply, auto-refill'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '60 days', default: false }
      ]
    },
    {
      id: '3',
      sku: 'FIN-1-TAB',
      name: 'Finasteride',
      genericName: 'Finasteride',
      category: 'hairLoss',
      dosages: ['1mg', '5mg'],
      basePrice: 2,
      cost: 0.30,
      stock: 5000,
      status: 'active',
      plans: [
        {
          id: 'p6',
          name: 'Monthly Supply',
          price: 20,
          frequency: 'monthly',
          discount: 0,
          description: '30 tablets per month'
        },
        {
          id: 'p7',
          name: '3-Month Supply',
          price: 54,
          frequency: 'quarterly',
          discount: 10,
          description: '90 tablets, save 10%'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '90 days', default: false }
      ]
    },
    {
      id: '4',
      sku: 'SIL-50-TAB',
      name: 'Sildenafil',
      genericName: 'Sildenafil Citrate',
      category: 'ed',
      dosages: ['25mg', '50mg', '100mg'],
      basePrice: 10,
      cost: 1.50,
      stock: 80,
      status: 'active',
      plans: [
        {
          id: 'p9',
          name: '4 Tablets',
          price: 40,
          frequency: 'once',
          discount: 0,
          description: 'One-time purchase'
        },
        {
          id: 'p10',
          name: '8 Tablets Monthly',
          price: 64,
          frequency: 'monthly',
          discount: 20,
          description: 'Monthly subscription, save 20%'
        }
      ],
      shippingOptions: [
        { frequency: 'On demand', default: true },
        { frequency: '30 days', default: false }
      ]
    },
    {
      id: '5',
      sku: 'PHEN-375-TAB',
      name: 'Phentermine',
      genericName: 'Phentermine HCl',
      category: 'weightLoss',
      dosages: ['37.5mg'],
      basePrice: 3,
      cost: 0.50,
      stock: 45,
      status: 'active',
      plans: [
        {
          id: 'p11',
          name: 'Monthly Supply',
          price: 89,
          frequency: 'monthly',
          discount: 0,
          description: '30 tablets per month'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true }
      ]
    }
  ]);

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: medications.length,
    acne: medications.filter(m => m.category === 'acne').length,
    hairLoss: medications.filter(m => m.category === 'hairLoss').length,
    ed: medications.filter(m => m.category === 'ed').length,
    weightLoss: medications.filter(m => m.category === 'weightLoss').length
  }), [medications]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to medications database
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  // Apply filters
  let filteredMedications = medications.filter(med => {
    const matchesCategory = activeFilter === 'all' || med.category === activeFilter;
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = med.stock < 100 && med.stock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = med.stock === 0;
    } else if (stockFilter === 'normal') {
      matchesStock = med.stock >= 100;
    }
    
    return matchesCategory && matchesSearch && matchesStock;
  });

  const toggleMedicationSelection = (medicationId: string) => {
    const newSelection = new Set(selectedMedications);
    if (newSelection.has(medicationId)) {
      newSelection.delete(medicationId);
    } else {
      newSelection.add(medicationId);
    }
    setSelectedMedications(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedMedications.size === filteredMedications.length) {
      setSelectedMedications(new Set());
    } else {
      setSelectedMedications(new Set(filteredMedications.map(m => m.id)));
    }
  };

  // CSV helpers
  const toCsvValue = (v: any) => {
    if (v === null || v === undefined) return '';
    let s = String(v);
    if (s.includes('"')) s = s.replace(/"/g, '""');
    if (/[",\n]/.test(s)) s = `"${s}"`;
    return s;
  };

  const handleExportAll = useCallback(() => {
    try {
      if (filteredMedications.length === 0) {
        info('No medications to export');
        return;
      }
      // Deduplicate by SKU, prefer the last occurrence (typically most recently imported)
      const uniqueBySkuMap = new Map<string, Medication>();
      filteredMedications.forEach(m => uniqueBySkuMap.set(m.sku, m));
      const uniqueMeds = Array.from(uniqueBySkuMap.values());

      // Include plans count, JSON plan details, and pricing range
      const headers = ['ID','SKU','Name','Generic Name','Category','Dosages','Plans','Plans_JSON','Pricing','Cost','Stock','Status'];
      const rows = uniqueMeds.map(m => {
        const prices = (m.plans && m.plans.length > 0) ? m.plans.map(p => p.price) : [m.basePrice || 0];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const pricing = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice}-$${maxPrice}`;
        const plansJson = JSON.stringify(
          m.plans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            frequency: p.frequency,
            discount: p.discount,
            description: p.description
          }))
        );
        return [
          m.id,
          m.sku,
          m.name,
          m.genericName,
          m.category,
          m.dosages.join(' | '),
          m.plans?.length ?? 0,
          plansJson,
          pricing,
          m.cost,
          m.stock,
          m.status
        ].map(toCsvValue).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medications_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success(`Exported ${uniqueMeds.length} medications to CSV.`);
    } catch (e) {
      console.error('Export medications failed', e);
      errorToast('Export failed');
    }
  }, [filteredMedications, info, success, errorToast]);

  const handleExportSelected = useCallback(() => {
    const selected = medications.filter(m => selectedMedications.has(m.id));
    if (selected.length === 0) {
      info('No medications selected for export');
      return;
    }
    try {
      // Deduplicate by SKU among selected
      const uniqueBySkuMap = new Map<string, Medication>();
      selected.forEach(m => uniqueBySkuMap.set(m.sku, m));
      const uniqueSelected = Array.from(uniqueBySkuMap.values());

      const headers = ['ID','SKU','Name','Generic Name','Category','Dosages','Plans','Plans_JSON','Pricing','Cost','Stock','Status'];
      const rows = uniqueSelected.map(m => {
        const prices = (m.plans && m.plans.length > 0) ? m.plans.map(p => p.price) : [m.basePrice || 0];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const pricing = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice}-$${maxPrice}`;
        const plansJson = JSON.stringify(
          m.plans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            frequency: p.frequency,
            discount: p.discount,
            description: p.description
          }))
        );
        return [
          m.id,
          m.sku,
          m.name,
          m.genericName,
          m.category,
          m.dosages.join(' | '),
          m.plans?.length ?? 0,
          plansJson,
          pricing,
          m.cost,
          m.stock,
          m.status
        ].map(toCsvValue).join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_medications_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSelectedMedications(new Set());
      success(`Exported ${uniqueSelected.length} selected medications to CSV.`);
    } catch (e) {
      console.error('Export selected medications failed', e);
      errorToast('Export failed');
    }
  }, [medications, selectedMedications, info, success, errorToast]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCsv = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        info('No data found in CSV');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const get = (row: Record<string,string>, key: string) => row[key] ?? row[key.replace(/\s+/g, '')] ?? '';
      const hasPlanDetailHeaders = headers.some(h => /^(plan\s*\d+\s*(name|price|frequency|discount))$/.test(h)) || headers.includes('plans_json');

      const parsePlansFromRow = (row: Record<string,string>): Plan[] | undefined => {
        // Priority 1: JSON in plans_json column
        const plansJson = row['plans_json'] || row['plansjson'];
        if (plansJson) {
          try {
            const parsed = JSON.parse(plansJson);
            if (Array.isArray(parsed) && parsed.length) {
              return parsed.map((p, idx) => ({
                id: p.id || `p-json-${idx}`,
                name: p.name || `Plan ${idx+1}`,
                price: Number(p.price) || 0,
                frequency: p.frequency || 'once',
                discount: Number(p.discount) || 0,
                description: p.description || ''
              }));
            }
          } catch {}
        }
        // Priority 2: Column sets like plan1 name, plan1 price, ... up to 5
        const plans: Plan[] = [];
        for (let i = 1; i <= 5; i++) {
          const n = get(row, `plan ${i} name`) || get(row, `plan${i} name`) || get(row, `plan_${i}_name`);
          const priceStr = get(row, `plan ${i} price`) || get(row, `plan${i} price`) || get(row, `plan_${i}_price`);
          const freq = get(row, `plan ${i} frequency`) || get(row, `plan${i} frequency`) || get(row, `plan_${i}_frequency`) || 'once';
          const discStr = get(row, `plan ${i} discount`) || get(row, `plan${i} discount`) || get(row, `plan_${i}_discount`) || '0';
          if (!n && !priceStr) continue;
          plans.push({
            id: `p-${i}`,
            name: n || `Plan ${i}`,
            price: Number(priceStr) || 0,
            frequency: freq || 'once',
            discount: Number(discStr) || 0,
            description: ''
          });
        }
        return plans.length ? plans : undefined;
      };
      const parseLine = (line: string) => {
        // Basic CSV parser handling commas inside quotes
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        result.push(cur);
        return result;
      };
      const imported: Partial<Medication & { preservePlans?: boolean }>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => row[h] = values[idx]?.trim() ?? '');
        const name = get(row, 'name');
        if (!name) continue;
        const dosagesRaw = get(row, 'dosages');
        const parsedPlans = hasPlanDetailHeaders ? parsePlansFromRow(row) : undefined;
        // If no explicit base price, try to derive it from a Pricing column like "$10-$20" or "$59"
        const pricingStr = (get(row, 'pricing') || '').replace(/\$/g, '').replace(/\s/g, '');
        let derivedBasePrice: number | undefined = undefined;
        if (pricingStr) {
          const parts = pricingStr.split('-').map(p => p.replace(/[^0-9.]/g, ''));
          const nums = parts.map(p => Number(p)).filter(n => !isNaN(n));
          if (nums.length > 0) derivedBasePrice = Math.min(...nums);
        }
        const medPartial: Partial<Medication & { preservePlans?: boolean }> = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`,
          sku: get(row, 'sku') || `SKU-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
          name,
          genericName: get(row, 'generic name') || get(row, 'genericname') || name,
          // If category is unrecognized, we'll preserve existing during merge or default to 'acne'
          category: (['acne','hairloss','ed','weightloss'].includes((get(row, 'category') || '').toLowerCase())
            ? (get(row, 'category') as Medication['category'])
            : undefined) as Medication['category'] | undefined,
          dosages: dosagesRaw ? dosagesRaw.split(/\||;|\//).map(s => s.trim()).filter(Boolean) : undefined,
          basePrice: get(row, 'base price') || get(row, 'baseprice') ? (Number(get(row, 'base price') || get(row, 'baseprice')) || 0) : derivedBasePrice,
          cost: get(row, 'cost') ? (Number(get(row, 'cost')) || 0) : undefined,
          stock: get(row, 'stock') ? (Number(get(row, 'stock')) || 0) : undefined,
          status: get(row, 'status') ? (((get(row, 'status') || 'active') === 'inactive' ? 'inactive' : 'active') as Medication['status']) : undefined,
          plans: parsedPlans,
          // If no detailed plan columns, mark to preserve existing plans
          preservePlans: !hasPlanDetailHeaders
        };
        imported.push(medPartial);
      }
      if (imported.length === 0) {
        info('No valid medications found in CSV');
        return;
      }
      // Instead of merging by SKU, prepend imported medications as new entries above existing data
      const newMeds: Medication[] = imported.map((imp, idx) => {
        const plans = (imp.plans as Plan[] | undefined) && (imp.plans as Plan[]).length
          ? (imp.plans as Plan[])
          : [
              {
                id: `p-new-${Date.now()}-${idx}`,
                name: 'One-time Purchase',
                price: (imp.basePrice as number) || 0,
                frequency: 'once',
                discount: 0,
                description: 'Single purchase'
              }
            ];
        return {
          id: (imp.id as string) || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${idx}`),
          sku: (imp.sku as string) || `SKU-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
          name: imp.name as string,
          genericName: (imp.genericName as string) || (imp.name as string),
          category: (imp.category as Medication['category']) || 'acne',
          dosages: (imp.dosages as string[]) || ['Standard'],
          basePrice: (imp.basePrice as number) || 0,
          cost: (imp.cost as number) || 0,
          stock: (imp.stock as number) || 0,
          status: (imp.status as Medication['status']) || 'active',
          plans,
          shippingOptions: [ { frequency: '30 days', default: true } ]
        };
      });
      setMedications(prev => [...newMeds, ...prev]);
      success(`Imported ${newMeds.length} medications (added as new entries)`);
    } catch (e) {
      console.error('Import CSV failed', e);
      errorToast('Import failed');
    }
  };

  const handleManagePlans = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowPlanModal(true);
  };

  const calculateInventoryValue = () => {
    return medications.reduce((sum, med) => sum + (med.stock * med.cost), 0);
  };

  const lowStockCount = medications.filter(m => m.stock < 100 && m.stock > 0).length;
  const outOfStockCount = medications.filter(m => m.stock === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All Medications', count: filterCounts.all },
    { id: 'acne', label: 'Acne', count: filterCounts.acne },
    { id: 'hairLoss', label: 'Hair Loss', count: filterCounts.hairLoss },
    { id: 'ed', label: 'ED', count: filterCounts.ed },
    { id: 'weightLoss', label: 'Weight Loss', count: filterCounts.weightLoss }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Medication Database</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Inventory Value: <span className="font-semibold text-gray-900">${calculateInventoryValue().toLocaleString()}</span>
            {lowStockCount > 0 && (
              <>
                {' '}• <span className="font-semibold text-orange-600">{lowStockCount} low stock</span>
              </>
            )}
            {outOfStockCount > 0 && (
              <>
                {' '}• <span className="font-semibold text-red-600">{outOfStockCount} out</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Stripe-style Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {filter.label}
            <span className={`ml-1.5 ${activeFilter === filter.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Integrated Search and Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Stock Filter */}
        <select 
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="">All Stock Levels</option>
          <option value="normal">Normal Stock</option>
          <option value="low">Low Stock (&lt;100)</option>
          <option value="out">Out of Stock</option>
        </select>

        {/* Status Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* More Filters */}
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          More filters
        </button>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button onClick={handleImportClick} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import CSV
        </button>
        
        <button onClick={handleExportAll} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Add Medication
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImportCsv(file);
              // reset input so same file can be re-imported
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedMedications.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedMedications.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Update Stock</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Change Category</button>
          <button onClick={handleExportSelected} className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-red-600 hover:text-red-700">Deactivate</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedMedications(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Compact Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedMedications.size === filteredMedications.length && filteredMedications.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosages
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plans
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedMedications.has(med.id)}
                      onChange={() => toggleMedicationSelection(med.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{med.sku}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleManagePlans(med)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-500">{med.genericName}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {med.dosages.slice(0, 2).join(', ')}
                      {med.dosages.length > 2 && (
                        <span className="text-gray-500"> +{med.dosages.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{med.plans.length} plans</div>
                    <div className="text-xs text-gray-500">
                      {med.shippingOptions.length} ship options
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${Math.min(...med.plans.map(p => p.price))}-${Math.max(...med.plans.map(p => p.price))}
                    </div>
                    <div className="text-xs text-gray-500">Cost: ${med.cost}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      med.stock === 0 ? 'text-red-600' :
                      med.stock < 100 ? 'text-orange-600' : 
                      'text-gray-900'
                    }`}>
                      {med.stock.toLocaleString()}
                    </div>
                    {med.stock === 0 && (
                      <div className="text-xs text-red-600">Out of stock</div>
                    )}
                    {med.stock > 0 && med.stock < 100 && (
                      <div className="text-xs text-orange-600">Low stock</div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      med.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {med.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => handleManagePlans(med)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      Plans
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/medication/${med.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {filteredMedications.length} of {medications.length} medications
            </span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Previous</button>
              <span className="px-2 py-1 text-sm text-gray-700">Page 1 of 1</span>
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Plans Modal - keeping this as is since it's a modal */}
      {showPlanModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage Plans for {selectedMedication.name}
            </h3>
            
            <div className="space-y-6">
              {/* Current Plans */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Subscription Plans</h4>
                <div className="space-y-3">
                  {selectedMedication.plans.map((plan) => (
                    <div key={plan.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                          <p className="text-sm mt-1">
                            Frequency: <span className="font-medium">{plan.frequency}</span> | 
                            Price: <span className="font-medium text-green-600">${plan.price}</span>
                            {plan.discount > 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {plan.discount}% off
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                          <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Shipping Frequency Options</h4>
                <div className="space-y-2">
                  {selectedMedication.shippingOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.default}
                          onChange={() => {}}
                          className="mr-3"
                        />
                        <span className="text-sm">{option.frequency}</span>
                        {option.default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <button className="text-sm text-gray-600 hover:text-gray-700">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400">
                    + Add Shipping Option
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Medication</h3>
            <AddMedicationForm
              onCancel={() => setShowAddModal(false)}
              onSave={(med) => {
                setMedications(prev => [med, ...prev]);
                setShowAddModal(false);
                success('Medication added');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline form component to keep file self-contained
function AddMedicationForm({ onCancel, onSave }: { onCancel: () => void; onSave: (m: Medication) => void }) {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<Medication['category']>('acne');
  const [dosages, setDosages] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [status, setStatus] = useState<Medication['status']>('active');
  const { error: errorToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorToast('Name is required');
      return;
    }
    const med: Medication = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      sku: sku || `SKU-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
      name: name.trim(),
      genericName: (genericName || name).trim(),
      category,
      dosages: dosages ? dosages.split(',').map(s => s.trim()).filter(Boolean) : ['Standard'],
      basePrice: Number(basePrice) || 0,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      status,
      plans: [
        { id: 'p-new-1', name: 'One-time Purchase', price: Number(basePrice) || 0, frequency: 'once', discount: 0, description: 'Single purchase' }
      ],
      shippingOptions: [ { frequency: '30 days', default: true } ]
    };
    onSave(med);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Generic Name</label>
          <input value={genericName} onChange={(e) => setGenericName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Medication['category'])} className="w-full border rounded px-3 py-2">
            <option value="acne">Acne</option>
            <option value="hairLoss">Hair Loss</option>
            <option value="ed">ED</option>
            <option value="weightLoss">Weight Loss</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Dosages (comma separated)</label>
          <input value={dosages} onChange={(e) => setDosages(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. 0.025%, 0.05%" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Base Price</label>
          <input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(parseFloat(e.target.value))} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Cost</label>
          <input type="number" step="0.01" value={cost} onChange={(e) => setCost(parseFloat(e.target.value))} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Stock</label>
          <input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value || '0', 10))} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Medication['status'])} className="w-full border rounded px-3 py-2">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">Save</button>
      </div>
    </form>
  );
}
