// Book prices are Sri Lankan rupees: 1250 -> "රු. 1,250.00".
export const formatPrice = (price: number) =>
  `රු. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
