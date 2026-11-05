// components/profile/HiddenFileInput.tsx — an invisible image <input>; `open()` from the parent's ref shows the picker.
import type { Ref } from 'react';
import { ACCEPTED_TYPES } from './profileImages';

export function HiddenFileInput({ inputRef, onPick }: { inputRef: Ref<HTMLInputElement>; onPick: (file: File | undefined) => void }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_TYPES.join(',')}
      className="hidden"
      onChange={(e) => {
        onPick(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );
}
