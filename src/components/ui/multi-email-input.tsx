"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Badge } from "./badge";
import { Input } from "./input";

interface MultiEmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export function MultiEmailInput({
  value = [],
  onChange,
  placeholder = "Enter email addresses separated by commas",
  className,
  disabled = false,
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setError(null);
  };

  const addEmails = (emailString: string) => {
    const emails = emailString
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach((email) => {
      if (isValidEmail(email)) {
        if (!value.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      setError(`Invalid email(s): ${invalidEmails.join(", ")}`);
      return false;
    }

    if (validEmails.length > 0) {
      onChange([...value, ...validEmails]);
    }
    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        if (addEmails(inputValue)) {
          setInputValue("");
        }
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last email when backspace is pressed on empty input
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      if (addEmails(inputValue)) {
        setInputValue("");
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter((email) => email !== emailToRemove));
    setError(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    if (addEmails(pastedText)) {
      setInputValue("");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-input flex min-h-10 w-full flex-wrap gap-1 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "cursor-not-allowed opacity-50",
          error &&
            "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
        )}
      >
        {value.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="flex items-center gap-1 text-sm"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="hover:bg-secondary-foreground/20 ml-1 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {value.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {value.length} email{value.length === 1 ? "" : "s"} added
        </p>
      )}
    </div>
  );
}
