const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const academicPeriod = read('data/academic-period.json');
const data = {
  classrooms: read('data/classrooms.json'),
  days: read('data/days.json'),
  timeslots: read('data/timeslots.json'),
  academicPeriod,
  schedule: read(academicPeriod.scheduleFile)
};
fs.writeFileSync(
  path.join(root, 'data/offline-data.js'),
  'window.ENU_FREE_ROOMS_DATA = ' + JSON.stringify(data) + ';\n',
  'utf8'
);
console.log('offline-data.js rebuilt for', academicPeriod.activeAcademicYear, 'semester', academicPeriod.activeSemester);
