/* App.jsx */
import { useState, useEffect } from 'react'
import './App.css'

const RECIPES = {
  SOAP: { id: 'SOAP', name: 'Еко-Мило', left: 'ОЛІЇ', right: 'ЛУГ', emoji: '🧼', color: 'soap' },
  CHOCOLATE: { id: 'CHOCOLATE', name: 'Крафт Шоколад', left: 'КАКАО-БОБИ', right: 'МАСЛО/ЦУКОР', emoji: '🍫', color: 'choco' },
  LEMONADE: { id: 'LEMONADE', name: 'Енергетик', left: 'СИРОП', right: 'ЕКСТРАКТИ', emoji: '🥤', color: 'energy' }
};
function App() {
  const [status, setStatus] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState('SOAP');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let isProcessing = false;
    const interval = setInterval(async () => {
      if (isProcessing) return;
      isProcessing = true;
      try {
        const res = await fetch('http://localhost:8080/api/simulator/status');
        const currentStatus = await res.json();
        setStatus(currentStatus);

        // Перевірка завершення процесу
        if (currentStatus.processState === 'DONE' && !showResult) {
          setShowResult(true);
        }

        if (currentStatus.processState !== 'IDLE' && currentStatus.processState !== 'DONE') {
          await fetch('http://localhost:8080/api/simulator/tick', { method: 'POST' });
        }
      } catch (error) {
        console.error("Помилка:", error);
      } finally {
        isProcessing = false;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showResult]);

  const startSimulator = async () => {
    setShowResult(false);
    await fetch(`http://localhost:8080/api/simulator/start?recipe=${selectedRecipe}`, { method: 'POST' });
  };

  const stopSimulator = async () => {
    await fetch('http://localhost:8080/api/simulator/stop', { method: 'POST' });
    setShowResult(false);
  };

  const closeResultModal = async () => {
    await fetch('http://localhost:8080/api/simulator/reset', { method: 'POST' });
    setShowResult(false);
  };

  if (!status) return <div className="loading">Initializing System...</div>;

  const currentRcp = RECIPES[selectedRecipe];
  const isRunning = status.processState !== 'IDLE' && status.processState !== 'DONE';

  // TankUI залишається майже без змін, тільки назви беремо з currentRcp
  const TankUI = ({ title, data, maxVol, colorClass, type, hideTopPipe, hideBottomPipe }) => {
    const marks = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(m => m < maxVol);
    return (
        <div className={`tank-wrapper ${type}`}>
          <div className={`valve-assembly top-v ${data.inputValveOpen ? 'open' : ''}`}>
            {!hideTopPipe && <div className={`pipe-segment ${data.inputValveOpen ? `flow-${colorClass}` : ''}`}></div>}
            <div className="valve-handle"></div>
          </div>
          <div className="tank-structure">
            <div className="tank-glass">
              <div className="tank-scale">
                {marks.map(vol => (<div key={vol} className="scale-mark" style={{ bottom: `${(vol / maxVol) * 100}%` }}></div>))}
              </div>
              <div className="substance-name">{title}</div>
              <div className={`liquid-fill ${colorClass} ${data.heaterOn ? 'boiling' : ''}`} style={{ height: `${(data.currentLevel / maxVol) * 100}%` }}></div>
              {data.mixerOn && (
                  <div className="mixer-assembly">
                    <div className="mixer-shaft"></div>
                    <div className="mixer-blades"></div>
                  </div>
              )}
              <div className={`led-sensor sensor-h ${data.highSensor ? 'active' : ''}`}></div>
              <div className={`led-sensor sensor-l ${data.lowSensor ? 'active' : ''}`}></div>
            </div>
          </div>
          <div className={`valve-assembly bottom-v ${data.outputValveOpen ? 'open' : ''}`}>
            <div className="valve-handle"></div>
            {!hideBottomPipe && <div className={`pipe-segment drain-pipe ${data.outputValveOpen ? `flow-${colorClass}` : ''}`}></div>}
          </div>
        </div>
    );
  };

  return (
      <div className="app-viewport">
        <header className="glass-header">
          <h1>CONTROL PANEL: MULTI-LINE AGGREGATE</h1>
        </header>

        <main className="main-layout">

          {/* НОВЕ: Панель вибору продукту (зліва) */}
          <aside className="recipe-sidebar">
            <h3>Лінія виробництва</h3>
            {Object.values(RECIPES).map(rcp => (
                <button
                    key={rcp.id}
                    className={`recipe-btn ${selectedRecipe === rcp.id ? 'active' : ''}`}
                    onClick={() => setSelectedRecipe(rcp.id)}
                    disabled={isRunning}
                >
                  <span className="emoji">{rcp.emoji}</span> {rcp.name}
                </button>
            ))}
          </aside>

          <div className="visualizer-card">
            <div className="tanks-grid">
              <div className="upper-assembly">
                <div className="row-upper">
                  <TankUI title={currentRcp.left} data={status.oilTank} maxVol={50} colorClass="oil" type="small" hideBottomPipe={true} />
                  <TankUI title={currentRcp.right} data={status.lyeTank} maxVol={50} colorClass="lye" type="small" hideBottomPipe={true} />
                </div>
                <div className="piping-system">
                  <div className={`p-horizontal left ${status.oilTank.outputValveOpen ? 'flow-oil' : ''}`}></div>
                  <div className={`p-horizontal right ${status.lyeTank.outputValveOpen ? 'flow-lye' : ''}`}></div>
                  <div className={`p-vertical-main ${(status.oilTank.outputValveOpen || status.lyeTank.outputValveOpen) ? 'flow-mixed' : ''}`}></div>
                </div>
              </div>
              <div className="row-lower">
                <TankUI title="РЕАКТОР" data={status.reactorTank} maxVol={100} colorClass={currentRcp.color} type="large" hideTopPipe={true} />
              </div>
            </div>
          </div>

          <aside className="side-controls">
            <div className="state-card">
              <label>Поточний етап</label>
              <div className="state-badge">{status.processState}</div>
            </div>

            <button className={`action-button start-btn ${isRunning ? 'disabled' : ''}`} onClick={startSimulator} disabled={isRunning}>
              {isRunning ? "В ПРОЦЕСІ..." : "ПОЧАТИ ПРОЦЕС"}
            </button>

            {/* НОВЕ: Кнопка аварійної зупинки */}
            <button className="action-button stop-btn" onClick={stopSimulator}>
              🚨 АВАРІЙНА ЗУПИНКА
            </button>
          </aside>
        </main>

        {/* НОВЕ: Модальне вікно готового продукту */}
        {showResult && (
            <div className="result-modal-overlay">
              <div className="result-modal">
                <h2>Процес завершено!</h2>
                <div className="product-showcase">
                  <span className="product-emoji">{currentRcp.emoji}</span>
                </div>
                <p>Ваш продукт <strong>{currentRcp.name}</strong> успішно розфасовано та готовий до відправки!</p>
                <button className="action-button" onClick={closeResultModal}>Забрати продукт</button>
              </div>
            </div>
        )}
      </div>
  )
}

export default App