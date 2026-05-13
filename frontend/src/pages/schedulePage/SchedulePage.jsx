import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tasksApi } from '../../services/api';
import './Schedule.css';

const MONTHS_PT  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW_SHORT  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DOW_FULL   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

const TYPE = {
  PROVA:     { label:'Prova',     chip:'#fee2e2', chipText:'#991b1b', icon:<AlertCircle size={16}/>, iconBg:'#fee2e2', iconColor:'#dc2626' },
  TRABALHO:  { label:'Trabalho',  chip:'#fef3c7', chipText:'#92400e', icon:<FileText size={16}/>,   iconBg:'#fef3c7', iconColor:'#d97706' },
  ATIVIDADE: { label:'Atividade', chip:'#d1fae5', chipText:'#065f46', icon:<FileText size={16}/>,   iconBg:'#d1fae5', iconColor:'#059669' },
};

function fmtDay(d)  { return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]}`; }
function fmtShort(d){ return `${d.getDate()} de ${MONTHS_PT[d.getMonth()].slice(0,3)}.`; }

function getWeekStart(date) {
  // Domingo como primeiro dia da semana (consistente com o grid do mês)
  const d = new Date(date); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - d.getDay()); // vai para o domingo
  return d;
}

export default function SchedulePage() {
  const { token } = useAuth();

  const [calDate,   setCalDate]   = useState(new Date());
  const [selDate,   setSelDate]   = useState(new Date());
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [viewMode,  setViewMode]  = useState('month');

  const today = new Date(); today.setHours(0,0,0,0);

  useEffect(() => { load(); }, [token]);

  async function load() {
    try {
      setLoading(true);
      const res = await tasksApi.getAllTasks(token);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch { setTasks([]); }
    finally { setLoading(false); }
  }

  function tasksFor(date) {
    return tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === date.toDateString());
  }

  // ── Navigation ─────────────────────────────────────────
  function prev() {
    const d = new Date(calDate);
    viewMode === 'week' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1, 1);
    setCalDate(d);
  }
  function next() {
    const d = new Date(calDate);
    viewMode === 'week' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1, 1);
    setCalDate(d);
  }
  function goToday() {
    // Cria cópias independentes para evitar mutação compartilhada
    const t = new Date(); t.setHours(0,0,0,0);
    setCalDate(new Date(t));
    setSelDate(new Date(t));
  }

  // ── Period label ───────────────────────────────────────
  const weekStart = getWeekStart(calDate);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const periodLabel = viewMode === 'week'
    ? `${fmtShort(weekStart)} – ${fmtShort(weekEnd)} ${weekEnd.getFullYear()}`
    : `${MONTHS_PT[calDate.getMonth()]} ${calDate.getFullYear()}`;

  // Indica se o calendário já está mostrando o período que contém hoje
  const isViewingToday = viewMode === 'month'
    ? calDate.getMonth() === today.getMonth() && calDate.getFullYear() === today.getFullYear()
    : weekStart <= today && today <= weekEnd;

  // ── Side panel data ────────────────────────────────────
  const selTasks = tasksFor(selDate).sort((a,b) => {
    const order = { PROVA:0, TRABALHO:1, ATIVIDADE:2 };
    return (order[a.type]??2) - (order[b.type]??2);
  });

  const upcoming = tasks
    .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= today)
    .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6);

  // ── Month data ─────────────────────────────────────────
  const daysInMonth  = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="sc-page">
      <div className="sc-inner">
        <div className="sc-layout">

          {/* ── Left: Calendar ── */}
          <div className="sc-cal-col">
            <div className="sc-cal-card">

              {/* Calendar header */}
              <div className="sc-cal-hdr">
                <div className="sc-cal-nav">
                  <button className="sc-nav-btn" onClick={prev}><ChevronLeft size={16}/></button>
                  <span className="sc-period">{periodLabel}</span>
                  <button className="sc-nav-btn" onClick={next}><ChevronRight size={16}/></button>
                </div>
                <div className="sc-cal-actions">
                  <button
                    className={`sc-today-btn ${isViewingToday ? 'sc-today-btn--active' : ''}`}
                    onClick={goToday}
                  >
                    Hoje
                  </button>
                  <div className="sc-view-toggle">
                    <button className={`sc-view-btn ${viewMode==='week'?'active':''}`} onClick={()=>setViewMode('week')}>Semana</button>
                    <button className={`sc-view-btn ${viewMode==='month'?'active':''}`} onClick={()=>setViewMode('month')}>Mês</button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="sc-loading">Carregando…</div>
              ) : viewMode === 'month' ? (

                /* ── Month grid ── */
                <div className="sc-month-grid">
                  {DOW_SHORT.map(d => <div key={d} className="sc-dow-hdr">{d}</div>)}

                  {Array.from({length: firstWeekday}).map((_,i) => (
                    <div key={`e${i}`} className="sc-cell sc-cell-empty"/>
                  ))}

                  {Array.from({length: daysInMonth}).map((_,i) => {
                    const date    = new Date(calDate.getFullYear(), calDate.getMonth(), i+1);
                    const isToday = date.toDateString() === today.toDateString();
                    const isSel   = date.toDateString() === selDate.toDateString();
                    const dayTasks= tasksFor(date);
                    const visible = dayTasks.slice(0, 2);
                    const extra   = dayTasks.length - visible.length;

                    return (
                      <div
                        key={i}
                        className={`sc-cell ${isToday?'sc-cell-today':''} ${isSel&&!isToday?'sc-cell-sel':''}`}
                        onClick={() => setSelDate(date)}
                      >
                        <span className={`sc-cell-num ${isToday?'sc-cell-num-today':''}`}>{i+1}</span>
                        <div className="sc-cell-chips">
                          {visible.map(t => {
                            const ts = TYPE[t.type] || TYPE.ATIVIDADE;
                            return (
                              <span key={t.id} className="sc-chip"
                                style={{background:ts.chip, color:ts.chipText}}>
                                {t.title}
                              </span>
                            );
                          })}
                          {extra > 0 && <span className="sc-chip-more">+{extra}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

              ) : (

                /* ── Week grid ── */
                <div className="sc-week-grid">
                  {Array.from({length:7}).map((_,i) => {
                    const date    = new Date(weekStart); date.setDate(weekStart.getDate()+i);
                    const isToday = date.toDateString() === today.toDateString();
                    const isSel   = date.toDateString() === selDate.toDateString();
                    const dayTasks= tasksFor(date);

                    return (
                      <div key={i} className={`sc-wcol ${isToday?'sc-wcol-today':''} ${isSel&&!isToday?'sc-wcol-sel':''}`}
                        onClick={() => setSelDate(date)}>
                        <div className="sc-wcol-hdr">
                          <span className="sc-wcol-dow">{DOW_SHORT[date.getDay()]}</span>
                          <span className={`sc-wcol-num ${isToday?'sc-wcol-num-today':''}`}>{date.getDate()}</span>
                        </div>
                        <div className="sc-wcol-body">
                          {dayTasks.length === 0
                            ? <div className="sc-wcol-empty"/>
                            : dayTasks.map(t => {
                                const ts = TYPE[t.type] || TYPE.ATIVIDADE;
                                return (
                                  <div key={t.id} className="sc-wtask"
                                    style={{background:ts.chip, color:ts.chipText, borderLeftColor:ts.chipText}}>
                                    <span className="sc-wtask-title">{t.title}</span>
                                    {t.subjectName && <span className="sc-wtask-sub">{t.subjectName}</span>}
                                  </div>
                                );
                              })
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

              )}
            </div>
          </div>

          {/* ── Right: Side panel ── */}
          <div className="sc-side-col">

            {/* Selected day */}
            <div className="sc-side-card">
              <h3 className="sc-side-title">{fmtDay(selDate)}</h3>
              {selTasks.length === 0 ? (
                <p className="sc-side-empty">Nenhuma entrega para este dia.</p>
              ) : (
                <div className="sc-side-tasks">
                  {selTasks.map(t => {
                    const ts = TYPE[t.type] || TYPE.ATIVIDADE;
                    return (
                      <div key={t.id} className="sc-side-task">
                        <div className="sc-side-icon" style={{background:ts.iconBg, color:ts.iconColor}}>
                          {ts.icon}
                        </div>
                        <div className="sc-side-info">
                          <span className="sc-side-task-name" style={{textDecoration:t.completed?'line-through':'none'}}>
                            {t.title}
                          </span>
                          {t.subjectName && <span className="sc-side-task-sub">{t.subjectName}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="sc-side-card">
                <h3 className="sc-side-title">
                  <Clock size={15}/> Próximas Entregas
                </h3>
                <div className="sc-side-tasks">
                  {upcoming.map(t => {
                    const ts = TYPE[t.type] || TYPE.ATIVIDADE;
                    return (
                      <div key={t.id} className="sc-side-task">
                        <div className="sc-side-icon" style={{background:ts.iconBg, color:ts.iconColor}}>
                          {ts.icon}
                        </div>
                        <div className="sc-side-info">
                          <span className="sc-side-task-name">{t.title}</span>
                          {t.subjectName && <span className="sc-side-task-sub">{t.subjectName}</span>}
                          <span className="sc-side-task-date">{fmtDay(new Date(t.dueDate))}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="sc-side-card">
              <h3 className="sc-side-title">Legenda</h3>
              <div className="sc-legend">
                {Object.entries(TYPE).map(([key, ts]) => (
                  <div key={key} className="sc-legend-row">
                    <span className="sc-legend-dot" style={{background:ts.iconColor}}/>
                    <span>{ts.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
