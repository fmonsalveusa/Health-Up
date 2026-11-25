-- ============================================================
-- HEALTH UP · Migración: inventario del vial
-- Corre esto en Supabase → SQL Editor → New Query → Run
-- ============================================================
-- Unidades totales que trae el vial de cada orden (ej: 300 en un vial de 3 ml U-100).
-- La app resta las unidades inyectadas para avisar cuántas dosis quedan.

alter table public.dosing_orders add column if not exists vial_units int;
