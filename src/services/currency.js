export const centsToDollars = (cents) => {
  const value = Number(cents);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value / 100;
};

export const formatUSD = (cents) => `$${centsToDollars(cents).toFixed(2)}`;
