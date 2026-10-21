"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  className: string;
  disabled?: boolean;
  message: string;
  confirmWhenFieldChanges?: { name: string; initialValue: string };
};

export function ConfirmSubmitButton({
  children,
  className,
  disabled = false,
  message,
  confirmWhenFieldChanges,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      onClick={(event) => {
        const form = event.currentTarget.form;
        if (confirmWhenFieldChanges && form &&
            new FormData(form).get(confirmWhenFieldChanges.name) === confirmWhenFieldChanges.initialValue) {
          return;
        }
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
