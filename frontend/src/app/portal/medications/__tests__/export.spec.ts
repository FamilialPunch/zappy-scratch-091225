import { describe, it, expect } from 'vitest';

// Lightweight import of helpers by re-implementing tiny pure functions for test without React
interface Plan { price: number }
interface Medication { sku: string; basePrice: number; plans: Plan[] }

const getPriceRangeText = (m: Medication) => {
  const prices = (m.plans?.length ? m.plans.map(p => Number(p.price)).filter(n => !isNaN(n)) : []) as number[];
  if (prices.length === 0) {
    const price = Number(m.basePrice) || 0;
    return `$${price}-${price}`;
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `$${min}-${max}`;
};

const dedupeBySku = (list: Medication[]) => {
  const lastBySku = new Map<string, Medication>();
  for (const m of list) lastBySku.set(m.sku, m);
  return list.filter(m => lastBySku.get(m.sku) === m);
};

describe('medication export helpers', () => {
  it('computes min-max pricing from plans', () => {
    const med: Medication = { sku: 'TRE-025-CR', basePrice: 59, plans: [{ price: 59 }, { price: 44 }] };
    expect(getPriceRangeText(med)).toBe('$44-$59');
  });

  it('falls back to base price when no plans', () => {
    const med: Medication = { sku: 'X', basePrice: 10, plans: [] };
    expect(getPriceRangeText(med)).toBe('$10-$10');
  });

  it('dedupes by SKU keeping last occurrence', () => {
    const list: Medication[] = [
      { sku: 'A', basePrice: 1, plans: [] },
      { sku: 'B', basePrice: 2, plans: [] },
      { sku: 'A', basePrice: 3, plans: [] },
    ];
    const out = dedupeBySku(list);
    expect(out.map(m => m.sku)).toEqual(['B', 'A']);
    expect(out[1].basePrice).toBe(3);
  });
});
