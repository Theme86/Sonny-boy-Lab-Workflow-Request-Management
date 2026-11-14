// components/equipment/EquipmentPhotoPicker.tsx — the photo part of the pop-up: preview, buttons, hidden file input.
import { useRef } from 'react';
import { EquipmentPhoto } from '@/components/EquipmentPhoto';
import type { EquipmentPhotoState } from '@/hooks/equipment/useEquipmentPhoto';
import type { Equipment } from '@/lib/equipment';
import { ACCEPTED_TYPES } from '@/lib/equipmentPhoto';
import { EquipmentPhotoActions } from './EquipmentPhotoActions';

type Props = { photo: EquipmentPhotoState; item: Equipment | null; name: string };

export function EquipmentPhotoPicker({ photo, item, name }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <EquipmentPhoto src={photo.remove ? null : item?.imageUrl} previewSrc={photo.preview} name={name} size="lg" />
      <EquipmentPhotoActions photo={photo} item={item} onChoose={() => input.current?.click()} />
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          photo.pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}