import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCalendar } from '../src/contributions-data.js';

test('aligns days in UTC across a year boundary and preserves actual totals',() => {
  const calendar = prepareCalendar({total:{lastYear:7},contributions:[
    {date:'2026-01-01',count:4,level:4},
    {date:'2025-12-30',count:1,level:1},
    {date:'2025-12-31',count:2,level:2}
  ]});
  assert.equal(calendar.total,7);
  assert.equal(calendar.weeks,1);
  assert.deepEqual(calendar.days.map(day=>[day.date,day.column,day.row]),[['2025-12-30',0,2],['2025-12-31',0,3],['2026-01-01',0,4]]);
});
test('starts a new week on Sunday without inventing zero-count future cells',() => {
  const calendar = prepareCalendar({contributions:[{date:'2026-11-14',count:0,level:0},{date:'2026-11-15',count:3,level:3}]});
  assert.equal(calendar.weeks,2);
  assert.deepEqual(calendar.days.map(day=>[day.column,day.row]),[[0,6],[1,0]]);
  assert.equal(calendar.days.length,2);
});
test('rejects invalid dates, impossible counts, gaps, duplicates, and conflicting totals',() => {
  const day = {date:'2026-11-18',count:3,level:3};
  for (const payload of [
    {contributions:[]},
    {contributions:[{...day,date:'2026-02-30'}]},
    {contributions:[{...day,count:-1}]},
    {contributions:[{...day,level:5}]},
    {contributions:[day,day]},
    {contributions:[day,{...day,date:'2026-11-20'}]},
    {total:{lastYear:100},contributions:[day]}
  ]) assert.throws(()=>prepareCalendar(payload));
});
