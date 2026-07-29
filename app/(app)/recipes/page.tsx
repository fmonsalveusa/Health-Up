'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Icon, Chip, FoodImg, TabBar } from '@/components/ui';
import type { Recipe } from '@/lib/types';

const FILTERS = [
  { l: 'Todas', v: '' },
  { l: '< 400 kcal', v: 'low-cal' },
  { l: 'Alto en proteína', v: 'alto-prot' },
  { l: 'Vegetariano', v: 'vegetariano' },
  { l: 'Sin gluten', v: 'sin-gluten' },
  { l: 'Rápido', v: 'rápido' },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase.from('recipes').select('*').order('title');
      if (filter === 'low-cal') query = query.lt('kcal', 400);
      else if (filter) query = query.contains('tags', [filter]);
      const { data } = await query;
      setRecipes(data || []);
    }
    load();
  }, [filter]);

  const filtered = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <div style={{ minHeight: '100vh', background: HU.cream }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <h1 style={{ fontFamily: HU.display, fontSize: 32, fontWeight: 500, color: HU.ink, lineHeight: 1, letterSpacing: -.8, margin: 0 }}>Recetas.</h1>
        <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 6 }}>{recipes.length} opciones disponibles</div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: HU.paper, borderRadius: 14, border: `1px solid ${HU.line}` }}>
          <Icon name="search" size={16} color={HU.mute} />
          <input
            type="text" placeholder="Buscar receta o ingrediente…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: HU.sans, fontSize: 14, color: HU.ink }}
          />
        </div>
      </div>

      {/* Chips */}
      <div style={{ padding: '0 0 14px', overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', gap: 6, padding: '0 20px' }}>
          {FILTERS.map(f => (
            <Chip key={f.v} active={filter === f.v} onClick={() => setFilter(f.v)}>{f.l}</Chip>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map(r => (
            <a key={r.id} href={`/recipes/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', background: HU.paper, border: `1px solid ${HU.lineSoft}`, position: 'relative' }}>
                <div style={{ height: 100, position: 'relative' }}>
                  <FoodImg tone={r.tone} label="" ratio="auto" style={{ height: '100%', aspectRatio: 'auto' }} />
                  {r.tags[0] && (
                    <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '2px 6px', borderRadius: 4, background: 'rgba(30,58,95,.8)', color: '#fff', fontFamily: HU.mono, fontSize: 9, letterSpacing: .4 }}>
                      {r.tags[0]}
                    </div>
                  )}
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontFamily: HU.sans, fontSize: 13, fontWeight: 600, color: HU.ink, lineHeight: 1.2, minHeight: 32 }}>{r.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontFamily: HU.mono, fontSize: 10, color: HU.mute }}>
                    <span>{r.kcal} kcal</span>
                    <span>·</span>
                    <span>{r.cook_minutes} min</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <TabBar active="recipes" />
    </div>
  );
}
