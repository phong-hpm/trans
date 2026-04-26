// Confirm.tsx — Shared inline confirm/cancel action row

import type React from 'react';

import { Button } from './Button';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export const Confirm: React.FC<Props> = ({ onConfirm, onCancel }) => (
  <div className="flex gap-2">
    <Button variant="contain" color="danger" className="flex-1" onClick={onConfirm}>
      Confirm
    </Button>
    <Button variant="outline" color="ghost" className="flex-1" onClick={onCancel}>
      Cancel
    </Button>
  </div>
);
