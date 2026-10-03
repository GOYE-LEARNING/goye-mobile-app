// hooks/useAlert.tsx
//
// Drop-in replacement for React Native's native Alert.alert, backed by the
// app's own CustomAlert modal instead of the OS's plain system dialog.
// Matches Alert.alert's call signature closely enough that converting a
// call site is almost always just renaming `Alert.alert(` to `alert(`.
import { useCallback, useState } from 'react';
import { CustomAlert } from '@/components/CustomAlert';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
  title: string;
  message: string;
  buttons: AlertButton[];
  type: AlertType;
}

export function useAlert() {
  const [state, setState] = useState<AlertState | null>(null);

  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => {
      const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
      const inferredType: AlertType =
        type ?? (resolvedButtons.some((b) => b.style === 'destructive') ? 'warning' : 'info');
      setState({ title, message: message ?? '', buttons: resolvedButtons, type: inferredType });
    },
    [],
  );

  const dismiss = useCallback(() => setState(null), []);

  // Mirrors Alert.alert's left-to-right button order: with two buttons the
  // first is usually "Cancel" and the last is the primary/destructive
  // action, so the last button maps to CustomAlert's highlighted primary
  // button and an earlier one (if present) maps to the secondary button.
  const primary = state?.buttons[state.buttons.length - 1];
  const secondary = state && state.buttons.length > 1 ? state.buttons[0] : undefined;

  const AlertComponent = (
    <CustomAlert
      visible={!!state}
      type={state?.type ?? 'info'}
      title={state?.title ?? ''}
      message={state?.message ?? ''}
      primaryLabel={primary?.text ?? 'OK'}
      onPrimary={() => {
        dismiss();
        primary?.onPress?.();
      }}
      secondaryLabel={secondary?.text}
      onSecondary={
        secondary
          ? () => {
              dismiss();
              secondary.onPress?.();
            }
          : undefined
      }
    />
  );

  return { alert, AlertComponent };
}
