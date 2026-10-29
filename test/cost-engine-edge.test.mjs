import test from 'node:test';import assert from 'node:assert/strict';import {quote} from '../src/cost-engine.mjs';
test('reject arithmetic overflow',()=>assert.throws(()=>quote({componentsHalalas:[Number.MAX_SAFE_INTEGER],marginBasisPoints:9999,quantityLiters:1000}),/overflow/i));
test('margin is never below target after rounding',()=>{for(const margin of [0,500,1250,2500,3500,7500]){const x=quote({componentsHalalas:[12345],marginBasisPoints:margin,quantityLiters:1000});assert.ok((x.pricePerM3Halalas-x.costPerM3Halalas)*10000/x.pricePerM3Halalas>=margin-0.00001)}});
test('input is not mutated',()=>{const components=[100,200];quote({componentsHalalas:components,marginBasisPoints:1000,quantityLiters:1500});assert.deepEqual(components,[100,200])});
