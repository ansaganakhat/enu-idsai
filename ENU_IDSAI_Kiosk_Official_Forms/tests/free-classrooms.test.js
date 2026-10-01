const assert = require('assert');
const path = require('path');
const fs = require('fs');
const svc = require('../classroom-availability-service.js');

const root = path.resolve(__dirname, '..');
const classrooms = JSON.parse(fs.readFileSync(path.join(root,'data/classrooms.json'),'utf8'));
const schedule = JSON.parse(fs.readFileSync(path.join(root,'data/schedules/2026-semester-1.json'),'utf8'));

function rooms(day,time){
  return svc.findAvailableRooms(day,time,classrooms,schedule).map(r=>r.room);
}

const monday = rooms('monday','08:00-08:50');
assert.strictEqual(monday.length, 50, 'Monday 08:00 free-room count must match source spreadsheet');
assert(monday.includes('103') && monday.includes('1136') && !monday.includes('222'));

const wed = rooms('wednesday','14:10-15:00');
assert.deepStrictEqual(wed, ['112','120','402','407','408','412','502б','504б','505','507','509','604','606','615']);

const none = rooms('thursday','16:10-17:00');
assert.strictEqual(none.length,0,'Thursday 16:10 is an empty-state test case');

const sorted = svc.sortClassroomsNaturally([
  {room:'508б'},{room:'501а'},{room:'502б'},{room:'508а'},{room:'502а'},{room:'504б'},{room:'504а'}
]).map(x=>x.room);
assert.deepStrictEqual(sorted,['501а','502а','502б','504а','504б','508а','508б']);

// The service is semester-agnostic: UI code does not change when a new schedule object is used.
const fakeSchedule = {lessons:[{room:'103',day:'monday',time:'08:00-08:50'}]};
const fake = svc.findAvailableRooms('monday','08:00-08:50',classrooms,fakeSchedule).map(r=>r.room);
assert(!fake.includes('103') && fake.length===classrooms.length-1);

console.log('PASS: free-classrooms availability tests');
