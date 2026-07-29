'use client';

import { HU } from '@/lib/design';
import { Icon, Btn, TabBar } from '@/components/ui';

export default function PlanPage() {
  return (
    <div style={{ minHeight: '100vh', background: HU.cream }}>
      <div style={{ padding: '60px 20px 16px' }}>
        <h1 style={{ fontFamily: HU.display, fontSize: 32, fontWeight: 500, color: HU.ink, lineHeight: 1, letterSpacing: -.8, margin: 0 }}>Tu plan.</h1>
        <div style={{ fontFamily: HU.sans, fontSize: 13, color: HU.mute, marginTop: 6 }}>Plan semanal</div>
      </div>

      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `${HU.leaf}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon name="spark" size={28} color={HU.leaf} stroke={2} />
        </div>
        <div style={{ fontFamily: HU.display, fontSize: 22, fontWeight: 500, color: HU.ink, marginBottom: 8 }}>Plan semanal</div>
        <div style={{ fontFamily: HU.sans, fontSize: 14, color: HU.mute, lineHeight: 1.5, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
          El generador de plan semanal está en desarrollo. Pronto podrás generar tu plan personalizado con IA.
        </div>
        <a href="/recipes">
          <Btn variant="primary" size="md" icon="book">Mientras, explora recetas</Btn>
        </a>
      </div>

      <TabBar active="plan" />
    </div>
  );
}
