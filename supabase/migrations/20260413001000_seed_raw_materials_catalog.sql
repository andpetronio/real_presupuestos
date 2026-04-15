-- Seed inicial de materias primas operativas.
-- Modelo vigente: nombre + unidad base + cantidad comprada + costo base + merma.

with seed_data (name, purchase_quantity, base_cost, base_unit, wastage_percentage) as (
  values
    ('Corazon de vaca', 1000::numeric, 5980.00::numeric, 'g', 30::numeric),
    ('Carne de vaca', 1000::numeric, 10660.00::numeric, 'g', 30::numeric),
    ('Pechuga de pollo', 1000::numeric, 8840.00::numeric, 'g', 30::numeric),
    ('Carne de cerdo', 1000::numeric, 10140.00::numeric, 'g', 30::numeric),
    ('Pollo deshuesado (pata)', 1000::numeric, 8710.00::numeric, 'g', 30::numeric),
    ('Zanahoria', 1000::numeric, 1500.00::numeric, 'g', 0::numeric),
    ('Calabaza', 1000::numeric, 1500.00::numeric, 'g', 0::numeric),
    ('Papa/camote', 1000::numeric, 1500.00::numeric, 'g', 0::numeric),
    ('Zukini', 1000::numeric, 1500.00::numeric, 'g', 0::numeric),
    ('Lentejas', 1000::numeric, 4000.00::numeric, 'g', 0::numeric),
    ('Arroz', 1000::numeric, 2500.00::numeric, 'g', 0::numeric),
    ('Higado de vaca', 1000::numeric, 4387.50::numeric, 'g', 30::numeric),
    ('Higado de pollo', 1000::numeric, 1800.00::numeric, 'g', 50::numeric),
    ('Rinon de vaca', 1000::numeric, 4499.95::numeric, 'g', 30::numeric),
    ('Rinon de cerdo', 1000::numeric, 1950.00::numeric, 'g', 30::numeric),
    ('Sesos', 1000::numeric, 1869.40::numeric, 'g', 30::numeric),
    ('Caldo de hueso', 1000::numeric, 5000.00::numeric, 'g', 0::numeric),
    ('Huevo', 30::numeric, 7000.00::numeric, 'u', 0::numeric),
    ('Mejillones', 250::numeric, 4000.00::numeric, 'g', 0::numeric),
    ('Espirulina', 100::numeric, 5500.00::numeric, 'g', 0::numeric),
    ('Cornalitos', 1000::numeric, 8400.00::numeric, 'g', 0::numeric),
    ('Ricota', 1000::numeric, 9000.00::numeric, 'g', 0::numeric),
    ('Huellita', 1::numeric, 160.00::numeric, 'u', 0::numeric)
)
insert into public.raw_materials (
  name,
  base_unit,
  purchase_quantity,
  purchase_unit,
  purchase_cost,
  derived_unit_cost,
  base_cost,
  wastage_percentage,
  cost_with_wastage,
  is_active
)
select
  sd.name,
  sd.base_unit,
  sd.purchase_quantity,
  sd.base_unit,
  sd.base_cost,
  round((sd.base_cost * (1 + sd.wastage_percentage / 100.0)) / nullif(sd.purchase_quantity, 0), 6),
  sd.base_cost,
  sd.wastage_percentage,
  round(sd.base_cost * (1 + sd.wastage_percentage / 100.0), 2),
  true
from seed_data sd
on conflict (name)
do update set
  base_unit = excluded.base_unit,
  purchase_quantity = excluded.purchase_quantity,
  purchase_unit = excluded.purchase_unit,
  purchase_cost = excluded.purchase_cost,
  derived_unit_cost = excluded.derived_unit_cost,
  base_cost = excluded.base_cost,
  wastage_percentage = excluded.wastage_percentage,
  cost_with_wastage = excluded.cost_with_wastage,
  is_active = excluded.is_active,
  updated_at = now();
