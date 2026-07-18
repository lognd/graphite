import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigField } from './ConfigField';

describe('ConfigField', () => {
  // frob:tests frontend/src/components/ConfigField/ConfigField.tsx::ConfigField
  it('renders label, value, and source attribution', () => {
    render(
      <ConfigField
        label="ui.port"
        value="8765"
        source="default"
        isDefault
        onSave={() => Promise.resolve()}
        onReset={() => Promise.resolve()}
      />,
    );
    expect(screen.getByText('ui.port')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8765')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
  });

  it('disables reset when the value is already the default', () => {
    render(
      <ConfigField
        label="ui.port"
        value="8765"
        source="default"
        isDefault
        onSave={() => Promise.resolve()}
        onReset={() => Promise.resolve()}
      />,
    );
    expect(screen.getByRole('button', { name: 'reset to default' })).toBeDisabled();
  });

  it('save is disabled until the draft differs from the current value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfigField
        label="ui.port"
        value="8765"
        source="project"
        isDefault={false}
        onSave={onSave}
        onReset={() => Promise.resolve()}
      />,
    );
    const saveButton = screen.getByRole('button', { name: 'save' });
    expect(saveButton).toBeDisabled();

    await user.clear(screen.getByDisplayValue('8765'));
    await user.type(screen.getByRole('textbox'), '9999');
    expect(saveButton).not.toBeDisabled();

    await user.click(saveButton);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('9999'));
  });

  it('renders the real error message verbatim on a failed save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("unknown config key 'does.not.exist'"));
    render(
      <ConfigField
        label="does.not.exist"
        value="1"
        source="project"
        isDefault={false}
        onSave={onSave}
        onReset={() => Promise.resolve()}
      />,
    );
    await user.type(screen.getByRole('textbox'), '2');
    await user.click(screen.getByRole('button', { name: 'save' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent("unknown config key 'does.not.exist'"),
    );
  });

  it('calls onReset when reset is clicked on a non-default value', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfigField
        label="ui.port"
        value="9999"
        source="project"
        isDefault={false}
        onSave={() => Promise.resolve()}
        onReset={onReset}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'reset to default' }));
    await waitFor(() => expect(onReset).toHaveBeenCalledOnce());
  });
});
