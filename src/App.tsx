import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Laptop, 
  Video, 
  Hammer, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  User, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Filter,
  Info,
  Key,
  LogOut,
  CheckSquare,
  Square,
  CalendarDays
} from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  category: string;
  description: string;
  capacity: string;
  icon: React.ElementType;
  badgeColor: string;
  accentColor: string;
  cardBorder: string;
  btnBg: string;
}

interface Period {
  id: string;
  label: string;
  time: string;
}

interface BlockedDate {
  id: string;
  date: string;
  resourceId: string | null;
  reason: string;
  createdBy: string;
}

interface Reservation {
  id: string;
  resourceId: string;
  teacherName: string;
  subject: string;
  grade: string;
  notes?: string;
  date: string;
  shift: 'MANHA' | 'TARDE';
  periodId: string;
  periodLabel: string;
  createdAt: string;
}

const RESOURCES: Resource[] = [
  {
    id: 'chromebook-carrinho-1',
    name: 'Chromebooks - Carrinho 1 (30 UN)',
    category: 'CHROMEBOOK',
    description: 'Armário móvel 1 em tom Laranja contendo 30 Chromebooks carregados.',
    capacity: '30 Alunos',
    icon: Laptop,
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    accentColor: 'orange',
    cardBorder: 'border-orange-200 hover:border-orange-400',
    btnBg: 'bg-orange-600 hover:bg-orange-700 text-white'
  },
  {
    id: 'chromebook-carrinho-2',
    name: 'Chromebooks - Carrinho 2 (30 UN)',
    category: 'CHROMEBOOK',
    description: 'Armário móvel 2 em tom Verde contendo 30 Chromebooks carregados.',
    capacity: '30 Alunos',
    icon: Laptop,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    accentColor: 'emerald',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  {
    id: 'sala-google',
    name: 'Sala Google',
    category: 'SALA_GOOGLE',
    description: 'Espaço com Computadores de mesa e Lousa Digital',
    capacity: '35 Alunos',
    icon: Video,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    accentColor: 'blue',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    btnBg: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  {
    id: 'espaco-maker',
    name: 'Espaço Maker',
    category: 'ESPACO_MAKER',
    description: 'Bancadas de trabalho, laboratório de ciências, kits de robótica e ferramentas.',
    capacity: '30 Alunos',
    icon: Hammer,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    accentColor: 'purple',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white'
  }
];

const SHIFTS_PERIODS: Record<'MANHA' | 'TARDE', Period[]> = {
  MANHA: [
    { id: 'M1', label: '1ª Aula', time: '07:00 - 07:50' },
    { id: 'M2', label: '2ª Aula', time: '07:50 - 08:40' },
    { id: 'M3', label: '3ª Aula', time: '08:40 - 09:30' },
    { id: 'M4', label: '4ª Aula', time: '09:30 - 10:20' }, // Recreio entre 10:20 e 10:35
    { id: 'M5', label: '5ª Aula', time: '10:35 - 11:25' },
    { id: 'M6', label: '6ª Aula', time: '11:25 - 12:15' },
  ],
  TARDE: [
    { id: 'T1', label: '1ª Aula', time: '12:30 - 13:20' },
    { id: 'T2', label: '2ª Aula', time: '13:20 - 14:10' },
    { id: 'T3', label: '3ª Aula', time: '14:10 - 15:00' },
    { id: 'T4', label: '4ª Aula', time: '15:00 - 15:50' }, // Recreio entre 15:50 e 16:05
    { id: 'T5', label: '5ª Aula', time: '16:05 - 16:55' },
    { id: 'T6', label: '6ª Aula', time: '16:55 - 17:30' },
  ]
};

// Helper para obter a data de hoje no formato YYYY-MM-DD
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper para obter o mês atual no formato YYYY-MM
const getCurrentMonthString = () => {
  const today = new Date();
  return today.toISOString().substring(0, 7);
};

const DEFAULT_BLOCKED_DATES: BlockedDate[] = [
  {
    id: 'blk-1',
    date: '2026-08-15',
    resourceId: null, // Bloqueio global
    reason: 'Feriado Municipal - Aniversário da Cidade',
    createdBy: 'Direção Escolar'
  },
  {
    id: 'blk-2',
    date: '2026-08-20',
    resourceId: 'espaco-maker',
    reason: 'Manutenção Preventiva das Impressoras 3D',
    createdBy: 'Coordenador Maker'
  }
];

const DEFAULT_RESERVATIONS: Reservation[] = [
  {
    id: 'res-101',
    resourceId: 'chromebook-carrinho-1',
    teacherName: 'Prof. Carlos Eduardo',
    subject: 'Matemática',
    grade: '8º Ano B',
    date: getTodayString(),
    shift: 'MANHA',
    periodId: 'M1',
    periodLabel: '1ª Aula (07:00 - 07:50)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'res-102',
    resourceId: 'chromebook-carrinho-2',
    teacherName: 'Prof. Ricardo Santos',
    subject: 'Ciências',
    grade: '9º Ano A',
    date: getTodayString(),
    shift: 'MANHA',
    periodId: 'M2',
    periodLabel: '2ª Aula (07:50 - 08:40)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'res-103',
    resourceId: 'sala-google',
    teacherName: 'Profª Ana Paula',
    subject: 'Geografia',
    grade: '6º Ano A',
    date: getTodayString(),
    shift: 'TARDE',
    periodId: 'T1',
    periodLabel: '1ª Aula (12:30 - 13:20)',
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // Autenticação do Administrador
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Identificação do Professor
  const [teacherName, setTeacherName] = useState(() => {
    return localStorage.getItem('alda_teacher_name') || '';
  });

  // Estados de navegação
  const [activeTab, setActiveTab] = useState<'NEW_RESERVATION' | 'CALENDAR_VIEW' | 'ADMIN_PANEL'>('NEW_RESERVATION');

  // Formulário de Reserva
  const [selectedResource, setSelectedResource] = useState<string>(RESOURCES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedShift, setSelectedShift] = useState<'MANHA' | 'TARDE'>('MANHA');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  
  // Detalhes da Aula
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('8º Ano A');
  const [notes, setNotes] = useState('');

  // Mensagens de feedback
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info' | ''; message: string }>({ type: '', message: '' });

  // Estados do Admin
  const [adminFilterMonth, setAdminFilterMonth] = useState<string>(getCurrentMonthString());
  const [adminFilterDay, setAdminFilterDay] = useState<string>('');
  const [adminFilterResource, setAdminFilterResource] = useState<string>('ALL');
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);

  // Modo de bloqueio: 'RANGE' (Intervalo de datas) ou 'MULTIPLE' (Várias datas individuais)
  const [blockMode, setBlockMode] = useState<'RANGE' | 'MULTIPLE'>('RANGE');
  const [blockStartDate, setBlockStartDate] = useState(getTodayString());
  const [blockEndDate, setBlockEndDate] = useState(getTodayString());
  const [selectedDatesToBlock, setSelectedDatesToBlock] = useState<string[]>([getTodayString()]);
  const [tempSingleDate, setTempSingleDate] = useState(getTodayString());
  const [adminBlockResource, setAdminBlockResource] = useState('');
  const [adminBlockReason, setAdminBlockReason] = useState('');

  // Datas bloqueadas pela gestão escolar obtidas do servidor
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Reservas obtidas do servidor
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Carregar dados e sincronizar via polling em tempo real com o servidor
  const fetchServerData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        setBlockedDates(data.blockedDates || []);
      }
    } catch (e) {
      console.error('Erro ao conectar ao servidor:', e);
    }
  };

  useEffect(() => {
    fetchServerData();
    const interval = setInterval(fetchServerData, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('alda_teacher_name', teacherName);
  }, [teacherName]);

  // Objeto do recurso atualmente selecionado
  const currentResourceObj = useMemo(() => {
    return RESOURCES.find(r => r.id === selectedResource) || RESOURCES[0];
  }, [selectedResource]);

  // Verificar se a data selecionada possui bloqueio
  const dateBlockInfo = useMemo(() => {
    return blockedDates.find(b => 
      b.date === selectedDate && (b.resourceId === null || b.resourceId === selectedResource)
    );
  }, [blockedDates, selectedDate, selectedResource]);

  // Períodos ocupados na data e recurso selecionados
  const occupiedPeriodIds = useMemo(() => {
    return reservations
      .filter(r => r.resourceId === selectedResource && r.date === selectedDate)
      .map(r => r.periodId);
  }, [reservations, selectedResource, selectedDate]);

  // Reservas filtradas para a tabela do Admin
  const filteredReservationsForAdmin = useMemo(() => {
    return reservations.filter(r => {
      const matchMonth = adminFilterMonth === 'ALL' || r.date.startsWith(adminFilterMonth);
      const matchDay = !adminFilterDay || r.date === adminFilterDay;
      const matchResource = adminFilterResource === 'ALL' || r.resourceId === adminFilterResource;
      return matchMonth && matchDay && matchResource;
    });
  }, [reservations, adminFilterMonth, adminFilterDay, adminFilterResource]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'As@2026') {
      setIsAdminAuthenticated(true);
      setShowAdminAuthModal(false);
      setAdminPasswordInput('');
      setAuthError('');
      setActiveTab('ADMIN_PANEL');
      setFeedback({ type: 'success', message: 'Acesso Administrativo concedido com sucesso!' });
    } else {
      setAuthError('Senha incorreta. Tente novamente.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveTab('NEW_RESERVATION');
    setFeedback({ type: 'info', message: 'Sessão administrativa encerrada.' });
  };

  const openAdminTab = () => {
    if (isAdminAuthenticated) {
      setActiveTab('ADMIN_PANEL');
    } else {
      setShowAdminAuthModal(true);
    }
  };

  // Alternar seleção de períodos
  const togglePeriodSelection = (periodId: string) => {
    if (occupiedPeriodIds.includes(periodId) || dateBlockInfo) return;

    if (selectedPeriods.includes(periodId)) {
      setSelectedPeriods(selectedPeriods.filter(p => p !== periodId));
    } else {
      setSelectedPeriods([...selectedPeriods, periodId]);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    if (!teacherName.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe o seu nome.' });
      return;
    }

    if (!subject.trim() || !grade.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe a disciplina e a turma.' });
      return;
    }

    if (!notes.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe a atividade ou observação.' });
      return;
    }

    if (selectedPeriods.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos uma aula na grade.' });
      return;
    }

    // Trava de conflito local prévia
    const hasConflict = selectedPeriods.some(pId => occupiedPeriodIds.includes(pId));
    if (hasConflict) {
      setFeedback({ 
        type: 'error', 
        message: 'Um ou mais horários selecionados acabaram de ser reservados. Escolha outro slot.' 
      });
      return;
    }

    if (dateBlockInfo) {
      setFeedback({ 
        type: 'error', 
        message: `Esta data está bloqueada pela administração: ${dateBlockInfo.reason}` 
      });
      return;
    }

    // Criar uma reserva para cada período marcado
    const newReservations: Reservation[] = selectedPeriods.map(pId => {
      const pObj = SHIFTS_PERIODS[selectedShift].find(p => p.id === pId)!;
      return {
        id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        resourceId: selectedResource,
        teacherName: teacherName.trim(),
        subject: subject.trim(),
        grade: grade.trim(),
        notes: notes.trim(),
        date: selectedDate,
        shift: selectedShift,
        periodId: pId,
        periodLabel: `${pObj.label} (${pObj.time})`,
        createdAt: new Date().toISOString()
      };
    });

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservations)
      });

      if (!res.ok) {
        const errData = await res.json();
        setFeedback({
          type: 'error',
          message: errData.error || 'Erro ao realizar reserva no servidor.'
        });
        fetchServerData();
        return;
      }

      const data = await res.json();
      setReservations(data.reservations || []);
      setBlockedDates(data.blockedDates || []);
      setSelectedPeriods([]);
      setSubject('');
      setNotes('');
      setFeedback({ 
        type: 'success', 
        message: `Reserva efetuada com sucesso para ${currentResourceObj.name} em ${selectedDate.split('-').reverse().join('/')}!` 
      });
    } catch (e) {
      console.error('Erro na requisição:', e);
      setFeedback({ type: 'error', message: 'Erro de conexão com o servidor de reservas.' });
    }
  };

  const handleToggleSelectReservation = (id: string) => {
    if (selectedReservationIds.includes(id)) {
      setSelectedReservationIds(selectedReservationIds.filter(item => item !== id));
    } else {
      setSelectedReservationIds([...selectedReservationIds, id]);
    }
  };

  const handleSelectAllReservations = () => {
    if (selectedReservationIds.length === filteredReservationsForAdmin.length) {
      setSelectedReservationIds([]);
    } else {
      setSelectedReservationIds(filteredReservationsForAdmin.map(r => r.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedReservationIds.length === 0) return;
    
    try {
      const res = await fetch('/api/reservations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedReservationIds })
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        setBlockedDates(data.blockedDates || []);
        setFeedback({ 
          type: 'info', 
          message: `${selectedReservationIds.length} reserva(s) excluída(s) com sucesso.` 
        });
        setSelectedReservationIds([]);
      }
    } catch (e) {
      console.error('Erro ao excluir reservas em lote:', e);
    }
  };

  const handleSingleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        setBlockedDates(data.blockedDates || []);
        setSelectedReservationIds(prev => prev.filter(item => item !== id));
        setFeedback({ type: 'info', message: 'Reserva removida do sistema.' });
      }
    } catch (e) {
      console.error('Erro ao excluir reserva:', e);
    }
  };

  // Adicionar data individual à lista de datas para bloqueio
  const handleAddSingleDateToBlockList = () => {
    if (!tempSingleDate) return;
    if (!selectedDatesToBlock.includes(tempSingleDate)) {
      setSelectedDatesToBlock([...selectedDatesToBlock, tempSingleDate]);
    }
  };

  const handleRemoveDateFromBlockList = (d: string) => {
    setSelectedDatesToBlock(selectedDatesToBlock.filter(item => item !== d));
  };

  const handleAddBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminBlockReason.trim()) {
      setFeedback({ type: 'error', message: 'Informe a justificativa do bloqueio.' });
      return;
    }

    let datesToRegister: string[] = [];

    if (blockMode === 'RANGE') {
      if (!blockStartDate || !blockEndDate) {
        setFeedback({ type: 'error', message: 'Informe as datas inicial e final.' });
        return;
      }
      if (blockStartDate > blockEndDate) {
        setFeedback({ type: 'error', message: 'A data inicial não pode ser maior que a data final.' });
        return;
      }

      // Gerar array com todo o intervalo de datas
      const start = new Date(blockStartDate);
      const end = new Date(blockEndDate);
      const cur = new Date(start);

      while (cur <= end) {
        datesToRegister.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      if (selectedDatesToBlock.length === 0) {
        setFeedback({ type: 'error', message: 'Selecione ao menos uma data para bloquear.' });
        return;
      }
      datesToRegister = [...selectedDatesToBlock];
    }

    // Criar novos bloqueios para todas as datas coletadas
    const newBlocks: BlockedDate[] = datesToRegister.map(d => ({
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: d,
      resourceId: adminBlockResource || null,
      reason: adminBlockReason.trim(),
      createdBy: 'Direção Escolar'
    }));

    try {
      const res = await fetch('/api/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlocks)
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        setBlockedDates(data.blockedDates || []);
        setAdminBlockReason('');
        if (blockMode === 'MULTIPLE') setSelectedDatesToBlock([]);
        setFeedback({ 
          type: 'success', 
          message: `${datesToRegister.length} data(s) bloqueada(s) com sucesso na agenda!` 
        });
      }
    } catch (e) {
      console.error('Erro ao bloquear datas:', e);
    }
  };

  const handleRemoveBlockDate = async (id: string) => {
    try {
      const res = await fetch(`/api/blocked-dates/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setReservations(data.reservations || []);
        setBlockedDates(data.blockedDates || []);
        setFeedback({ type: 'info', message: 'Desbloqueio efetuado com sucesso.' });
      }
    } catch (e) {
      console.error('Erro ao desfaire bloqueio:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg shrink-0 flex items-center justify-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/1NhJzJHX_oa1uxxKdAw1epDhuCZwKWijZ" 
                  alt="Logo E.M.E.F.I Profª Alda de Souza Araújo" 
                  className="h-14 sm:h-16 w-auto max-w-[120px] object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "https://drive.google.com/uc?export=view&id=1NhJzJHX_oa1uxxKdAw1epDhuCZwKWijZ";
                  }}
                />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                  Sistema Integrado de Agendamento
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  E.M.E.F.I Profª Alda de Souza Araújo
                </h1>
                <p className="text-xs text-slate-300">
                  Reserva de Chromebooks (Carrinhos 1 e 2), Sala Google e Espaço Maker
                </p>
              </div>
            </div>

            {/* Status da Sessão Admin */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {isAdminAuthenticated ? (
                <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Modo Admin Ativo</span>
                  <button
                    onClick={handleAdminLogout}
                    className="ml-2 p-1 hover:bg-emerald-900 rounded-md transition-all text-emerald-200"
                    title="Sair do Modo Admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAdminTab}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Acesso Restrito Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('NEW_RESERVATION')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'NEW_RESERVATION'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Nova Reserva (Professor)
          </button>

          <button
            onClick={() => setActiveTab('CALENDAR_VIEW')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'CALENDAR_VIEW'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            Visão Geral da Agenda
          </button>

          <button
            onClick={openAdminTab}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ADMIN_PANEL'
                ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Painel do Administrador {isAdminAuthenticated ? '✓' : '🔒'}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Banner de Feedback */}
        {feedback.message && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-xs transition-all ${
            feedback.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-900' 
              : feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-3">
              {feedback.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
              {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {feedback.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
              <span className="text-xs sm:text-sm font-semibold">{feedback.message}</span>
            </div>
            <button 
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: NEW RESERVATION FORM */}
        {activeTab === 'NEW_RESERVATION' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Professor Name input */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Nome do Docente Responsável
                </label>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Step 1: Resource Picker */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Selecione o Equipamento ou Espaço
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RESOURCES.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedResource === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedResource(item.id);
                          setSelectedPeriods([]);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          item.cardBorder
                        } ${
                          isSelected
                            ? 'bg-slate-900 text-white ring-2 ring-blue-500 shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeColor}`}>
                              {item.category}
                            </span>
                            <IconComp className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <h3 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </h3>
                          <p className={`text-xs mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {item.description}
                          </p>
                        </div>
                        <span className={`mt-3 text-[11px] font-medium block ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                          Capacidade: {item.capacity}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Date and Shift Picker */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  Data e Período Escolar
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Data da Reserva
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayString()}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedPeriods([]);
                      }}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Turno Escolar
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { 
                          setSelectedShift('MANHA'); 
                          setSelectedPeriods([]); 
                          setGrade('8º Ano A');
                        }}
                        className={`py-2 px-3 text-xs font-extrabold rounded-xl border transition-all ${
                          selectedShift === 'MANHA'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Manhã (07h-12h15)
                        <span className="block text-[10px] font-normal opacity-90">8º e 9º Anos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { 
                          setSelectedShift('TARDE'); 
                          setSelectedPeriods([]); 
                          setGrade('6º Ano A');
                        }}
                        className={`py-2 px-3 text-xs font-extrabold rounded-xl border transition-all ${
                          selectedShift === 'TARDE'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Tarde (12h30-17h30)
                        <span className="block text-[10px] font-normal opacity-90">6º e 7º Anos</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status da Data */}
                {dateBlockInfo && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-900">
                    <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wide">Data Bloqueada pela Direção</h4>
                      <p className="text-xs mt-0.5 font-medium">{dateBlockInfo.reason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Class Info */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Dados da Aula
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Componente Curricular / Disciplina
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Matemática, Robótica, História"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Turma
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                    >
                      {selectedShift === 'MANHA' ? (
                        <>
                          <option value="8º Ano A">8º Ano A (Manhã)</option>
                          <option value="8º Ano B">8º Ano B (Manhã)</option>
                          <option value="8º Ano C">8º Ano C (Manhã)</option>
                          <option value="8º Ano D">8º Ano D (Manhã)</option>
                          <option value="8º Ano E">8º Ano E (Manhã)</option>
                          <option value="8º Ano F">8º Ano F (Manhã)</option>
                          <option value="8º Ano G">8º Ano G (Manhã)</option>
                          <option value="9º Ano A">9º Ano A (Manhã)</option>
                          <option value="9º Ano B">9º Ano B (Manhã)</option>
                          <option value="9º Ano C">9º Ano C (Manhã)</option>
                          <option value="9º Ano D">9º Ano D (Manhã)</option>
                          <option value="9º Ano E">9º Ano E (Manhã)</option>
                          <option value="9º Ano F">9º Ano F (Manhã)</option>
                          <option value="9º Ano G">9º Ano G (Manhã)</option>
                        </>
                      ) : (
                        <>
                          <option value="6º Ano A">6º Ano A (Tarde)</option>
                          <option value="6º Ano B">6º Ano B (Tarde)</option>
                          <option value="6º Ano C">6º Ano C (Tarde)</option>
                          <option value="6º Ano D">6º Ano D (Tarde)</option>
                          <option value="6º Ano E">6º Ano E (Tarde)</option>
                          <option value="6º Ano F">6º Ano F (Tarde)</option>
                          <option value="6º Ano G">6º Ano G (Tarde)</option>
                          <option value="7º Ano A">7º Ano A (Tarde)</option>
                          <option value="7º Ano B">7º Ano B (Tarde)</option>
                          <option value="7º Ano C">7º Ano C (Tarde)</option>
                          <option value="7º Ano D">7º Ano D (Tarde)</option>
                          <option value="7º Ano E">7º Ano E (Tarde)</option>
                          <option value="7º Ano F">7º Ano F (Tarde)</option>
                          <option value="7º Ano G">7º Ano G (Tarde)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Atividade ou Observação <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva obrigatoriamente a atividade, softwares necessários ou objetivos da aula..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Schedule slots */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Aulas do Período ({selectedShift})</h3>
                    <p className="text-xs text-slate-500">
                      Horários oficiais da escola. Selecione uma ou mais aulas.
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>

                {/* 6 Classes grid */}
                <div className="space-y-2">
                  {SHIFTS_PERIODS[selectedShift].map((period) => {
                    const isOccupied = occupiedPeriodIds.includes(period.id);
                    const isSelected = selectedPeriods.includes(period.id);
                    const isBlocked = !!dateBlockInfo;

                    const existingRes = isOccupied 
                      ? reservations.find(r => r.resourceId === selectedResource && r.date === selectedDate && r.periodId === period.id)
                      : null;

                    return (
                      <div
                        key={period.id}
                        onClick={() => togglePeriodSelection(period.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isBlocked
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                            : isOccupied
                            ? 'bg-red-50 border-red-200 cursor-not-allowed'
                            : isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md cursor-pointer'
                            : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-white shadow-xs'
                          }`}>
                            {isBlocked ? (
                              <Lock className="w-4 h-4 text-slate-400" />
                            ) : isOccupied ? (
                              <XCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                            )}
                          </div>

                          <div>
                            <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {period.label}
                            </span>
                            <span className={`block text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {period.time}
                            </span>
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="text-right">
                          {isBlocked ? (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Bloqueado</span>
                          ) : isOccupied ? (
                            <div className="text-right">
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-extrabold block">
                                Ocupado
                              </span>
                              {existingRes && (
                                <span className="text-[10px] text-red-700 block mt-0.5 max-w-[120px] truncate font-medium">
                                  {existingRes.teacherName}
                                </span>
                              )}
                            </div>
                          ) : isSelected ? (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                              Selecionado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              Livre
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit button */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center text-xs mb-4 text-slate-600 font-medium">
                    <span>Aulas Selecionadas:</span>
                    <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                      {selectedPeriods.length} de 6 aulas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateReservation}
                    disabled={selectedPeriods.length === 0 || !!dateBlockInfo}
                    className={`w-full py-3.5 rounded-xl text-xs font-extrabold tracking-wide uppercase shadow-lg transition-all flex items-center justify-center gap-2 ${
                      selectedPeriods.length > 0 && !dateBlockInfo
                        ? `${currentResourceObj.btnBg} active:scale-[0.99]`
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Agendamento
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CALENDAR VIEW */}
        {activeTab === 'CALENDAR_VIEW' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Visão Geral de Agendamentos</h2>
                  <p className="text-xs text-slate-500">
                    Consulte a disponibilidade dos 4 recursos para a data selecionada.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 border rounded-xl">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Data:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Grid of Resources for selected date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {RESOURCES.map((res) => {
                  const resReservations = reservations.filter(r => r.resourceId === res.id && r.date === selectedDate);
                  const isBlocked = blockedDates.some(b => b.date === selectedDate && (b.resourceId === null || b.resourceId === res.id));

                  return (
                    <div key={res.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${res.badgeColor}`}>
                            {res.category}
                          </span>
                          {isBlocked ? (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Bloqueado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {12 - resReservations.length}/12 Aulas do Dia Livres
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mb-3">{res.name}</h3>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {resReservations.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-3 text-center">Nenhum agendamento para esta data.</p>
                          ) : (
                            resReservations.map((r) => (
                              <div key={r.id} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                                <div className="font-extrabold text-slate-800">{r.periodLabel}</div>
                                <div className="text-[11px] text-slate-600 mt-0.5">{r.teacherName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{r.subject} ({r.grade})</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedResource(res.id);
                          setActiveTab('NEW_RESERVATION');
                        }}
                        disabled={isBlocked}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-extrabold transition-all ${
                          isBlocked
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : res.btnBg
                        }`}
                      >
                        Reservar {res.category}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN PANEL */}
        {activeTab === 'ADMIN_PANEL' && isAdminAuthenticated && (
          <div className="space-y-8">
            
            {/* Header info for Admin */}
            <div className="bg-amber-500/10 border border-amber-300/60 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-extrabold text-amber-950">Painel de Gestão Administrativa</h2>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Bloqueio individual ou em intervalo de datas, filtros por mês e por dia, exclusão em lote de reservas.
                  </p>
                </div>
              </div>
              <button
                onClick={handleAdminLogout}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair do Modo Admin
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form Block Multiple Dates */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    Bloquear Datas na Agenda
                  </h3>
                  
                  {/* Mode switcher */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBlockMode('RANGE')}
                      className={`px-3 py-1 rounded-lg transition-all ${blockMode === 'RANGE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'}`}
                    >
                      Intervalo (De/Até)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockMode('MULTIPLE')}
                      className={`px-3 py-1 rounded-lg transition-all ${blockMode === 'MULTIPLE' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600'}`}
                    >
                      Lista de Datas
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddBlockDates} className="space-y-4">
                  {blockMode === 'RANGE' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={blockStartDate}
                          onChange={(e) => setBlockStartDate(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={blockEndDate}
                          onChange={(e) => setBlockEndDate(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Adicionar Data para o Lote
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={tempSingleDate}
                          onChange={(e) => setTempSingleDate(e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddSingleDateToBlockList}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Adicionar
                        </button>
                      </div>

                      {/* Selected Dates Chips */}
                      {selectedDatesToBlock.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-32 overflow-y-auto">
                          {selectedDatesToBlock.map(d => (
                            <span key={d} className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              {d.split('-').reverse().join('/')}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveDateFromBlockList(d)} 
                                className="text-amber-800 hover:text-red-700 font-bold ml-1"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Recurso Específico (Opcional)
                    </label>
                    <select
                      value={adminBlockResource}
                      onChange={(e) => setAdminBlockResource(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="">TODOS OS RECURSOS (Bloqueio Geral)</option>
                      {RESOURCES.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Motivo / Justificativa
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Conselho de Classe, Feriado, Manutenção"
                      value={adminBlockReason}
                      onChange={(e) => setAdminBlockReason(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold text-xs tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Confirmar Bloqueio {blockMode === 'RANGE' ? 'do Intervalo' : `(${selectedDatesToBlock.length} data(s))` }
                  </button>
                </form>
              </div>

              {/* Blocked Dates List */}
              <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-slate-600" />
                  Datas Bloqueadas Cadastradas ({blockedDates.length})
                </h3>

                {blockedDates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum bloqueio cadastrado no momento.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {blockedDates.map((block) => {
                      const resTarget = RESOURCES.find(r => r.id === block.resourceId);
                      return (
                        <div key={block.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">
                                {block.date.split('-').reverse().join('/')}
                              </span>
                              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold uppercase">
                                {resTarget ? resTarget.name : 'Todos os Recursos'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium">{block.reason}</p>
                          </div>

                          <button
                            onClick={() => handleRemoveBlockDate(block.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover Bloqueio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* General Management Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              
              {/* Table Filters Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Gerenciamento Geral de Reservas ({filteredReservationsForAdmin.length})
                  </h3>
                  <p className="text-xs text-slate-500">Filtre por mês, dia ou recurso. Selecione itens para exclusão em lote.</p>
                </div>

                {/* Filter inputs */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter by Month */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Mês:</span>
                    <input
                      type="month"
                      value={adminFilterMonth === 'ALL' ? '' : adminFilterMonth}
                      onChange={(e) => {
                        setAdminFilterMonth(e.target.value || 'ALL');
                        setAdminFilterDay('');
                      }}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                    {adminFilterMonth !== 'ALL' && (
                      <button 
                        onClick={() => setAdminFilterMonth('ALL')}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filter by Day */}
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Dia Exato:</span>
                    <input
                      type="date"
                      value={adminFilterDay}
                      onChange={(e) => setAdminFilterDay(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                    />
                    {adminFilterDay && (
                      <button 
                        onClick={() => setAdminFilterDay('')}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filter by Resource */}
                  <select
                    value={adminFilterResource}
                    onChange={(e) => setAdminFilterResource(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-slate-50"
                  >
                    <option value="ALL">Todos os Recursos</option>
                    {RESOURCES.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Batch Action Toolbar */}
              {selectedReservationIds.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900">
                    {selectedReservationIds.length} reserva(s) selecionada(s)
                  </span>
                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Selecionados
                  </button>
                </div>
              )}

              {/* Reservations Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="p-3 w-10 text-center">
                        <button onClick={handleSelectAllReservations} className="text-slate-600">
                          {filteredReservationsForAdmin.length > 0 && selectedReservationIds.length === filteredReservationsForAdmin.length ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Data</th>
                      <th className="p-3">Recurso</th>
                      <th className="p-3">Professor(a)</th>
                      <th className="p-3">Disciplina / Turma</th>
                      <th className="p-3">Aula</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredReservationsForAdmin.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          Nenhuma reserva encontrada para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredReservationsForAdmin.map((r) => {
                        const resObj = RESOURCES.find(item => item.id === r.resourceId);
                        const isChecked = selectedReservationIds.includes(r.id);

                        return (
                          <tr key={r.id} className={`hover:bg-slate-50 transition-all ${isChecked ? 'bg-blue-50/40' : ''}`}>
                            <td className="p-3 text-center">
                              <button onClick={() => handleToggleSelectReservation(r.id)}>
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {r.date.split('-').reverse().join('/')}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${resObj?.badgeColor}`}>
                                {resObj?.name}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{r.teacherName}</td>
                            <td className="p-3 text-slate-600">{r.subject} ({r.grade})</td>
                            <td className="p-3 text-slate-600">{r.periodLabel}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleSingleDelete(r.id)}
                                className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir esta reserva"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Admin Auth Modal */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Acesso do Administrador</h3>
                <p className="text-xs text-slate-500">Informe a senha de gestão para continuar.</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Digite a senha..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {authError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5">{authError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminAuthModal(false);
                    setAuthError('');
                    setAdminPasswordInput('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
