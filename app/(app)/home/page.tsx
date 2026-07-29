'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Icon, Btn, Ring, MacroBar, FoodImg, TabBar } from '@/components/ui';
import { calculateTDEE, calculateTargetKcal, calculateMacros } from '@/lib/nutrition';
import type { Profile, PlannedMeal, Recipe } from '@/lib/types';

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayMeals, setTodayMeals] = useState<(PlannedMeal & { recipe?: Recipe })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Perfil
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Comidas de hoy (planned_meals con receta) — si hay plan para esta semana
      const today = new Date();
      const dayOfWeek = (today.getDay() + 6) % 7; // 0=lun
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek);
      const weekStart = monday.toISOString().split('T')[0];

      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (plan) {
        const { data: meals } = await supabase
          .from('planned_meals')
          .select('*, recipe:recipes(*)')
          .eq('plan_id', plan.id)
          .eq('day_of_week', dayOfWeek)
          .order('scheduled_time');
        setTodayMeals(meals || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: HU.display, fontSize: 20, color: HU.ink }}>Cargando...</div>
      </div>
    );
  }

  // Calcular nutrición real del usuario
  const tdee = profile.sex && profile.age && profile.current_weight && profile.height_cm
    ? calculateTDEE({ sex: profile.sex, age: profile.age, weight_kg: profile.current_weight, height_cm: profile.height_cm })
    : 1600;
  const targetKcal = calculateTargetKcal(tdee);
  const macros = calculateMacros(targetKcal);

  // Calcular lo comido
  const eatenMeals = todayMeals.filter(m => m.is_eaten);
  const eatenKcal = eatenMeals.reduce((sum, m) => sum + (m.recipe?.kcal || m.custom_kcal || 0), 0);
  const progress = targetKcal > 0 ? Math.min(eatenKcal / targetKcal, 1) : 0;

  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;

  async function markEaten(mealId: string) {
    await supabase.from('planned_meals').update({ is_eaten: true, eaten_at: new Date().toISOString() }).eq('id', mealId);
    setTodayMeals(prev => prev.map(m => m.id === mealId ? { ...m, is_eaten: true } : m));
  }

  const firstName = profile.name?.split(' ')[0] || 'tú';

  return (
    <div style={{ minHeight: '100vh', background: HU.cream }}>
      <div style={{ padding: '60px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginBottom: 2 }}>
            {today.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <h1 style={{ fontFamily: HU.display, fontSize: 30, fontWeight: 500, color: HU.ink, lineHeight: 1.1, letterSpacing: -.6, margin: 0 }}>
            Hola, <em style={{ fontStyle: 'italic', color: HU.leaf }}>{firstName}</em>.
          </h1>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: HU.paper, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Icon name="bell" size={18} color={HU.ink} />
        </div>
      </div>

      {/* Week strip */}
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {days.map((d, i) => {
            const isToday = i === todayIdx;
            const date = new Date(today);
            date.setDate(today.getDate() - todayIdx + i);
            return (
              <div key={d} style={{
                flex: 1, paddingTop: 10, paddingBottom: 10, borderRadius: 14,
                background: isToday ? HU.ink : HU.paper, color: isToday ? '#fff' : HU.ink,
                border: isToday ? 'none' : `1px solid ${HU.lineSoft}`, textAlign: 'center',
              }}>
                <div style={{ fontFamily: HU.sans, fontSize: 10, fontWeight: 600, opacity: .6, letterSpacing: .6 }}>{d}</div>
                <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, marginTop: 2 }}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily summary */}
      <div style={{ margin: '8px 20px 20px', padding: 20, borderRadius: 24, background: HU.paper, border: `1px solid ${HU.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: .8, textTransform: 'uppercase' }}>Hoy</div>
            <div style={{ fontFamily: HU.display, fontSize: 22, fontWeight: 500, color: HU.ink, marginTop: 2 }}>
              {eatenKcal.toLocaleString()} <span style={{ fontSize: 14, color: HU.mute }}>/ {targetKcal.toLocaleString()} kcal</span>
            </div>
          </div>
          <Ring size={56} stroke={6} value={progress} color={HU.leaf}>
            <div style={{ fontFamily: HU.display, fontSize: 16, color: HU.ink, fontWeight: 500 }}>{Math.round(progress * 100)}%</div>
          </Ring>
        </div>
        <MacroBar p={30} c={40} f={30} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: .4 }}>
          <span><span style={{ color: HU.ink, fontWeight: 700 }}>{macros.proteinG}g</span> PROT</span>
          <span><span style={{ color: HU.leaf, fontWeight: 700 }}>{macros.carbsG}g</span> CARB</span>
          <span><span style={{ color: '#B08A3A', fontWeight: 700 }}>{macros.fatG}g</span> GRASA</span>
        </div>
      </div>

      {/* GLP-1 dose card */}
      {profile.glp1_med && profile.glp1_med !== 'none' && (
        <div style={{ margin: '0 20px 20px', padding: '14px 16px', borderRadius: 20, background: HU.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: HU.leaf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="syringe" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: HU.sans, fontSize: 11, opacity: .65, textTransform: 'uppercase', letterSpacing: .6 }}>Tu tratamiento</div>
            <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, marginTop: 2 }}>
              {profile.glp1_med.charAt(0).toUpperCase() + profile.glp1_med.slice(1)} · {profile.glp1_dose || '0.25 mg'}
            </div>
          </div>
        </div>
      )}

      {/* Today meals */}
      <div style={{ padding: '0 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink, letterSpacing: -.3 }}>Comidas de hoy</div>
        <a href="/plan" style={{ fontFamily: HU.sans, fontSize: 12, color: HU.leaf, fontWeight: 600, textDecoration: 'none' }}>Ver plan</a>
      </div>

      {todayMeals.length > 0 ? (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
          {todayMeals.map(m => {
            const name = m.recipe?.title || m.custom_name || 'Comida';
            const kcal = m.recipe?.kcal || m.custom_kcal || 0;
            const tone = m.recipe?.tone || 'leaf';
            return (
              <div key={m.id} style={{
                display: 'flex', gap: 12, padding: 10, background: HU.paper, borderRadius: 18,
                border: `1px solid ${HU.lineSoft}`, alignItems: 'center', opacity: m.is_eaten ? .8 : 1,
              }}>
                <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <FoodImg tone={tone} label="" />
                  {m.is_eaten && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,58,95,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 13, background: HU.leaf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={14} color="#fff" stroke={3} />
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: .6 }}>
                      {m.meal_type.toUpperCase()} {m.scheduled_time ? `· ${m.scheduled_time.slice(0, 5)}` : ''}
                    </div>
                    <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.ink, fontWeight: 700 }}>{kcal} kcal</div>
                  </div>
                  <div style={{ fontFamily: HU.display, fontSize: 15, fontWeight: 500, color: HU.ink, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                  {!m.is_eaten && (
                    <div onClick={() => markEaten(m.id)} style={{
                      marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                      borderRadius: 100, background: `${HU.leaf}18`, cursor: 'pointer',
                      fontFamily: HU.sans, fontSize: 11, fontWeight: 600, color: HU.leafDeep,
                    }}>
                      <Icon name="check" size={12} color={HU.leafDeep} stroke={2.5} /> Lo comí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, marginBottom: 12 }}>
            No hay comidas planificadas para hoy.
          </div>
          <a href="/recipes">
            <Btn variant="secondary" size="sm" icon="book">Explorar recetas</Btn>
          </a>
        </div>
      )}

      <TabBar active="home" />
    </div>
  );
}
