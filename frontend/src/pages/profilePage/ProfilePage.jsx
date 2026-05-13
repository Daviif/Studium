import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, GraduationCap, Building2, Calendar, Camera, LogOut, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi, coursesApi } from '../../services/api';
import './Profile.css';

const SEMESTERS = ['1º Semestre','2º Semestre','3º Semestre','4º Semestre','5º Semestre','6º Semestre','7º Semestre','8º Semestre','9º Semestre','10º Semestre'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function fmtMemberSince(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const token = localStorage.getItem('token');

  const initials = user?.name
    ? user.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
    : 'US';

  // ── Estado ─────────────────────────────────────────────
  const [profileData, setProfileData] = useState({ name: user?.name || '' });
  const [academicData, setAcademicData] = useState({ university: '', course: '', semester: '6º Semestre' });
  const [prefs, setPrefs]               = useState({ emailNotifications: true, inAppNotifications: true, notifyHoursBefore: 1, quietHoursStart: 22, quietHoursEnd: 8 });
  const [firstCourse, setFirstCourse]   = useState(null);
  const [saving, setSaving]             = useState(false);
  const [feedback, setFeedback]         = useState({ type: '', msg: '' });
  const [showPrefs, setShowPrefs]       = useState(false);

  useEffect(() => {
    if (user) { setProfileData({ name: user.name || '' }); }
    loadCourse();
    loadPrefs();
  }, [user]);

  async function loadCourse() {
    try {
      const res = await coursesApi.list(token);
      const courses = Array.isArray(res.data) ? res.data : [];
      if (courses[0]) {
        setFirstCourse(courses[0]);
        setAcademicData(prev => ({ ...prev, university: courses[0].university || '', course: courses[0].name || '' }));
      }
    } catch {}
  }

  async function loadPrefs() {
    try {
      const res = await authApi.getNotificationPreferences(token);
      if (res.data?.preferences) setPrefs(res.data.preferences);
    } catch {}
  }

  function flash(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type:'', msg:'' }), 3000);
  }

  async function handleSavePersonal(e) {
    e.preventDefault();
    if (!profileData.name.trim()) { flash('error', 'Nome não pode estar vazio.'); return; }
    try {
      setSaving(true);
      await authApi.updateProfile({ name: profileData.name }, token);
      flash('success', 'Perfil atualizado com sucesso!');
    } catch (err) {
      flash('error', err.response?.data?.error || 'Erro ao salvar perfil.');
    } finally { setSaving(false); }
  }

  async function handleSavePrefs(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await authApi.updateNotificationPreferences(prefs, token);
      flash('success', 'Preferências salvas!');
      setShowPrefs(false);
    } catch (err) {
      flash('error', 'Erro ao salvar preferências.');
    } finally { setSaving(false); }
  }

  function handleLogout() {
    if (window.confirm('Tem certeza que deseja sair?')) { logout(); navigate('/'); }
  }

  return (
    <div className="pf-page">
      {feedback.msg && (
        <div className={`pf-feedback pf-feedback-${feedback.type}`}>{feedback.msg}</div>
      )}

      <div className="pf-layout">

        {/* ── Sidebar esquerda ── */}
        <aside className="pf-sidebar">
          <div className="pf-user-card">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">{initials}</div>
              <button className="pf-avatar-cam" title="Trocar foto"><Camera size={14}/></button>
            </div>
            <h2 className="pf-user-name">{user?.name}</h2>
            <p className="pf-user-email">{user?.email}</p>

            <div className="pf-user-meta">
              {academicData.university && (
                <div className="pf-meta-row">
                  <Building2 size={14}/><span>{academicData.university}</span>
                </div>
              )}
              {academicData.course && (
                <div className="pf-meta-row">
                  <GraduationCap size={14}/><span>{academicData.course}</span>
                </div>
              )}
              <div className="pf-meta-row">
                <Calendar size={14}/><span>{academicData.semester}</span>
              </div>
            </div>

            <div className="pf-member-since">
              <p className="pf-ms-label">MEMBRO DESDE</p>
              <p className="pf-ms-value">{fmtMemberSince(user?.createdAt)}</p>
            </div>
          </div>
        </aside>

        {/* ── Conteúdo direito ── */}
        <main className="pf-main">

          {/* Informações Pessoais */}
          <form className="pf-card" onSubmit={handleSavePersonal}>
            <div className="pf-card-hdr">
              <User size={17}/>
              <div>
                <h3>Informações Pessoais</h3>
                <p>Atualize suas informações de perfil</p>
              </div>
            </div>
            <div className="pf-fields-row">
              <div className="pf-field">
                <label>NOME COMPLETO</label>
                <input
                  className="pf-input"
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData({ name: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="pf-field">
                <label>EMAIL</label>
                <div className="pf-input-icon">
                  <Mail size={15}/>
                  <input className="pf-input" type="email" value={user?.email || ''} disabled/>
                </div>
              </div>
            </div>
            <div className="pf-card-footer">
              <button className="pf-save-btn" type="submit" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </form>

          {/* Informações Acadêmicas */}
          <div className="pf-card">
            <div className="pf-card-hdr">
              <GraduationCap size={17}/>
              <div>
                <h3>Informações Acadêmicas</h3>
                <p>Configure seu curso e período atual</p>
              </div>
            </div>
            <div className="pf-fields-row">
              <div className="pf-field">
                <label>UNIVERSIDADE</label>
                <input
                  className="pf-input"
                  value={academicData.university}
                  onChange={e => setAcademicData(p => ({ ...p, university: e.target.value }))}
                  placeholder="Ex: Universidade Federal"
                />
              </div>
              <div className="pf-field">
                <label>CURSO</label>
                <input
                  className="pf-input"
                  value={academicData.course}
                  onChange={e => setAcademicData(p => ({ ...p, course: e.target.value }))}
                  placeholder="Ex: Ciência da Computação"
                />
              </div>
            </div>
            <div className="pf-field pf-field-sm">
              <label>SEMESTRE ATUAL</label>
              <select
                className="pf-input pf-select"
                value={academicData.semester}
                onChange={e => setAcademicData(p => ({ ...p, semester: e.target.value }))}
              >
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="pf-card-footer">
              <button className="pf-save-btn" type="button" disabled={saving}>
                Salvar alterações
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className="pf-card">
            <div className="pf-card-hdr">
              <Bell size={17}/>
              <div>
                <h3>Notificações</h3>
                <p>Gerencie como e quando ser notificado</p>
              </div>
              <button className="pf-edit-link" type="button" onClick={() => setShowPrefs(p => !p)}>
                {showPrefs ? 'Fechar' : 'Editar'}
              </button>
            </div>

            {showPrefs ? (
              <form onSubmit={handleSavePrefs} className="pf-prefs">
                <label className="pf-check-row">
                  <input type="checkbox" checked={prefs.emailNotifications}
                    onChange={e => setPrefs(p => ({ ...p, emailNotifications: e.target.checked }))}/>
                  <span>Notificações por email</span>
                </label>
                <label className="pf-check-row">
                  <input type="checkbox" checked={prefs.inAppNotifications}
                    onChange={e => setPrefs(p => ({ ...p, inAppNotifications: e.target.checked }))}/>
                  <span>Notificações no aplicativo</span>
                </label>
                <div className="pf-prefs-row">
                  <label>Antecedência</label>
                  <div className="pf-prefs-inline">
                    <input type="number" min="0" max="72" className="pf-num-input"
                      value={prefs.notifyHoursBefore}
                      onChange={e => setPrefs(p => ({ ...p, notifyHoursBefore: parseInt(e.target.value)||0 }))}/>
                    <span>horas antes</span>
                  </div>
                </div>
                <div className="pf-prefs-row">
                  <label>Silêncio (h)</label>
                  <div className="pf-prefs-inline">
                    <input type="number" min="0" max="23" className="pf-num-input"
                      value={prefs.quietHoursStart}
                      onChange={e => setPrefs(p => ({ ...p, quietHoursStart: parseInt(e.target.value)||0 }))}/>
                    <span>até</span>
                    <input type="number" min="0" max="23" className="pf-num-input"
                      value={prefs.quietHoursEnd}
                      onChange={e => setPrefs(p => ({ ...p, quietHoursEnd: parseInt(e.target.value)||0 }))}/>
                  </div>
                </div>
                <div className="pf-card-footer">
                  <button className="pf-save-btn" type="submit" disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar preferências'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pf-prefs-summary">
                <span>Email: <b>{prefs.emailNotifications ? 'Ativo' : 'Desativado'}</b></span>
                <span>App: <b>{prefs.inAppNotifications ? 'Ativo' : 'Desativado'}</b></span>
                <span>Aviso com <b>{prefs.notifyHoursBefore}h</b> de antecedência</span>
                <span>Silêncio: <b>{String(prefs.quietHoursStart).padStart(2,'0')}h–{String(prefs.quietHoursEnd).padStart(2,'0')}h</b></span>
              </div>
            )}
          </div>

          {/* Zona de Perigo */}
          <div className="pf-card pf-danger-card">
            <h3 className="pf-danger-title">Zona de Perigo</h3>
            <p className="pf-danger-sub">Ações irreversíveis para sua conta</p>
            <div className="pf-danger-actions">
              <button className="pf-logout-btn" type="button" onClick={handleLogout}>
                <LogOut size={15}/> Sair da conta
              </button>
              <button className="pf-delete-btn" type="button" disabled title="Em breve">
                <Trash2 size={15}/> Excluir conta
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
