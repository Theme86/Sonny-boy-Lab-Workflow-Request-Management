import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { LabInfoFooter } from '@/components/LabInfoFooter';

const none = { hours: null, contactEmail: null, rulesUrl: null };

describe('LabInfoFooter', () => {
  test('renders nothing when the lab has not configured anything', () => {
    const { container } = render(<LabInfoFooter info={none} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows only the items that are set', () => {
    render(<LabInfoFooter info={{ ...none, hours: 'Mon–Fri 09:00–17:00' }} />);
    expect(screen.getByText('Mon–Fri 09:00–17:00')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('safety rules open in a new tab without giving that page access to ours', () => {
    render(<LabInfoFooter info={{ ...none, rulesUrl: 'https://example.ac.th/rules.pdf' }} />);
    const link = screen.getByRole('link', { name: 'Lab safety rules' });
    expect(link).toHaveAttribute('href', 'https://example.ac.th/rules.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('"Report a problem" starts an email to the lab', () => {
    render(<LabInfoFooter info={{ ...none, contactEmail: 'lab@ku.th' }} />);
    expect(screen.getByRole('link', { name: 'Report a problem' }).getAttribute('href')).toMatch(/^mailto:lab@ku\.th\?subject=/);
  });
});
