// app/equipment/page.tsx — the equipment page. The content is in components/equipment/EquipmentList.tsx.
'use client';

import { AppShell } from '@/components/AppShell';
import { EquipmentList } from '@/components/equipment/EquipmentList';

export default function EquipmentPage() {
  return (
    <AppShell>
      <EquipmentList />
    </AppShell>
  );
}