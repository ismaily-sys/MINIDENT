export const calculateTotal = (treatments) => {
  return treatments.reduce((total, treatment) => {
    return total + treatment.price;
  }, 0);
};

export const calculateDiscountedTotal = (treatments, discountPercentage) => {
  const total = calculateTotal(treatments);
  const discount = (total * discountPercentage) / 100;
  return total - discount;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};