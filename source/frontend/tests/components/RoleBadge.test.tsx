import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { RoleBadge, StatusBadge } from '@/components/RoleBadge';
import { ROLES, ROLE_LABELS } from '@/lib/users';

describe('RoleBadge', () => {
  test.each(ROLES)('shows the readable label for %s', (role) => {
    render(<RoleBadge role={role} />);
    expect(screen.getByText(ROLE_LABELS[role])).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  test('active account', () => {
    render(<StatusBadge active />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Deactivated')).not.toBeInTheDocument();
  });

  test('deactivated account', () => {
    render(<StatusBadge active={false} />);
    expect(screen.getByText('Deactivated')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  test('the coloured dot is hidden from screen readers (the text says it all)', () => {
    const { container } = render(<StatusBadge active />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
