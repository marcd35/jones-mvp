import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Shop">
        body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is an accessible modal dialog named by its title', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Shop">
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Shop' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('closes from the labelled close button', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Shop">
        body
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Shop">
        body
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab focus inside the dialog', async () => {
    render(
      <Modal isOpen onClose={() => {}} title="Shop">
        <button>One</button>
        <button>Two</button>
      </Modal>,
    );
    const close = screen.getByRole('button', { name: 'Close' });
    const two = screen.getByRole('button', { name: 'Two' });

    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    expect(two).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(two).toHaveFocus();
  });

  it('returns focus to the opener when it closes', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Shop">
            body
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });
});
