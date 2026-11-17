// Industry collaboration form rules (US-7): who sees the type, required fields, defaults, payload.
import { describe, expect, it } from 'vitest';
import { canSubmitIndustry, emptyForm, formTypesFor, toPayload, validateForm, type FormValues } from '@/lib/requests';

const industry: FormValues = {
  ...emptyForm,
  type: 'industry_collaboration',
  title: 'Joint sensor study',
  description: 'Test sensors for ACME',
  partnerCompany: 'ACME Co',
  contactName: 'Mr Smith',
  contactEmail: 'smith@acme.com',
};

describe('industry collaboration form', () => {
  it('only lecturers and lab managers can pick the type', () => {
    expect(canSubmitIndustry('lecturer')).toBe(true);
    expect(canSubmitIndustry('lab_manager')).toBe(true);
    expect(canSubmitIndustry('ta')).toBe(false);
    expect(canSubmitIndustry('member')).toBe(false);
    expect(formTypesFor('lecturer').map((t) => t.value)).toContain('industry_collaboration');
    expect(formTypesFor('member').map((t) => t.value)).not.toContain('industry_collaboration');
    expect(formTypesFor(undefined).map((t) => t.value)).not.toContain('industry_collaboration');
  });

  it('confidentiality defaults to restricted (SRS-15)', () => {
    expect(emptyForm.confidentiality).toBe('restricted');
    expect(toPayload(industry)).toMatchObject({ confidentiality: 'restricted' });
  });

  it('a complete form has no errors', () => {
    expect(validateForm(industry)).toEqual({});
  });

  it('partner company and external contact are required (US-7)', () => {
    const e = validateForm({ ...industry, partnerCompany: ' ', contactName: '', contactEmail: '' });
    expect(Object.keys(e).sort()).toEqual(['contactEmail', 'contactName', 'partnerCompany']);
  });

  it('rejects an invalid email', () => {
    expect(validateForm({ ...industry, contactEmail: 'nope' }).contactEmail).toMatch(/valid email/);
  });

  it('phone is optional and the payload trims and drops empty fields', () => {
    const body = toPayload({ ...industry, partnerCompany: '  ACME Co ', contactPhone: '  ' });
    expect(body).toMatchObject({ partnerCompany: 'ACME Co', contactPhone: undefined });
  });

  it('other types do not send or require industry fields', () => {
    const ticket = { ...emptyForm, title: 'Fix script', description: 'Backup fails' };
    expect(validateForm(ticket)).toEqual({});
    expect(toPayload(ticket)).not.toHaveProperty('partnerCompany');
  });
});