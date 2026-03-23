import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Button } from '../Button';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from './Dropdown';

describe('Dropdown', () => {
  it('renders a search input when searchable is enabled', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem>Alpha</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(
      screen.getByRole('searchbox', { name: 'Search dropdown items' })
    ).toBeInTheDocument();
  });

  it('filters dropdown items based on the search query', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownLabel>Actions</DropdownLabel>
        <DropdownItem>Alpha</DropdownItem>
        <DropdownItem>Beta</DropdownItem>
        <DropdownSeparator />
        <DropdownItem>Gamma</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'bet'
    );

    expect(screen.getByRole('menuitem', { name: 'Beta' })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Alpha' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Gamma' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders an empty state when no items match', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown
        searchable
        searchEmptyState="Nothing matched"
        trigger={<Button>Open menu</Button>}
      >
        <DropdownItem>Alpha</DropdownItem>
        <DropdownItem>Beta</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'zzz'
    );

    expect(screen.getByText('Nothing matched')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Alpha' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Beta' })
    ).not.toBeInTheDocument();
  });

  it('uses custom searchText when provided', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Dropdown searchable trigger={<Button>Open menu</Button>}>
        <DropdownItem searchText="new patient intake">Create</DropdownItem>
        <DropdownItem>Archive</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'patient'
    );

    expect(
      screen.getByRole('menuitem', { name: 'Create' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Archive' })
    ).not.toBeInTheDocument();
  });

  it('supports multi-select items with checkbox semantics', async () => {
    const user = userEvent.setup();
    const handleSelectedValuesChange = vi.fn();

    renderWithTheme(
      <Dropdown
        multiSelect
        defaultSelectedValues={['alpha']}
        onSelectedValuesChange={handleSelectedValuesChange}
        trigger={<Button>Open menu</Button>}
      >
        <DropdownItem value="alpha">Alpha</DropdownItem>
        <DropdownItem value="beta">Beta</DropdownItem>
      </Dropdown>
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const alphaItem = screen.getByRole('menuitemcheckbox', { name: 'Alpha' });
    const betaItem = screen.getByRole('menuitemcheckbox', { name: 'Beta' });

    expect(alphaItem).toHaveAttribute('aria-checked', 'true');
    expect(betaItem).toHaveAttribute('aria-checked', 'false');

    await user.click(betaItem);

    expect(betaItem).toHaveAttribute('aria-checked', 'true');
    expect(handleSelectedValuesChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('keeps multi-select behavior when filtering searchable dropdowns', async () => {
    const user = userEvent.setup();

    function SearchableMultiSelectHarness() {
      const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

      return (
        <Dropdown
          searchable
          multiSelect
          selectedValues={selectedValues}
          onSelectedValuesChange={setSelectedValues}
          trigger={<Button>Open menu</Button>}
        >
          <DropdownItem value="schedule" searchText="schedule appointment">
            Schedule Visit
          </DropdownItem>
          <DropdownItem value="message" searchText="send secure message">
            Message Patient
          </DropdownItem>
        </Dropdown>
      );
    }

    renderWithTheme(<SearchableMultiSelectHarness />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.type(
      screen.getByRole('searchbox', { name: 'Search dropdown items' }),
      'secure'
    );

    const messageItem = screen.getByRole('menuitemcheckbox', {
      name: 'Message Patient',
    });

    expect(
      screen.queryByRole('menuitemcheckbox', { name: 'Schedule Visit' })
    ).not.toBeInTheDocument();

    await user.click(messageItem);

    expect(messageItem).toHaveAttribute('aria-checked', 'true');
  });
});
