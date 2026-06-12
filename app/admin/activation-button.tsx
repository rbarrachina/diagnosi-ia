"use client";

type ConfirmSubmitButtonProps = {
  children: string;
  className: string;
  disabled?: boolean;
  message: string;
};

export function ConfirmSubmitButton({
  children,
  className,
  disabled = false,
  message,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled}
      onClick={(event) => {
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
