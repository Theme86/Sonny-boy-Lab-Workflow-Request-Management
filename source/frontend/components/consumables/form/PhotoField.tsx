// components/consumables/form/PhotoField.tsx — the image column of the form: preview, upload / remove buttons, and an image URL box.
import { useRef } from 'react';
import { ACCEPTED_IMAGE_TYPES, PHOTO_MAX_MB } from '@/lib/consumableForm';
import { ui } from '@/lib/ui';
import { Icon } from '../ui/icons';
import { btn, inputClass, labelCls } from '../ui/styles';
import { Thumb } from '../ui/Thumb';
import type { PhotoChoice } from './usePhotoChoice';

type Props = {
  photo: PhotoChoice;
  imageUrl: string;
  urlError?: string;
  alt: string;
  isEdit: boolean;
  onUrlChange: (url: string) => void;
};

function PhotoButtons({ photo, isEdit, onPick }: { photo: PhotoChoice; isEdit: boolean; onPick: () => void }) {
  let second = null;
  if (photo.file) {
    second = (
      <button type="button" className={btn.text} onClick={photo.keepSaved}>
        {isEdit && photo.hasSaved ? 'Keep current image' : 'Remove'}
      </button>
    );
  } else if (photo.hasSaved) {
    second = (
      <button type="button" className={btn.dangerText} onClick={photo.removeSaved}>
        Remove image
      </button>
    );
  } else if (photo.remove) {
    second = (
      <button type="button" className={btn.text} onClick={photo.keepSaved}>
        Keep current image
      </button>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" className={btn.secondary} onClick={onPick}>
        {photo.hasAny ? 'Change image' : 'Add image'}
      </button>
      {second}
    </div>
  );
}

export function PhotoField({ photo, imageUrl, urlError, alt, isEdit, onUrlChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={labelCls}>Image</span>
      <div className="mt-1.5">
        <Thumb src={photo.remove ? null : imageUrl.trim() || null} previewSrc={photo.preview} alt={alt} size="lg" />
      </div>
      <PhotoButtons photo={photo} isEdit={isEdit} onPick={() => fileInput.current?.click()} />
      <p className={`mt-1.5 text-xs ${ui.muted}`}>
        {photo.remove ? 'The image will be removed when you save.' : `JPG, PNG or WEBP, up to ${PHOTO_MAX_MB} MB`}
      </p>
      {photo.error && <p className={`mt-1 text-xs ${ui.errorText}`}>{photo.error}</p>}
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          photo.pick(e.target.files?.[0]);
          e.target.value = ''; // lets the same file be picked again after "Remove"
        }}
      />
      <div className="relative mt-3">
        <span className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 ${ui.muted}`}>
          <Icon name="link" className="h-3.5 w-3.5" />
        </span>
        <input
          type="url"
          placeholder="Or paste image URL"
          value={imageUrl}
          onChange={(e) => {
            onUrlChange(e.target.value);
            photo.urlEdited();
          }}
          className={`${inputClass(Boolean(urlError))} !py-1.5 !pl-8 !text-xs`}
        />
      </div>
      {urlError && <p className={`mt-1 text-xs ${ui.errorText}`}>{urlError}</p>}
    </div>
  );
}
