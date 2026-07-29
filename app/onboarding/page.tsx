'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Btn, Icon } from '@/components/ui';

const GLP1_OPTIONS: { name: string; sub: string; value: string }[] = [
  { name: 'Ozempic®', sub: 'Semaglutida', value: 'ozempic' },
  { name: 'Wegovy®', sub: 'Semaglutida alta dosis', value: 'wegovy' },
  { name: 'Mounjaro®', sub: 'Tirzepatida', value: 'mounjaro' },
  { name: 'Compounded Tirzepatide', sub: 'Tirzepatida compuesta', value: 'compounded_tirzepatide' },
  { name: 'Saxenda®', sub: 'Liraglutida', value: 'saxenda' },
  { name: 'Otro', sub: 'Escribir manualmente', value: 'other' },
  { name: 'Aún no estoy en GLP-1', sub: 'Plan preventivo', value: 'none' },
];

// Conversión imperial ↔ métrico
const lbsToKg = (lbs: number) => Math.round(lbs * 0.453592 * 10) / 10;
const ftInToCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54));

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<'F' | 'M'>('M');
  const [age, setAge] = useState(34);
  const [weightLbs, setWeightLbs] = useState(172);
  const [targetLbs, setTargetLbs] = useState(150);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(8);
  const [med, setMed] = useState('ozempic');
  const [customMed, setCustomMed] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const totalSteps = 3;

  async function finish() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Convertir a métrico para guardar en DB
    const weightKg = lbsToKg(weightLbs);
    const targetKg = lbsToKg(targetLbs);
    const heightCm = ftInToCm(heightFt, heightIn);

    await supabase.from('profiles').update({
      sex, age, height_cm: heightCm,
      current_weight: weightKg, target_weight: targetKg,
      glp1_med: med === 'other' ? customMed : med,
      glp1_dose: med !== 'none' ? '0.25 mg' : null,
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    // Log peso inicial (en kg)
    await supabase.from('weight_logs').insert({
      user_id: user.id, weight: weightKg,
    });

    window.location.href = '/home';
  }

  const ProgressBar = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? HU.ink : HU.lineSoft, transition: 'background 0.3s' }} />
      ))}
    </div>
  );

  const Shell = ({ children, stepNum }: { children: React.ReactNode; stepNum: number }) => (
    <div style={{ minHeight: '100vh', background: HU.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 24px 0' }}>
        <ProgressBar />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {step > 0 ? (
            <div onClick={() => setStep(step - 1)} style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: HU.paper, cursor: 'pointer', transform: 'scaleX(-1)' }}>
              <Icon name="chev" size={14} color={HU.ink} />
            </div>
          ) : <div />}
          <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute, letterSpacing: .8 }}>{stepNum + 1} / {totalSteps}</div>
        </div>
      </div>
      {children}
    </div>
  );

  // STEP 0: Sexo + edad + estatura
  if (step === 0) return (
    <Shell stepNum={0}>
      <div style={{ padding: '8px 28px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ fontFamily: HU.mono, fontSize: 10, letterSpacing: 1.2, color: HU.mute, textTransform: 'uppercase', marginBottom: 10 }}>Paso 1 · Sobre ti</div>
        <h2 style={{ fontFamily: HU.display, fontSize: 30, fontWeight: 500, color: HU.ink, lineHeight: 1.1, letterSpacing: -.6, margin: 0 }}>Cuéntanos algo de ti.</h2>
        <p style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, marginTop: 8, marginBottom: 28 }}>Usamos esto para calcular tus calorías objetivo (TDEE).</p>

        <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Sexo biológico</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
          {(['F', 'M'] as const).map(s => (
            <div key={s} onClick={() => setSex(s)} style={{
              padding: '18px 16px', borderRadius: 16, background: sex === s ? HU.ink : HU.paper,
              color: sex === s ? '#fff' : HU.ink, border: `1px solid ${sex === s ? HU.ink : HU.line}`,
              fontFamily: HU.sans, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              {s === 'F' ? 'Femenino' : 'Masculino'}
              {sex === s && <Icon name="check" size={18} color="#fff" />}
            </div>
          ))}
        </div>

        <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Edad</div>
        <div style={{ background: HU.paper, border: `1px solid ${HU.line}`, borderRadius: 20, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div onClick={() => setAge(Math.max(18, age - 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
            <input type="number" value={age} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 18 && v <= 80) setAge(v); }}
              style={{ width: 80, textAlign: 'center', fontFamily: HU.display, fontSize: 48, fontWeight: 400, color: HU.ink, lineHeight: 1, border: 'none', background: 'transparent', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' as any }} />
            <div onClick={() => setAge(Math.min(80, age + 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
          </div>
          <div style={{ textAlign: 'center', fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 6 }}>años</div>
        </div>

        <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Estatura</div>
        <div style={{ background: HU.paper, border: `1px solid ${HU.line}`, borderRadius: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            {/* Feet */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: .6 }}>PIES</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => setHeightFt(Math.max(4, heightFt - 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
                <input type="number" value={heightFt} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 4 && v <= 7) setHeightFt(v); }}
                  style={{ width: 50, textAlign: 'center', fontFamily: HU.display, fontSize: 36, fontWeight: 400, color: HU.ink, border: 'none', background: 'transparent', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' as any }} />
                <div onClick={() => setHeightFt(Math.min(7, heightFt + 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
              </div>
            </div>
            {/* Inches */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: .6 }}>PULGADAS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => setHeightIn(Math.max(0, heightIn - 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
                <input type="number" value={heightIn} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 11) setHeightIn(v); }}
                  style={{ width: 50, textAlign: 'center', fontFamily: HU.display, fontSize: 36, fontWeight: 400, color: HU.ink, border: 'none', background: 'transparent', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' as any }} />
                <div onClick={() => setHeightIn(Math.min(11, heightIn + 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 40px', background: HU.cream }}>
        <Btn variant="primary" size="lg" style={{ width: '100%' }} icon="chev" onClick={() => setStep(1)}>Continuar</Btn>
      </div>
    </Shell>
  );

  // STEP 1: Peso + meta (en libras)
  if (step === 1) {
    const diffLbs = weightLbs - targetLbs;
    const diffKg = lbsToKg(diffLbs);
    const weeks = Math.ceil(diffKg / 0.5);
    const weeklyLbs = 1.1; // ~0.5 kg ≈ 1.1 lbs
    return (
      <Shell stepNum={1}>
        <div style={{ padding: '8px 28px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ fontFamily: HU.mono, fontSize: 10, letterSpacing: 1.2, color: HU.mute, textTransform: 'uppercase', marginBottom: 10 }}>Paso 2 · Tu meta</div>
          <h2 style={{ fontFamily: HU.display, fontSize: 30, fontWeight: 500, color: HU.ink, lineHeight: 1.1, letterSpacing: -.6, margin: 0 }}>Peso actual y meta.</h2>
          <p style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, marginTop: 8, marginBottom: 24 }}>Buscamos una pérdida sostenible: 1–1.5 lbs por semana.</p>

          <div style={{ background: HU.paper, borderRadius: 20, padding: 20, marginBottom: 14, border: `1px solid ${HU.line}` }}>
            <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.mute, textTransform: 'uppercase', letterSpacing: .4, marginBottom: 14 }}>Peso actual</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div onClick={() => setWeightLbs(Math.max(88, weightLbs - 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <input type="number" value={weightLbs} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 88 && v <= 500) setWeightLbs(v); }}
                  style={{ width: 100, textAlign: 'center', fontFamily: HU.display, fontSize: 48, fontWeight: 400, color: HU.ink, border: 'none', background: 'transparent', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' as any }} />
                <div style={{ fontFamily: HU.sans, fontSize: 16, color: HU.mute }}>lbs</div>
              </div>
              <div onClick={() => setWeightLbs(Math.min(500, weightLbs + 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
            </div>
          </div>

          <div style={{ background: HU.paper, borderRadius: 20, padding: 20, marginBottom: 14, border: `1px solid ${HU.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.mute, textTransform: 'uppercase', letterSpacing: .4 }}>Meta</div>
              {diffLbs > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 100, background: `${HU.leaf}22`, fontFamily: HU.mono, fontSize: 10, color: HU.leafDeep, fontWeight: 600 }}>−{diffLbs} lbs</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div onClick={() => setTargetLbs(Math.max(88, targetLbs - 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <input type="number" value={targetLbs} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 88 && v <= 500) setTargetLbs(v); }}
                  style={{ width: 100, textAlign: 'center', fontFamily: HU.display, fontSize: 48, fontWeight: 400, color: HU.leaf, border: 'none', background: 'transparent', outline: 'none', MozAppearance: 'textfield', WebkitAppearance: 'none' as any }} />
                <div style={{ fontFamily: HU.sans, fontSize: 16, color: HU.mute }}>lbs</div>
              </div>
              <div onClick={() => setTargetLbs(Math.min(500, targetLbs + 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
            </div>
          </div>

          {diffLbs > 0 && (
            <div style={{ background: `${HU.sun}20`, borderRadius: 16, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name="target" size={18} color={HU.inkDeep} stroke={2} />
              <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.inkDeep, lineHeight: 1.4 }}>
                <strong>Ritmo recomendado:</strong> ~{weeklyLbs} lbs/semana → {weeks} semanas. Saludable y compatible con GLP-1.
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px 40px', background: HU.cream }}>
          <Btn variant="primary" size="lg" style={{ width: '100%' }} icon="chev" onClick={() => setStep(2)}>Continuar</Btn>
        </div>
      </Shell>
    );
  }

  // STEP 2: GLP-1
  return (
    <Shell stepNum={2}>
      <div style={{ padding: '8px 28px', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ fontFamily: HU.mono, fontSize: 10, letterSpacing: 1.2, color: HU.mute, textTransform: 'uppercase', marginBottom: 10 }}>Paso 3 · Tu tratamiento</div>
        <h2 style={{ fontFamily: HU.display, fontSize: 30, fontWeight: 500, color: HU.ink, lineHeight: 1.1, letterSpacing: -.6, margin: 0 }}>¿Qué GLP-1 estás usando?</h2>
        <p style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, marginTop: 8, marginBottom: 20 }}>Ajustamos calorías y macros según tus efectos secundarios más comunes.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GLP1_OPTIONS.map((m) => {
            const active = med === m.value;
            return (
              <div key={m.value} onClick={() => setMed(m.value)} style={{
                padding: '14px 16px', borderRadius: 16, background: active ? HU.ink : HU.paper,
                border: `1px solid ${active ? HU.ink : HU.line}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: active ? HU.leaf : HU.creamWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="syringe" size={18} color={active ? '#fff' : HU.ink} stroke={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: HU.sans, fontSize: 15, fontWeight: 600, color: active ? '#fff' : HU.ink }}>{m.name}</div>
                  <div style={{ fontFamily: HU.sans, fontSize: 12, color: active ? 'rgba(255,255,255,.65)' : HU.mute, marginTop: 1 }}>{m.sub}</div>
                </div>
                {active && <div style={{ width: 22, height: 22, borderRadius: 11, background: HU.leaf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={13} color="#fff" stroke={2.5} /></div>}
              </div>
            );
          })}
        </div>

        {med === 'other' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Nombre del medicamento</div>
            <input
              type="text" placeholder="Escribe el nombre de tu medicamento"
              value={customMed} onChange={e => setCustomMed(e.target.value)}
              style={{
                width: '100%', height: 48, padding: '0 16px', borderRadius: 14,
                border: `1px solid ${HU.line}`, background: HU.paper,
                fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none',
              }}
            />
          </div>
        )}
        <div style={{ marginTop: 18, background: `${HU.coral}14`, borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="bell" size={16} color={HU.coral} stroke={2} />
          <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.inkDeep, lineHeight: 1.4 }}>
            Health Up complementa tu tratamiento. No sustituye el consejo de tu médico.
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 40px', background: HU.cream }}>
        <Btn variant="primary" size="lg" style={{ width: '100%' }} icon="spark" loading={saving} onClick={finish}>Generar mi plan</Btn>
      </div>
    </Shell>
  );
}
