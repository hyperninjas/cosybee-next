"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeSlash, Lock } from "@gravity-ui/icons";
import {
  buttonVariants,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";

export interface PasswordFieldProps {
  /** Form field name (read on submit for uncontrolled forms). */
  name: string;
  /** Visible label text. */
  label: ReactNode;
  /** Optional element rendered at the end of the label row, e.g. a
   *  "Forgot password?" link. */
  labelAction?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
  isRequired?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  /** Persistent helper text shown below the field (hidden while an error
   *  message is showing). */
  description?: ReactNode;
  /** Marks the field invalid and renders `errorMessage` in place of the
   *  description. */
  isInvalid?: boolean;
  errorMessage?: ReactNode;
  /** Hide the leading lock icon (shown by default). */
  hideIcon?: boolean;
  /** Classes for the wrapping TextField. */
  className?: string;
  /** Controlled value. Omit (with `onChange`) to use the field uncontrolled. */
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

/**
 * Password input with a show/hide toggle, built the recommended HeroUI v3 way:
 * `TextField` + `InputGroup` with a lock prefix and an icon `Button` suffix
 * that flips the input's `type` between `password` and `text`. Supports the
 * HeroUI validation pattern (`isInvalid` + `FieldError`, swapped with a
 * `Description`). Visibility state is local to each field.
 */
export function PasswordField({
  name,
  label,
  labelAction,
  placeholder = "••••••••",
  autoComplete = "current-password",
  isRequired,
  minLength,
  autoFocus,
  description,
  isInvalid,
  errorMessage,
  hideIcon,
  className,
  value,
  onChange,
  defaultValue,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  // Only bind controlled props when a value is supplied, so the same component
  // works uncontrolled (value read from the form on submit by `name`).
  const controlled = value !== undefined ? { value, onChange } : {};

  return (
    <TextField
      name={name}
      isRequired={isRequired}
      isInvalid={isInvalid}
      autoFocus={autoFocus}
      className={className}
      defaultValue={defaultValue}
      {...controlled}
    >
      {labelAction ? (
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          {labelAction}
        </div>
      ) : (
        <Label>{label}</Label>
      )}
      <InputGroup variant="secondary">
        {!hideIcon && (
          <InputGroup.Prefix>
            <Lock className="size-4 text-muted" />
          </InputGroup.Prefix>
        )}
        <InputGroup.Input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
        />
        <InputGroup.Suffix className="pr-0">
          {/* Native <button> (not HeroUI <Button>) so the toggle uses pure CSS
              :hover. The icon swap happens during press, which leaves React
              Aria's data-pressed/data-hovered stuck on the HeroUI button —
              freezing the hover state after the first click. */}
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((v) => !v)}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              isIconOnly: true,
            })}
          >
            {visible ? (
              <Eye className="size-4" />
            ) : (
              <EyeSlash className="size-4" />
            )}
          </button>
        </InputGroup.Suffix>
      </InputGroup>
      {isInvalid && errorMessage ? (
        <FieldError>{errorMessage}</FieldError>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </TextField>
  );
}
