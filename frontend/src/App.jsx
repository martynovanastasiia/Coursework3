import { useState, useEffect, useRef } from 'react'
import './App.css'

const RECIPES = {
  SOAP: { id: 'SOAP', name: 'Еко-Мило', leftLabel: 'ОЛІЇ', rightLabel: 'ЛУГ', emoji: '🧼', leftColor: 'oil', rightColor: 'lye', finalColor: 'soap', eqLeft: 'mixer', eqRight: 'mixer', hideRight: false },
  CHOCOLATE: { id: 'CHOCOLATE', name: 'Крафт Шоколад', leftLabel: 'КАКАО\nБОБИ', rightLabel: 'МАСЛО/ЦУКОР', emoji: '🍫', leftColor: 'beans', rightColor: 'butter', finalColor: 'choco', eqLeft: 'grinder', eqRight: 'mixer', hideRight: false },
  MILK: { id: 'MILK', name: 'Пастеризація', leftLabel: 'СИРЕ МОЛОКО', rightLabel: '', emoji: '🥛', leftColor: 'milk', rightColor: 'milk', finalColor: 'milk', eqLeft: 'mixer', eqRight: 'mixer', hideRight: true, hasFilter: true }
}

const getStepLabels = (recipeId) => {
  if (recipeId === 'MILK') return ['—', 'Завантаження', 'Підготовка', 'Передача', 'Обробка', 'Охолодження', 'Вивантаження'];
  return ['—', 'Завантаження', 'Підготовка', 'Передача', 'Обробка', 'Вивантаження'];
}

function Thermometer({ temp, maxTemp = 100 }) {
  const pct = Math.min(100, Math.max(0, ((temp - 20) / (maxTemp - 20)) * 100))
  return (
      <div className="thermometer" title={`${temp.toFixed(1)}°C`}>
        <div className="thermo-tube"><div className={`thermo-fill ${temp > 60 ? 'hot' : 'cool'}`} style={{ height: `${pct}%` }} /></div>
        <span className="thermo-label">{Math.round(temp)}°</span>
      </div>
  )
}

function TankUI({ title, data, maxVol, colorClass, type, hideTopPipe, hideBottomPipe, equipmentType, isPaused }) {
  const marks = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(m => m < maxVol)
  const activeFlow = data.inputValveOpen && !isPaused
  const activeDrain = data.outputValveOpen && !isPaused

  return (
      <div className={`tank-wrapper ${type}`}>
        <div className={`valve-assembly top-v ${data.inputValveOpen ? 'open' : ''}`}>
          {!hideTopPipe && <div className={`pipe-segment ${activeFlow ? `flow-${colorClass}` : ''}`} />}
          <div className="valve-handle" />
        </div>

        <div className="tank-structure">
          <div className="tank-glass">
            <div className="tank-scale">{marks.map(vol => <div key={vol} className="scale-mark" style={{ bottom: `${(vol / maxVol) * 100}%` }} />)}</div>
            <div className="substance-name">{title}</div>
            <div className={`liquid-fill ${colorClass} ${data.heaterOn && !isPaused ? 'boiling' : ''}`} style={{ height: `${(data.currentLevel / maxVol) * 100}%` }} />

            {data.mixerOn && !isPaused && (
                equipmentType === 'grinder' ? (
                    <div className="grinder-assembly"><div className="grinder-gear"/><div className="grinder-gear reverse"/><div className="grinder-gear"/></div>
                ) : (
                    <div className="mixer-assembly"><div className="mixer-shaft" /><div className="mixer-blades" /></div>
                )
            )}

            <div className={`led-sensor sensor-h ${data.highSensor ? 'active' : ''}`} />
            <div className={`led-sensor sensor-l ${data.lowSensor ? 'active' : ''}`} />

            {data.currentLevel > 5 && <div className="vol-indicator">{Math.round(data.currentLevel)}л</div>}
            <Thermometer temp={data.temperature} maxTemp={maxVol === 100 ? 100 : 80} />
          </div>
        </div>

        <div className={`valve-assembly bottom-v ${data.outputValveOpen ? 'open' : ''}`}>
          <div className="valve-handle" />
          {!hideBottomPipe && <div className={`pipe-segment drain-pipe ${activeDrain ? `flow-${colorClass}` : ''}`} />}
        </div>
      </div>
  )
}

function ProcessProgress({ stepIndex, processState, recipeId }) {
  const isActive  = processState !== 'ОЧІКУВАННЯ' && processState !== 'ЗАВЕРШЕНО'
  const isDone    = processState === 'ЗАВЕРШЕНО'
  const labels = getStepLabels(recipeId);

  return (
      <div className="process-progress">
        <div className="progress-steps">
          {labels.slice(1).map((label, i) => {
            const idx = i + 1;
            const done = idx < stepIndex || isDone;
            const current = idx === stepIndex && isActive;
            return (
                <div key={idx} className={`progress-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                  <div className="step-dot">{done ? '✓' : idx}</div>
                  <div className="step-label">{label}</div>
                  {idx < labels.length - 1 && <div className={`step-line ${done ? 'done' : ''}`} />}
                </div>
            )
          })}
        </div>

      </div>
  )
}

function EventLog({ events, isRunning }) {
  const logRef = useRef(null)

  const userScrolledUpRef = useRef(false)
  const [showBtn, setShowBtn] = useState(false)

  // 📌 відслідковуємо скрол
  useEffect(() => {
    const el = logRef.current
    if (!el) return

    const handleScroll = () => {
      const atBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 20

      userScrolledUpRef.current = !atBottom
      setShowBtn(!atBottom)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // 📌 автоскрол
  useEffect(() => {
    const el = logRef.current
    if (!el) return

    if (isRunning && !userScrolledUpRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [events, isRunning])

  const scrollToBottom = () => {
    const el = logRef.current
    if (!el) return

    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    })

    userScrolledUpRef.current = false
    setShowBtn(false)
  }

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
                  <div
                      key={evt.id || `${evt}-${i}`}
                      className="log-row"
                  >
                    {evt.text || evt}
                  </div>
              ))
          )}
        </div>

        {showBtn && (
            <button className="scroll-btn" onClick={scrollToBottom}>
              ↓
            </button>
        )}
      </div>
  )
}

function App() {
  const [status, setStatus] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState('CHOCOLATE')
  const [showResult, setShowResult] = useState(false)

  // ДОДАНО: Створюємо унікальний ідентифікатор сесії при першому завантаженні
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15))

  useEffect(() => {
    let isProcessing = false
    const interval = setInterval(async () => {
      if (isProcessing) return
      isProcessing = true
      try {
        // ДОДАНО: Передаємо headers у запит status
        const res = await fetch('https://chemical-simulator-5x2p.onrender.com/api/simulator/status', {
          headers: { 'X-Session-Id': sessionId }
        })
        const currentStatus = await res.json()
        setStatus(currentStatus)

        if (currentStatus.processState === 'ЗАВЕРШЕНО' && !showResult) setShowResult(true)
        if (currentStatus.processState !== 'ОЧІКУВАННЯ' && currentStatus.processState !== 'ЗАВЕРШЕНО' && !currentStatus.isPaused) {
          // ДОДАНО: Передаємо headers у запит tick
          await fetch('https://chemical-simulator-5x2p.onrender.com/api/simulator/tick', {
            method: 'POST',
            headers: { 'X-Session-Id': sessionId }
          })
        }
      } catch (err) { console.error('Помилка:', err) } finally { isProcessing = false }
    }, 100)
    return () => clearInterval(interval)
  }, [showResult, sessionId]) // Додали sessionId у залежності

  const startSimulator = async () => {
    setShowResult(false);
    // ДОДАНО: Передаємо headers
    await fetch(`https://chemical-simulator-5x2p.onrender.com/api/simulator/start?recipe=${selectedRecipe}`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId }
    })
  }

  const togglePause = async () => {
    // ДОДАНО: Передаємо headers
    await fetch('https://chemical-simulator-5x2p.onrender.com/api/simulator/pause', {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId }
    })
  }

  const resetSimulation = async () => {
    // ДОДАНО: Передаємо headers
    await fetch('https://chemical-simulator-5x2p.onrender.com/api/simulator/reset', {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId }
    });
    setShowResult(false)
  }

  if (!status) return <div className="loading-screen"><div className="loading-spinner" /><p>Ініціалізація системи...</p></div>

  const currentRcp = RECIPES[selectedRecipe]
  const isRunning  = status.processState !== 'ОЧІКУВАННЯ' && status.processState !== 'ЗАВЕРШЕНО'

  const activeLeftColor = (currentRcp.id === 'CHOCOLATE' && status.currentStepIndex >= 3) ? 'choco' : currentRcp.leftColor;

  const flowLeft = status.oilTank.outputValveOpen && !status.isPaused ? `flow-${activeLeftColor}` : ''
  const flowRight = status.lyeTank.outputValveOpen && !status.isPaused ? `flow-${currentRcp.rightColor}` : ''
  const flowMain = (status.oilTank.outputValveOpen || status.lyeTank.outputValveOpen) && !status.isPaused ? `flow-${currentRcp.finalColor}` : ''

  return (
      <div className="app-viewport">
        <header className="glass-header">
          <h1>ПАНЕЛЬ КЕРУВАННЯ — БАГАТОПРОФІЛЬНА ЛІНІЯ</h1>
          <span className={`header-status-badge ${isRunning ? 'running' : ''}`}>{isRunning ? (status.isPaused ? '⏸ ПАУЗА' : '● В РОБОТІ') : '○ ОЧІКУВАННЯ'}</span>
        </header>

        <main className="main-layout">
          <aside className="recipe-sidebar">
            <h3>Лінія виробництва</h3>
            {Object.values(RECIPES).map(rcp => (
                <button key={rcp.id} className={`recipe-btn ${selectedRecipe === rcp.id ? 'active' : ''}`} onClick={() => setSelectedRecipe(rcp.id)} disabled={isRunning}>
                  <span className="emoji">{rcp.emoji}</span><div className="recipe-btn-info"><strong>{rcp.name}</strong></div>
                </button>
            ))}
          </aside>

          <div className="visualizer-card">
            <div className="tanks-grid">
              <div className="upper-assembly">
                <div className="row-upper" style={{ justifyContent: currentRcp.hideRight ? 'center' : 'space-between' }}>
                  <TankUI title={currentRcp.leftLabel} data={status.oilTank} maxVol={50} colorClass={activeLeftColor} type="small" hideBottomPipe equipmentType={currentRcp.eqLeft} isPaused={status.isPaused} />
                  {!currentRcp.hideRight && <TankUI title={currentRcp.rightLabel} data={status.lyeTank} maxVol={50} colorClass={currentRcp.rightColor} type="small" hideBottomPipe equipmentType={currentRcp.eqRight} isPaused={status.isPaused} />}
                </div>

                <div className="piping-system">
                  <div className={`p-horizontal left ${flowLeft}`} style={{ width: currentRcp.hideRight ? '0' : '50%' }} />
                  {!currentRcp.hideRight && <div className={`p-horizontal right ${flowRight}`} />}
                  <div className={`p-vertical-main ${flowMain}`} style={{ height: currentRcp.hasFilter ? '15px' : '100%' }} />
                  {currentRcp.hasFilter && <div className={`filter-module ${flowMain ? 'filtering' : ''}`}><div className="filter-grid"></div></div>}
                </div>
              </div>

              <div className="row-lower">
                <TankUI title="РЕАКТОР" data={status.reactorTank} maxVol={100} colorClass={currentRcp.finalColor} type="large" hideTopPipe equipmentType="mixer" isPaused={status.isPaused} />
              </div>
            </div>

            <ProcessProgress stepIndex={status.currentStepIndex} processState={status.processState} recipeId={currentRcp.id} />
          </div>

          <aside className="side-controls">
            <div className="state-card"><label>Поточний етап</label><div className="state-badge" style={{ background: status.isPaused ? '#f59e0b' : 'var(--accent-blue)' }}>{status.isPaused ? 'ПАУЗА' : status.processState}</div></div>
            <div className="control-buttons">
              {!isRunning ? <button className="action-button start-btn" onClick={startSimulator}>▶ ПОЧАТИ ПРОЦЕС</button> : (
                  <><button className={`action-button ${status.isPaused ? 'resume-btn' : 'pause-btn'}`} onClick={togglePause}>{status.isPaused ? '▶ ПРОДОВЖИТИ' : '⏸ ПАУЗА'}</button>
                    <button className="action-button stop-btn" onClick={resetSimulation}>⏹ ЗАВЕРШИТИ ПРОЦЕС</button></>
              )}
            </div>
            <EventLog events={status.eventLog || []} isRunning={isRunning} />
          </aside>
        </main>

        {showResult && (
            <div className="result-modal-overlay">
              <div className="result-modal">
                <h2>Процес завершено!</h2><div className="product-showcase"><span className="product-emoji">{currentRcp.emoji}</span></div>
                <p>Продукт <strong>{currentRcp.name}</strong> успішно виготовлено та готовий до відправки!</p>
                <button className="action-button" onClick={resetSimulation}>Прийняти продукт</button>
              </div>
            </div>
        )}
      </div>
  )
}

export default App