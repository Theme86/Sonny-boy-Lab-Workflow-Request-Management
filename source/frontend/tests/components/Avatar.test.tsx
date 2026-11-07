import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Avatar } from '@/components/Avatar';
import { API_URL } from '@/lib/api';

const person = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ku.th', avatarUrl: null };

const wrapper = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('Avatar', () => {
  test('without a picture it shows the initials', () => {
    const { container } = render(<Avatar user={person} />);
    expect(container).toHaveTextContent('AL');
    expect(container.querySelector('img')).toBeNull();
  });

  test('the same person always gets the same colour', () => {
    const a = render(<Avatar user={person} />);
    const b = render(<Avatar user={{ ...person, firstName: 'Other' }} />); // same email
    expect(wrapper(a.container).style.backgroundColor).not.toBe('');
    expect(wrapper(a.container).style.backgroundColor).toBe(wrapper(b.container).style.backgroundColor);
  });

  test('different emails can get different colours', () => {
    const colours = new Set(
      ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com', 'f@x.com', 'g@x.com', 'h@x.com'].map((email) => {
        const { container } = render(<Avatar user={{ ...person, email }} />);
        return wrapper(container).style.backgroundColor;
      }),
    );
    expect(colours.size).toBeGreaterThan(1);
  });

  test('shows the saved picture, with the backend address in front of a stored path', () => {
    const { container } = render(<Avatar user={{ ...person, avatarUrl: '/userImages/1/avatar.png?v=1' }} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', `${API_URL}/userImages/1/avatar.png?v=1`);
    expect(container).not.toHaveTextContent('AL');
  });

  test('a full URL (Google picture) is used as is, without sending a referrer', () => {
    const { container } = render(<Avatar user={{ ...person, avatarUrl: 'https://lh3.googleusercontent.com/a/x' }} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/x');
    expect(img).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  test('the picture is decorative (empty alt text)', () => {
    const { container } = render(<Avatar user={{ ...person, avatarUrl: '/a.png' }} />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  test('a preview (picked file) wins over the saved picture', () => {
    const { container } = render(<Avatar user={{ ...person, avatarUrl: '/a.png' }} previewSrc="data:image/png;base64,AAAA" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  test('falls back to the initials when the picture fails to load', () => {
    const { container } = render(<Avatar user={{ ...person, avatarUrl: '/broken.png' }} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('AL');
  });

  test('a new picture is tried again after an earlier one failed', () => {
    const { container, rerender } = render(<Avatar user={{ ...person, avatarUrl: '/broken.png' }} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    rerender(<Avatar user={{ ...person, avatarUrl: '/fixed.png' }} />);
    expect(container.querySelector('img')).toHaveAttribute('src', `${API_URL}/fixed.png`);
  });

  test.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-16'],
    ['xl', 'h-24'],
  ] as const)('size %s', (size, cls) => {
    const { container } = render(<Avatar user={person} size={size} />);
    expect(wrapper(container).className).toContain(cls);
  });

  test('defaults to medium and accepts extra classes', () => {
    const { container } = render(<Avatar user={person} className="ring-4" />);
    expect(wrapper(container).className).toContain('h-10');
    expect(wrapper(container).className).toContain('ring-4');
  });

  test('the initials are hidden from screen readers', () => {
    const { container } = render(<Avatar user={person} />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('AL');
  });
});
