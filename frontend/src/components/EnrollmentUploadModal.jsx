import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { enrollmentApi } from '../services/api';
import './EnrollmentUploadModal.css';

const DAY_LABELS = {
  SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua',
  QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb', DOMINGO: 'Dom'
};

export default function EnrollmentUploadModal({ courseId, token, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // upload | parsing | preview | applying | success
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [generateRoutines, setGenerateRoutines] = useState(true);
  const [applyResult, setApplyResult] = useState(null);
  const fileInputRef = useRef(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFileSelect = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('O arquivo deve ter no máximo 10 MB.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // ── Parse ──────────────────────────────────────────────────────────────────

  const handleParse = async () => {
    if (!file) return;
    setStep('parsing');
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('courseId', courseId);
      const res = await enrollmentApi.parse(formData, token);
      const data = res.data;
      setParseResult(data);
      // Usa o code como chave (único por subject no atestado)
      setSelectedSubjects(new Set(data.subjects.map(s => s.code)));
      setStep('preview');
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao analisar o PDF.');
      setStep('upload');
    }
  };

  // ── Apply ──────────────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!parseResult) return;
    setStep('applying');
    setError('');
    try {
      const subjectsToApply = parseResult.subjects
        .filter(s => selectedSubjects.has(s.code))
        .map(s => ({
          subjectId: s.subjectId,       // null para novas
          subjectName: s.subjectName,
          willCreate: s.willCreate,
          schedule: s.schedule || []
        }));

      const res = await enrollmentApi.apply({
        courseId,
        semester: parseResult.semester,
        subjects: subjectsToApply,
        generateRoutines
      }, token);

      setApplyResult(res.data);
      setStep('success');
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'Erro ao aplicar os dados.');
      setStep('preview');
    }
  };

  const toggleSubject = (code) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal enrollment-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header-row">
          <h2>Importar Atestado de Matrícula</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div className="enrollment-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ── STEP: Upload ── */}
        {step === 'upload' && (
          <>
            <p className="modal-subtitle">
              Faça upload do seu atestado de matrícula em PDF. O sistema detectará automaticamente as matérias ativas e os horários das aulas via IA.
            </p>

            <div
              className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileText size={40} color="#667eea" />
                  <p className="drop-zone-filename">{file.name}</p>
                  <span className="drop-zone-hint">Clique para trocar o arquivo</span>
                </>
              ) : (
                <>
                  <Upload size={40} color="#9ca3af" />
                  <p className="drop-zone-text">Arraste o PDF aqui ou clique para selecionar</p>
                  <span className="drop-zone-hint">Apenas .pdf · Máx. 10 MB</span>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="secondary-button" onClick={onClose}>Cancelar</button>
              <button className="primary-button" onClick={handleParse} disabled={!file}>
                <Upload size={15} />
                Analisar PDF
              </button>
            </div>
          </>
        )}

        {/* ── STEP: Parsing ── */}
        {step === 'parsing' && (
          <div className="enrollment-loading">
            <Loader2 size={48} className="spin" color="#667eea" />
            <p>Analisando PDF com IA...</p>
            <span>Extraindo matérias e horários</span>
          </div>
        )}

        {/* ── STEP: Preview ── */}
        {step === 'preview' && parseResult && (
          <>
            {/* Meta info */}
            <div className="enrollment-meta">
              {parseResult.semester && (
                <span className="meta-badge">📅 Semestre: {parseResult.semester}</span>
              )}
              {parseResult.studentName && (
                <span className="meta-badge">👤 {parseResult.studentName}</span>
              )}
            </div>

            {/* Lista unificada de matérias */}
            <div className="enrollment-section">
              <h3 className="enrollment-section-title">
                <CheckCircle size={16} color="#22c55e" />
                {parseResult.subjects.length} matéria(s) encontrada(s) no atestado
              </h3>

              <div className="enrollment-subjects-list">
                {parseResult.subjects.map(s => (
                  <div
                    key={s.code}
                    className={`enrollment-subject-row ${selectedSubjects.has(s.code) ? 'selected' : ''}`}
                  >
                    <label className="enrollment-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.has(s.code)}
                        onChange={() => toggleSubject(s.code)}
                      />
                      <div className="enrollment-subject-info">
                        <div className="enrollment-subject-name-row">
                          <span className="enrollment-subject-name">{s.subjectName}</span>
                          {s.willCreate && (
                            <span className="will-create-badge">Nova</span>
                          )}
                        </div>
                        <span className="enrollment-subject-code">{s.code}</span>
                      </div>
                    </label>

                    {s.schedule && s.schedule.length > 0 ? (
                      <div className="enrollment-schedule-chips">
                        {s.schedule.map((slot, i) => (
                          <span key={i} className="schedule-chip">
                            <Clock size={11} />
                            {DAY_LABELS[slot.day]} {slot.startTime}
                          </span>
                        ))}
                      </div>
                    ) : s.scheduleError === 'quota' ? (
                      <span className="no-schedule quota-warn">⚠ Quota da IA esgotada</span>
                    ) : (
                      <span className="no-schedule">Sem horário detectado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate routines toggle */}
            <label className="routines-toggle">
              <input
                type="checkbox"
                checked={generateRoutines}
                onChange={e => setGenerateRoutines(e.target.checked)}
              />
              <span>Gerar rotinas de aula automaticamente para matérias com horário detectado</span>
            </label>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setStep('upload')}>
                Voltar
              </button>
              <button
                className="primary-button"
                onClick={handleApply}
                disabled={selectedSubjects.size === 0}
              >
                Importar {selectedSubjects.size} matéria(s)
              </button>
            </div>
          </>
        )}

        {/* ── STEP: Applying ── */}
        {step === 'applying' && (
          <div className="enrollment-loading">
            <Loader2 size={48} className="spin" color="#667eea" />
            <p>Aplicando dados...</p>
            <span>Atualizando status e criando rotinas</span>
          </div>
        )}

        {/* ── STEP: Success ── */}
        {step === 'success' && applyResult && (
          <div className="enrollment-success">
            <CheckCircle size={56} color="#22c55e" />
            <h3>Concluído!</h3>
            {applyResult.subjectsCreated > 0 && (
              <p><strong>{applyResult.subjectsCreated}</strong> matéria(s) criada(s) automaticamente</p>
            )}
            <p>
              <strong>{applyResult.statusUpdated}</strong> matéria(s) marcadas como <strong>Ativa</strong>
            </p>
            {applyResult.routinesCreated > 0 && (
              <p><strong>{applyResult.routinesCreated}</strong> rotina(s) de aula criadas</p>
            )}
            {applyResult.routinesCreated === 0 && generateRoutines && (
              <p className="success-hint">
                Rotinas não criadas para matérias novas — associe um professor e use "Gerar Rotinas" na página da matéria.
              </p>
            )}
            <button className="primary-button" onClick={onClose}>Fechar</button>
          </div>
        )}

      </div>
    </div>
  );
}
