// app/requests/new/IndustryFields.tsx — the extra fields shown when the type is "Industry collaboration" (US-7).
import { CONFIDENTIALITY_HINTS, CONFIDENTIALITY_LABELS, CONFIDENTIALITY_LEVELS, INDUSTRY_LIMITS, type FormErrors, type FormValues } from '@/lib/requests';
import { ui } from '@/lib/ui';
import { Field } from './Field';

type Props = {
  values: FormValues;
  errors: FormErrors;
  set: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
};

const control = (error?: string) => `${ui.input} ${error ? ui.inputError : ''}`;

export function IndustryFields({ values, errors, set }: Props) {
  return (
    <>
      <Field label="Partner company" htmlFor="partnerCompany" error={errors.partnerCompany}>
        <input
          id="partnerCompany"
          className={control(errors.partnerCompany)}
          value={values.partnerCompany}
          maxLength={INDUSTRY_LIMITS.partnerMax}
          aria-invalid={!!errors.partnerCompany}
          aria-describedby={errors.partnerCompany ? 'partnerCompany-error' : undefined}
          onChange={(e) => set('partnerCompany', e.target.value)}
        />
      </Field>
      <Field label="External contact name" htmlFor="contactName" error={errors.contactName}>
        <input
          id="contactName"
          className={control(errors.contactName)}
          value={values.contactName}
          maxLength={INDUSTRY_LIMITS.contactNameMax}
          aria-invalid={!!errors.contactName}
          aria-describedby={errors.contactName ? 'contactName-error' : undefined}
          onChange={(e) => set('contactName', e.target.value)}
        />
      </Field>
      <Field label="External contact email" htmlFor="contactEmail" error={errors.contactEmail}>
        <input
          id="contactEmail"
          type="email"
          className={control(errors.contactEmail)}
          value={values.contactEmail}
          maxLength={INDUSTRY_LIMITS.contactEmailMax}
          aria-invalid={!!errors.contactEmail}
          aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
          onChange={(e) => set('contactEmail', e.target.value)}
        />
      </Field>
      <Field label="External contact phone (optional)" htmlFor="contactPhone" error={errors.contactPhone}>
        <input
          id="contactPhone"
          className={control(errors.contactPhone)}
          value={values.contactPhone}
          maxLength={INDUSTRY_LIMITS.contactPhoneMax}
          onChange={(e) => set('contactPhone', e.target.value)}
        />
      </Field>
      <Field
        label="Confidentiality"
        htmlFor="confidentiality"
        error={errors.confidentiality}
        hint={CONFIDENTIALITY_HINTS[values.confidentiality]}
      >
        <select
          id="confidentiality"
          className={`${ui.select} w-full`}
          value={values.confidentiality}
          onChange={(e) => set('confidentiality', e.target.value)}
        >
          {CONFIDENTIALITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {CONFIDENTIALITY_LABELS[level]}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}