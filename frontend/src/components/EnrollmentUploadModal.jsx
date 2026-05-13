import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { enrollmentApi } from '../services/api';
import './EnrollmentUploadModal.css';

const DAY_LABELS = {
  SEGUNDA:'Seg', TERCA:'Ter', QUARTA:'Qua',
  QUINTA:'Qui', SEXTA:'Sex', SABADO:'Sáb', DOMINGO:'Dom'
};

export default function EnrollmentUploadModal({ courseId, token, onClose, onSuccess }) {
  const [step,             setStep]             = useState('upload');
  const [file,             setFile]             = useState(null);
  const [dragOver,         setDragOver]         = useState(false);
  const [error,            setError]            = useState('');
  const [parseResult,      setParseResult]      = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [generateRoutines, setGenerateRoutines] = useState(true);
  const [applyResult,      setApplyResult]      = useState(null);
  const fileInputRef = useRef(null);

  function handleFileSelect(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Apenas arquivos PDF são aceitos.'); return; }
    if (f.size > 10 * 1024 * 1024)    { setError('O arquivo deve ter no máximo 10 MB.'); return; }
    setFile(f); setError('');
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  async function handleParse() {
    if (!file) return;
    setStep('parsing'); setError('');
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      fd.append('courseId', courseId);
      const res  = await enrollmentApi.parse(fd, token);
      const data = res.data;
      setParseResult(data);
      setSelectedSubjects(new Set(data.subjects.map(s => s.code)));
      setStep('preview');
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao analisar o PDF.');
      setStep('upload');
    }
  }

  async function handleApply() {
    if (!parseResult) return;
    setStep('applying'); setError('');
    try {
      const subjectsToApply = parseResult.subjects
        .filter(s => selectedSubjects.has(s.code))
        .map(s => ({ subjectId: s.subjectId, subjectName: s.subjectName, willCreate: s.willCreate, schedule: s.schedule || [] }));

      const res = await enrollmentApi.apply({ courseId, semester: parseResult.semester, subjects: subjectsToApply, generateRoutines }, token);
      setApplyResult(res.data);
      setStep('success');
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao aplicar os dados.');
      setStep('preview');
    }
  }

  function toggleSubject(code) {
    setSelectedSubjects(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  return (
    <div className="em-overlay" onClick={onClose}>
      <div className="em-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="em-header">
          <div className="em-header-left">
            <FileText size={17}/>
            <h2>Importar Atestado</h2>
          </div>
          <button className="em-close" onClick={onClose}><X size={16}/></button>
        </div>

        {error && (
          <div className="em-error">
            <AlertCircle size={15}/> {error}
          </div>
        )}

        {/* ── Upload ── */}
        {step === 'upload' && (
          <div className="em-body">
            <p className="em-subtitle">
              Faça upload do atestado de matrícula em PDF. O sistema detectará automaticamente as matérias ativas e os horários das aulas.
            </p>
            <div
              className={`em-drop ${dragOver ? 'drag' : ''} ${file ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept="application/pdf" style={{display:'none'}}
                onChange={e => handleFileSelect(e.target.files[0])}/>
              {file ? (
                <>
                  <FileText size={36}/>
                  <span className="em-drop-name">{file.name}</span>
                  <span className="em-drop-hint">Clique para trocar</span>
                </>
              ) : (
                <>
                  <Upload size={36}/>
                  <span className="em-drop-text">Arraste o PDF aqui ou clique para selecionar</span>
                  <span className="em-drop-hint">Apenas .pdf · Máx. 10 MB</span>
                </>
              )}
            </div>
            <div className="em-actions">
              <button className="em-btn-cancel" onClick={onClose}>Cancelar</button>
              <button className="em-btn-primary" onClick={handleParse} disabled={!file}>
                <Upload size={14}/> Analisar PDF
              </button>
            </div>
          </div>
        )}

        {/* ── Parsing / Applying ── */}
        {(step === 'parsing' || step === 'applying') && (
          <div className="em-loading">
            <Loader2 size={44} className="em-spin"/>
            <p>{step === 'parsing' ? 'Analisando PDF com IA…' : 'Aplicando dados…'}</p>
            <span>{step === 'parsing' ? 'Extraindo matérias e horários' : 'Atualizando status e criando rotinas'}</span>
          </div>
        )}

        {/* ── Preview ── */}
        {step === 'preview' && parseResult && (
          <div className="em-body">
            {/* Meta */}
            <div className="em-meta">
              {parseResult.semester    && <span className="em-meta-badge">📅 {parseResult.semester}</span>}
              {parseResult.studentName && <span className="em-meta-badge">👤 {parseResult.studentName}</span>}
            </div>

            {/* Subjects */}
            <div className="em-section">
              <p className="em-section-label">
                <CheckCircle size={14}/> {parseResult.subjects.length} MATÉRIA(S) ENCONTRADA(S)
              </p>
              <div className="em-subjects">
                {parseResult.subjects.map(s => (
                  <div key={s.code} className={`em-subject-row ${selectedSubjects.has(s.code) ? 'selected' : ''}`}>
                    <label className="em-check-label">
                      <input type="checkbox" checked={selectedSubjects.has(s.code)}
                        onChange={() => toggleSubject(s.code)} style={{accentColor:'var(--primary)'}}/>
                      <div className="em-subject-info">
                        <div className="em-subject-name-row">
                          <span className="em-subject-name">{s.subjectName}</span>
                          {s.willCreate && <span className="em-new-badge">Nova</span>}
                        </div>
                        <span className="em-subject-code">{s.code}</span>
                      </div>
                    </label>
                    <div className="em-schedule">
                      {s.schedule?.length > 0 ? (
                        s.schedule.map((slot, i) => (
                          <span key={i} className="em-slot-chip">
                            <Clock size={10}/> {DAY_LABELS[slot.day]} {slot.startTime}
                          </span>
                        ))
                      ) : s.scheduleError === 'quota' ? (
                        <span className="em-no-schedule warn">⚠ Quota da IA esgotada</span>
                      ) : (
                        <span className="em-no-schedule">Sem horário</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Routines toggle */}
            <label className="em-toggle">
              <input type="checkbox" checked={generateRoutines}
                onChange={e => setGenerateRoutines(e.target.checked)}
                style={{accentColor:'var(--primary)'}}/>
              <span>Gerar rotinas automaticamente para matérias com horário detectado</span>
            </label>

            <div className="em-actions">
              <button className="em-btn-cancel" onClick={() => setStep('upload')}>Voltar</button>
              <button className="em-btn-primary" onClick={handleApply} disabled={selectedSubjects.size === 0}>
                Importar {selectedSubjects.size} matéria(s)
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && applyResult && (
          <div className="em-success">
            <div className="em-success-icon"><CheckCircle size={40}/></div>
            <h3>Concluído!</h3>
            {applyResult.subjectsCreated > 0 && (
              <p><strong>{applyResult.subjectsCreated}</strong> matéria(s) criada(s) automaticamente</p>
            )}
            <p><strong>{applyResult.statusUpdated}</strong> matéria(s) marcadas como <strong>Ativa</strong></p>
            {applyResult.routinesCreated > 0 && (
              <p><strong>{applyResult.routinesCreated}</strong> rotina(s) de aula criadas</p>
            )}
            {applyResult.routinesCreated === 0 && generateRoutines && (
              <p className="em-success-hint">Rotinas não criadas para matérias novas — associe um professor e gere as rotinas na página da matéria.</p>
            )}
            <button className="em-btn-primary" onClick={onClose}>Fechar</button>
          </div>
        )}

      </div>
    </div>
  );
}
