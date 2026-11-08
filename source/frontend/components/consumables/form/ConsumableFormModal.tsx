// components/consumables/form/ConsumableFormModal.tsx — the add / edit pop-up.
import { unitLabel, unitsWith, type Consumable } from '@/lib/consumables';
import { Field, QuantityInput, Section } from './FormFields';
import { Icon } from '../ui/icons';
import { Modal } from '../ui/Modal';
import { PhotoField } from './PhotoField';
import { btn, inputClass } from '../ui/styles';
import { useConsumableForm, type SaveHandler } from './useConsumableForm';

type Props = { initial?: Consumable; onClose: () => void; onSave: SaveHandler };

export function ConsumableFormModal({ initial, onClose, onSave }: Props) {
  const { form, errors, set, photo, saving, saveError, submit } = useConsumableForm(initial, onSave);
  const isEdit = Boolean(initial);
  // keeps a legacy unit (e.g. "bottle") selectable so editing doesn't silently drop it
  const unitOptions = unitsWith(initial ? [initial.unit] : []);

  return (
    <Modal
      size="lg"
      title={isEdit ? 'Edit consumable' : 'Add consumable'}
      description={isEdit ? `Update details for ${initial!.name}.` : 'Add a new chemical or supply to the inventory.'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="consumable-form" className={btn.primary} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add consumable'}
          </button>
        </>
      }
    >
      <form id="consumable-form" onSubmit={submit} noValidate className="space-y-7">
        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
          <PhotoField
            photo={photo}
            imageUrl={form.imageUrl}
            urlError={errors.imageUrl}
            alt={form.name || 'Preview'}
            isEdit={isEdit}
            onUrlChange={(url) => set('imageUrl', url)}
          />
          <div className="space-y-4">
            <Field label="Name" required error={errors.name}>
              <input
                autoFocus
                value={form.name}
                maxLength={150}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Hydrochloric Acid"
                className={inputClass(Boolean(errors.name))}
              />
            </Field>
            <Field label="Description" hint={`${form.description.length}/250`} error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                maxLength={250}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Grade, concentration, supplier notes…"
                className={`${inputClass(Boolean(errors.description))} resize-none`}
              />
            </Field>
          </div>
        </div>

        <Section title="Stock">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Unit" required error={errors.unit}>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputClass(Boolean(errors.unit))}>
                <option value="">Select unit…</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {unitLabel(u)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Current stock" required error={errors.currentStock}>
              <QuantityInput value={form.currentStock} unit={form.unit} invalid={Boolean(errors.currentStock)} onChange={(v) => set('currentStock', v)} />
            </Field>
            <Field label="Reorder threshold" required error={errors.reorderThreshold} help="Flag as low stock at or below this.">
              <QuantityInput
                value={form.reorderThreshold}
                unit={form.unit}
                invalid={Boolean(errors.reorderThreshold)}
                onChange={(v) => set('reorderThreshold', v)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Chemical details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="pH value" error={errors.phValue} help="Optional · 0.00 – 14.00">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={14}
                step="0.01"
                value={form.phValue}
                onChange={(e) => set('phValue', e.target.value)}
                placeholder="e.g. 7.00"
                className={inputClass(Boolean(errors.phValue))}
              />
            </Field>
            <Field label="Expiry date" help="Leave empty if it does not expire.">
              <input type="date" value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} className={inputClass()} />
            </Field>
          </div>
        </Section>
      </form>
    </Modal>
  );
}
