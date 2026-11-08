// Behaviour tests for the consumable add/edit pop-up: client checks and errors coming back from the backend.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { ConsumableFormModal } from '@/components/consumables/form/ConsumableFormModal';
import { ApiError } from '@/lib/api';
import type { Consumable } from '@/lib/consumables';

const item: Consumable = {
  consumableId: 7, name: 'Ethanol', description: null, unit: 'ml', currentStock: 100, reorderThreshold: 20,
  phValue: null, expiryDate: null, imageUrl: null, hazards: [],
};

// initial: null opens the "Add" form; leaving it out edits `item`
function renderForm({ onSave = vi.fn().mockResolvedValue(undefined), initial = item as Consumable | null } = {}) {
  render(<ConsumableFormModal initial={initial ?? undefined} onClose={vi.fn()} onSave={onSave} />);
  return onSave;
}

test('blocks saving and shows the message when a required field is empty', async () => {
  const onSave = renderForm({ initial: null });
  await userEvent.click(screen.getByRole('button', { name: 'Add consumable' }));
  expect(screen.getByText('Name is required.')).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test('shows each backend validation message under its own field', async () => {
  const onSave = vi.fn().mockRejectedValue(
    new ApiError(400, 'Validation failed', { currentStock: 'Current stock is too large', expiryDate: 'Expiry date is not a valid date' }),
  );
  renderForm({ onSave });
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(await screen.findByText('Current stock is too large')).toBeInTheDocument();
  expect(screen.getByText('Expiry date is not a valid date')).toBeInTheDocument();
  expect(screen.getByText('Please fix the highlighted fields.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
});

test('shows any other error message at the top of the form', async () => {
  renderForm({ onSave: vi.fn().mockRejectedValue(new ApiError(500, 'Could not reach the server')) });
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText('Could not reach the server')).toBeInTheDocument();
});

test('sends the edited values as numbers', async () => {
  const onSave = renderForm();
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Ethanol', unit: 'ml', currentStock: 100, reorderThreshold: 20, phValue: null }),
    { file: null, remove: false },
  );
});
