import { useState, useMemo } from 'react';
import { SCHEDULE_DATA } from './data/scheduleData';
import './index.css';

const MONTHS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getDaysInMonth(monthIndex, year = 2026) {
  const date = new Date(year, monthIndex, 1);
  const days = [];
  while (date.getMonth() === monthIndex) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function App() {
  const [selectedGroupId, setSelectedGroupId] = useState(SCHEDULE_DATA[0].id);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // January
  const year = 2026;

  const selectedGroup = useMemo(() =>
    SCHEDULE_DATA.find(g => g.id === selectedGroupId),
    [selectedGroupId]);

  const monthName = MONTHS[currentMonthIndex];
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonthIndex, year), [currentMonthIndex]);

  // Transform schedule to easy lookup
  // schedule: { "8:00": { "Lunes": "Place" } }
  // We want to know for a given weekday, what are the shifts?
  const shiftsByDay = useMemo(() => {
    const shifts = {};
    if (!selectedGroup) return {};

    // Iterate over schedule structure
    Object.entries(selectedGroup.schedule).forEach(([timeRange, weekMap]) => {
      Object.entries(weekMap).forEach(([dayName, location]) => {
        if (location && location.trim() !== "") {
          if (!shifts[dayName]) shifts[dayName] = [];
          shifts[dayName].push({ time: timeRange, location });
        }
      });
    });
    return shifts;
  }, [selectedGroup]);

  const freeDaysSet = useMemo(() => {
    if (!selectedGroup || !selectedGroup.freeDays[monthName]) return new Set();
    return new Set(selectedGroup.freeDays[monthName]);
  }, [selectedGroup, monthName]);

  const handlePrevMonth = () => setCurrentMonthIndex(prev => Math.max(0, prev - 1));
  const handleNextMonth = () => setCurrentMonthIndex(prev => Math.min(11, prev + 1));

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cronograma de Mantenimiento {year}</h1>
      </header>

      <div className="controls">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="group-selector"
        >
          {SCHEDULE_DATA.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        <div className="month-nav">
          <button onClick={handlePrevMonth} disabled={currentMonthIndex === 0}>&lt;</button>
          <span>{monthName}</span>
          <button onClick={handleNextMonth} disabled={currentMonthIndex === 11}>&gt;</button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}

        {/* Fill empty slots before first day */}
        {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell empty" />
        ))}

        {daysInMonth.map(date => {
          const dateNum = date.getDate();
          const dayOfWeekIndex = date.getDay();
          const dayName = DAYS_OF_WEEK[dayOfWeekIndex]; // "Lunes", etc.

          const isFree = freeDaysSet.has(dateNum);
          const dayShifts = shiftsByDay[dayName] || [];

          return (
            <div key={dateNum} className={`calendar-cell ${isFree ? 'free-day' : ''}`}>
              <div className="date-number">{dateNum}</div>
              <div className="cell-content">
                {isFree ? (
                  <span className="badge-free">LIBRE</span>
                ) : (
                  dayShifts.length > 0 ? (
                    <div className="shifts-list">
                      {dayShifts.map((shift, idx) => (
                        <div key={idx} className="shift-item">
                          <span className="shift-time">{shift.time.split('--')[0]}</span>
                          <span className="shift-loc" title={shift.location}>{shift.location}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="no-shift">-</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
