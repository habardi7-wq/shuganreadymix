import test from 'node:test';
import assert from 'node:assert/strict';
import {quote,realizedMarginBasisPoints} from '../src/cost-engine.mjs';
test('180 SAR cost and 25% sales margin gives 240 SAR quote',()=>{
 const x=quote({componentsHalalas:[10000,8000],marginBasisPoints:2500,quantityLiters:100000});
 assert.equal(x.costPerM3Halalas,18000);
 assert.equal(x.pricePerM3Halalas,24000);
 assert.equal(x.totalRevenueHalalas,2400000);
 assert.equal(x.grossProfitHalalas,600000);
 assert.equal(realizedMarginBasisPoints({revenueHalalas:x.totalRevenueHalalas,costHalalas:x.totalCostHalalas}),2500);
});
test('small fractional quantities use liters and round only at total',()=>{
 const x=quote({componentsHalalas:[10001],marginBasisPoints:0,quantityLiters:1500});
 assert.equal(x.totalRevenueHalalas,15002);
});
test('reject negative costs',()=>assert.throws(()=>quote({componentsHalalas:[-1],marginBasisPoints:2500,quantityLiters:1000})));
test('reject 100 percent target margin',()=>assert.throws(()=>quote({componentsHalalas:[100],marginBasisPoints:10000,quantityLiters:1000})));
test('reject zero volume',()=>assert.throws(()=>quote({componentsHalalas:[100],marginBasisPoints:0,quantityLiters:0})));
test('reject floating point money',()=>assert.throws(()=>quote({componentsHalalas:[100.5],marginBasisPoints:0,quantityLiters:1000})));
test('zero revenue margin is undefined',()=>assert.equal(realizedMarginBasisPoints({revenueHalalas:0,costHalalas:0}),null));
