/** Inventory quantities are integer base units (e.g. grams or milliliters).
 * Production is liters, recipe consumption is base units per m3.
 * Pure preview: no mutations, database updates must occur in one transaction.
 */
function integer(n,label,{allowZero=true}={}) {
 if(!Number.isSafeInteger(n)||n<0||(!allowZero&&n===0))throw new RangeError('Invalid '+label);
 return n;
}
export function planBatch({productionLiters,recipe,stock}) {
 integer(productionLiters,'production volume',{allowZero:false});
 if(!Array.isArray(recipe)||recipe.length===0||!stock||typeof stock!=='object')throw new TypeError('Invalid recipe or stock');
 const ids=new Set(),requirements=[];
 for(const ingredient of recipe){
   if(!ingredient||typeof ingredient.materialId!=='string'||!ingredient.materialId.trim()||ids.has(ingredient.materialId))throw new TypeError('Duplicate/invalid ingredient');
   ids.add(ingredient.materialId);
   const perM3=integer(ingredient.unitsPerM3,'recipe quantity');
   const available=integer(stock[ingredient.materialId],'stock quantity');
   const exact=perM3*productionLiters;
   if(!Number.isSafeInteger(exact))throw new RangeError('Quantity overflow');
   const needed=Math.ceil(exact/1000);
   if(!Number.isSafeInteger(needed))throw new RangeError('Quantity overflow');
   requirements.push({materialId:ingredient.materialId,needed,available,shortage:Math.max(0,needed-available)});
 }
 return {canProduce:requirements.every(x=>x.shortage===0),requirements};
}
export function capacityLiters({recipe,stock}){
 if(!Array.isArray(recipe)||recipe.length===0)throw new TypeError('Invalid recipe');
 const caps=recipe.filter(x=>x.unitsPerM3>0).map(x=>{
  integer(x.unitsPerM3,'recipe rate',{allowZero:false});
  const qty=integer(stock[x.materialId],'stock quantity');
  const liters=Math.floor(qty*1000/x.unitsPerM3);
  if(!Number.isSafeInteger(liters))throw new RangeError('Capacity overflow');
  return liters;
 });
 if(!caps.length)throw new RangeError('Recipe has no consuming ingredients');
 return Math.min(...caps);
}
