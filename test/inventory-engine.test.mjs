import test from 'node:test';import assert from 'node:assert/strict';import {planBatch,capacityLiters} from '../src/inventory-engine.mjs';
const recipe=[{materialId:'cement',unitsPerM3:350000},{materialId:'sand',unitsPerM3:750000}];
test('one cubic meter consumes prescribed materials',()=>{let x=planBatch({productionLiters:1000,recipe,stock:{cement:400000,sand:760000}});assert.equal(x.canProduce,true);assert.equal(x.requirements[0].needed,350000)});
test('shortages block production',()=>{let x=planBatch({productionLiters:2000,recipe,stock:{cement:400000,sand:1000000}});assert.equal(x.canProduce,false);assert.equal(x.requirements[0].shortage,300000)});
test('fractional production rounds resource requirement upward',()=>{let x=planBatch({productionLiters:1,recipe:[{materialId:'x',unitsPerM3:1250}],stock:{x:2}});assert.equal(x.requirements[0].needed,2)});
test('duplicate material rejects',()=>assert.throws(()=>planBatch({productionLiters:1000,recipe:[recipe[0],recipe[0]],stock:{cement:700000}})));
test('stock capacity honors limiting ingredient',()=>assert.equal(capacityLiters({recipe,stock:{cement:700000,sand:750000}}),1000));
test('missing stock rejects',()=>assert.throws(()=>planBatch({productionLiters:1000,recipe,stock:{cement:400000}})));
test('zero volume rejects',()=>assert.throws(()=>planBatch({productionLiters:0,recipe,stock:{cement:400000,sand:1000000}})));
