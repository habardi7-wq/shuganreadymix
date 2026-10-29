/** Verified impact calculation: use comparable periods and documented baselines. */
export function measuredSavings({baselineCostHalalas,actualCostHalalas,baselineVolumeLiters,actualVolumeLiters,platformCostHalalas=0}) {
 const ints=[baselineCostHalalas,actualCostHalalas,baselineVolumeLiters,actualVolumeLiters,platformCostHalalas];
 if(ints.some(x=>!Number.isSafeInteger(x)||x<0)||baselineVolumeLiters<=0||actualVolumeLiters<=0)throw new TypeError('Invalid impact inputs');
 // Normalize against actual output to avoid attributing lower production to platform savings.
 const baselineUnit=baselineCostHalalas/baselineVolumeLiters;
 const normalizedBaseline=Math.round(baselineUnit*actualVolumeLiters);
 if(!Number.isSafeInteger(normalizedBaseline))throw new RangeError('Impact overflow');
 const gross=normalizedBaseline-actualCostHalalas;
 const net=gross-platformCostHalalas;
 if(!Number.isSafeInteger(gross)||!Number.isSafeInteger(net))throw new RangeError('Impact overflow');
 return {normalizedBaselineHalalas:normalizedBaseline,grossSavingsHalalas:gross,netSavingsHalalas:net,roiBasisPoints:platformCostHalalas>0?Math.round(net*10000/platformCostHalalas):null};
}
