/**
 * Utility functions for the EverGreen application.
 */

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
