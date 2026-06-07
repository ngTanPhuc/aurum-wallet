export const formatCurrency = (amount: number, currency: string = '') => {
  if (currency) {
    return `${amount.toLocaleString()} ${currency}`;
  }
  return amount.toLocaleString();
};

export const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
