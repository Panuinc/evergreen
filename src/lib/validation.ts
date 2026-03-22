type ValidatorFn = (value: unknown, formData: Record<string, unknown>) => string | null | undefined;

export function isValidLatitude(value: unknown): boolean {
  const num = parseFloat(String(value));
  return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value: unknown): boolean {
  const num = parseFloat(String(value));
  return !isNaN(num) && num >= -180 && num <= 180;
}

export function isValidThaiPhone(value: unknown): boolean {
  return /^0[0-9]{8,9}$/.test(String(value).replace(/[-\s]/g, ""));
}

export function isRequired(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null && value !== "";
}

export function isPositiveNumber(value: unknown): boolean {
  const num = parseFloat(String(value));
  return !isNaN(num) && num > 0;
}


export function validateForm<T>(
  formData: T,
  rules: Record<string, ValidatorFn[]>,
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const data = formData as Record<string, unknown>;
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      const error = rule(data[field], data);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
