export function validateName(value) {
  if (!value.trim()) return 'Enter your name.';
  if (value.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}

export function validateEmail(value) {
  if (!value.trim()) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return 'Enter a valid email, like name@example.com.';
  }
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Enter your password.';
  if (value.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}