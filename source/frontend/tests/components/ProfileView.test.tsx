import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { InfoRow, InfoSection, PageHeading, ProfileDetails, ProfileHeader } from '@/components/ProfileView';
import { makeUser } from '../helpers';

describe('PageHeading', () => {
  test('title, optional subtitle and action', () => {
    render(<PageHeading title="Users" subtitle="Everyone" action={<button>Add</button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument();
    expect(screen.getByText('Everyone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  test('works with only a title', () => {
    render(<PageHeading title="Users" />);
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });
});

describe('InfoRow', () => {
  test('a plain row shows label and value', () => {
    render(
      <dl>
        <InfoRow label="Name">Ada</InfoRow>
      </dl>,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('with href the whole row is a link', () => {
    render(
      <dl>
        <InfoRow label="Name" href="/profile/edit">
          Ada
        </InfoRow>
      </dl>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile/edit');
  });
});

describe('InfoSection', () => {
  test('heading, description and rows', () => {
    render(
      <InfoSection title="Account" description="Details">
        <InfoRow label="Status">Ok</InfoRow>
      </InfoSection>,
    );
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

describe('ProfileHeader', () => {
  test('shows name, email, role and department', () => {
    render(<ProfileHeader user={makeUser({ role: 'ta', department: 'SKE' })} />);
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByText('ada@ku.th')).toBeInTheDocument();
    expect(screen.getByText('Teaching Assistant')).toBeInTheDocument();
    expect(screen.getByText('SKE')).toBeInTheDocument();
  });

  test('only a deactivated account shows the deactivated badge', () => {
    const { rerender } = render(<ProfileHeader user={makeUser({ active: true })} />);
    expect(screen.queryByText('Deactivated')).not.toBeInTheDocument();
    rerender(<ProfileHeader user={makeUser({ active: false })} />);
    expect(screen.getByText('Deactivated')).toBeInTheDocument();
  });

  test('uses the person\'s banner when they have one, a gradient otherwise', () => {
    const { rerender } = render(<ProfileHeader user={makeUser({ bannerUrl: null })} />);
    expect(screen.getByRole('img', { name: 'Profile banner' })).not.toHaveAttribute('style');
    rerender(<ProfileHeader user={makeUser({ bannerUrl: '/userImages/1/banner.png' })} />);
    expect(screen.getByRole('img', { name: 'Profile banner' }).getAttribute('style')).toContain('/userImages/1/banner.png');
  });

  test('renders the action (e.g. Edit profile)', () => {
    render(<ProfileHeader user={makeUser()} action={<a href="/profile/edit">Edit profile</a>} />);
    expect(screen.getByRole('link', { name: 'Edit profile' })).toBeInTheDocument();
  });
});

describe('ProfileDetails: my own profile (editable)', () => {
  const mine = makeUser({ studentId: null, phone: null, department: null, bio: null, lastLoginAt: null });

  test('empty values invite the person to fill them in', () => {
    render(<ProfileDetails user={mine} editable />);
    expect(screen.getByText('Add your faculty or department')).toBeInTheDocument();
    expect(screen.getByText('Add a short bio')).toBeInTheDocument();
    expect(screen.getByText('Add a phone number')).toBeInTheDocument();
    expect(screen.getByText('Add your student or staff ID')).toBeInTheDocument();
  });

  test('editable rows link to the edit page; role and account rows do not', () => {
    render(<ProfileDetails user={mine} editable />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const link of links) expect(link).toHaveAttribute('href', '/profile/edit');
    const roleRow = screen.getByText('Role').parentElement as HTMLElement;
    expect(roleRow.tagName).toBe('DIV');
  });

  test('shows the filled-in values', () => {
    const filled = makeUser({ studentId: '6710545725', phone: '081 234 5678', department: 'SKE', bio: 'Hello\nthere' });
    render(<ProfileDetails user={filled} editable />);
    expect(screen.getByText('6710545725')).toBeInTheDocument();
    expect(screen.getByText('081 234 5678')).toBeInTheDocument();
    expect(screen.getByText('SKE')).toBeInTheDocument();
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.queryByText('Add a short bio')).not.toBeInTheDocument();
  });

  test('explains who can see the private details', () => {
    render(<ProfileDetails user={mine} editable />);
    expect(screen.getByText(/Only you and the Lab Manager/)).toBeInTheDocument();
  });
});

describe('ProfileDetails: someone else\'s profile', () => {
  test('empty values read "Not provided" and rows are not links', () => {
    render(<ProfileDetails user={makeUser({ department: null, bio: null })} editable={false} />);
    expect(screen.getAllByText('Not provided').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('without private fields (member viewing a member) there is no contact section', () => {
    render(<ProfileDetails user={makeUser()} editable={false} />);
    expect(screen.queryByText('Contact info and ID')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    // the email moves into the Account section instead
    expect(screen.getByText('ada@ku.th')).toBeInTheDocument();
  });

  test('a Lab Manager receives the private fields, so the contact section is shown', () => {
    render(<ProfileDetails user={makeUser({ studentId: '6710545725', phone: '0812345678' })} editable={false} />);
    expect(screen.getByText('Contact info and ID')).toBeInTheDocument();
    expect(screen.getByText('Visible to you as Lab Manager.')).toBeInTheDocument();
    expect(screen.getByText('6710545725')).toBeInTheDocument();
    expect(screen.getByText('0812345678')).toBeInTheDocument();
  });

  test('private fields that are present but empty count as shown (null is not "hidden")', () => {
    render(<ProfileDetails user={makeUser({ studentId: null, phone: null })} editable={false} />);
    expect(screen.getByText('Contact info and ID')).toBeInTheDocument();
  });
});

describe('ProfileDetails: account section', () => {
  test('member since, last sign-in and status', () => {
    render(<ProfileDetails user={makeUser({ lastLoginAt: null, active: true })} editable />);
    const account = screen.getByRole('heading', { name: 'Account' }).closest('section') as HTMLElement;
    expect(within(account).getByText('Member since')).toBeInTheDocument();
    expect(within(account).getByText('Never')).toBeInTheDocument(); // last sign-in
    expect(within(account).getByText('Active')).toBeInTheDocument();
  });

  test('a deactivated account says so', () => {
    render(<ProfileDetails user={makeUser({ active: false })} editable />);
    const account = screen.getByRole('heading', { name: 'Account' }).closest('section') as HTMLElement;
    expect(within(account).getByText('Deactivated')).toBeInTheDocument();
  });
});
