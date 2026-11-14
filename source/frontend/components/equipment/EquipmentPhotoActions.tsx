// components/equipment/EquipmentPhotoActions.tsx — the photo buttons, the hint and the error in the pop-up.
import type { EquipmentPhotoState } from '@/hooks/equipment/useEquipmentPhoto';
import { PHOTO_MAX_MB } from '@/lib/equipmentPhoto';
import type { Equipment } from '@/lib/equipment';
import { ui } from '@/lib/ui';

type Props = { photo: EquipmentPhotoState; item: Equipment | null; onChoose: () => void };

export function EquipmentPhotoActions({ photo, item, onChoose }: Props) {
  const hasSavedPhoto = !!item?.imageUrl && !photo.remove;
  const hasAnyPhoto = !!photo.file || hasSavedPhoto;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <button type="button" className={ui.btnOutline} onClick={onChoose}>
          {hasAnyPhoto ? 'Change photo' : 'Add photo'}
        </button>
        {photo.file ? (
          <button type="button" className={ui.btnText} onClick={photo.keepCurrent}>
            {item !== null && item?.imageUrl ? 'Keep current photo' : 'Remove'}
          </button>
        ) : (
          hasSavedPhoto && (
            <button type="button" className={ui.btnDanger} onClick={photo.markRemoved}>
              Remove photo
            </button>
          )
        )}
      </div>
      <p className={`mt-1.5 text-xs ${ui.muted}`}>
        {photo.remove ? 'The photo will be removed when you save.' : `JPG, PNG or WEBP, up to ${PHOTO_MAX_MB} MB`}
      </p>
      {photo.error && <p className={`mt-1 text-xs ${ui.errorText}`}>{photo.error}</p>}
    </div>
  );
}