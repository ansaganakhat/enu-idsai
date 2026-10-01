# Бос аудиториялар / Свободные аудитории

Бұл функционал қазіргі ENU · IDSAI kiosk жобасына **5-пункт** ретінде қосылған. Алдыңғы 1–4 пункттердің логикасы өзгертілмейді.

## Қосылған файлдар

- `free-classrooms.js` — selector/chat UI және бет логикасы.
- `classroom-availability-service.js` — UI-дан тәуелсіз бос аудиторияны есептеу сервисі.
- `data/classrooms.json` — аудитория нөмірі, қазақша/орысша атауы, сыйымдылығы.
- `data/days.json` — күн ID-лері және екі тілдегі атаулар.
- `data/timeslots.json` — 13 уақыт интервалы және смена нөмірі.
- `data/academic-period.json` — белсенді оқу жылы/семестр және schedule файлы.
- `data/schedules/2026-semester-1.json` — 2026, 1-семестрдің occupied сабақ деректері.
- `data/offline-data.js` — сайтты `file://` арқылы ашқанда қолданылатын автоматты fallback.
- `data/source/ENU_barlyk_bos_auditoriyalar_2026_1_semester.xlsx` — осы нұсқа жасалған бастапқы Excel.
- `tools/build-offline-data.js` — JSON өзгергеннен кейін offline fallback-ты қайта жасайды.
- `tests/free-classrooms.test.js` — availability логикасының автоматты тесттері.

## Іздеу алгоритмі

Пайдаланушы бір күн және бір уақыт таңдайды. Сервис `schedule.lessons` ішінен дәл сол `day + time` комбинациясында бар аудиторияларды occupied деп белгілейді. Қалған `classrooms.json` аудиториялары бос деп есептеледі.

Нәтиже аудитория нөмірі бойынша табиғи ретпен сұрыпталады, соның ішінде `501а`, `502а`, `502б`, `504а`, `504б`, `508а`, `508б` дұрыс орналасады.

## Қазіргі active period

`data/academic-period.json`:

```json
{
  "activeAcademicYear": "2026",
  "activeSemester": 1,
  "scheduleFile": "data/schedules/2026-semester-1.json"
}
```

## Келесі семестрге ауыстыру

1. Жаңа schedule JSON-ды `data/schedules/` ішіне салыңыз, мысалы:
   `2026-semester-2.json`.
2. `data/academic-period.json` ішінде:
   - `activeAcademicYear`;
   - `activeSemester`;
   - `scheduleFile`
   мәндерін өзгертіңіз.
3. GitHub Pages қолданылса — осы жеткілікті.
4. Егер сайтты компьютерде тікелей `index.html` (`file://`) арқылы ашатын болсаңыз, бір рет:

```bash
node tools/build-offline-data.js
```

іске қосыңыз. Бұл `offline-data.js` файлын жаңа active schedule бойынша қайта жасайды.

Frontend HTML/CSS кодын өзгерту қажет емес.

## Schedule форматы

```json
{
  "academicYear": "2026",
  "semester": 1,
  "lessons": [
    {
      "room": "404",
      "day": "monday",
      "time": "10:00-10:50"
    }
  ]
}
```

Мұнда `lessons` ішіндегі аудитория сол уақытта бос емес. `lessons` ішінде жоқ аудитория — бос.

## Тест

Node.js бар компьютерде:

```bash
node tests/free-classrooms.test.js
```

Қазіргі build үшін күтілетін нәтиже:

```text
PASS: free-classrooms availability tests
```
