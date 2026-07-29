'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Icon, Btn, TabBar } from '@/components/ui';
import { calculateTDEE, calculateTargetKcal, calculateMacros, kgToLbs, lbsToKg, cmToFtIn } from '@/lib/nutrition';
import type { Profile, GLP1Med } from '@/lib/types';

const MED_OPTIONS: { label: string; value: GLP1Med }[] = [
  { label: 'Ozempic® (Semaglutida)', value: 'ozempic' },
  { label: 'Wegovy® (Semaglutida)', value: 'wegovy' },
  { label: 'Mounjaro® (Tirzepatida)', value: 'mounjaro' },
  { label: 'Saxenda® (Liraglutida)', value: 'saxenda' },
  { label: 'Compounded Tirzepatide', value: 'mounjaro' },
  { label: 'Ninguno', value: 'none' },
];

const DOSE_OPTIONS: Record<string, string[]> = {
  ozempic: ['0.25 mg', '0.5 mg', '1.0 mg', '2.0 mg'],
  wegovy: ['0.25 mg', '0.5 mg', '1.0 mg', '1.7 mg', '2.4 mg'],
  mounjaro: ['2.5 mg', '5.0 mg', '7.5 mg', '10.0 mg', '12.5 mg', '15.0 mg'],
  saxenda: ['0.6 mg', '1.2 mg', '1.8 mg', '2.4 mg', '3.0 mg'],
};

type EditField = 'weight' | 'target' | 'med' | null;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState<EditField>(null);
  const [saving, setSaving] = useState(false);

  // Edit values
  const [editWeight, setEditWeight] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editMed, setEditMed] = useState<GLP1Med>('none');
  const [editDose, setEditDose] = useState('');
  const [editMedCustom, setEditMedCustom] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    load();
  }, []);

  function startEdit(field: EditField) {
    if (!profile) return;
    setEditing(field);
    if (field === 'weight') setEditWeight(String(kgToLbs(profile.current_weight || 0)));
    if (field === 'target') setEditTarget(String(kgToLbs(profile.target_weight || 0)));
    if (field === 'med') {
      setEditMed(profile.glp1_med as GLP1Med || 'none');
      setEditDose(profile.glp1_dose || '');
      setEditMedCustom('');
    }
  }

  async function saveField() {
    if (!profile) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (editing === 'weight') {
      const lbs = parseFloat(editWeight);
      if (lbs) {
        updates.current_weight = lbsToKg(lbs);
        // También registrar en weight_logs
        await supabase.from('weight_logs').insert({ user_id: user.id, weight: lbsToKg(lbs) });
      }
    }
    if (editing === 'target') {
      const lbs = parseFloat(editTarget);
      if (lbs) updates.target_weight = lbsToKg(lbs);
    }
    if (editing === 'med') {
      updates.glp1_med = editMed;
      updates.glp1_dose = editDose || null;
    }

    await supabase.from('profiles').update(updates).eq('id', user.id);

    // Reload profile
    const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(refreshed);
    setEditing(null);
    setSaving(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  }

  if (!profile) return null;

  const tdee = profile.sex && profile.age && profile.current_weight && profile.height_cm
    ? calculateTDEE({ sex: profile.sex, age: profile.age, weight_kg: profile.current_weight, height_cm: profile.height_cm })
    : 0;
  const targetKcal = calculateTargetKcal(tdee);
  const macros = calculateMacros(targetKcal);
  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : '?';
  const weightLbs = kgToLbs(profile.current_weight || 0);
  const targetLbs = kgToLbs(profile.target_weight || 0);
  const [ft, inches] = profile.height_cm ? cmToFtIn(profile.height_cm) : [0, 0];
  const doseOptions = DOSE_OPTIONS[profile.glp1_med || ''] || [];

  const inputStyle: React.CSSProperties = {
    height: 48, padding: '0 14px', borderRadius: 14,
    border: `1px solid ${HU.line}`, background: HU.cream,
    fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none', width: '100%',
  };

  return (
    <div style={{ minHeight: '100vh', background: HU.cream }}>
      <div style={{ padding: '60px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 style={{ fontFamily: HU.display, fontSize: 32, fontWeight: 500, color: HU.ink, lineHeight: 1, letterSpacing: -.8, margin: 0 }}>Perfil.</h1>
      </div>

      {/* Avatar card */}
      <div style={{ margin: '0 20px 20px', padding: 20, borderRadius: 22, background: HU.paper, border: `1px solid ${HU.line}`, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: 34, background: `linear-gradient(135deg, ${HU.leaf}, ${HU.ink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: HU.display, fontSize: 26, fontWeight: 500 }}>{initial}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink, letterSpacing: -.3 }}>{profile.name || 'Usuario'}</div>
          <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute, marginTop: 2 }}>
            {profile.age} años · {ft}'{inches}" · {profile.sex}
          </div>
        </div>
      </div>

      {/* Stats */}
      {tdee > 0 && (
        <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[{ l: 'TDEE', v: tdee.toLocaleString() }, { l: 'Meta kcal', v: targetKcal.toLocaleString() }, { l: 'Prot/día', v: `${macros.proteinG}g` }].map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 14, background: HU.paper, border: `1px solid ${HU.lineSoft}`, textAlign: 'center' }}>
              <div style={{ fontFamily: HU.mono, fontSize: 9, color: HU.mute, letterSpacing: .8, textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink, marginTop: 4, letterSpacing: -.3 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Settings list with edit buttons */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Mi cuerpo */}
        <div>
          <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 12px 6px' }}>Mi cuerpo</div>
          <div style={{ background: HU.paper, borderRadius: 16, border: `1px solid ${HU.lineSoft}`, overflow: 'hidden' }}>

            {/* Peso actual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: `1px solid ${HU.lineSoft}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: HU.creamWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="scale" size={15} color={HU.ink} stroke={1.8} />
              </div>
              <div style={{ flex: 1, fontFamily: HU.sans, fontSize: 14, color: HU.ink }}>Peso actual</div>
              <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute }}>{weightLbs} lbs</div>
              <div onClick={() => startEdit('weight')} style={{ width: 28, height: 28, borderRadius: 8, background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="settings" size={12} color={HU.ink} />
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: HU.creamWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="target" size={15} color={HU.ink} stroke={1.8} />
              </div>
              <div style={{ flex: 1, fontFamily: HU.sans, fontSize: 14, color: HU.ink }}>Meta</div>
              <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute }}>{targetLbs} lbs</div>
              <div onClick={() => startEdit('target')} style={{ width: 28, height: 28, borderRadius: 8, background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="settings" size={12} color={HU.ink} />
              </div>
            </div>
          </div>
        </div>

        {/* Tratamiento */}
        <div>
          <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 12px 6px' }}>Tratamiento</div>
          <div style={{ background: HU.paper, borderRadius: 16, border: `1px solid ${HU.lineSoft}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: HU.creamWarm, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="syringe" size={15} color={HU.ink} stroke={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.ink }}>Medicamento</div>
                <div style={{ fontFamily: HU.sans, fontSize: 11, color: HU.mute, marginTop: 1 }}>
                  {profile.glp1_med && profile.glp1_med !== 'none'
                    ? `${profile.glp1_med} · ${profile.glp1_dose || 'sin dosis'}`
                    : 'Ninguno'}
                </div>
              </div>
              <div onClick={() => startEdit('med')} style={{ width: 28, height: 28, borderRadius: 8, background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name="settings" size={12} color={HU.ink} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Edit modals ── */}

        {/* Edit weight */}
        {editing === 'weight' && (
          <div style={{ padding: 18, borderRadius: 18, background: HU.paper, border: `2px solid ${HU.sun}` }}>
            <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 14 }}>Editar peso actual</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <input type="number" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)}
                style={{ ...inputStyle, fontFamily: HU.display, fontSize: 24 }} autoFocus />
              <span style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, flexShrink: 0 }}>lbs</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="md" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="primary" size="md" icon="check" loading={saving} onClick={saveField} style={{ flex: 1 }}>Guardar</Btn>
            </div>
          </div>
        )}

        {/* Edit target */}
        {editing === 'target' && (
          <div style={{ padding: 18, borderRadius: 18, background: HU.paper, border: `2px solid ${HU.sun}` }}>
            <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 14 }}>Editar peso meta</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <input type="number" step="0.1" value={editTarget} onChange={e => setEditTarget(e.target.value)}
                style={{ ...inputStyle, fontFamily: HU.display, fontSize: 24 }} autoFocus />
              <span style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, flexShrink: 0 }}>lbs</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="md" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="primary" size="md" icon="check" loading={saving} onClick={saveField} style={{ flex: 1 }}>Guardar</Btn>
            </div>
          </div>
        )}

        {/* Edit medication */}
        {editing === 'med' && (
          <div style={{ padding: 18, borderRadius: 18, background: HU.paper, border: `2px solid ${HU.sun}` }}>
            <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 14 }}>Editar medicamento</div>

            <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Medicamento</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {MED_OPTIONS.map(m => {
                const active = editMed === m.value && editMedCustom === '';
                return (
                  <div key={m.label} onClick={() => { setEditMed(m.value); setEditMedCustom(''); }} style={{
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                    background: active ? HU.ink : HU.cream,
                    color: active ? '#fff' : HU.ink,
                    border: `1px solid ${active ? HU.ink : HU.line}`,
                    fontFamily: HU.sans, fontSize: 14, fontWeight: active ? 600 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    {m.label}
                    {active && <Icon name="check" size={16} color="#fff" />}
                  </div>
                );
              })}
            </div>

            {editMed !== 'none' && (
              <>
                <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Dosis actual</div>
                {(DOSE_OPTIONS[editMed] || []).length > 0 ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {(DOSE_OPTIONS[editMed] || []).map(d => (
                      <div key={d} onClick={() => setEditDose(d)} style={{
                        padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                        background: editDose === d ? HU.ink : HU.cream,
                        color: editDose === d ? '#fff' : HU.ink,
                        border: `1px solid ${editDose === d ? HU.ink : HU.line}`,
                        fontFamily: HU.mono, fontSize: 13, fontWeight: 600,
                      }}>{d}</div>
                    ))}
                  </div>
                ) : (
                  <input placeholder="Ej: 0.5 mg" value={editDose} onChange={e => setEditDose(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 16 }} />
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="md" onClick={() => setEditing(null)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn variant="primary" size="md" icon="check" loading={saving} onClick={saveField} style={{ flex: 1 }}>Guardar</Btn>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Btn variant="ghost" size="md" onClick={logout} style={{ width: '100%', color: HU.coral }}>Cerrar sesión</Btn>
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}
