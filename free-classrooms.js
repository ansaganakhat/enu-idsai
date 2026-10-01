/* ============================================================================
   БОС АУДИТОРИЯЛАР / СВОБОДНЫЕ АУДИТОРИИ
   UI logic is intentionally separated from schedule data.
   Canonical data files live under /data. The generated offline-data.js is only
   a file:// fallback for university kiosk computers opened without a web server.
   ============================================================================ */

const FREE_ROOMS_TEXT = {
  ru: {
    shift1: "1-смена",
    shift2: "2-смена",
    selectDay: "Выберите день.",
    selectTime: "Выберите время.",
    selected: "Выбрано",
    day: "День",
    time: "Время",
    loading: "Проверяю свободные аудитории...",
    foundPrefix: "По вашему запросу",
    foundMiddle: "в",
    foundSuffix: "свободны следующие аудитории:",
    none: (day, time) => `К сожалению, ${day}, ${time} свободных аудиторий не найдено. Выберите другое время.`,
    count: n => `Найдено: ${n} свободных аудиторий`,
    room: "Аудитория",
    kzName: "Қазақша",
    ruName: "Русский",
    capacity: "Вместимость",
    seats: "мест",
    status: "Статус",
    free: "Свободна",
    period: (year, semester) => `${year} · ${semester} семестр`,
    dataError: "Ошибка при загрузке данных расписания.",
    roomsError: "Информация об аудиториях не найдена."
  },
  kk: {
    shift1: "1-ауысым",
    shift2: "2-ауысым",
    selectDay: "Күнді таңдаңыз.",
    selectTime: "Уақытты таңдаңыз.",
    selected: "Таңдалды",
    day: "Күн",
    time: "Уақыт",
    loading: "Бос аудиторияларды тексеріп жатырмын...",
    foundPrefix: "Сіздің сұранысыңыз бойынша",
    foundMiddle: "уақытында",
    foundSuffix: "келесі аудиториялар бос:",
    none: (day, time) => `Өкінішке қарай, ${day} күні ${time} уақытында бос аудитория табылмады. Басқа уақытты таңдап көріңіз.`,
    count: n => `Табылды: ${n} бос аудитория`,
    room: "Аудитория",
    kzName: "Қазақша",
    ruName: "Орысша",
    capacity: "Сыйымдылығы",
    seats: "орын",
    status: "Статус",
    free: "Бос",
    period: (year, semester) => `${year} · ${semester}-семестр`,
    dataError: "Расписание деректерін жүктеу кезінде қате пайда болды.",
    roomsError: "Аудиториялар туралы ақпарат табылмады."
  }
};

const freeRoomsState = {
  loaded: false,
  loading: false,
  loadError: null,
  classrooms: [],
  days: [],
  timeslots: [],
  academicPeriod: null,
  schedule: null,
  selectedDay: null,
  selectedTime: null,
  lastResults: null
};

function currentFreeText(){
  return FREE_ROOMS_TEXT[typeof lang !== "undefined" ? lang : "ru"] || FREE_ROOMS_TEXT.ru;
}

async function fetchJson(path){
  const response = await fetch(path, {cache:"no-store"});
  if(!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function validateFreeRoomsData(data){
  if(!Array.isArray(data.classrooms) || data.classrooms.length === 0){
    throw new Error("classrooms.json is empty or invalid");
  }
  if(!Array.isArray(data.days) || data.days.length === 0){
    throw new Error("days.json is empty or invalid");
  }
  if(!Array.isArray(data.timeslots) || data.timeslots.length === 0){
    throw new Error("timeslots.json is empty or invalid");
  }
  if(!data.academicPeriod || !data.schedule || !Array.isArray(data.schedule.lessons)){
    throw new Error("academic period or schedule is invalid");
  }
  return data;
}

async function loadFreeRoomsData(){
  if(freeRoomsState.loaded || freeRoomsState.loading) return;
  freeRoomsState.loading = true;
  freeRoomsState.loadError = null;

  try{
    let data;
    const offline = window.ENU_FREE_ROOMS_DATA;

    if(location.protocol === "file:" && offline){
      data = offline;
    }else{
      try{
        const [classrooms, days, timeslots, academicPeriod] = await Promise.all([
          fetchJson("data/classrooms.json"),
          fetchJson("data/days.json"),
          fetchJson("data/timeslots.json"),
          fetchJson("data/academic-period.json")
        ]);
        const schedule = await fetchJson(academicPeriod.scheduleFile);
        data = {classrooms, days, timeslots, academicPeriod, schedule};
      }catch(fetchError){
        if(!offline) throw fetchError;
        console.warn("JSON fetch failed; using offline kiosk data fallback.", fetchError);
        data = offline;
      }
    }

    validateFreeRoomsData(data);
    freeRoomsState.classrooms = data.classrooms;
    freeRoomsState.days = data.days;
    freeRoomsState.timeslots = data.timeslots;
    freeRoomsState.academicPeriod = data.academicPeriod;
    freeRoomsState.schedule = data.schedule;
    freeRoomsState.loaded = true;
  }catch(error){
    console.error("Free classrooms data load error:", error);
    freeRoomsState.loadError = error;
  }finally{
    freeRoomsState.loading = false;
    renderFreeClassroomsDataState();
  }
}

const findAvailableRooms = (...args) => ClassroomAvailability.findAvailableRooms(...args);
const sortClassroomsNaturally = (...args) => ClassroomAvailability.sortClassroomsNaturally(...args);
window.findAvailableRooms = findAvailableRooms;
window.sortClassroomsNaturally = sortClassroomsNaturally;

function getDay(dayId){
  return freeRoomsState.days.find(d=>d.id === dayId) || null;
}
function getTime(timeId){
  return freeRoomsState.timeslots.find(t=>t.id === timeId) || null;
}
function localizedDay(day){
  if(!day) return "";
  return (typeof lang !== "undefined" && lang === "kk") ? day.kz : day.ru;
}

function renderDayOptions(){
  const root = document.getElementById("freeDayOptions");
  if(!root || !freeRoomsState.loaded) return;
  root.innerHTML = "";
  freeRoomsState.days.forEach(day=>{
    const selected = freeRoomsState.selectedDay === day.id;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `selector-card day-card${selected ? " selected" : ""}`;
    btn.setAttribute("role","radio");
    btn.setAttribute("aria-checked", selected ? "true" : "false");
    btn.dataset.value = day.id;
    btn.innerHTML = `<span class="fake-check" aria-hidden="true"></span><span>${localizedDay(day)}</span>`;
    btn.addEventListener("click",()=>selectFreeDay(day.id));
    root.appendChild(btn);
  });
}

function renderTimeOptions(){
  const root = document.getElementById("freeTimeOptions");
  if(!root || !freeRoomsState.loaded) return;
  const tx = currentFreeText();
  root.innerHTML = "";
  [1,2].forEach(shift=>{
    const group = document.createElement("div");
    group.className = "shift-group";
    const title = document.createElement("div");
    title.className = "shift-title";
    title.innerHTML = `<span>${shift}</span>${shift === 1 ? tx.shift1 : tx.shift2}`;
    group.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "timeslot-grid";
    freeRoomsState.timeslots.filter(t=>Number(t.shift)===shift).forEach(slot=>{
      const selected = freeRoomsState.selectedTime === slot.id;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `selector-card time-card${selected ? " selected" : ""}`;
      btn.setAttribute("role","radio");
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.dataset.value = slot.id;
      btn.innerHTML = `<span class="fake-check" aria-hidden="true"></span><span>${slot.label || `${slot.start}–${slot.end}`}</span>`;
      btn.addEventListener("click",()=>selectFreeTime(slot.id));
      grid.appendChild(btn);
    });
    group.appendChild(grid);
    root.appendChild(group);
  });
}

function selectFreeDay(dayId){
  freeRoomsState.selectedDay = dayId;
  freeRoomsState.lastResults = null;
  renderDayOptions();
  updateFreeSearchControls();
}

function selectFreeTime(timeId){
  freeRoomsState.selectedTime = timeId;
  freeRoomsState.lastResults = null;
  renderTimeOptions();
  updateFreeSearchControls();
}

function updateFreeSearchControls(){
  const btn = document.getElementById("freeSearchButton");
  const summary = document.getElementById("freeSelectionSummary");
  const validation = document.getElementById("freeValidation");
  if(!btn || !summary) return;
  const day = getDay(freeRoomsState.selectedDay);
  const time = getTime(freeRoomsState.selectedTime);
  btn.disabled = !(day && time && freeRoomsState.loaded && !freeRoomsState.loadError);
  if(validation) validation.textContent = "";
  const tx = currentFreeText();
  const parts=[];
  if(day) parts.push(`${tx.day}: ${localizedDay(day)}`);
  if(time) parts.push(`${tx.time}: ${time.label || `${time.start}–${time.end}`}`);
  summary.textContent = parts.length ? `${tx.selected}: ${parts.join(" · ")}` : "";
}

function renderAcademicPeriod(){
  const badge = document.getElementById("academicPeriodBadge");
  if(!badge || !freeRoomsState.academicPeriod) return;
  const tx = currentFreeText();
  badge.textContent = tx.period(freeRoomsState.academicPeriod.activeAcademicYear, freeRoomsState.academicPeriod.activeSemester);
}

function renderFreeClassroomsDataState(){
  const errorBox = document.getElementById("freeDataError");
  const panel = document.getElementById("freeSearchPanel");
  if(!errorBox || !panel) return;
  if(freeRoomsState.loadError){
    const tx=currentFreeText();
    errorBox.textContent = freeRoomsState.classrooms.length ? tx.dataError : tx.roomsError;
    errorBox.hidden = false;
    panel.classList.add("data-disabled");
    return;
  }
  errorBox.hidden = true;
  panel.classList.remove("data-disabled");
  if(freeRoomsState.loaded){
    renderAcademicPeriod();
    renderDayOptions();
    renderTimeOptions();
    updateFreeSearchControls();
  }
}

function showFreeClassrooms(){
  show("freeClassrooms");
  loadFreeRoomsData();
  refreshFreeClassroomsLanguage();
}
window.showFreeClassrooms = showFreeClassrooms;

function roomCardHtml(room){
  const tx=currentFreeText();
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  return `
    <article class="room-card">
      <div class="room-card-top">
        <div class="room-number"><small>${tx.room}</small><strong>${safe(room.room)}</strong></div>
        <div class="room-status"><span class="status-dot"></span>${tx.free}</div>
      </div>
      <div class="room-names">
        <div><span>${tx.kzName}</span><b>${safe(room.nameKz)}</b></div>
        <div><span>${tx.ruName}</span><b>${safe(room.nameRu)}</b></div>
      </div>
      <div class="room-meta">
        <div><span>${tx.capacity}</span><strong>${safe(room.capacity)} ${tx.seats}</strong></div>
        <div><span>${tx.status}</span><strong class="free-text">● ${tx.free}</strong></div>
      </div>
    </article>`;
}

async function searchFreeClassrooms(){
  const tx=currentFreeText();
  const validation=document.getElementById("freeValidation");
  const resultArea=document.getElementById("freeResultArea");
  const agentMessage=document.getElementById("freeAgentMessage");
  const typing=document.getElementById("freeTyping");
  const resultsRoot=document.getElementById("freeRoomResults");
  const toolbar=document.getElementById("freeResultsToolbar");
  const countEl=document.getElementById("freeResultsCount");
  const searchBtn=document.getElementById("freeSearchButton");

  if(!freeRoomsState.selectedDay){
    if(validation) validation.textContent=tx.selectDay;
    return;
  }
  if(!freeRoomsState.selectedTime){
    if(validation) validation.textContent=tx.selectTime;
    return;
  }
  if(!freeRoomsState.loaded || freeRoomsState.loadError) return;

  if(validation) validation.textContent="";
  resultArea.hidden=false;
  toolbar.hidden=true;
  resultsRoot.innerHTML="";
  agentMessage.textContent=tx.loading;
  typing.hidden=false;
  searchBtn.disabled=true;
  resultArea.scrollIntoView({behavior:"smooth",block:"start"});

  await new Promise(resolve=>setTimeout(resolve, 550));

  const results=findAvailableRooms(
    freeRoomsState.selectedDay,
    freeRoomsState.selectedTime,
    freeRoomsState.classrooms,
    freeRoomsState.schedule
  );
  freeRoomsState.lastResults=results;

  const day=getDay(freeRoomsState.selectedDay);
  const time=getTime(freeRoomsState.selectedTime);
  const dayText=localizedDay(day);
  const timeText=time.label || `${time.start}–${time.end}`;
  typing.hidden=true;

  if(results.length === 0){
    agentMessage.textContent=tx.none(dayText,timeText);
    countEl.textContent=tx.count(0);
    toolbar.hidden=false;
    resultsRoot.innerHTML=`<div class="empty-rooms"><div class="empty-icon">⌁</div><p>${tx.none(dayText,timeText)}</p></div>`;
  }else{
    if(typeof lang !== "undefined" && lang === "kk"){
      agentMessage.textContent=`${tx.foundPrefix} ${dayText} күні ${timeText} ${tx.foundMiddle} ${tx.foundSuffix}`;
    }else{
      agentMessage.textContent=`${tx.foundPrefix}: ${dayText}, ${timeText} ${tx.foundSuffix}`;
    }
    countEl.textContent=tx.count(results.length);
    toolbar.hidden=false;
    resultsRoot.innerHTML=results.map(roomCardHtml).join("");
  }
  searchBtn.disabled=false;
  resetIdle();
}
window.searchFreeClassrooms=searchFreeClassrooms;

function resetFreeClassroomsSearch(){
  freeRoomsState.selectedDay=null;
  freeRoomsState.selectedTime=null;
  freeRoomsState.lastResults=null;
  const resultArea=document.getElementById("freeResultArea");
  if(resultArea) resultArea.hidden=true;
  const resultsRoot=document.getElementById("freeRoomResults");
  if(resultsRoot) resultsRoot.innerHTML="";
  renderDayOptions();
  renderTimeOptions();
  updateFreeSearchControls();
  const panel=document.getElementById("freeSearchPanel");
  if(panel) panel.scrollIntoView({behavior:"smooth",block:"start"});
}
window.resetFreeClassroomsSearch=resetFreeClassroomsSearch;
window.resetFreeClassrooms=resetFreeClassroomsSearch;

function refreshFreeClassroomsLanguage(){
  if(!document.getElementById("freeClassrooms")) return;
  renderAcademicPeriod();
  if(freeRoomsState.loaded){
    renderDayOptions();
    renderTimeOptions();
    updateFreeSearchControls();
  }
  if(freeRoomsState.lastResults !== null){
    // Re-render existing result in the newly selected UI language without recomputing data.
    const results=freeRoomsState.lastResults;
    const day=getDay(freeRoomsState.selectedDay);
    const time=getTime(freeRoomsState.selectedTime);
    const tx=currentFreeText();
    const dayText=localizedDay(day);
    const timeText=time ? (time.label || `${time.start}–${time.end}`) : "";
    const msg=document.getElementById("freeAgentMessage");
    const count=document.getElementById("freeResultsCount");
    const root=document.getElementById("freeRoomResults");
    if(results.length===0){
      if(msg) msg.textContent=tx.none(dayText,timeText);
      if(count) count.textContent=tx.count(0);
      if(root) root.innerHTML=`<div class="empty-rooms"><div class="empty-icon">⌁</div><p>${tx.none(dayText,timeText)}</p></div>`;
    }else{
      if(msg){
        msg.textContent = (typeof lang !== "undefined" && lang === "kk")
          ? `${tx.foundPrefix} ${dayText} күні ${timeText} ${tx.foundMiddle} ${tx.foundSuffix}`
          : `${tx.foundPrefix}: ${dayText}, ${timeText} ${tx.foundSuffix}`;
      }
      if(count) count.textContent=tx.count(results.length);
      if(root) root.innerHTML=results.map(roomCardHtml).join("");
    }
  }
}
window.refreshFreeClassroomsLanguage=refreshFreeClassroomsLanguage;

loadFreeRoomsData();
refreshFreeClassroomsLanguage();
