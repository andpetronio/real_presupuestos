import { describe, it, expect } from 'vitest';
import {
  parseFormValue,
  parseNonNegativeNumber,
  parsePositiveNumber,
  parsePositiveInteger,
  parseWastagePercentage,
  parseRecipeItems,
  validateRecipeItems,
  calculateCostWithWastage,
  getTutorError,
  getVeterinaryError,
  getRawMaterialError,
  getRecipeError,
  getRecipeItemsError
} from './parsers';

describe('parseFormValue', () => {
  it('trimea strings', () => {
    expect(parseFormValue('  hola  ')).toBe('hola');
  });

  it('retorna string vacío para null', () => {
    expect(parseFormValue(null)).toBe('');
  });

  it('retorna string vacío para no-string', () => {
    expect(parseFormValue(123 as unknown as File)).toBe('');
  });
});

describe('parseNonNegativeNumber', () => {
  it('parsea strings a número', () => {
    expect(parseNonNegativeNumber('123')).toBe(123);
    expect(parseNonNegativeNumber('0')).toBe(0);
  });

  it('retorna 0 para string vacío', () => {
    expect(parseNonNegativeNumber('')).toBe(0);
  });

  it('retorna null para valores inválidos', () => {
    expect(parseNonNegativeNumber('abc')).toBeNull();
    expect(parseNonNegativeNumber('NaN')).toBeNull();
    expect(parseNonNegativeNumber('-5')).toBeNull();
  });

  it('retorna null para NaN', () => {
    expect(parseNonNegativeNumber('not a number')).toBeNull();
  });
});

describe('parsePositiveNumber', () => {
  it('retorna el número si es positivo', () => {
    expect(parsePositiveNumber('5')).toBe(5);
    expect(parsePositiveNumber('0.5')).toBe(0.5);
    expect(parsePositiveNumber('0.001')).toBe(0.001);
  });

  it('retorna null para cero', () => {
    expect(parsePositiveNumber('0')).toBeNull();
  });

  it('retorna null para negativo', () => {
    expect(parsePositiveNumber('-5')).toBeNull();
  });

  it('retorna null para vacío', () => {
    expect(parsePositiveNumber('')).toBeNull();
  });
});

describe('parsePositiveInteger', () => {
  it('retorna entero positivo', () => {
    expect(parsePositiveInteger('5')).toBe(5);
    expect(parsePositiveInteger('100')).toBe(100);
  });

  it('retorna null para decimales', () => {
    expect(parsePositiveInteger('5.5')).toBeNull();
    expect(parsePositiveInteger('1.5')).toBeNull();
  });

  it('retorna null para cero', () => {
    expect(parsePositiveInteger('0')).toBeNull();
  });

  it('retorna null para negativo', () => {
    expect(parsePositiveInteger('-5')).toBeNull();
  });

  it('retorna null para vacío', () => {
    expect(parsePositiveInteger('')).toBeNull();
  });
});

describe('parseWastagePercentage', () => {
  it('parsea valores entre 0 y 100', () => {
    expect(parseWastagePercentage('0')).toBe(0);
    expect(parseWastagePercentage('50')).toBe(50);
    expect(parseWastagePercentage('100')).toBe(100);
  });

  it('retorna null para > 100', () => {
    expect(parseWastagePercentage('101')).toBeNull();
  });

  it('retorna null para negativo', () => {
    expect(parseWastagePercentage('-5')).toBeNull();
  });
});

describe('parseRecipeItems', () => {
  it('arma filas desde FormData', () => {
    const fd = new FormData();
    fd.append('rawMaterialId', 'id1');
    fd.append('dailyQuantity', '100');
    fd.append('rawMaterialId', 'id2');
    fd.append('dailyQuantity', '200');

    const result = parseRecipeItems(fd);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ rawMaterialId: 'id1', dailyQuantity: '100' });
    expect(result[1]).toEqual({ rawMaterialId: 'id2', dailyQuantity: '200' });
  });

  it('ignora filas vacías', () => {
    const fd = new FormData();
    fd.append('rawMaterialId', 'id1');
    fd.append('dailyQuantity', '100');
    fd.append('rawMaterialId', '');
    fd.append('dailyQuantity', '');

    const result = parseRecipeItems(fd);
    expect(result).toHaveLength(1);
  });

  it('sincroniza columnas desbalanceadas', () => {
    const fd = new FormData();
    fd.append('rawMaterialId', 'id1');
    fd.append('rawMaterialId', 'id2');
    fd.append('dailyQuantity', '100');

    const result = parseRecipeItems(fd);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ rawMaterialId: 'id2', dailyQuantity: '' });
  });
});

describe('validateRecipeItems', () => {
  it('retorna error si no hay items', () => {
    const result = validateRecipeItems([]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBeTruthy();
  });

  it('retorna error si falta rawMaterialId', () => {
    const result = validateRecipeItems([{ rawMaterialId: '', dailyQuantity: '100' }]);
    expect(result.ok).toBe(false);
  });

  it('retorna error si falta dailyQuantity', () => {
    const result = validateRecipeItems([{ rawMaterialId: 'id1', dailyQuantity: '' }]);
    expect(result.ok).toBe(false);
  });

  it('retorna error si dailyQuantity no es positiva', () => {
    const result = validateRecipeItems([{ rawMaterialId: 'id1', dailyQuantity: '0' }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('mayor a 0');
  });

  it('retorna error si hay materiales duplicados', () => {
    const result = validateRecipeItems([
      { rawMaterialId: 'id1', dailyQuantity: '100' },
      { rawMaterialId: 'id1', dailyQuantity: '200' }
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('repitas');
  });

  it('retorna items parseados si todo está bien', () => {
    const result = validateRecipeItems([
      { rawMaterialId: 'id1', dailyQuantity: '100' },
      { rawMaterialId: 'id2', dailyQuantity: '200' }
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(2);
      expect(result.items[0].rawMaterialId).toBe('id1');
      expect(result.items[0].dailyQuantity).toBe(100);
    }
  });
});

describe('calculateCostWithWastage', () => {
  it('calcula costo con merma', () => {
    expect(calculateCostWithWastage(100, 10)).toBe(110);
    expect(calculateCostWithWastage(100, 5)).toBe(105);
  });

  it('no modifica si merma es cero', () => {
    expect(calculateCostWithWastage(100, 0)).toBe(100);
  });

  it('redondea a 2 decimales', () => {
    expect(calculateCostWithWastage(99.99, 10)).toBe(109.99);
  });
});

describe('getTutorError', () => {
  it('mensaje genérico cuando no hay error', () => {
    expect(getTutorError('create', undefined)).toContain('crear');
    expect(getTutorError('update', undefined)).toContain('guardar');
  });

  it('mensaje específico para WhatsApp duplicado', () => {
    expect(getTutorError('create', 'ERROR: violate tutors_whatsapp_number_unique')).toContain('WhatsApp');
  });
});

describe('getVeterinaryError', () => {
  it('mensaje genérico cuando no hay error', () => {
    expect(getVeterinaryError('create', undefined)).toContain('veterinaria');
    expect(getVeterinaryError('update', undefined)).toContain('guardar');
  });

  it('mensaje específico para nombre duplicado', () => {
    expect(getVeterinaryError('create', 'ERROR: violate veterinaries_name_unique')).toContain('nombre');
  });
});

describe('getRawMaterialError', () => {
  it('mensaje genérico cuando no hay error', () => {
    expect(getRawMaterialError('create', undefined)).toContain('crear');
    expect(getRawMaterialError('update', undefined)).toContain('guardar');
  });

  it('mensaje específico para nombre duplicado', () => {
    expect(getRawMaterialError('create', 'ERROR: raw_materials_name_unique')).toContain('nombre');
  });
});

describe('getRecipeError', () => {
  it('mensaje genérico cuando no hay error', () => {
    expect(getRecipeError('create', undefined)).toContain('crear');
    expect(getRecipeError('update', undefined)).toContain('guardar');
  });

  it('mensaje específico para foreign key error', () => {
    expect(getRecipeError('create', 'violates foreign key constraint')).toContain('perro');
  });
});

describe('getRecipeItemsError', () => {
  it('mensaje genérico cuando no hay error', () => {
    expect(getRecipeItemsError(undefined)).toContain('materias primas');
  });

  it('mensaje específico para material duplicado', () => {
    expect(getRecipeItemsError('ERROR: recipe_items_unique_material_per_recipe')).toContain('repitas');
  });
});
