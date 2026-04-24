// Input.tsx — Reusable labeled text input component

import type React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<Props> = ({ label, ...props }) => (
  <div>
    <div className="block text-xs font-medium text-gray-600 mb-1">{label}</div>
    <input
      {...props}
      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);
