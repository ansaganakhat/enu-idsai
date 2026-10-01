/* Pure availability logic. No DOM dependency. */
(function(root, factory){
  const api = factory();
  if(typeof module === "object" && module.exports) module.exports = api;
  if(root) root.ClassroomAvailability = api;
})(typeof window !== "undefined" ? window : globalThis, function(){
  function sortClassroomsNaturally(rooms){
    return [...rooms].sort((a,b)=>{
      const pa = String(a.room).match(/^(\d+)(.*)$/u);
      const pb = String(b.room).match(/^(\d+)(.*)$/u);
      const na = pa ? Number(pa[1]) : Number.MAX_SAFE_INTEGER;
      const nb = pb ? Number(pb[1]) : Number.MAX_SAFE_INTEGER;
      if(na !== nb) return na - nb;
      const sa = pa ? pa[2] : String(a.room);
      const sb = pb ? pb[2] : String(b.room);
      return sa.localeCompare(sb, "ru", {numeric:true, sensitivity:"base"});
    });
  }

  function findAvailableRooms(day, time, classrooms, schedule){
    if(!Array.isArray(classrooms) || !schedule || !Array.isArray(schedule.lessons)) return [];
    const occupied = new Set(
      schedule.lessons
        .filter(item => item.day === day && item.time === time)
        .map(item => String(item.room))
    );
    return sortClassroomsNaturally(classrooms.filter(room => !occupied.has(String(room.room))));
  }

  return {findAvailableRooms, sortClassroomsNaturally};
});
