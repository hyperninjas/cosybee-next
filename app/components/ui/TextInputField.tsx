"use client";

import type { ReactNode } from "react";
import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from "@heroui/react";

export interface TextInputFieldProps {
  name: string;
  label: ReactNode;
  type?: "text" | "email" | "tel" | "url" | "search";
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "search";
  isRequired?: boolean;
  autoFocus?: boolean;
  readOnly?: boolean;
  /** Leading icon rendered in the input's prefix slot. */
  icon?: ReactNode;
  /** Persistent helper text (hidden while an error message is showing). */
  description?: ReactNode;
  /** Marks the field invalid and renders `errorMessage` in place of the
   *  description. */
  isInvalid?: boolean;
  errorMessage?: ReactNode;
  className?: string;
  /** Controlled value. Omit (with `onChange`) to use uncontrolled. */
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
}

/**
 * Single-line text/email field built the recommended HeroUI v3 way:
 * `TextField` + `InputGroup` with an optional prefix icon, plus the standard
 * validation pattern (`isInvalid` + `FieldError`, swapped with `Description`).
 * Sibling of [PasswordField] — use it for email, name, and other text inputs
 * so every auth form shares the same anatomy.
 */
export function TextInputField({
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  isRequired,
  autoFocus,
  readOnly,
  icon,
  description,
  isInvalid,
  errorMessage,
  className,
  value,
  onChange,
  defaultValue,
}: TextInputFieldProps) {
  const controlled = value !== undefined ? { value, onChange } : {};

  return (
    <TextField
      name={name}
      type={type}
      isRequired={isRequired}
      isInvalid={isInvalid}
      autoFocus={autoFocus}
      className={className}
      defaultValue={defaultValue}
      {...controlled}
    >
      <Label>{label}</Label>
      <InputGroup variant="secondary">
        {icon && <InputGroup.Prefix>{icon}</InputGroup.Prefix>}
        <InputGroup.Input
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          readOnly={readOnly}
        />
      </InputGroup>
      {isInvalid && errorMessage ? (
        <FieldError>{errorMessage}</FieldError>
      ) : description ? (
        <Description>{description}</Description>
      ) : null}
    </TextField>
  );
}
