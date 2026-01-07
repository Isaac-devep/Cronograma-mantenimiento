import { useMemo } from 'react';
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
                        // Note: In case of multiple same-weekdays being free in a month (rare but possible in logic),
                        // the UI in Excel shows one cell. But wait, Excel has 1 row per Month.
                        // If Jan has multiple "free Mondays", how does Excel show it?
                        // Looking at the image: "LUNES 13". JUST ONE number.
                        // What if Jan 20 and Jan 27 are also free?
                        // The prompt only lists specific dates. "13 21 15 16 17".
                        // It seems there is at most ONE free date per weekday column per month in this specific roster.
                        // OR, maybe multiple numbers? The image shows just one.
                        // We will store all of them, and join them with comma if multiple.
                        if (!row.cells[colName]) row.cells[colName] = [];
                        row.cells[colName].push(dayOfMonth);
                    }
                }
                date.setDate(date.getDate() + 1);
            }

            // Now handle "Extra/Dias Libres"
            // Any freeDay that was NOT placed in the grid columns?
            // Actually, the user said "Dias libres al final".
            // In the image, "31" is in "Dias libres".
            // Jan 31 2026 is a Saturday. 
            // If Jan 31 is in freeDays, our logic above would put it in the "Sábado" column.
            // But in the User's Image, "Sábado" column for Enero has "17".
            // "31" is in the separate table.
            // This suggests the Main Grid only holds the "Shift Rotation Free Days" and the Side Table holds "Extra Free Days".
            // BUT, we only have one list of numbers.
            // Heuristic: If we have multiple free saturdays, maybe the later one goes to extra?
            // Or maybe we just list ALL free days in the grid, and "Dias libres" is just a summary?
            // The user said "lo otro seria colocar los dias libre al final de mes para imprevistos".
            // Suggestion: Filter out the days that are clearly "Roster Free Days" vs "Extra".
            // But we don't know the logic.
            // Let's TRY to put ALL of them in the grid cells first.
            // If the User specifically wants that "Dias Libres" column, we can list dates that are 'overflow' or maybe dates > 28?
            // No, Jan 31 is Sat. Jan 17 is Sat.
            // Let's do this: 
            // We fill the grid cells. If a cell already has a value, we append?
            // Or we create a separate "Extra" list for dates > 28? No that's arbitrary.
            // Let's look at the Image 1 again.
            // Enero: Lunes (Empty), Martes 13, Miér 21, Jue 15, Vie 16, Sáb 17.
            // "Dias libres": 31.
            // Jan 31 is Saturday.
            // So Jan has TWO free Saturdays: 17 and 31.
            // The Excel puts 17 in the "Sábado" col, and 31 in the "Dias libres".
            // Logic: The FIRST occurrence of a free day for that weekday goes to the grid. Subsequent ones go to Extra?
            // Let's try that logic.

            const usedDates = new Set();

            // We iterate WEEKDAYS orders to fill the main grid first with the 'earliest' free day?
            // Or just iterate the freeDays array?
            // The freeDays array in prompt: [13, 21, 15, 16, 17, 31].
            // It's not sorted.
            // Let's sort them.
            const sortedFreeRequest = [...freeDaysInMonth].sort((a, b) => a - b);

            // We'll iterate the sorted dates.
            // For each date, find its weekday.
            // If that weekday column is EMPTY in our row, put it there.
            // ELSE, put it in "Extra".

            sortedFreeRequest.forEach(dayNum => {
                const d = new Date(CURRENT_YEAR, monthIndex, dayNum);
                const dayIdx = d.getDay();
                if (dayIdx === 0) {
                    // Sundays always extra? Or ignored? Let's put in extra to be safe.
                    row.extra.push(dayNum);
                } else {
                    const colName = WEEKDAYS[dayIdx - 1]; // Mon-Sat
                    if (!row.cells[colName]) {
                        row.cells[colName] = []; // We use array but logic says we only want 1
                        row.cells[colName].push(dayNum);
                    } else {
                        // Collision! This weekday spot is taken.
                        row.extra.push(dayNum);
                    }
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
                                {WEEKDAYS.map(dayName => {
                                    const days = row.cells[dayName];
                                    return (
                                        <td key={dayName} className="day-cell">
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
            {/* Schedule Table Below */}
            <div className="schedule-table-wrapper">
                <table className="schedule-table">
                    <thead>
                        <tr>
                            <th>HORARIO</th>
                            {WEEKDAYS.map(d => <th key={d}>{d}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(selectedGroup.schedule).map(([timeRange, weekMap]) => (
                            <tr key={timeRange}>
                                <td className="time-cell">{timeRange}</td>
                                {WEEKDAYS.map(d => {
                                    const cellValue = weekMap[d] || "";
                                    // Case-insensitive check
                                    const isMatch = searchTerm && searchTerm.trim().length > 0 &&
                                        cellValue.toLowerCase().includes(searchTerm.toLowerCase());

                                    return (
                                        <td key={d} className={`sched-cell ${cellValue ? 'filled' : ''} ${isMatch ? 'highlight-match' : ''}`}>
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
