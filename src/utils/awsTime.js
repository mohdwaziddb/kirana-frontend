export const AWS_TIME_OFFSET_MINUTES = 330;

const addAwsOffset = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + AWS_TIME_OFFSET_MINUTES * 60 * 1000);
};

export const formatAwsDateTime = (value) => {
  const date = addAwsOffset(value);
  if (!date) return '';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getAwsDateKey = (value) => {
  const date = addAwsOffset(value);
  if (!date) return '';

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
