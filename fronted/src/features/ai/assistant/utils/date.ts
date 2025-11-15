const padMonth = (month: number) => String(month).padStart(2, '0');

export const formatDate = (date?: Date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = padMonth(date.getMonth() + 1);
  return `${year}.${month}`;
};

export const formatPeriod = (startDate?: Date, endDate?: Date, fallback?: string) => {
  if (!startDate && !endDate) {
    return fallback ?? '';
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `${formatDate(startDate)} - 진행중`;
  }

  return fallback ?? '';
};

