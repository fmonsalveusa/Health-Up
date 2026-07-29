-- ============================================================
-- HEATH UP · Schema de base de datos
-- Corre esto en Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. PERFILES DE USUARIO (extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  sex char(1) check (sex in ('F', 'M')),
  age int check (age between 18 and 99),
  height_cm numeric(5,1),         -- estatura en cm
  current_weight numeric(5,1),    -- peso actual en kg
  target_weight numeric(5,1),     -- peso meta en kg
  glp1_med text,                  -- 'ozempic' | 'wegovy' | 'mounjaro' | 'saxenda' | 'none'
  glp1_dose text,                 -- '0.25 mg', '0.5 mg', etc.
  onboarding_done boolean default false,
  plan_type text default 'free',  -- 'free' | 'pro'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. REGISTRO DE PESO (histórico)
create table public.weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  weight numeric(5,1) not null,
  logged_at date default current_date,
  note text,
  created_at timestamptz default now()
);

-- 3. RECETAS
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  kcal int not null,
  protein_g int,
  carbs_g int,
  fat_g int,
  cook_minutes int,
  servings int default 1,
  ingredients jsonb default '[]',   -- [{name, quantity, unit}]
  steps jsonb default '[]',         -- ["paso 1", "paso 2"]
  tags text[] default '{}',         -- {'alto-prot', 'vegetariano', 'sin-gluten'}
  glp1_notes text,                  -- nota sobre compatibilidad GLP-1
  tone text default 'leaf',         -- para color del placeholder de imagen
  image_url text,                   -- si hay foto real
  created_at timestamptz default now()
);

-- 4. PLAN SEMANAL
create table public.meal_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  week_start date not null,         -- lunes de la semana
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- 5. COMIDAS PLANIFICADAS
create table public.planned_meals (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.meal_plans on delete cascade not null,
  recipe_id uuid references public.recipes,
  day_of_week int check (day_of_week between 0 and 6), -- 0=lun
  meal_type text not null check (meal_type in ('desayuno', 'almuerzo', 'snack', 'cena')),
  scheduled_time time,
  is_eaten boolean default false,
  eaten_at timestamptz,
  custom_kcal int,                 -- override si no es receta
  custom_name text,                -- override si no es receta
  created_at timestamptz default now()
);

-- 6. DOSIS GLP-1
create table public.dose_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  dose_mg numeric(4,2) not null,
  med_name text not null,
  taken_at timestamptz default now(),
  scheduled_for date,
  notes text
);

-- 7. EFECTOS SECUNDARIOS
create table public.side_effects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  week_start date not null,
  nausea int default 0 check (nausea between 0 and 5),
  early_satiety int default 0 check (early_satiety between 0 and 5),
  fatigue int default 0 check (fatigue between 0 and 5),
  reflux int default 0 check (reflux between 0 and 5),
  other_notes text,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

-- ============================================================
-- ROW LEVEL SECURITY — cada usuario ve sólo sus datos
-- ============================================================

alter table public.profiles enable row level security;
alter table public.weight_logs enable row level security;
alter table public.meal_plans enable row level security;
alter table public.planned_meals enable row level security;
alter table public.dose_logs enable row level security;
alter table public.side_effects enable row level security;
alter table public.recipes enable row level security;

-- Profiles: el usuario ve/edita sólo el suyo
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Weight logs
create policy "Users manage own weight" on public.weight_logs
  for all using (auth.uid() = user_id);

-- Meal plans
create policy "Users manage own plans" on public.meal_plans
  for all using (auth.uid() = user_id);

-- Planned meals (via plan ownership)
create policy "Users manage own meals" on public.planned_meals
  for all using (
    exists (select 1 from public.meal_plans where id = planned_meals.plan_id and user_id = auth.uid())
  );

-- Dose logs
create policy "Users manage own doses" on public.dose_logs
  for all using (auth.uid() = user_id);

-- Side effects
create policy "Users manage own effects" on public.side_effects
  for all using (auth.uid() = user_id);

-- Recetas: todos pueden leer, sólo admin inserta (por ahora)
create policy "Anyone reads recipes" on public.recipes
  for select using (true);

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SEED: recetas iniciales (las que ya tenemos en el diseño)
-- ============================================================

insert into public.recipes (title, description, kcal, protein_g, carbs_g, fat_g, cook_minutes, tags, tone, glp1_notes, ingredients, steps) values
(
  'Avena proteica con frutos rojos',
  'Avena con proteína whey, frutos rojos frescos y un toque de canela.',
  320, 22, 38, 8, 10,
  '{"desayuno","rápido","alto-prot"}', 'sun',
  'Ideal post-inyección: suave y fácil de digerir.',
  '[{"name":"Avena","quantity":"50","unit":"g"},{"name":"Whey protein","quantity":"1","unit":"scoop"},{"name":"Frutos rojos","quantity":"80","unit":"g"},{"name":"Leche descremada","quantity":"200","unit":"ml"}]',
  '["Cocina la avena en la leche a fuego medio por 5 min.","Retira del fuego, deja enfriar 1 min y mezcla el whey.","Sirve con frutos rojos frescos y canela al gusto."]'
),
(
  'Bowl mediterráneo con salmón',
  'Salmón al horno, quinoa, pepino, aceitunas, hummus. Equilibrio de proteína y fibra para saciedad larga.',
  480, 36, 42, 14, 20,
  '{"almuerzo","alto-prot","omega-3","sin-gluten"}', 'leaf',
  'Porciones reducidas y proteína densa — ideal para Ozempic 0.5 mg. Come lento, mastica bien.',
  '[{"name":"Filete de salmón","quantity":"120","unit":"g"},{"name":"Quinoa cocida","quantity":"80","unit":"g"},{"name":"Pepino en cubos","quantity":"0.5","unit":"unidad"},{"name":"Aceitunas kalamata","quantity":"6","unit":"piezas"},{"name":"Hummus","quantity":"2","unit":"cda"},{"name":"Hojas verdes","quantity":"1","unit":"taza"},{"name":"Aceite de oliva","quantity":"1","unit":"cdita"},{"name":"Limón","quantity":"0.25","unit":"unidad"}]',
  '["Precalienta el horno a 200°C. Sazona el salmón con limón, sal y pimienta.","Hornea 12 minutos hasta que el salmón esté opaco y se desprenda con el tenedor.","Monta el bowl: quinoa de base, hojas verdes, pepino, aceitunas y hummus al centro.","Coloca el salmón encima, rocía aceite de oliva y sirve tibio."]'
),
(
  'Yogur griego con pepino',
  'Snack fresco alto en proteína con pepino rallado y eneldo.',
  140, 14, 10, 4, 5,
  '{"snack","rápido","sin-gluten"}', 'cream',
  'Excelente para días con náusea — fresco y liviano.',
  '[{"name":"Yogur griego 0%","quantity":"170","unit":"g"},{"name":"Pepino rallado","quantity":"0.5","unit":"unidad"},{"name":"Eneldo","quantity":"1","unit":"cdita"},{"name":"Sal y pimienta","quantity":"","unit":"al gusto"}]',
  '["Ralla el pepino y escúrrelo bien.","Mezcla con el yogur, eneldo, sal y pimienta.","Sirve frío."]'
),
(
  'Pollo al horno con kale',
  'Pechuga de pollo jugosa con kale crujiente y sweet potato.',
  380, 40, 22, 12, 30,
  '{"cena","alto-prot","sin-gluten"}', 'navy',
  'Cena ideal: alta proteína, bajo índice glucémico. Buena opción para días sin efectos.',
  '[{"name":"Pechuga de pollo","quantity":"150","unit":"g"},{"name":"Kale","quantity":"2","unit":"tazas"},{"name":"Sweet potato","quantity":"100","unit":"g"},{"name":"Aceite de oliva","quantity":"1","unit":"cda"},{"name":"Ajo en polvo","quantity":"0.5","unit":"cdita"}]',
  '["Precalienta horno a 200°C.","Sazona el pollo con ajo, sal y pimienta. Hornea 20 min.","Corta sweet potato en cubos, mezcla con aceite y hornea junto al pollo los últimos 15 min.","Masajea kale con un poco de aceite y sal. Hornea 5 min hasta crujiente.","Arma el plato y sirve."]'
),
(
  'Bowl buddha con quinoa',
  'Quinoa, garbanzos, aguacate, zanahoria rallada y tahini.',
  420, 18, 52, 16, 25,
  '{"almuerzo","alto-prot","vegetariano"}', 'leaf',
  'Alto en fibra — masticar bien para evitar hinchazón con GLP-1.',
  '[{"name":"Quinoa cocida","quantity":"100","unit":"g"},{"name":"Garbanzos","quantity":"80","unit":"g"},{"name":"Aguacate","quantity":"0.5","unit":"unidad"},{"name":"Zanahoria rallada","quantity":"1","unit":"unidad"},{"name":"Tahini","quantity":"1","unit":"cda"},{"name":"Limón","quantity":"0.5","unit":"unidad"}]',
  '["Cocina quinoa según instrucciones.","Escurre garbanzos y calienta en sartén con un poco de aceite.","Ralla la zanahoria, corta el aguacate.","Arma el bowl con todos los ingredientes.","Aliña con tahini mezclado con limón y agua."]'
),
(
  'Ensalada tibia de lentejas',
  'Lentejas con vegetales asados, queso feta y vinagreta de mostaza.',
  340, 22, 38, 10, 20,
  '{"almuerzo","vegetariano"}', 'sun',
  'Buena fuente de hierro y proteína vegetal. Porción moderada recomendada.',
  '[{"name":"Lentejas cocidas","quantity":"120","unit":"g"},{"name":"Pimiento rojo","quantity":"0.5","unit":"unidad"},{"name":"Cebolla morada","quantity":"0.25","unit":"unidad"},{"name":"Queso feta","quantity":"30","unit":"g"},{"name":"Mostaza dijon","quantity":"1","unit":"cdita"},{"name":"Vinagre balsámico","quantity":"1","unit":"cda"}]',
  '["Asa pimiento y cebolla en cubos a 200°C por 15 min.","Calienta lentejas y mezcla con vegetales.","Prepara vinagreta: mostaza + vinagre + aceite.","Sirve tibio con feta desmenuzado."]'
);
