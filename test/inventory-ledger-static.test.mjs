import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../db/003_inventory_ledger.sql',import.meta.url),'utf8');
test('balances reject negative inventory',()=>assert.match(sql,/quantity bigint not null default 0 check\(quantity>=0\)/i));
test('movement retries use unique idempotency key',()=>assert.match(sql,/unique\(factory_id,event_key,material_id\)/i));
test('balance is locked before posting movement',()=>assert.match(sql,/for update;/i));
test('direct client writes revoked',()=>assert.match(sql,/revoke all on public\.materials,public\.inventory_balances,public\.inventory_movements from anon,authenticated/i));
test('posting function excludes client execution',()=>assert.match(sql,/revoke all on function public\.post_inventory_movement\([^)]+\) from public,anon,authenticated/i));
test('ledger uses tenant-based foreign keys',()=>assert.match(sql,/foreign key\(factory_id,material_id\) references public\.inventory_balances\(factory_id,material_id\)/i));
