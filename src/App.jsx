import { useState, useMemo } from 'react';
import { SCHEDULE_DATA } from './data/scheduleData';
import ExcelView from './ExcelView';
import './index.css';

function App() {
  const [selectedGroupId, setSelectedGroupId] = useState(SCHEDULE_DATA[0].id);
  const year = 2026;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cronograma de Mantenimiento {year}</h1>
      </header>

      <div className="controls">
        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Seleccionar Grupo:</label>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="group-selector"
        >
          {SCHEDULE_DATA.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </div>

      <ExcelView selectedGroupId={selectedGroupId} />
    </div>
  );
}

export default App;
