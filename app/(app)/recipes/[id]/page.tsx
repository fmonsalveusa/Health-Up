'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Icon, Btn, Chip, FoodImg } from '@/components/ui';
import type { Recipe, Ingredient } from '@/lib/types';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('recipes').select('*').eq('id', id).single();
      setRecipe(data);
    }
    load();
  }, [id]);

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', background: HU.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: HU.display, fontSize: 18, color: HU.mute }}>Cargando receta...</div>
      </div>
    );
  }

  const ingredients = (recipe.ingredients || []) as Ingredient[];
  const steps = (recipe.steps || []) as string[];
  const totalMacros = (recipe.protein_g || 0) + (recipe.carbs_g || 0) + (recipe.fat_g || 0);
  const pPct = totalMacros ? Math.round(((recipe.protein_g || 0) / totalMacros) * 100) : 33;
  const cPct = totalMacros ? Math.round(((recipe.carbs_g || 0) / totalMacros) * 100) : 34;
  const fPct = totalMacros ? 100 - pPct - cPct : 33;

  return (
    <div style={{ minHeight: '100vh', background: HU.paper, position: 'relative' }}>
      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 320 }}>
          <FoodImg tone={recipe.tone} label={recipe.title} ratio="auto" style={{ height: '100%', aspectRatio: 'auto' }} />
        </div>
        <div style={{ position: 'absolute', top: 56, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: 'scaleX(-1)' }}>
            <Icon name="chev" size={16} color={HU.ink} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="heart" size={16} color={HU.coral} stroke={0} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', marginTop: -32, background: HU.paper, borderRadius: '28px 28px 0 0', position: 'relative' }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {recipe.tags.map(tag => (
            <Chip key={tag} style={{ background: `${HU.leaf}22`, border: 'none', color: HU.leafDeep, fontWeight: 600 }}>{tag}</Chip>
          ))}
        </div>

        <h1 style={{ fontFamily: HU.display, fontSize: 28, fontWeight: 500, color: HU.ink, lineHeight: 1.05, letterSpacing: -.6, margin: 0 }}>
          {recipe.title}
        </h1>
        {recipe.description && (
          <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 6, lineHeight: 1.5 }}>
            {recipe.description}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '18px 0', padding: '12px 0', borderTop: `1px solid ${HU.line}`, borderBottom: `1px solid ${HU.line}` }}>
          {[
            { l: 'kcal', v: recipe.kcal },
            { l: 'prot', v: `${recipe.protein_g || 0}g` },
            { l: 'carb', v: `${recipe.carbs_g || 0}g` },
            { l: 'grasa', v: `${recipe.fat_g || 0}g` },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', borderLeft: i > 0 ? `1px solid ${HU.line}` : 'none' }}>
              <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink }}>{s.v}</div>
              <div style={{ fontFamily: HU.mono, fontSize: 9, color: HU.mute, letterSpacing: .8, textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* GLP-1 note */}
        {recipe.glp1_notes && (
          <div style={{ padding: '14px 16px', borderRadius: 16, background: `${HU.leaf}14`, border: `1px solid ${HU.leaf}30`, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: HU.leaf, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="syringe" size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 700, color: HU.leafDeep }}>Compatible con tu dosis</div>
              <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.inkDeep, marginTop: 3, lineHeight: 1.4 }}>{recipe.glp1_notes}</div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 10, letterSpacing: -.2 }}>
          Ingredientes · {recipe.servings} porción{recipe.servings > 1 ? 'es' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${HU.lineSoft}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: HU.creamWarm }} />
              <div style={{ flex: 1, fontFamily: HU.sans, fontSize: 13, color: HU.ink }}>{ing.name}</div>
              <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute }}>{ing.quantity} {ing.unit}</div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 10, letterSpacing: -.2 }}>
          Preparación · {recipe.cook_minutes} min
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 120 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: HU.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HU.display, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontFamily: HU.sans, fontSize: 13, color: HU.ink, lineHeight: 1.5, paddingTop: 4 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
