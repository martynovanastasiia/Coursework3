/* App.jsx */
import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Метадані рецептів ───────────────────────────────────────────────────────
const RECIPES = {
  SOAP: {
    id: 'SOAP', name: 'Еко-Мило',
    leftLabel: 'ОЛІЇ', rightLabel: 'ЛУГ',
    emoji: '🧼', color: 'soap',
    description: 'Холодне омилення рослинних олій лужним розчином'
  },
  CHOCOLATE: {
    id: 'CHOCOLATE', name: 'Крафт Шоколад',
    leftLabel: 'КАКАО-БОБИ', rightLabel: 'МАСЛО/ЦУКОР',
    emoji: '🍫', color: 'choco',
    description: 'Темперування какао та конширування суміші'
  },
  PHARMA: {
    id: 'PHARMA', name: 'API Розчин',
    leftLabel: 'РОЗЧИННИК', rightLabel: 'АКТИВНИЙ АФІ',
    emoji: '💊', color: 'pharma',
    description: 'Стерильне розчинення активного фармацевтичного інгредієнту'
  }
}

// ─── Назви кроків процесу для прогрес-бару ──────────────────────────────────
const STEP_LABELS = ['—', 'Завантаження', 'Підготовка', 'Передача', 'Реакція', 'Вивантаження']

// ─── Компонент: Термометр у баку ─────────────────────────────────────────────
function Thermometer({ temp, maxTemp = 100 }) {
  const pct = Math.min(100, Math.max(0, ((temp - 20) / (maxTemp - 20)) * 100))
  const hot = temp > 60
  return (
    <div className="thermometer" title={`${temp.toFixed(1)}°C`}>
      <div className="thermo-tube">
        <div
          className={`thermo-fill ${hot ? 'hot' : 'cool'}`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="thermo-label">{Math.round(temp)}°</span>
    </div>
  )
}

// ─── Компонент: Один бак ──────────────────────────────────────────────────────
function TankUI({ title, data, maxVol, colorClass, type, hideTopPipe, hideBottomPipe }) {
  const marks = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(m => m < maxVol)
  return (
    <div className={`tank-wrapper ${type}`}>
      {/* Вхідний кран */}
      <div className={`valve-assembly top-v ${data.inputValveOpen ? 'open' : ''}`}>
        {!hideTopPipe && (
          <div className={`pipe-segment ${data.inputValveOpen ? `flow-${colorClass}` : ''}`} />
        )}
        <div className="valve-handle" />
      </div>

      {/* Корпус бака */}
      <div className="tank-structure">
        <div className="tank-glass">
          {/* Шкала */}
          <div className="tank-scale">
            {marks.map(vol => (
              <div key={vol} className="scale-mark" style={{ bottom: `${(vol / maxVol) * 100}%` }} />
            ))}
          </div>

          {/* Назва речовини */}
          <div className="substance-name">{title}</div>

          {/* Рідина */}
          <div
            className={`liquid-fill ${colorClass} ${data.heaterOn ? 'boiling' : ''}`}
            style={{ height: `${(data.currentLevel / maxVol) * 100}%` }}
          />

          {/* Мікрсер */}
          {data.mixerOn && (
            <div className="mixer-assembly">
              <div className="mixer-shaft" />
              <div className="mixer-blades" />
            </div>
          )}

          {/* Датчики рівня */}
          <div className={`led-sensor sensor-h ${data.highSensor ? 'active' : ''}`} />
          <div className={`led-sensor sensor-l ${data.lowSensor ? 'active' : ''}`} />

          {/* Показник об'єму */}
          {data.currentLevel > 5 && (
            <div className="vol-indicator">{Math.round(data.currentLevel)}л</div>
          )}

          {/* Термометр */}
          <Thermometer temp={data.temperature} maxTemp={maxVol === 100 ? 100 : 80} />
        </div>
      </div>

      {/* Вихідний кран */}
      <div className={`valve-assembly bottom-v ${data.outputValveOpen ? 'open' : ''}`}>
        <div className="valve-handle" />
        {!hideBottomPipe && (
          <div className={`pipe-segment drain-pipe ${data.outputValveOpen ? `flow-${colorClass}` : ''}`} />
        )}
      </div>
    </div>
  )
}

// ─── Компонент: Прогрес-бар процесу ──────────────────────────────────────────
function ProcessProgress({ stepIndex, totalSteps, stepProgress, processState }) {
  const isActive  = processState !== 'IDLE' && processState !== 'DONE'
  const isDone    = processState === 'DONE'

  return (
    <div className="process-progress">
      <div className="progress-steps">
        {STEP_LABELS.slice(1).map((label, i) => {
          const idx = i + 1
          const done    = idx < stepIndex || isDone
          const current = idx === stepIndex && isActive
          return (
            <div key={idx} className={`progress-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
              <div className="step-dot">{done ? '✓' : idx}</div>
              <div className="step-label">{label}</div>
              {idx < STEP_LABELS.length - 1 && (
                <div className={`step-line ${done ? 'done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
      {isActive && (
        <div className="step-progress-bar">
          <div className="step-progress-fill" style={{ width: `${stepProgress * 100}%` }} />
        </div>
      )}
    </div>
  )
}

// ─── Компонент: Журнал подій ──────────────────────────────────────────────────
function EventLog({ events }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  return (
    <div className="event-log">
      <div className="log-header">
        <span className="log-dot" /> Журнал подій
      </div>
      <div className="log-body" ref={logRef}>
        {events.length === 0 ? (
          <div className="log-empty">Очікування запуску...</div>
        ) : (
          events.map((evt, i) => (
            <div key={i} className="log-row">{evt}</div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Головний компонент ───────────────────────────────────────────────────────
function App() {
  const [status, setStatus]               = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState('SOAP')
  const [showResult, setShowResult]       = useState(false)

  useEffect(() => {
    let isProcessing = false

    const interval = setInterval(async () => {
      if (isProcessing) return
      isProcessing = true
      try {
        const res = await fetch('http://localhost:8080/api/simulator/status')
        const currentStatus = await res.json()
        setStatus(currentStatus)

        if (currentStatus.processState === 'DONE' && !showResult) {
          setShowResult(true)
        }

        const state = currentStatus.processState
        if (state !== 'IDLE' && state !== 'DONE') {
          await fetch('http://localhost:8080/api/simulator/tick', { method: 'POST' })
        }
      } catch (err) {
        console.error('Помилка з\'єднання з сервером:', err)
      } finally {
        isProcessing = false
      }
    }, 100)

    return () => clearInterval(interval)
  }, [showResult])

  const startSimulator = async () => {
    setShowResult(false)
    await fetch(`http://localhost:8080/api/simulator/start?recipe=${selectedRecipe}`, { method: 'POST' })
  }

  const stopSimulator = async () => {
    await fetch('http://localhost:8080/api/simulator/stop', { method: 'POST' })
    setShowResult(false)
  }

  const closeResultModal = async () => {
    await fetch('http://localhost:8080/api/simulator/reset', { method: 'POST' })
    setShowResult(false)
  }

  if (!status) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Ініціалізація системи...</p>
      </div>
    )
  }

  const currentRcp = RECIPES[selectedRecipe]
  const isRunning  = status.processState !== 'IDLE' && status.processState !== 'DONE'

  return (
    <div className="app-viewport">
      <header className="glass-header">
        <h1>CONTROL PANEL — MULTI-LINE AGGREGATE</h1>
        <span className={`header-status-badge ${isRunning ? 'running' : ''}`}>
          {isRunning ? '● WORKING' : '○ IDLE'}
        </span>
      </header>

      <main className="main-layout">

        {/* ── Панель рецептів (ліво) ── */}
        <aside className="recipe-sidebar">
          <h3>Лінія виробництва</h3>
          {Object.values(RECIPES).map(rcp => (
            <button
              key={rcp.id}
              className={`recipe-btn ${selectedRecipe === rcp.id ? 'active' : ''}`}
              onClick={() => setSelectedRecipe(rcp.id)}
              disabled={isRunning}
            >
              <span className="emoji">{rcp.emoji}</span>
              <div className="recipe-btn-info">
                <strong>{rcp.name}</strong>
                <small>{rcp.description}</small>
              </div>
            </button>
          ))}
        </aside>

        {/* ── Візуалізатор (центр) ── */}
        <div className="visualizer-card">
          <div className="tanks-grid">

            {/* Верхні баки + трубна розводка */}
            <div className="upper-assembly">
              <div className="row-upper">
                <TankUI
                  title={currentRcp.leftLabel}
                  data={status.oilTank}
                  maxVol={50}
                  colorClass="oil"
                  type="small"
                  hideBottomPipe
                />
                <TankUI
                  title={currentRcp.rightLabel}
                  data={status.lyeTank}
                  maxVol={50}
                  colorClass="lye"
                  type="small"
                  hideBottomPipe
                />
              </div>

              {/* Трубна система */}
              <div className="piping-system">
                <div className={`p-horizontal left  ${status.oilTank.outputValveOpen ? 'flow-oil' : ''}`} />
                <div className={`p-horizontal right ${status.lyeTank.outputValveOpen ? 'flow-lye' : ''}`} />
                <div className={`p-vertical-main ${(status.oilTank.outputValveOpen || status.lyeTank.outputValveOpen) ? 'flow-mixed' : ''}`} />
              </div>
            </div>

            {/* Реактор */}
            <div className="row-lower">
              <TankUI
                title="РЕАКТОР"
                data={status.reactorTank}
                maxVol={100}
                colorClass={currentRcp.color}
                type="large"
                hideTopPipe
              />
            </div>
          </div>

          {/* Прогрес кроків */}
          <ProcessProgress
            stepIndex={status.currentStepIndex}
            totalSteps={status.totalSteps}
            stepProgress={status.stepProgress}
            processState={status.processState}
          />
        </div>

        {/* ── Права панель ── */}
        <aside className="side-controls">

          {/* Стан */}
          <div className="state-card">
            <label>Поточний етап</label>
            <div className="state-badge">{status.processState}</div>
          </div>

          {/* Кнопки */}
          <button
            className={`action-button start-btn ${isRunning ? 'disabled' : ''}`}
            onClick={startSimulator}
            disabled={isRunning}
          >
            {isRunning ? '⏳ В ПРОЦЕСІ...' : '▶ ПОЧАТИ ПРОЦЕС'}
          </button>

          <button className="action-button stop-btn" onClick={stopSimulator}>
            🚨 АВАРІЙНА ЗУПИНКА
          </button>

          {/* Журнал подій */}
          <EventLog events={status.eventLog || []} />
        </aside>
      </main>

      {/* ── Модальне вікно готового продукту ── */}
      {showResult && (
        <div className="result-modal-overlay">
          <div className="result-modal">
            <h2>Процес завершено!</h2>
            <div className="product-showcase">
              <span className="product-emoji">{currentRcp.emoji}</span>
            </div>
            <p>Продукт <strong>{currentRcp.name}</strong> успішно виготовлено та готовий до відправки!</p>
            <button className="action-button" onClick={closeResultModal}>
              Прийняти продукт
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
