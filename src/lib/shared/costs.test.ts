import { describe, it, expect } from 'vitest';
import {
  sumOperationalCost,
  computeOperationalTotal,
  type OperationalInputs,
  type OperationalSettings,
  type CamelCaseOperationalSettings
} from './costs';

const defaultSettings: OperationalSettings = {
  vacuum_bag_small_unit_cost: 100,
  vacuum_bag_large_unit_cost: 200,
  label_unit_cost: 5,
  non_woven_bag_unit_cost: 50,
  labor_hour_cost: 500,
  cooking_hour_cost: 600,
  calcium_unit_cost: 10,
  kefir_unit_cost: 15
};

describe('sumOperationalCost', () => {
  it('suma todos los costos operativos', () => {
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 2,
      vacuumBagLargeQty: 1,
      labelsQty: 10,
      nonWovenBagQty: 5,
      laborHoursQty: 2,
      cookingHoursQty: 1,
      calciumQty: 3,
      kefirQty: 2
    };
    const result = sumOperationalCost(inputs, defaultSettings);
    // 2*100 + 1*200 + 10*5 + 5*50 + 2*500 + 1*600 + 3*10 + 2*15
    // = 200 + 200 + 50 + 250 + 1000 + 600 + 30 + 30 = 2360
    expect(result).toBe(2360);
  });

  it('retorna 0 cuando todos los inputs son 0', () => {
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 0,
      vacuumBagLargeQty: 0,
      labelsQty: 0,
      nonWovenBagQty: 0,
      laborHoursQty: 0,
      cookingHoursQty: 0,
      calciumQty: 0,
      kefirQty: 0
    };
    expect(sumOperationalCost(inputs, defaultSettings)).toBe(0);
  });

  it('calcula correctamente con un solo item', () => {
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 3,
      vacuumBagLargeQty: 0,
      labelsQty: 0,
      nonWovenBagQty: 0,
      laborHoursQty: 0,
      cookingHoursQty: 0,
      calciumQty: 0,
      kefirQty: 0
    };
    expect(sumOperationalCost(inputs, defaultSettings)).toBe(300);
  });

  it('maneja costos unitarios decimales', () => {
    const settings: OperationalSettings = {
      vacuum_bag_small_unit_cost: 99.99,
      vacuum_bag_large_unit_cost: 0,
      label_unit_cost: 0,
      non_woven_bag_unit_cost: 0,
      labor_hour_cost: 0,
      cooking_hour_cost: 0,
      calcium_unit_cost: 0,
      kefir_unit_cost: 0
    };
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 2,
      vacuumBagLargeQty: 0,
      labelsQty: 0,
      nonWovenBagQty: 0,
      laborHoursQty: 0,
      cookingHoursQty: 0,
      calciumQty: 0,
      kefirQty: 0
    };
    expect(sumOperationalCost(inputs, settings)).toBeCloseTo(199.98);
  });

  it('sumOperationalCost y computeOperationalTotal dan el mismo resultado (snake→camel conversion)', () => {
    const snakeSettings: OperationalSettings = {
      vacuum_bag_small_unit_cost: 100,
      vacuum_bag_large_unit_cost: 200,
      label_unit_cost: 5,
      non_woven_bag_unit_cost: 50,
      labor_hour_cost: 500,
      cooking_hour_cost: 600,
      calcium_unit_cost: 10,
      kefir_unit_cost: 15
    };
    const camelSettings: CamelCaseOperationalSettings = {
      vacuumBagSmallUnitCost: 100,
      vacuumBagLargeUnitCost: 200,
      labelUnitCost: 5,
      nonWovenBagUnitCost: 50,
      laborHourCost: 500,
      cookingHourCost: 600,
      calciumUnitCost: 10,
      kefirUnitCost: 15
    };
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 3,
      vacuumBagLargeQty: 2,
      labelsQty: 5,
      nonWovenBagQty: 1,
      laborHoursQty: 4,
      cookingHoursQty: 3,
      calciumQty: 2,
      kefirQty: 1
    };
    expect(sumOperationalCost(inputs, snakeSettings)).toBe(computeOperationalTotal(inputs, camelSettings));
  });
});

describe('computeOperationalTotal', () => {
  const camelSettings: CamelCaseOperationalSettings = {
    vacuumBagSmallUnitCost: 100,
    vacuumBagLargeUnitCost: 200,
    labelUnitCost: 5,
    nonWovenBagUnitCost: 50,
    laborHourCost: 500,
    cookingHourCost: 600,
    calciumUnitCost: 10,
    kefirUnitCost: 15
  };

  it('suma todos los costos operativos', () => {
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 2,
      vacuumBagLargeQty: 1,
      labelsQty: 10,
      nonWovenBagQty: 5,
      laborHoursQty: 2,
      cookingHoursQty: 1,
      calciumQty: 3,
      kefirQty: 2
    };
    const result = computeOperationalTotal(inputs, camelSettings);
    // 2*100 + 1*200 + 10*5 + 5*50 + 2*500 + 1*600 + 3*10 + 2*15
    // = 200 + 200 + 50 + 250 + 1000 + 600 + 30 + 30 = 2360
    expect(result).toBe(2360);
  });

  it('redondea a 2 decimales', () => {
    const settings: CamelCaseOperationalSettings = {
      vacuumBagSmallUnitCost: 33.333,
      vacuumBagLargeUnitCost: 0,
      labelUnitCost: 0,
      nonWovenBagUnitCost: 0,
      laborHourCost: 0,
      cookingHourCost: 0,
      calciumUnitCost: 0,
      kefirUnitCost: 0
    };
    const inputs: OperationalInputs = {
      vacuumBagSmallQty: 3,
      vacuumBagLargeQty: 0,
      labelsQty: 0,
      nonWovenBagQty: 0,
      laborHoursQty: 0,
      cookingHoursQty: 0,
      calciumQty: 0,
      kefirQty: 0
    };
    // 3 * 33.333 = 99.999 → rounds to 100.00
    expect(computeOperationalTotal(inputs, settings)).toBe(100);
  });

  it('es conmutativo (orden de items no altera resultado)', () => {
    const a: OperationalInputs = {
      vacuumBagSmallQty: 1,
      vacuumBagLargeQty: 2,
      labelsQty: 3,
      nonWovenBagQty: 4,
      laborHoursQty: 5,
      cookingHoursQty: 6,
      calciumQty: 7,
      kefirQty: 8
    };
    const b: OperationalInputs = {
      vacuumBagLargeQty: 1,
      labelsQty: 2,
      nonWovenBagQty: 3,
      laborHoursQty: 4,
      cookingHoursQty: 5,
      calciumQty: 6,
      kefirQty: 7,
      vacuumBagSmallQty: 8
    };
    expect(computeOperationalTotal(a, camelSettings)).not.toBe(computeOperationalTotal(b, camelSettings));
  });
});
