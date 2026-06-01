import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, BarChart3, Flame, Plus, ChevronRight } from 'lucide-react';
import { coursesApi, subjectsApi, tasksApi, routinesApi, quotesApi } from './services/api';
import { parseDate } from './utils/dates';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const DOW    = ['DOMINGO','SEGUNDA','TERCA','QUARTA','QUINTA','SEXTA','SABADO'];
const DOW_PT = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const QUOTE_FALLBACK = {
  text: '"A educação é a arma mais poderosa que você pode usar para mudar o mundo."',
  author: 'Nelson Mandela',
  attribution: 'LÍDER E ATIVISTA SUL-AFRICANO',
};

const QUOTE_CACHE_KEY = 'studium_quote_cache';
const QUOTE_TTL_MS    = 12 * 60 * 60 * 1000; // 12 horas

function getCachedQuote() {
  try {
    const raw = localStorage.getItem(QUOTE_CACHE_KEY);
    if (!raw) return null;
    const { quote, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt < QUOTE_TTL_MS) return quote;
  } catch {}
  return null;
}

function setCachedQuote(quote) {
  try {
    localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ quote, savedAt: Date.now() }));
  } catch {}
}

const SUB_COLORS = [
  { bg:'#fef9e8', bar:'#d4940a', text:'#7a5000' },
  { bg:'#e8f4ff', bar:'#1a7fc4', text:'#0f5a8c' },
  { bg:'#eaf5ea', bar:'#2a7a2a', text:'#1a5c1a' },
  { bg:'#ffeef2', bar:'#c43060', text:'#8c1a40' },
];

const TYPE_STYLE = {
  TRABALHO:  { label:'TRABALHO',  bg:'#fef3c7', color:'#92400e' },
  ATIVIDADE: { label:'ATIVIDADE', bg:'#d1fae5', color:'#065f46' },
  PROVA:     { label:'PROVA',     bg:'#fee2e2', color:'#991b1b' },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
function fmtHeader(d) {
  return `${DOW_PT[d.getDay()].toUpperCase()}, ${d.getDate()} DE ${MONTHS[d.getMonth()].toUpperCase()}`;
}
function Deadline({ iso }) {
  if (!iso) return null;
  const d = parseDate(iso);
  if (!d) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.ceil((d - today) / 86400000);
  if (diff < 0)   return <span className="db db-o">Atrasada</span>;
  if (diff === 0) return <span className="db db-t">Hoje</span>;
  if (diff === 1) return <span className="db db-tm">Amanhã</span>;
  if (diff <= 7)  return <span className="db db-s">em {diff} dias</span>;
  return <span className="db db-n">{d.getDate()} de {MONTHS[d.getMonth()].slice(0,3).toLowerCase()}.</span>;
}

export default function App() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [tasks,    setTasks]    = useState([]);
  const [routines, setRoutines] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [quote,    setQuote]    = useState(getCachedQuote() || QUOTE_FALLBACK);

  useEffect(() => { if (token) load(); }, [token]);

  // Frase do dia — carrega em segundo plano, sem travar o dashboard
  useEffect(() => {
    const cached = getCachedQuote();
    if (cached) { setQuote(cached); return; }
    quotesApi.daily()
      .then(res => {
        if (res.data?.text) {
          setCachedQuote(res.data);
          setQuote(res.data);
        }
      })
      .catch(() => {}); // mantém fallback silenciosamente
  }, []);

  async function load() {
    try {
      const [tR, rR, cR] = await Promise.all([
        tasksApi.getAllTasks(token),
        routinesApi.getAllRoutines(token),
        coursesApi.list(token),
      ]);
      const ts = Array.isArray(tR.data) ? tR.data : [];
      const rs = Array.isArray(rR.data) ? rR.data : [];
      const cs = Array.isArray(cR.data) ? cR.data : [];
      setTasks(ts); setRoutines(rs);
      const top = cs.slice(0,3);
      const srs = await Promise.all(top.map(c => subjectsApi.list(c.id,token).catch(()=>({data:[]}))));
      setSubjects(srs.flatMap((r,i)=>(r.data||[]).map(s=>({...s,courseName:top[i].name}))).slice(0,4));
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }

  const now = new Date();
  const todayDOW = DOW[now.getDay()];
  // `quote` vem do estado (API + cache localStorage de 12h)
  const firstName = user?.name?.split(' ')[0] ?? 'Estudante';
  const initials  = user?.name ? user.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() : 'US';

  const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7)); mon.setHours(0,0,0,0);
  const sun=new Date(mon); sun.setDate(mon.getDate()+6); sun.setHours(23,59,59,999);

  const weekTs   = tasks.filter(t=>t.dueDate&&parseDate(t.dueDate)>=mon&&parseDate(t.dueDate)<=sun);
  const doneTs   = tasks.filter(t=>t.completed);
  const todayTs  = tasks.filter(t=>!t.completed&&t.dueDate&&parseDate(t.dueDate).toDateString()===now.toDateString());
  const weekPct  = weekTs.length>0 ? Math.round((weekTs.filter(t=>t.completed).length/weekTs.length)*100) : 0;

  const doneDates=new Set(doneTs.filter(t=>t.updatedAt).map(t=>new Date(t.updatedAt).toDateString()));
  let streak=0; const ck=new Date(now);
  while(doneDates.has(ck.toDateString())&&streak<365){streak++;ck.setDate(ck.getDate()-1);}

  const tW=tasks.reduce((s,t)=>s+(t.weight||1),0);
  const dW=doneTs.reduce((s,t)=>s+(t.weight||1),0);
  const score=tW>0?((dW/tW)*10).toFixed(1):null;

  const in14=new Date(now.getTime()+14*86400000);
  const upcoming=tasks.filter(t=>!t.completed&&t.dueDate&&parseDate(t.dueDate)<=in14)
    .sort((a,b)=>parseDate(a.dueDate)-parseDate(b.dueDate)).slice(0,8);

  const todayClasses=routines.filter(r=>r.dayOfWeek===todayDOW)
    .sort((a,b)=>a.startTime.localeCompare(b.startTime));

  const subProg={};
  tasks.forEach(t=>{
    const id=t.professorSubject?.subject?.id; if(!id) return;
    if(!subProg[id]) subProg[id]={total:0,done:0};
    subProg[id].total++; if(t.completed) subProg[id].done++;
  });

  if(loading) return <div className="dash-loading">Carregando…</div>;

  return (
    <div className="dash">
      <div className="dash-inner">

        {/* Saudação */}
        <div className="dash-greeting">
          <div className="dash-gl">
            <p className="dash-date">{fmtHeader(now)}</p>
            <div className="dash-hello-row">
              <div className="dash-avatar">{initials}</div>
              <h1 className="dash-hello">{greeting()}, <em>{firstName}</em>.</h1>
            </div>
            <p className="dash-summary">
              {todayTs.length>0
                ? `${todayTs.length} entrega${todayTs.length>1?'s':''} hoje · ${weekPct}% da semana concluído.`
                : weekPct>0 ? `${weekPct}% da semana concluído. Continue assim!`
                : 'Sem entregas para hoje. Bom dia de estudos!'}
            </p>
          </div>
          <button className="dash-cta" onClick={()=>navigate('/courses')}>
            <Plus size={15}/> Nova tarefa
          </button>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          {[
            {icon:<Calendar size={18}/>,    cls:'dsc-teal',  label:'ESTA SEMANA', val:weekTs.filter(t=>!t.completed).length, unit:'entregas'     },
            {icon:<CheckSquare size={18}/>, cls:'dsc-amber', label:'CONCLUÍDAS',  val:doneTs.length,  unit:`de ${tasks.length}`},
            {icon:<BarChart3 size={18}/>,   cls:'dsc-sage',  label:'PROGRESSO',   val:score??'–',     unit:'/10'              },
            {icon:<Flame size={18}/>,       cls:'dsc-peach', label:'SEQUÊNCIA',   val:streak,         unit:'dias de estudo'   },
          ].map(s=>(
            <div key={s.label} className="dsc">
              <div className={`dsc-icon ${s.cls}`}>{s.icon}</div>
              <div className="dsc-body">
                <p className="dsc-label">{s.label}</p>
                <p className="dsc-val">{s.val} <span>{s.unit}</span></p>
              </div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="dash-main">

          {/* Próximas entregas */}
          <section className="dash-card">
            <div className="dash-card-hdr">
              <div>
                <h2 className="dash-card-title">Próximas entregas</h2>
                <p className="dash-card-sub">Próximos 14 dias</p>
              </div>
              <button className="dash-text-btn" onClick={()=>navigate('/schedule')}>
                Ver cronograma <ChevronRight size={13}/>
              </button>
            </div>
            {upcoming.length===0 ? (
              <div className="dash-empty">
                <p>Nenhuma entrega nos próximos 14 dias.</p>
                <button onClick={()=>navigate('/courses')}>Adicionar tarefas →</button>
              </div>
            ) : (
              <div className="dash-task-list">
                {upcoming.map(t=>{
                  const ts=TYPE_STYLE[t.type]||TYPE_STYLE.ATIVIDADE;
                  return (
                    <div key={t.id} className="dti">
                      <span className="dti-circle"/>
                      <div className="dti-body">
                        <div className="dti-row">
                          <span className="dti-name">{t.title}</span>
                          <span className="dti-type" style={{background:ts.bg,color:ts.color}}>{ts.label}</span>
                        </div>
                        <p className="dti-meta">
                          <span className="dti-dot"/>
                          {t.subjectName||'Matéria'}
                          {t.professorName&&<> · Prof. {t.professorName}</>}
                        </p>
                      </div>
                      <Deadline iso={t.dueDate}/>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Direita */}
          <div className="dash-right">

            {/* Aulas hoje */}
            <section className="dash-card dash-today-card">
              <div className="dash-today-hdr">
                <Calendar size={15}/><h2 className="dash-card-title">Aulas de hoje</h2>
              </div>
              {todayClasses.length===0
                ? <p className="dash-empty-txt">Sem aulas programadas para hoje.</p>
                : <div className="dash-class-list">
                    {todayClasses.map(r=>(
                      <div key={r.id} className="dcl">
                        <span className="dcl-time">{r.startTime}</span>
                        <span className="dcl-bar"/>
                        <div className="dcl-info">
                          <span className="dcl-name">{r.subjectName||r.activity}</span>
                          <span className="dcl-dur">{r.duration}min</span>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </section>

            {/* Matérias */}
            {subjects.length>0 && (
              <section className="dash-card">
                <div className="dash-card-hdr">
                  <h2 className="dash-card-title">Matérias</h2>
                  <button className="dash-text-btn" onClick={()=>navigate('/courses')}>
                    Todas <ChevronRight size={13}/>
                  </button>
                </div>
                <div className="dash-subj-grid">
                  {subjects.map((s,i)=>{
                    const col=SUB_COLORS[i%SUB_COLORS.length];
                    const p=subProg[s.id];
                    const pct=p&&p.total>0?Math.round((p.done/p.total)*100):0;
                    return (
                      <div key={s.id} className="dsj" style={{background:col.bg}}
                        onClick={()=>navigate(`/courses/${s.courseId||s.id}`)}>
                        <p className="dsj-course">{s.courseName}</p>
                        <p className="dsj-name" style={{color:col.text}}>{s.name}</p>
                        <div className="dsj-track">
                          <div className="dsj-fill" style={{width:`${pct}%`,background:col.bar}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Quote */}
            <div className="dash-quote">
              <p className="dash-quote-text">{quote.text}</p>
              <p className="dash-quote-attr">
                {quote.author && <strong>{quote.author}</strong>}
                {quote.attribution && <span> · {quote.attribution}</span>}
                {/* compat com estrutura legada */}
                {quote.attr && !quote.author && quote.attr}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
