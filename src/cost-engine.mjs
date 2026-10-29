/** Deterministic quote calculation. All money is in integer halalas; volume is liters. */
export function quote({componentsHalalas, marginBasisPoints, quantityLiters}) {
  if (!Array.isArray(componentsHalalas) || componentsHalalas.length === 0 || componentsHalalas.some(x => !Number.isSafeInteger(x) || x < 0)) throw new TypeError('Invalid cost components');
  if (!Number.isSafeInteger(marginBasisPoints) || marginBasisPoints < 0 || marginBasisPoints >= 10000) throw new RangeError('Invalid target margin');
  if (!Number.isSafeInteger(quantityLiters) || quantityLiters <= 0) throw new RangeError('Invalid concrete volume');
  const costPerM3 = componentsHalalas.reduce((a,b)=>a+b,0);
  if(!Number.isSafeInteger(costPerM3)) throw new RangeError('Cost overflow');
  const pricePerM3 = Math.ceil(costPerM3*10000/(10000-marginBasisPoints));
  if(!Number.isSafeInteger(pricePerM3)) throw new RangeError('Price overflow');
  const totalCost = Math.round(costPerM3*quantityLiters/1000);
  const totalRevenue = Math.round(pricePerM3*quantityLiters/1000);
  if (![totalCost,totalRevenue].every(Number.isSafeInteger)) throw new RangeError('Total overflow');
  return { costPerM3Halalas: costPerM3, pricePerM3Halalas: pricePerM3, quantityLiters, totalCostHalalas: totalCost, totalRevenueHalalas: totalRevenue, grossProfitHalalas: totalRevenue-totalCost, marginBasisPoints };
}
export function realizedMarginBasisPoints({revenueHalalas,costHalalas}) {
  if(![revenueHalalas,costHalalas].every(Number.isSafeInteger) || revenueHalalas < 0 || costHalalas < 0) throw new TypeError('Invalid accounting amounts');
  return revenueHalalas === 0 ? null : Math.round((revenueHalalas-costHalalas)*10000/revenueHalalas);
}
