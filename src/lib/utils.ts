import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string): string {
  if (!str) return str;

  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      // Handle empty strings or single characters
      if (word.length === 0) return word;
      if (word.length === 1) return word.toUpperCase();

      // Capitalize first letter and keep rest lowercase
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .trim();
}
