import { useState, useMemo } from 'react';
import { SCHEDULE_DATA } from './data/scheduleData';

const MONTHS = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Only 2026 support for now
const CURRENT_YEAR = 2026;

function ExcelView({ selectedGroupId, searchTerm }) {
    const selectedGroup = SCHEDULE_DATA.find(g => g.id === selectedGroupId) || SCHEDULE_DATA[0];
    const [activeColIndex, setActiveColIndex] = useState(null);

    /**
     * For each month and weekday, we want to find which DATES match.
     * Example: January, Lunes -> which dates in Jan 2026 are Mondays?
     * Then we check if those dates are in the 'freeDays' list for that month.
     */
    const gridData = useMemo(() => {
        const data = [];

        MONTHS.forEach((monthName, monthIndex) => {
            const row = { month: monthName, cells: {}, extra: [] };
            const freeDaysInMonth = selectedGroup.freeDays[monthName] || [];

            // Get all days in this month
            const date = new Date(CURRENT_YEAR, monthIndex, 1);
            while (date.getMonth() === monthIndex) {
                const dayOfWeekIndex = date.getDay(); // 0=Sun, 1=Mon...
                const dayOfMonth = date.getDate();

                // Skip Sundays as they are not in the columns
                if (dayOfWeekIndex !== 0) {
                    // Map JS day index to our WEEKDAYS array index
                    // JS: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
                    // Arr: 0=Mon, 1=Tue...
                    const colIndex = dayOfWeekIndex - 1;
                    const colName = WEEKDAYS[colIndex]; // e.g. "Lunes"

                    // Check if this date is a free day
                    if (freeDaysInMonth.includes(dayOfMonth)) {
                        // We found a free day for this column!
                        // Only add if empty (first one goes to grid, extras go to DÍAS LIBRES)
                        if (!row.cells[colName]) {
                            row.cells[colName] = [dayOfMonth];
                        }
                    }
                }
                date.setDate(date.getDate() + 1);
            }

            // Simple heuristic for extras 
            const sortedFreeRequest = [...freeDaysInMonth].sort((a, b) => a - b);
            const usedDates = new Set();
            Object.values(row.cells).forEach(arr => arr.forEach(d => usedDates.add(d)));

            sortedFreeRequest.forEach(dayNum => {
                if (!usedDates.has(dayNum)) {
                    row.extra.push(dayNum);
                }
            });

            data.push(row);
        });

        return data;
    }, [selectedGroup]);

    return (
        <div className="excel-view-container">
            {/* Main Grid: Months x Weekdays */}
            <div className="excel-grid-wrapper">
                <table className="excel-table">
                    <thead>
                        <tr>
                            <th className="month-col-header"></th>
                            {WEEKDAYS.map(d => <th key={d}>{d.toUpperCase()}</th>)}
                            <th className="extra-col-header">DÍAS LIBRES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gridData.map((row) => (
                            <tr key={row.month}>
                                <td className="month-cell">{row.month}</td>
                                {WEEKDAYS.map((dayName, colIdx) => {
                                    const days = row.cells[dayName];
                                    return (
                                        <td
                                            key={dayName}
                                            className="day-cell"
                                            onMouseEnter={() => setActiveColIndex(colIdx)}
                                            onMouseLeave={() => setActiveColIndex(null)}
                                            style={{ cursor: 'pointer' }}
                                            title="Ver horario abajo"
                                        >
                                            {days ? days.join(", ") : ""}
                                        </td>
                                    );
                                })}
                                <td className="extra-cell">
                                    {row.extra.join("   ")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Schedule Table Below */}
            <div className="schedule-table-wrapper">
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>HORARIO</th>
                            {WEEKDAYS.map((d, i) => (
                                <th key={d} className={i === activeColIndex ? "related-column" : ""}>
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(selectedGroup.schedule).map(([timeRange, weekMap]) => (
                            <tr key={timeRange}>
                                <td className="time-cell">{timeRange}</td>
                                {WEEKDAYS.map((d, colIdx) => {
                                    const cellValue = weekMap[d] || "";
                                    // Case-insensitive check
                                    const isMatch = searchTerm && searchTerm.trim().length > 0 &&
                                        cellValue.toLowerCase().includes(searchTerm.toLowerCase());
                                    const isRelated = colIdx === activeColIndex;

                                    return (
                                        <td key={d} className={`sched-cell ${cellValue ? 'filled' : ''} ${isMatch ? 'highlight-match' : ''} ${isRelated ? 'related-column' : ''}`}>
                                            {cellValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ExcelView;
