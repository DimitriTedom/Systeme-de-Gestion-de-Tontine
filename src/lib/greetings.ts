/**
 * Get personalized greeting based on time of day
 */
export function getGreeting(name: string = 'Admin'): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return `Bonjour, ${name}`;
  } else if (hour < 18) {
    return `Bon après-midi, ${name}`;
  } else {
    return `Bonsoir, ${name}`;
  }
}

/**
 * Get emoji based on time of day
 */
export function getTimeEmoji(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return '🌅';
  } else if (hour < 18) {
    return '☀️';
  } else {
    return '🌙';
  }
}

/**
 * Get motivational message based on time of day
 */
export function getMotivationalMessage(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Commencez votre journée du bon pied';
  } else if (hour < 18) {
    return 'Continuez votre excellent travail';
  } else {
    return 'Terminez la journée en beauté';
  }
}
