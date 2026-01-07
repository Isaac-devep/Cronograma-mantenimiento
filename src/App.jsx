import { useState } from 'react';
import { SCHEDULE_DATA } from './data/scheduleData';
import ExcelView from './ExcelView';
import './index.css';

function App() {
  const [selectedGroupId, setSelectedGroupId] = useState(SCHEDULE_DATA[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const year = 2026;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cronograma de Mantenimiento {year}</h1>
      </header>

      <div className="controls">
        <div className="control-group">
          <label className="control-label">Grupo:</label>
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

        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar lugar (ej. Mar Azul)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
              title="Borrar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <ExcelView selectedGroupId={selectedGroupId} searchTerm={searchTerm} />
    </div>
  );
}

export default App;
