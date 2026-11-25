'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { HU } from '@/lib/design';
import { Icon, Btn, Chip, TabBar } from '@/components/ui';
import { kgToLbs, lbsToKg } from '@/lib/nutrition';
import type { Profile, WeightLog, DoseLog, DosingOrder } from '@/lib/types';
import { localDateStr, parseLocalDate } from '@/lib/dates';
import { getWeekNumber, calcDoseForWeek, calcMgForUnits, isPen, penDoseMg } from '@/lib/dosing';
import { PenVisual } from '@/components/PenVisual';
import { DoseStatus } from '@/components/DoseStatus';
import { WeightChart } from '@/components/WeightChart';

const SIDE_EFFECTS = [
  'Náusea', 'Saciedad temprana', 'Fatiga', 'Reflujo',
  'Estreñimiento', 'Diarrea', 'Dolor de cabeza', 'Mareo',
];

type Tab = 'registro' | 'historial' | 'orden';

// ── Syringe SVG (for injection form only) ──
function SyringeVisual({ units, maxUnits = 100 }: { units: number; maxUnits?: number }) {
  const fillW = 260 * Math.min(units / maxUnits, 1);
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    ticks.push({ x: 30 + (i / 10) * 260, label: Math.round(maxUnits - (i / 10) * maxUnits) });
  }
  return (
    <svg viewBox="0 0 360 70" style={{ width: '100%', height: 70 }}>
      <rect x="28" y="18" width="264" height="34" rx="4" fill="#f0f0e8" stroke="#bbb" strokeWidth="1" />
      <rect x={292 - fillW} y="20" width={fillW} height="30" rx="3" fill="#d4e8c0" opacity="0.8" />
      <line x1={292 - fillW} y1="14" x2={292 - fillW} y2="56" stroke={HU.coral} strokeWidth="2.5" />
      <circle cx={292 - fillW} cy="12" r="4" fill={HU.coral} />
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={t.x} y1="52" x2={t.x} y2={i % 2 === 0 ? "58" : "55"} stroke="#999" strokeWidth="0.8" />
          {i % 2 === 0 && <text x={t.x} y="67" textAnchor="middle" fontSize="8" fill="#888" fontFamily="monospace">{t.label}</text>}
        </g>
      ))}
      <line x1="292" y1="35" x2="345" y2="35" stroke="#999" strokeWidth="1.5" />
      <polygon points="345,32 355,35 345,38" fill="#bbb" />
      <rect x="4" y="28" width="26" height="14" rx="2" fill="#ddd" stroke="#bbb" strokeWidth="0.8" />
      <text x={292 - fillW} y="8" textAnchor="middle" fontSize="11" fill={HU.coral} fontWeight="700" fontFamily="monospace">{units}u</text>
    </svg>
  );
}

export default function TrackPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [currentOrder, setCurrentOrder] = useState<DosingOrder | null>(null);
  const [allOrders, setAllOrders] = useState<DosingOrder[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('registro');

  const [injUnits, setInjUnits] = useState(0);
  const [injWeightLbs, setInjWeightLbs] = useState('');
  const [injEffects, setInjEffects] = useState<string[]>([]);
  const [injNotes, setInjNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUnits, setEditUnits] = useState(0);
  const [editWeight, setEditWeight] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [orderNum, setOrderNum] = useState('');
  const [orderMed, setOrderMed] = useState('Compounded Tirzepatide');
  const [orderStartUnits, setOrderStartUnits] = useState('');
  const [orderStartMg, setOrderStartMg] = useState('');
  const [orderIncUnits, setOrderIncUnits] = useState('');
  const [orderIncMg, setOrderIncMg] = useState('');
  const [orderMaxUnits, setOrderMaxUnits] = useState('');
  const [orderMaxMg, setOrderMaxMg] = useState('');
  const [orderMaxWeeks, setOrderMaxWeeks] = useState('8');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderVialUnits, setOrderVialUnits] = useState('');
  const [orderDevice, setOrderDevice] = useState<'syringe' | 'pen'>('syringe');
  const [orderPens, setOrderPens] = useState('4');
  const [editingVial, setEditingVial] = useState(false);
  const [vialInput, setVialInput] = useState('');

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);
    // Todo el historial de peso (para el rango "Todo" del gráfico)
    const { data: wl } = await supabase.from('weight_logs').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).order('created_at', { ascending: false }).limit(1000);
    setLogs(wl || []);
    // Suficientes dosis para sumar todo lo usado de un vial
    const { data: dl } = await supabase.from('dose_logs').select('*').eq('user_id', user.id).order('taken_at', { ascending: false }).limit(200);
    setDoseLogs(dl || []);
    const { data: orders } = await supabase.from('dosing_orders').select('*').eq('user_id', user.id).order('ordered_at', { ascending: false });
    setAllOrders(orders || []);
    const cur = (orders || []).find(o => o.is_current);
    setCurrentOrder(cur || null);
    if (cur) setInjUnits(calcDoseForWeek(cur, getWeekNumber(cur)));
  }

  async function saveVialUnits() {
    if (!currentOrder) return;
    const v = parseInt(vialInput);
    if (!v || v <= 0) { showError(isPen(currentOrder) ? 'Ingresa cuántas plumas trae la caja.' : 'Ingresa las unidades totales del vial.'); return; }
    const { error } = await supabase.from('dosing_orders').update({ vial_units: v }).eq('id', currentOrder.id);
    if (error) { showError(`No se pudo guardar el vial: ${error.message}`); return; }
    setEditingVial(false); setVialInput(''); loadData();
  }

  // mg de una dosis ya registrada: usa la orden con la que se registró, o su propia relación mg/unidad
  function orderForDose(dose: DoseLog): DosingOrder | null {
    return allOrders.find(o => o.id === dose.order_id) || (dose.order_id ? null : currentOrder);
  }
  // Dosis registrada con pluma: no tiene unidades, la dosis es fija en mg
  // (sólo por su order_id exacto, para no tratar dosis viejas de jeringa como pluma)
  const isPenDose = (dose: DoseLog) => isPen(allOrders.find(o => o.id === dose.order_id));

  function calcMgForDose(dose: DoseLog, units: number): number {
    const order = orderForDose(dose);
    if (order && isPen(order)) return dose.dose_mg || penDoseMg(order);
    if (order) return calcMgForUnits(order, units);
    if (dose.dose_units && dose.dose_mg) return Math.round(units * (dose.dose_mg / dose.dose_units) * 100) / 100;
    return dose.dose_mg;
  }

  function showError(msg: string) {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 6000);
  }

  async function saveInjection() {
    if (!profile || !currentOrder) return;
    setSaving(true);
    setErrorMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); showError('Tu sesión expiró. Vuelve a iniciar sesión.'); return; }
    const pen = isPen(currentOrder);
    const mg = pen ? penDoseMg(currentOrder) : calcMgForUnits(currentOrder, injUnits);
    const weekNum = getWeekNumber(currentOrder);
    const today = localDateStr();
    const { error: doseErr } = await supabase.from('dose_logs').insert({
      user_id: user.id, dose_mg: mg, dose_units: pen ? null : injUnits,
      med_name: currentOrder.medication, order_id: currentOrder.id,
      week_number: weekNum, scheduled_for: today,
      notes: [injEffects.length > 0 ? `Efectos: ${injEffects.join(', ')}` : '', injNotes].filter(Boolean).join(' | ') || null,
    });
    if (doseErr) {
      setSaving(false);
      showError(`No se pudo registrar la inyección: ${doseErr.message}`);
      return;
    }
    if (injWeightLbs) {
      const kg = lbsToKg(parseFloat(injWeightLbs));
      const { error: wErr } = await supabase.from('weight_logs').insert({ user_id: user.id, weight: kg, logged_at: today });
      if (!wErr) await supabase.from('profiles').update({ current_weight: kg, updated_at: new Date().toISOString() }).eq('id', user.id);
      else showError(`Inyección guardada, pero no el peso: ${wErr.message}`);
    }
    setInjWeightLbs(''); setInjNotes(''); setInjEffects([]);
    setSaving(false); setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
    loadData();
  }

  async function deleteDoseLog(id: string) {
    // Borrar sólo el weight_log que se muestra junto a esta dosis (el mismo que encuentra el historial)
    const dose = doseLogs.find(d => d.id === id);
    const doseDate = dose ? dose.scheduled_for || dose.taken_at?.split('T')[0] : null;
    const linkedWeight = doseDate ? logs.find(l => l.logged_at === doseDate) : null;
    const { error } = await supabase.from('dose_logs').delete().eq('id', id);
    if (error) {
      showError(`No se pudo eliminar: ${error.message}`);
      setConfirmDeleteId(null);
      return;
    }
    if (linkedWeight) await supabase.from('weight_logs').delete().eq('id', linkedWeight.id);
    setConfirmDeleteId(null); loadData();
  }

  function startEdit(d: DoseLog) {
    setEditingId(d.id); setEditUnits(d.dose_units || 0); setEditNotes(d.notes || '');
    const dDate = d.scheduled_for || d.taken_at?.split('T')[0];
    const mW = logs.find(l => l.logged_at === dDate);
    setEditWeight(mW ? String(kgToLbs(mW.weight)) : '');
  }

  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingEdit(false); showError('Tu sesión expiró. Vuelve a iniciar sesión.'); return; }

    const editingDose = doseLogs.find(d => d.id === editingId);
    const penEdit = editingDose ? isPenDose(editingDose) : false;
    const mg = editingDose ? calcMgForDose(editingDose, editUnits) : 0;
    const { error: editErr } = await supabase.from('dose_logs').update({
      // con pluma sólo se editan peso y notas; la dosis es la de la pluma
      ...(penEdit ? {} : { dose_units: editUnits, dose_mg: mg }),
      notes: editNotes || null,
    }).eq('id', editingId);
    if (editErr) {
      setSavingEdit(false);
      showError(`No se pudo guardar: ${editErr.message}`);
      return;
    }

    // Actualizar peso si fue modificado
    if (editWeight) {
      const kg = lbsToKg(parseFloat(editWeight));
      // Buscar la fecha del dose log para actualizar el weight_log correcto
      const dose = doseLogs.find(d => d.id === editingId);
      if (dose) {
        const doseDate = dose.scheduled_for || dose.taken_at?.split('T')[0];
        if (doseDate) {
          // Intentar actualizar el weight_log existente de ese día
          const { data: existing } = await supabase.from('weight_logs')
            .select('id').eq('user_id', user.id).eq('logged_at', doseDate).limit(1);
          if (existing && existing.length > 0) {
            await supabase.from('weight_logs').update({ weight: kg }).eq('id', existing[0].id);
          } else {
            await supabase.from('weight_logs').insert({ user_id: user.id, weight: kg, logged_at: doseDate });
          }
        }
      }
      // Actualizar peso actual en perfil
      await supabase.from('profiles').update({ current_weight: kg, updated_at: new Date().toISOString() }).eq('id', user.id);
    }

    setEditingId(null); setSavingEdit(false); loadData();
  }

  async function saveNewOrder() {
    if (!profile) return;
    setSavingOrder(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingOrder(false); showError('Tu sesión expiró. Vuelve a iniciar sesión.'); return; }
    const startU = parseInt(orderStartUnits) || 0, startM = parseFloat(orderStartMg) || null;

    if (orderDevice === 'pen') {
      // Pluma de una dosis: dosis fija en mg y cantidad de plumas en la caja
      const pens = parseInt(orderPens) || 0;
      if (!startM) { setSavingOrder(false); showError('Ingresa la dosis de la pluma en mg.'); return; }
      if (!pens) { setSavingOrder(false); showError('Ingresa cuántas plumas trae la caja.'); return; }
      const { error: penErr } = await supabase.from('dosing_orders').insert({
        user_id: user.id, order_number: orderNum || null, medication: orderMed, device: 'pen',
        start_units: 0, start_mg: startM, increment_units: 0, increment_mg: 0,
        max_units: null, max_mg: startM, max_weeks: pens, vial_units: pens,
        instructions: orderInstructions || null, is_current: true, ordered_at: localDateStr(),
      });
      if (penErr) {
        setSavingOrder(false);
        showError(penErr.message.includes('device')
          ? 'Falta correr supabase/005_pen_device.sql en Supabase para guardar plumas.'
          : `No se pudo guardar la orden: ${penErr.message}`);
        return;
      }
      setOrderNum(''); setOrderStartMg(''); setOrderInstructions(''); setOrderPens('4');
      setSavingOrder(false); setActiveTab('registro'); loadData();
      return;
    }

    if (!startU) { setSavingOrder(false); showError('Ingresa la dosis inicial en unidades.'); return; }
    const { error: orderErr } = await supabase.from('dosing_orders').insert({
      user_id: user.id, order_number: orderNum || null, medication: orderMed,
      concentration_mg_per_unit: startU && startM ? startM / startU : null,
      start_units: startU, start_mg: startM,
      increment_units: parseInt(orderIncUnits) || 0, increment_mg: parseFloat(orderIncMg) || 0,
      max_units: parseInt(orderMaxUnits) || null, max_mg: parseFloat(orderMaxMg) || null,
      max_weeks: parseInt(orderMaxWeeks) || 8, instructions: orderInstructions || null, is_current: true,
      ordered_at: localDateStr(),
      // sólo se envía si se llenó, para no fallar si la migración 004 no se ha corrido
      ...(parseInt(orderVialUnits) > 0 ? { vial_units: parseInt(orderVialUnits) } : {}),
    });
    if (orderErr) {
      setSavingOrder(false);
      showError(`No se pudo guardar la orden: ${orderErr.message}`);
      return;
    }
    setOrderNum(''); setOrderStartUnits(''); setOrderStartMg('');
    setOrderIncUnits(''); setOrderIncMg(''); setOrderMaxUnits('');
    setOrderMaxMg(''); setOrderInstructions(''); setOrderVialUnits('');
    setSavingOrder(false); setActiveTab('registro'); loadData();
  }

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: HU.display, fontSize: 20, color: HU.ink }}>Cargando...</div>
    </div>
  );

  const currentLbs = kgToLbs(profile.current_weight || 0);
  const targetLbs = kgToLbs(profile.target_weight || 0);
  const startLbs = logs.length > 0 ? kgToLbs(logs[logs.length - 1].weight) : currentLbs;
  const totalLoss = startLbs - currentLbs;
  const totalLossPct = startLbs > 0 ? Math.round((totalLoss / startLbs) * 1000) / 10 : 0;
  // Avance hacia la meta: de peso inicial a meta
  const goalProgress = startLbs > targetLbs && targetLbs > 0
    ? Math.min(1, Math.max(0, (startLbs - currentLbs) / (startLbs - targetLbs)))
    : 0;
  const remaining = currentLbs - targetLbs;
  const weekNum = currentOrder ? getWeekNumber(currentOrder) : 0;
  const penOrder = isPen(currentOrder);
  const editingDoseLog = editingId ? doseLogs.find(d => d.id === editingId) || null : null;
  const editingIsPen = editingDoseLog ? isPenDose(editingDoseLog) : false;
  const currentDoseUnits = currentOrder ? calcDoseForWeek(currentOrder, weekNum) : 0;
  const currentDoseMg = currentOrder ? calcMgForUnits(currentOrder, currentDoseUnits) : 0;
  const nextWeekUnits = currentOrder ? calcDoseForWeek(currentOrder, weekNum + 1) : 0;
  const nextWeekMg = currentOrder ? calcMgForUnits(currentOrder, nextWeekUnits) : 0;
  const lastDose = doseLogs.length > 0 ? doseLogs[0] : null;
  const lastDoseWeight = lastDose ? (() => { const d = lastDose.scheduled_for || lastDose.taken_at?.split('T')[0]; const m = logs.find(l => l.logged_at === d); return m ? kgToLbs(m.weight) : null; })() : null;

  const inputStyle: React.CSSProperties = {
    height: 48, padding: '0 14px', borderRadius: 14,
    border: `1px solid ${HU.line}`, background: HU.cream,
    fontFamily: HU.sans, fontSize: 15, color: HU.ink, outline: 'none', width: '100%',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.ink,
    marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: .4,
  };

  return (
    <div style={{ minHeight: '100vh', background: HU.cream, paddingBottom: 100 }}>
      <div style={{ padding: '60px 20px 8px' }}>
        <h1 style={{ fontFamily: HU.display, fontSize: 32, fontWeight: 500, color: HU.ink, lineHeight: 1, letterSpacing: -.8, margin: 0 }}>Progreso.</h1>
      </div>

      {/* ── Weight hero with line chart ── */}
      <div style={{ margin: '10px 20px 12px', padding: '18px 14px 8px', borderRadius: 24, background: HU.primary, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 4px', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: HU.mono, fontSize: 10, letterSpacing: 1, opacity: .6, textTransform: 'uppercase' }}>Peso actual</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <div style={{ fontFamily: HU.display, fontSize: 46, fontWeight: 400, letterSpacing: -1.5, lineHeight: 1 }}>{currentLbs}</div>
              <div style={{ fontFamily: HU.sans, fontSize: 14, opacity: .6 }}>lbs</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {totalLoss > 0 && <div style={{ padding: '4px 10px', borderRadius: 100, background: HU.leaf, fontFamily: HU.mono, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>−{totalLoss.toFixed(1)} lbs · −{totalLossPct}%</div>}
            <div style={{ fontFamily: HU.mono, fontSize: 10, opacity: .5 }}>Inicio: {startLbs} · Meta: {targetLbs} lbs</div>
            {remaining > 0 && <div style={{ fontFamily: HU.sans, fontSize: 11, opacity: .5, marginTop: 2 }}>Faltan {remaining.toFixed(1)}</div>}
          </div>
        </div>
        {/* Avance hacia la meta */}
        {goalProgress > 0 && (
          <div style={{ padding: '0 4px', marginBottom: 10 }}>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
              <div style={{ width: `${goalProgress * 100}%`, height: '100%', background: HU.leaf, transition: 'width .4s' }} />
            </div>
            <div style={{ fontFamily: HU.mono, fontSize: 9, opacity: .55, marginTop: 4 }}>{Math.round(goalProgress * 100)}% del camino a tu meta</div>
          </div>
        )}
        <WeightChart logs={logs} targetLbs={targetLbs} />
      </div>

      {/* ── Current order card (no syringe) ── */}
      {currentOrder && (
        <div style={{ margin: '0 20px 12px', padding: 14, borderRadius: 18, background: HU.paper, border: `1px solid ${HU.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: HU.sans, fontSize: 14, fontWeight: 600, color: HU.ink }}>{currentOrder.medication}</div>
              <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute }}>
                Orden {currentOrder.order_number ? `#${currentOrder.order_number}` : ''} · Semana {weekNum}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {penOrder ? (
                <>
                  <div style={{ fontFamily: HU.display, fontSize: 24, fontWeight: 500, color: HU.ink }}>{penDoseMg(currentOrder)} mg</div>
                  <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute }}>Pluma de una dosis</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: HU.display, fontSize: 24, fontWeight: 500, color: HU.ink }}>{currentDoseUnits}u</div>
                  <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute }}>{currentDoseMg} mg</div>
                </>
              )}
            </div>
          </div>
          {penOrder && <div style={{ marginTop: 8 }}><PenVisual mg={penDoseMg(currentOrder)} /></div>}
          {currentOrder.instructions && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: HU.cream, fontFamily: HU.sans, fontSize: 11, color: HU.mute, lineHeight: 1.5 }}>
              {currentOrder.instructions}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <DoseStatus order={currentOrder} doseLogs={doseLogs} medication={currentOrder.medication} />
          </div>
          {/* Tamaño del vial: agregar o corregir */}
          {editingVial ? (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" autoFocus placeholder={penOrder ? 'Plumas en la caja (ej: 4)' : 'Unidades totales (ej: 300)'} value={vialInput} onChange={e => setVialInput(e.target.value)}
                style={{ ...inputStyle, height: 40, fontSize: 14 }} />
              <Btn variant="secondary" size="sm" onClick={() => { setEditingVial(false); setVialInput(''); }}>✕</Btn>
              <Btn variant="leaf" size="sm" icon="check" onClick={saveVialUnits}>OK</Btn>
            </div>
          ) : (
            <button type="button" onClick={() => { setEditingVial(true); setVialInput(currentOrder.vial_units ? String(currentOrder.vial_units) : ''); }}
              style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: HU.sans, fontSize: 12, fontWeight: 600, color: HU.leafDeep }}>
              {penOrder
                ? (currentOrder.vial_units ? 'Editar plumas de la caja' : '+ Agregar cuántas plumas trae la caja')
                : (currentOrder.vial_units ? 'Editar unidades del vial' : '+ Agregar unidades del vial para saber cuántas dosis quedan')}
            </button>
          )}
        </div>
      )}

      {/* ── Tabs (Registro, Historial, + Orden) ── */}
      <div style={{ padding: '4px 20px 12px', display: 'flex', gap: 6 }}>
        {([
          { k: 'registro' as Tab, l: 'Registro' },
          { k: 'historial' as Tab, l: 'Historial' },
          { k: 'orden' as Tab, l: '+ Orden' },
        ]).map(t => (
          <Chip key={t.k} active={activeTab === t.k} onClick={() => setActiveTab(t.k)}>{t.l}</Chip>
        ))}
      </div>

      {errorMsg && (
        <div style={{ margin: '0 20px 12px', padding: '12px 16px', borderRadius: 14, background: `${HU.coral}14`, border: `1px solid ${HU.coral}40`, fontFamily: HU.sans, fontSize: 13, color: HU.coral, fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* ═══════════ REGISTRO ═══════════ */}
      {activeTab === 'registro' && (
        <div style={{ padding: '0 20px' }}>
          {/* Last dose summary */}
          {lastDose && (
            <div style={{ padding: 16, borderRadius: 18, background: `${HU.leaf}10`, border: `1px solid ${HU.leaf}25`, marginBottom: 14 }}>
              <div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.leafDeep, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 8 }}>Último registro</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: HU.display, fontSize: 22, fontWeight: 500, color: HU.ink }}>
                    {isPenDose(lastDose)
                      ? <>{lastDose.dose_mg} mg <span style={{ fontSize: 14, color: HU.mute }}>(pluma)</span></>
                      : <>{lastDose.dose_units || '—'}u <span style={{ fontSize: 14, color: HU.mute }}>({lastDose.dose_mg}mg)</span></>}
                  </div>
                  <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute, marginTop: 2 }}>
                    {new Date(lastDose.taken_at).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}
                    {lastDoseWeight && <span> · <strong style={{ color: HU.ink }}>{lastDoseWeight} lbs</strong></span>}
                  </div>
                  {lastDose.notes && <div style={{ fontFamily: HU.sans, fontSize: 11, color: HU.mute, marginTop: 4, lineHeight: 1.4 }}>{lastDose.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div onClick={() => startEdit(lastDose)} style={{ width: 32, height: 32, borderRadius: 10, background: HU.paper, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="settings" size={14} color={HU.ink} /></div>
                  <div onClick={() => setConfirmDeleteId(lastDose.id)} style={{ width: 32, height: 32, borderRadius: 10, background: `${HU.coral}12`, border: `1px solid ${HU.coral}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="x" size={14} color={HU.coral} /></div>
                </div>
              </div>
              {currentOrder && nextWeekUnits !== currentDoseUnits && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: HU.paper, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="chev" size={14} color={HU.leaf} />
                  <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.ink }}>
                    Siguiente semana: <strong>{nextWeekUnits}u</strong> ({nextWeekMg}mg)
                    {currentOrder.increment_units > 0 && <span style={{ color: HU.mute }}> · +{currentOrder.increment_units}u</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete confirm */}
          {confirmDeleteId && activeTab === 'registro' && (
            <div style={{ padding: 16, borderRadius: 14, background: `${HU.coral}12`, border: `1px solid ${HU.coral}30`, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.inkDeep }}>¿Eliminar este registro?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Btn>
                <Btn variant="primary" size="sm" style={{ background: HU.coral }} onClick={() => deleteDoseLog(confirmDeleteId)}>Eliminar</Btn>
              </div>
            </div>
          )}

          {/* Edit mode */}
          {editingId && (
            <div style={{ padding: 18, borderRadius: 18, background: HU.paper, border: `2px solid ${HU.sun}`, marginBottom: 14 }}>
              <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 14 }}>Editar registro</div>
              {editingIsPen ? (
                <div style={{ marginBottom: 14, fontFamily: HU.sans, fontSize: 13, color: HU.mute }}>
                  Dosis: <strong style={{ color: HU.ink }}>{editingDoseLog?.dose_mg} mg</strong> (pluma de una dosis)
                </div>
              ) : (
              <div style={{ marginBottom: 14 }}><div style={labelStyle}>Dosis (Unidades)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div onClick={() => setEditUnits(Math.max(0, editUnits - 1))} style={{ width: 40, height: 40, borderRadius: 20, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
                  <input type="number" value={editUnits} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setEditUnits(v); }}
                    style={{ width: 70, textAlign: 'center', fontFamily: HU.display, fontSize: 32, fontWeight: 500, color: HU.ink, border: 'none', background: 'transparent', outline: 'none' }} />
                  <div onClick={() => setEditUnits(Math.min(100, editUnits + 1))} style={{ width: 40, height: 40, borderRadius: 20, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
                  <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute }}>units</div>
                </div>
              </div>
              )}
              <div style={{ marginBottom: 14 }}><div style={labelStyle}>Peso (lbs)</div><input type="number" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)} style={inputStyle} /></div>
              <div style={{ marginBottom: 14 }}><div style={labelStyle}>Observaciones</div><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'none' as const }} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" size="md" onClick={() => setEditingId(null)} style={{ flex: 1 }}>Cancelar</Btn>
                <Btn variant="primary" size="md" icon="check" loading={savingEdit} onClick={saveEdit} style={{ flex: 1 }}>Guardar</Btn>
              </div>
            </div>
          )}

          {showSuccess && (
            <div style={{ padding: '12px 16px', borderRadius: 14, background: `${HU.leaf}18`, border: `1px solid ${HU.leaf}40`, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <Icon name="check" size={18} color={HU.leaf} stroke={2.5} />
              <span style={{ fontFamily: HU.sans, fontSize: 13, color: HU.leafDeep, fontWeight: 600 }}>Inyección registrada</span>
            </div>
          )}

          {/* New injection form */}
          {!currentOrder ? (
            <div style={{ padding: 20, borderRadius: 18, background: HU.paper, border: `1px solid ${HU.line}`, textAlign: 'center' }}>
              <Icon name="syringe" size={32} color={HU.dim} />
              <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, marginTop: 10, marginBottom: 14 }}>Registra una orden de producto primero.</div>
              <Btn variant="primary" size="md" onClick={() => setActiveTab('orden')}>+ Nueva orden</Btn>
            </div>
          ) : !editingId && (
            <div style={{ padding: 20, borderRadius: 22, background: HU.paper, border: `1px solid ${HU.line}` }}>
              <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink, marginBottom: 4 }}>Nueva inyección</div>
              <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute, marginBottom: 16 }}>Semana {weekNum} · {currentOrder.medication}</div>

              {penOrder ? (
                // Pluma de una dosis: no hay unidades que elegir, se inyecta la pluma completa
                <div style={{ marginBottom: 16 }}>
                  <div style={labelStyle}>Dosis</div>
                  <PenVisual mg={penDoseMg(currentOrder)} />
                  <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 6, textAlign: 'center' }}>
                    Pluma completa · <strong style={{ color: HU.ink }}>{penDoseMg(currentOrder)} mg</strong>
                  </div>
                </div>
              ) : (
              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Dosis (Unidades)</div>
                <SyringeVisual units={injUnits} maxUnits={100} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <div onClick={() => setInjUnits(Math.max(0, injUnits - 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
                  <input type="number" value={injUnits} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setInjUnits(v); }}
                    style={{ width: 80, textAlign: 'center', fontFamily: HU.display, fontSize: 36, fontWeight: 500, color: HU.ink, border: 'none', background: 'transparent', outline: 'none' }} />
                  <div onClick={() => setInjUnits(Math.min(100, injUnits + 1))} style={{ width: 44, height: 44, borderRadius: 22, background: HU.cream, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
                  <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute }}>units</div>
                </div>
                <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute, marginTop: 4, textAlign: 'center' }}>
                  = {calcMgForUnits(currentOrder, injUnits)} mg
                  {currentOrder.increment_units > 0 && <span> · Recomendado: <strong style={{ color: HU.ink }}>{currentDoseUnits}u</strong></span>}
                </div>
              </div>
              )}

              <div style={{ marginBottom: 16 }}><div style={labelStyle}>Peso de hoy</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" step="0.1" placeholder={`${currentLbs}`} value={injWeightLbs} onChange={e => setInjWeightLbs(e.target.value)} style={inputStyle} />
                  <span style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, flexShrink: 0 }}>lbs</span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}><div style={labelStyle}>Efectos secundarios</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SIDE_EFFECTS.map(e => {
                    const on = injEffects.includes(e);
                    return (
                      <div key={e} onClick={() => setInjEffects(p => on ? p.filter(x => x !== e) : [...p, e])} style={{
                        padding: '7px 12px', borderRadius: 10, cursor: 'pointer',
                        background: on ? `${HU.coral}18` : HU.cream, color: on ? HU.coral : HU.ink,
                        border: `1px solid ${on ? HU.coral : HU.line}`,
                        fontFamily: HU.sans, fontSize: 12, fontWeight: on ? 600 : 400,
                      }}>{on && '✓ '}{e}</div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}><div style={labelStyle}>Observaciones</div>
                <textarea placeholder="¿Cómo te sentiste?" value={injNotes} onChange={e => setInjNotes(e.target.value)} rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'none' as const }} />
              </div>

              <Btn variant="primary" size="lg" icon="syringe" loading={saving} onClick={saveInjection} style={{ width: '100%' }}>Registrar inyección</Btn>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ HISTORIAL ═══════════ */}
      {activeTab === 'historial' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 12 }}>Historial de inyecciones</div>
          {doseLogs.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', background: HU.paper, borderRadius: 18, border: `1px solid ${HU.lineSoft}` }}>
              <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute }}>No hay inyecciones registradas.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {doseLogs.map((d, i) => {
                const dDate = d.scheduled_for || d.taken_at?.split('T')[0];
                const mW = logs.find(l => l.logged_at === dDate);
                const wLbs = mW ? kgToLbs(mW.weight) : null;

                // Determine weight change vs previous injection
                const prevDose = doseLogs[i + 1];
                let weightChange = 0;
                let prevWLbs: number | null = null;
                if (prevDose && wLbs) {
                  const prevDate = prevDose.scheduled_for || prevDose.taken_at?.split('T')[0];
                  const prevLog = logs.find(l => l.logged_at === prevDate);
                  if (prevLog) {
                    prevWLbs = kgToLbs(prevLog.weight);
                    weightChange = wLbs - prevWLbs;
                  }
                }
                // Color: green=lost, red=gained, yellow=same (within 0.3 lbs)
                const wColor = Math.abs(weightChange) < 0.3 ? HU.sun : weightChange < 0 ? HU.leaf : HU.coral;
                const wBg = Math.abs(weightChange) < 0.3 ? HU.sun : weightChange < 0 ? HU.leaf : HU.coral;

                return (
                  <div key={d.id || i} style={{ padding: 14, borderRadius: 16, background: HU.paper, border: `1px solid ${HU.lineSoft}` }}>
                    {/* Top row: dose + date + actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: wLbs ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: HU.leaf, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="syringe" size={18} color="#fff" />
                        </div>
                        <div>
                          <div style={{ fontFamily: HU.mono, fontSize: 15, fontWeight: 700, color: HU.ink }}>{isPenDose(d) ? `Pluma · ${d.dose_mg}mg` : `${d.dose_units || '—'}u · ${d.dose_mg}mg`}</div>
                          <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute }}>
                            {new Date(d.taken_at).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {d.week_number ? ` · Sem ${d.week_number}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div onClick={() => startEdit(d)} style={{ width: 28, height: 28, borderRadius: 8, background: HU.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="settings" size={12} color={HU.ink} />
                        </div>
                        <div onClick={() => setConfirmDeleteId(d.id)} style={{ width: 28, height: 28, borderRadius: 8, background: `${HU.coral}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Icon name="x" size={12} color={HU.coral} />
                        </div>
                      </div>
                    </div>

                    {/* Weight badge — big, solid color */}
                    {wLbs && (
                      <div style={{
                        display: 'flex', gap: 10, alignItems: 'stretch',
                      }}>
                        <div style={{
                          flex: 1, padding: '12px 14px', borderRadius: 14,
                          background: wBg, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div>
                            <div style={{ fontFamily: HU.display, fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{wLbs}</div>
                            <div style={{ fontFamily: HU.sans, fontSize: 11, opacity: .85, marginTop: 2 }}>lbs</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {weightChange !== 0 && (
                              <div style={{ fontFamily: HU.mono, fontSize: 18, fontWeight: 700 }}>
                                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                              </div>
                            )}
                            <div style={{ fontFamily: HU.sans, fontSize: 10, opacity: .8 }}>
                              {Math.abs(weightChange) < 0.3 ? 'Sin cambio' : weightChange < 0 ? 'Bajaste' : 'Subiste'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {d.notes && editingId !== d.id && (
                      <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: HU.cream, fontFamily: HU.sans, fontSize: 12, color: HU.mute, lineHeight: 1.4 }}>{d.notes}</div>
                    )}

                    {/* Inline edit form */}
                    {editingId === d.id && (
                      <div style={{ marginTop: 10, padding: 14, borderRadius: 14, background: HU.cream, border: `2px solid ${HU.sun}` }}>
                        <div style={{ fontFamily: HU.sans, fontSize: 13, fontWeight: 600, color: HU.ink, marginBottom: 10 }}>Editar registro</div>
                        {isPenDose(d) ? (
                          <div style={{ marginBottom: 10, fontFamily: HU.sans, fontSize: 13, color: HU.mute }}>
                            Dosis: <strong style={{ color: HU.ink }}>{d.dose_mg} mg</strong> (pluma de una dosis)
                          </div>
                        ) : (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: HU.sans, fontSize: 11, fontWeight: 600, color: HU.ink, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>Dosis (Unidades)</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div onClick={() => setEditUnits(Math.max(0, editUnits - 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.paper, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>−</div>
                            <input type="number" value={editUnits} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setEditUnits(v); }}
                              style={{ width: 60, textAlign: 'center', fontFamily: HU.display, fontSize: 28, fontWeight: 500, color: HU.ink, border: 'none', background: 'transparent', outline: 'none' }} />
                            <div onClick={() => setEditUnits(Math.min(100, editUnits + 1))} style={{ width: 36, height: 36, borderRadius: 18, background: HU.paper, border: `1px solid ${HU.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600, color: HU.ink, userSelect: 'none' }}>+</div>
                            <div style={{ fontFamily: HU.sans, fontSize: 12, color: HU.mute }}>units</div>
                          </div>
<div style={{ fontFamily: HU.mono, fontSize: 10, color: HU.mute, marginTop: 2, textAlign: 'center' }}>= {calcMgForDose(d, editUnits)} mg</div>
                        </div>
                        )}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontFamily: HU.sans, fontSize: 11, fontWeight: 600, color: HU.ink, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>Peso (lbs)</div>
                          <input type="number" step="0.1" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="Peso en lbs"
                            style={{ height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${HU.line}`, background: HU.paper, fontFamily: HU.sans, fontSize: 14, color: HU.ink, outline: 'none', width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontFamily: HU.sans, fontSize: 11, fontWeight: 600, color: HU.ink, marginBottom: 4, textTransform: 'uppercase', letterSpacing: .4 }}>Observaciones</div>
                          <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                            style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${HU.line}`, background: HU.paper, fontFamily: HU.sans, fontSize: 14, color: HU.ink, outline: 'none', width: '100%', resize: 'none' as const }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn variant="secondary" size="sm" onClick={() => setEditingId(null)} style={{ flex: 1 }}>Cancelar</Btn>
                          <Btn variant="leaf" size="sm" icon="check" loading={savingEdit} onClick={saveEdit} style={{ flex: 1 }}>Guardar</Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDeleteId && activeTab === 'historial' && (
            <div style={{ position: 'fixed', bottom: 100, left: 20, right: 20, padding: 16, borderRadius: 14, background: HU.paper, border: `2px solid ${HU.coral}`, boxShadow: '0 -4px 20px rgba(0,0,0,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50 }}>
              <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.inkDeep }}>¿Eliminar este registro?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Btn>
                <Btn variant="primary" size="sm" style={{ background: HU.coral }} onClick={() => deleteDoseLog(confirmDeleteId)}>Eliminar</Btn>
              </div>
            </div>
          )}

          {/* Dose escalation */}
          {doseLogs.length >= 2 && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 18, background: `${HU.sun}15`, border: `1px solid ${HU.sun}30` }}>
              <div style={{ fontFamily: HU.sans, fontSize: 12, fontWeight: 700, color: HU.inkDeep, marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Escalado de dosis</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {Array.from(new Set(doseLogs.slice().reverse().map(d => d.dose_units ? `${d.dose_units}u` : `${d.dose_mg}mg`))).map((d, i, arr) => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: i === arr.length - 1 ? HU.primary : HU.paper, color: i === arr.length - 1 ? '#fff' : HU.ink, fontFamily: HU.mono, fontSize: 12, fontWeight: 600, border: `1px solid ${i === arr.length - 1 ? HU.primary : HU.line}` }}>{d}</div>
                    {i < arr.length - 1 && <Icon name="chev" size={12} color={HU.dim} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ + ORDEN ═══════════ */}
      {activeTab === 'orden' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ padding: 20, borderRadius: 22, background: HU.paper, border: `1px solid ${HU.line}` }}>
            <div style={{ fontFamily: HU.display, fontSize: 20, fontWeight: 500, color: HU.ink, marginBottom: 16 }}>Nueva orden de producto</div>
            <div style={{ marginBottom: 14 }}><div style={labelStyle}>Número de orden</div><input placeholder="Ej: 4566671" value={orderNum} onChange={e => setOrderNum(e.target.value)} style={inputStyle} /></div>
            <div style={{ marginBottom: 14 }}><div style={labelStyle}>Medicamento</div><input placeholder={orderDevice === 'pen' ? 'Zepbound' : 'Compounded Tirzepatide'} value={orderMed} onChange={e => setOrderMed(e.target.value)} style={inputStyle} /></div>

            {/* Tipo de dispositivo */}
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>¿Cómo se inyecta?</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {([
                  { k: 'syringe' as const, t: 'Vial + jeringa', s: 'Dosis en unidades' },
                  { k: 'pen' as const, t: 'Pluma de una dosis', s: 'Autoinyector, dosis fija' },
                ]).map(o => {
                  const on = orderDevice === o.k;
                  return (
                    <button key={o.k} type="button" onClick={() => {
                      setOrderDevice(o.k);
                      if (o.k === 'pen' && orderMed === 'Compounded Tirzepatide') setOrderMed('Zepbound');
                      if (o.k === 'syringe' && orderMed === 'Zepbound') setOrderMed('Compounded Tirzepatide');
                    }} style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                      background: on ? HU.primaryContainer : HU.paper, border: `1px solid ${on ? HU.primary : HU.line}`,
                    }}>
                      <div style={{ fontFamily: HU.sans, fontSize: 14, fontWeight: 600, color: on ? HU.onPrimaryContainer : HU.ink }}>{o.t}</div>
                      <div style={{ fontFamily: HU.sans, fontSize: 11, color: HU.mute, marginTop: 2 }}>{o.s}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {orderDevice === 'pen' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><div style={labelStyle}>Dosis por pluma (mg)</div><input type="number" step="0.5" placeholder="2.5" value={orderStartMg} onChange={e => setOrderStartMg(e.target.value)} style={inputStyle} /></div>
                  <div><div style={labelStyle}>Plumas en la caja</div><input type="number" placeholder="4" value={orderPens} onChange={e => setOrderPens(e.target.value)} style={inputStyle} /></div>
                </div>
                {parseFloat(orderStartMg) > 0 && <div style={{ marginBottom: 14 }}><PenVisual mg={parseFloat(orderStartMg)} /></div>}
              </>
            ) : (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><div style={labelStyle}>Dosis inicial (units)</div><input type="number" placeholder="82" value={orderStartUnits} onChange={e => setOrderStartUnits(e.target.value)} style={inputStyle} /></div>
              <div><div style={labelStyle}>Dosis inicial (mg)</div><input type="number" step="0.01" placeholder="14.47" value={orderStartMg} onChange={e => setOrderStartMg(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><div style={labelStyle}>Incremento/sem (units)</div><input type="number" placeholder="3" value={orderIncUnits} onChange={e => setOrderIncUnits(e.target.value)} style={inputStyle} /></div>
              <div><div style={labelStyle}>Incremento/sem (mg)</div><input type="number" step="0.01" placeholder="0.53" value={orderIncMg} onChange={e => setOrderIncMg(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><div style={labelStyle}>Máximo (units)</div><input type="number" placeholder="85" value={orderMaxUnits} onChange={e => setOrderMaxUnits(e.target.value)} style={inputStyle} /></div>
              <div><div style={labelStyle}>Máximo (mg)</div><input type="number" step="0.01" placeholder="15" value={orderMaxMg} onChange={e => setOrderMaxMg(e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div><div style={labelStyle}>Semanas máximas</div><input type="number" placeholder="8" value={orderMaxWeeks} onChange={e => setOrderMaxWeeks(e.target.value)} style={inputStyle} /></div>
              <div><div style={labelStyle}>Unidades del vial</div><input type="number" placeholder="300" value={orderVialUnits} onChange={e => setOrderVialUnits(e.target.value)} style={inputStyle} /></div>
            </div>
            </>
            )}
            <div style={{ marginBottom: 18 }}><div style={labelStyle}>Instrucciones completas</div>
              <textarea placeholder={orderDevice === 'pen' ? 'Inject 1 pen subcutaneously once a week...' : 'Inject 82 Units (14.47mg) subcutaneously once a week...'} value={orderInstructions} onChange={e => setOrderInstructions(e.target.value)} rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'none' as const }} />
            </div>
            <Btn variant="primary" size="lg" icon="plus" loading={savingOrder} onClick={saveNewOrder} style={{ width: '100%' }}>Guardar orden</Btn>
          </div>
          {allOrders.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: HU.display, fontSize: 18, fontWeight: 500, color: HU.ink, marginBottom: 10 }}>Órdenes</div>
              {allOrders.map(o => (
                <div key={o.id} style={{ padding: 14, borderRadius: 14, background: HU.paper, border: `1px solid ${o.is_current ? HU.leaf : HU.lineSoft}`, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: HU.sans, fontSize: 14, fontWeight: 600, color: HU.ink }}>{o.order_number ? `#${o.order_number}` : o.medication}</div>
                      <div style={{ fontFamily: HU.mono, fontSize: 11, color: HU.mute }}>{isPen(o) ? `Pluma ${o.start_mg} mg${o.vial_units ? ` × ${o.vial_units}` : ''}` : `${o.start_units}u (${o.start_mg}mg) → máx ${o.max_units}u`} · {parseLocalDate(o.ordered_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                    {o.is_current && <div style={{ padding: '3px 8px', borderRadius: 6, background: `${HU.leaf}22`, fontFamily: HU.mono, fontSize: 10, color: HU.leafDeep, fontWeight: 700 }}>ACTUAL</div>}
                  </div>
                  {o.instructions && <div style={{ marginTop: 6, fontFamily: HU.sans, fontSize: 11, color: HU.mute, lineHeight: 1.4 }}>{o.instructions}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TabBar active="track" />
    </div>
  );
}
