import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getUserDisplayName(user) {
  if (!user) return 'User'
  
  // Check for user metadata first (from signup)
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  
  // Check for individual name fields
  if (user.user_metadata?.first_name || user.user_metadata?.last_name) {
    const firstName = user.user_metadata.first_name || ''
    const lastName = user.user_metadata.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'User'
  }
  
  // Fallback to email username
  if (user.email) {
    return user.email.split('@')[0]
  }
  
  return 'User'
}
