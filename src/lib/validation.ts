export function isValidLatitude(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= -180 && num <= 180;
}

export function isValidThaiPhone(value) {
  return /^0[0-9]{8,9}$/.test(String(value).replace(/[-\s]/g, ""));
}

export function isRequired(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null && value !== "";
}

export function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}


export function validateForm(formData, rules) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of (fieldRules as any[])) {
      const error = rule(formData[field], formData);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}
