export function displayError(container: HTMLElement, message: string): void {
  container.innerHTML = "";

  const p = document.createElement("p");
  p.style.color = "red";
  p.textContent = message;
  container.appendChild(p);
}

export interface ValidationOptions {
  label?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowedValues?: (string | number)[];
  minValue?: number;
  maxValue?: number;
  container?: HTMLElement;
}

export function validateField(
  value: string | number | boolean,
  options: ValidationOptions
): boolean {
  const label = options.label ?? "This field";
  const container = options.container;

  // Required
  if (options.required && (value === null || value === undefined || value === "")) {
    if (container) displayError(container, `${label} is required.`);
    return false;
  }

  // === String validation ===
  if (typeof value === "string") {
    if (options.minLength !== undefined && value.length < options.minLength) {
      if (container) displayError(container, `${label} must be at least ${options.minLength} characters.`);
      return false;
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      if (container) displayError(container, `${label} must be no more than ${options.maxLength} characters.`);
      return false;
    }

    if (options.allowedValues && !options.allowedValues.includes(value)) {
      if (container) displayError(container, `${label} must be one of: ${options.allowedValues.join(", ")}`);
      return false;
    }
  }

  // === Number validation ===
  if (typeof value === "number") {
    if (options.minValue !== undefined && value < options.minValue) {
      if (container) displayError(container, `${label} must be at least ${options.minValue}.`);
      return false;
    }

    if (options.maxValue !== undefined && value > options.maxValue) {
      if (container) displayError(container, `${label} must be no more than ${options.maxValue}.`);
      return false;
    }

    if (options.allowedValues && !options.allowedValues.includes(value)) {
      if (container) displayError(container, `${label} must be one of: ${options.allowedValues.join(", ")}`);
      return false;
    }
  }

  // ✅ Passed all checks
  return true;
}
