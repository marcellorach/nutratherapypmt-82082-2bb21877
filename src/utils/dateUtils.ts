export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return date.toLocaleDateString();
};