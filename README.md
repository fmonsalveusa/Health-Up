# Health Up · App GLP-1

PWA de nutrición para personas en tratamiento GLP-1 (Ozempic, Wegovy, Mounjaro, Saxenda).

**Stack:** Next.js 14 + Supabase + Tailwind + PWA

---

## Setup en 10 minutos

### 1. Clonar e instalar

```bash
cd health-up
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → "New Project"
2. Dale nombre: `health-up`
3. Elige una contraseña para la DB (guárdala)
4. Región: la más cercana a tus usuarios
5. Espera ~2 min a que se cree

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus datos de Supabase (Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon/public key

### 4. Crear las tablas

1. En Supabase → **SQL Editor** → "New Query"
2. Pega TODO el contenido de `supabase/schema.sql`
3. Click **Run**
4. Deberías ver: profiles, weight_logs, recipes, meal_plans, planned_meals, dose_logs, side_effects

### 5. Configurar Auth

En Supabase → **Authentication** → **Providers**:
- Email: habilitado (ya viene por default)
- **Desactiva "Confirm email"** para desarrollo rápido:
  Settings → Auth → "Enable email confirmations" → OFF

### 6. Levantar el dev server

```bash
npm run dev
```

Abre [localhost:3000](http://localhost:3000) → deberías ver la pantalla de registro.

---

## Estructura del proyecto

```
health-up/
├── app/
│   ├── auth/           # Login / registro
│   ├── onboarding/     # 3 pasos: sexo+edad, peso+meta, GLP-1
│   ├── (app)/          # Páginas autenticadas
│   │   ├── home/       # Dashboard con comidas del día
│   │   ├── plan/       # Plan semanal (placeholder)
│   │   ├── recipes/    # Biblioteca + detalle
│   │   ├── track/      # Registro de peso
│   │   └── profile/    # Datos del usuario
│   ├── layout.tsx      # Root layout + fonts + PWA
│   └── globals.css     # Tailwind + animaciones
├── components/ui/      # Design system (Icon, Btn, Ring, etc.)
├── lib/
│   ├── supabase.ts     # Cliente browser
│   ├── supabase-server.ts  # Cliente server
│   ├── types.ts        # TypeScript types
│   ├── design.ts       # Tokens del design system
│   └── nutrition.ts    # Cálculos TDEE, macros
├── public/             # PWA manifest + iconos
├── supabase/
│   └── schema.sql      # Schema completo + seed de recetas
└── middleware.ts        # Auth guard
```

---

## Flujo del usuario

1. **Registro** → email + password
2. **Onboarding** → sexo, edad, estatura, peso, meta, medicamento GLP-1
3. **Home** → dashboard con calorías del día, macros, próxima dosis
4. **Recetas** → biblioteca filtrable, detalle con ingredientes y pasos
5. **Progreso** → registro de peso, historial, tracking
6. **Perfil** → datos, TDEE calculado, logout

---

## Deploy a producción

```bash
# Build
npm run build

# Deploy en Vercel (la forma más fácil)
npx vercel
```

En Vercel, agrega las variables de entorno de `.env.local`.

La PWA se activa automáticamente en producción — los usuarios pueden "Add to Home Screen".

---

## Próximos pasos (Fase 2)

- [ ] Generación de plan semanal con IA (Claude API)
- [ ] Recordatorios de dosis (push notifications)
- [ ] Tracking de efectos secundarios
- [ ] Fotos de comidas
- [ ] Suscripción con Stripe
