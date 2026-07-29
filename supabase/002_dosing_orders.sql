-- ============================================================
-- HEALTH UP · Migración: Órdenes de dosificación
-- Corre esto en Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Tabla de órdenes de producto (cada vez que recibes un nuevo vial)
create table if not exists public.dosing_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  order_number text,                    -- '#4566671'
  medication text not null,             -- 'Compounded Tirzepatide'
  concentration_mg_per_unit numeric(6,3), -- mg por unidad (ej: 0.1765 mg/unit)
  start_units int not null,             -- dosis inicial en unidades (ej: 82)
  start_mg numeric(6,2),                -- dosis inicial en mg (ej: 14.47)
  increment_units int default 0,        -- incremento semanal en unidades (ej: 3)
  increment_mg numeric(6,2) default 0,  -- incremento semanal en mg (ej: 0.53)
  max_units int,                        -- máximo de unidades (ej: 85)
  max_mg numeric(6,2),                  -- máximo en mg (ej: 15)
  max_weeks int default 8,              -- no exceder en X semanas
  instructions text,                    -- texto completo de las instrucciones
  is_current boolean default true,      -- orden activa
  ordered_at date default current_date,
  created_at timestamptz default now()
);

-- Cuando se crea una orden nueva, desactivar las anteriores
create or replace function public.deactivate_old_orders()
returns trigger as $$
begin
  update public.dosing_orders
  set is_current = false
  where user_id = new.user_id and id != new.id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_dosing_order
  after insert on public.dosing_orders
  for each row execute function public.deactivate_old_orders();

-- RLS
alter table public.dosing_orders enable row level security;
create policy "Users manage own orders" on public.dosing_orders
  for all using (auth.uid() = user_id);

-- Actualizar dose_logs para incluir unidades
alter table public.dose_logs add column if not exists dose_units int;
alter table public.dose_logs add column if not exists order_id uuid references public.dosing_orders;
alter table public.dose_logs add column if not exists week_number int;
