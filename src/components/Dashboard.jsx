import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  LayoutDashboard, CheckCircle2, XCircle, Clock, AlertCircle,
  Timer, Users, Layers, RefreshCw, ShieldCheck, ShieldAlert
} from 'lucide-react';

const API_URL      = "http://52.51.95.132:3000/test_cases";
const HISTORIAL_URL = "http://52.51.95.132:3000/test_historial";

const pct = (n, total) => total === 0 ? 0 : Math.round((n / total) * 100);

/* ─── Tooltip personalizado ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card border-0 shadow p-2" style={{ fontSize: 12 }}>
      <div className="text-muted fw-bold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="fw-semibold">
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

/* ─── Barra de módulo ─── */
const ModuloBar = ({ name, paso, fallo, pendiente, total, maxTotal }) => {
  const w = (n) => `${Math.round((n / maxTotal) * 100)}%`;
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <span className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '70%' }}>{name}</span>
        <span className="small text-muted">{total} tests</span>
      </div>
      <div className="progress" style={{ height: 8, borderRadius: 99 }}>
        <div className="progress-bar bg-success" style={{ width: w(paso) }} />
        <div className="progress-bar bg-danger"  style={{ width: w(fallo) }} />
        <div className="progress-bar bg-warning" style={{ width: w(pendiente) }} />
      </div>
    </div>
  );
};

/* ─── KPI Card ─── */
const KpiCard = ({ icon: Icon, label, value, colorClass, delay = 0 }) => (
  <div className="col">
    <div className="card border-0 shadow-sm h-100" style={{ animationDelay: `${delay}s` }}>
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div className={`p-2 rounded-3 bg-${colorClass} bg-opacity-10`}>
          <Icon size={22} className={`text-${colorClass}`} />
        </div>
        <div>
          <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: 1 }}>{label}</div>
          <div className={`h4 mb-0 fw-bold text-${colorClass}`}>{value}</div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Dashboard principal ─── */
const Dashboard = () => {
  const [tests,    setTests]    = useState([]);
  const [historial,setHistorial]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updated,  setUpdated]  = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}?activo=eq.true&order=id.desc`),
        fetch(`${HISTORIAL_URL}?order=fecha_cambio.asc`)
      ]);
      const [t, h] = await Promise.all([r1.json(), r2.json()]);
      setTests(Array.isArray(t) ? t : []);
      setHistorial(Array.isArray(h) ? h : []);
      setUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const s = useMemo(() => {
    const total   = tests.length;
    const paso    = tests.filter(t => t.estado === 'Pasó').length;
    const fallo   = tests.filter(t => t.estado === 'Falló').length;
    const pending = tests.filter(t => t.estado === 'Pendiente').length;
    const tTotal  = tests.reduce((a, t) => a + (parseInt(t.tiempo_estimado) || 0), 0);
    const tFallo  = tests.filter(t => t.estado === 'Falló').reduce((a,t)=> a+(parseInt(t.tiempo_estimado)||0),0);
    const passRate = pct(paso, total);
    const failRate = pct(fallo, total);

    /* módulos */
    const modulosMap = {};
    tests.forEach(t => {
      if (!modulosMap[t.modulo]) modulosMap[t.modulo] = { paso:0, fallo:0, pendiente:0, total:0 };
      modulosMap[t.modulo].total++;
      if (t.estado === 'Pasó')      modulosMap[t.modulo].paso++;
      else if (t.estado === 'Falló') modulosMap[t.modulo].fallo++;
      else                           modulosMap[t.modulo].pendiente++;
    });
    const modulos  = Object.entries(modulosMap).map(([name,v])=>({name,...v})).sort((a,b)=>b.total-a.total).slice(0,8);
    const maxTotal = modulos[0]?.total || 1;

    /* responsables */
    const respMap = {};
    tests.forEach(t => {
      const k = t.asignado_a || 'Sin asignar';
      if (!respMap[k]) respMap[k] = { paso:0, fallo:0, pendiente:0, total:0 };
      respMap[k].total++;
      if (t.estado === 'Pasó')      respMap[k].paso++;
      else if (t.estado === 'Falló') respMap[k].fallo++;
      else                           respMap[k].pendiente++;
    });
    const responsables = Object.entries(respMap).map(([name,v])=>({name,...v})).sort((a,b)=>b.total-a.total).slice(0,6);

    /* ─── Lógica de Timeline Mejorada (Tendencia Acumulativa) ─── */
    const dayMap = {};
    // Inicializamos los últimos 14 días con valores base (asumiendo que todo empieza pendiente)
    const today = new Date();
    for(let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0,10);
      dayMap[dateStr] = { dia: dateStr.slice(5), 'Pasó': 0, 'Falló': 0, 'Pendiente': total };
    }

    // Procesamos el historial para ver la evolución
    // Nota: Esto es una aproximación visual del progreso
    let currentPaso = 0;
    let currentFallo = 0;

    historial.forEach(h => {
      const day = (h.fecha_cambio||'').slice(0,10);
      if (dayMap[day]) {
        if (h.estado_nuevo === 'Pasó') currentPaso++;
        if (h.estado_nuevo === 'Falló') currentFallo++;
        
        dayMap[day]['Pasó'] = currentPaso;
        dayMap[day]['Falló'] = currentFallo;
        dayMap[day]['Pendiente'] = Math.max(0, total - currentPaso - currentFallo);
      }
    });

    // Rellenamos los huecos (si un día no hubo cambios, mantiene el estado del anterior)
    const timeline = Object.values(dayMap).sort((a,b) => a.dia.localeCompare(b.dia));
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i]['Pasó'] === 0 && timeline[i]['Falló'] === 0) {
        timeline[i]['Pasó'] = timeline[i-1]['Pasó'];
        timeline[i]['Falló'] = timeline[i-1]['Falló'];
        timeline[i]['Pendiente'] = timeline[i-1]['Pendiente'];
      }
    }

    const pieData = [
      { name:'Pasó',      value: paso,    color:'#10b981' },
      { name:'Falló',     value: fallo,   color:'#ef4444' },
      { name:'Pendiente', value: pending, color:'#f59e0b' },
    ].filter(d=>d.value>0);

    return { total, paso, fallo, pending, tTotal, tFallo, passRate, failRate, modulos, maxTotal, responsables, timeline, pieData };
  }, [tests, historial]);

  if (loading) return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
      <div className="spinner-border text-primary" style={{ width: 40, height: 40 }} role="status" />
      <p className="text-muted mt-3 small">Cargando datos desde la nube…</p>
    </div>
  );

  const impacto = pct(s.tFallo, s.tTotal);
  const isCritical = s.failRate > 15;

  return (
    <div className="container-fluid p-4 bg-light min-vh-100">

      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <LayoutDashboard size={26} className="text-primary" />
          <div>
            <h5 className="fw-bold mb-0 text-dark">Panel de Control QA</h5>
            <span className="text-muted small">
              {updated ? `Actualizado ${updated.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}` : ''} · {s.total} casos activos
            </span>
          </div>
        </div>
        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" onClick={fetchAll}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div className="row row-cols-2 row-cols-md-5 g-3 mb-4">
        <KpiCard icon={Layers}       label="Total Tests"  value={s.total}         colorClass="primary" delay={0}    />
        <KpiCard icon={CheckCircle2} label="Pasaron"      value={s.paso}          colorClass="success" delay={0.05} />
        <KpiCard icon={XCircle}      label="Fallaron"     value={s.fallo}         colorClass="danger"  delay={0.1}  />
        <KpiCard icon={Clock}        label="Pendientes"   value={s.pending}       colorClass="warning" delay={0.15} />
        <KpiCard icon={Timer}        label="Tiempo Total" value={`${s.tTotal}m`}  colorClass="info"    delay={0.2}  />
      </div>

      <div className="row g-4">

        {/* ── Donut ── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: 1 }}>Distribución</span>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={s.pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4} stroke="none">
                      {s.pieData.map((d,i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* leyenda */}
              <div className="d-flex justify-content-center gap-3 mt-2">
                {s.pieData.map(d => (
                  <div key={d.name} className="d-flex align-items-center gap-1">
                    <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: d.color }} />
                    <span className="small text-muted">{d.name} <strong style={{ color: d.color }}>{d.value}</strong></span>
                  </div>
                ))}
              </div>
              {/* tasa de éxito */}
              <div className="text-center mt-4">
                <div className="display-6 fw-bold text-success">{s.passRate}%</div>
                <div className="text-muted small">tasa de éxito</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Timeline Mejorado ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <span className="text-muted small fw-bold text-uppercase d-block mb-3" style={{ letterSpacing: 1 }}>
                Tendencia de Progreso — últimos 14 días
              </span>
              {s.timeline.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center text-muted small" style={{ height: 220 }}>
                  Sin historial disponible aún
                </div>
              ) : (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={s.timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="gPass"    x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gFail"    x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25}/>
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Stacked Areas para ver el total acumulado */}
                      <Area type="monotone" dataKey="Pasó"      stackId="1" stroke="#10b981" fill="url(#gPass)"    strokeWidth={2} />
                      <Area type="monotone" dataKey="Falló"     stackId="1" stroke="#ef4444" fill="url(#gFail)"    strokeWidth={2} />
                      <Area type="monotone" dataKey="Pendiente" stackId="1" stroke="#f59e0b" fill="url(#gPending)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Módulos ── */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <Layers size={18} className="text-primary me-2" />
                <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: 1 }}>Cobertura por Módulo</span>
              </div>
              {s.modulos.length === 0
                ? <p className="text-muted small text-center pt-4">Sin datos de módulos</p>
                : s.modulos.map(m => <ModuloBar key={m.name} {...m} maxTotal={s.maxTotal} />)
              }
              <div className="d-flex gap-3 pt-3 border-top mt-2">
                {[['Pasó','success'],['Falló','danger'],['Pendiente','warning']].map(([l,c])=>(
                  <div key={l} className="d-flex align-items-center gap-1">
                    <span className={`bg-${c} rounded-circle d-inline-block`} style={{ width:8, height:8 }} />
                    <span className="small text-muted">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Responsables ── */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <Users size={18} className="text-primary me-2" />
                <span className="text-muted small fw-bold text-uppercase" style={{ letterSpacing: 1 }}>Carga por Responsable</span>
              </div>
              {s.responsables.length === 0
                ? <p className="text-muted small text-center pt-4">Sin datos de responsables</p>
                : s.responsables.map(r => (
                  <div key={r.name} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary"
                          style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                          {(r.name||'?')[0].toUpperCase()}
                        </div>
                        <span className="small fw-semibold text-dark">{r.name}</span>
                      </div>
                      <div className="d-flex gap-2">
                        <span className="badge bg-success-subtle text-success">{r.paso}✓</span>
                        <span className="badge bg-danger-subtle text-danger">{r.fallo}✗</span>
                        <span className="badge bg-warning-subtle text-warning">{r.pendiente}◐</span>
                      </div>
                    </div>
                    <div className="progress" style={{ height: 5, borderRadius: 99 }}>
                      <div className="progress-bar bg-success" style={{ width: `${pct(r.paso,r.total)}%` }} />
                      <div className="progress-bar bg-danger"  style={{ width: `${pct(r.fallo,r.total)}%` }} />
                      <div className="progress-bar bg-warning" style={{ width: `${pct(r.pendiente,r.total)}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* ── Impact Banner ── */}
        <div className="col-12">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: '#1e293b' }}>
            <div className="row g-0">
              <div className="col-md-7 p-5 text-white border-end border-secondary border-opacity-25">
                <div className="d-flex align-items-center mb-3">
                  <AlertCircle size={22} className="text-primary me-2" />
                  <span className="text-uppercase fw-bold opacity-75 small" style={{ letterSpacing: 2 }}>Deuda de Tiempo por Fallos</span>
                </div>
                <div className="d-flex align-items-baseline gap-3 mb-2">
                  <h1 className="display-2 fw-bold mb-0 text-danger">{s.tFallo}</h1>
                  <span className="h3 text-white-50 fw-light">min perdidos</span>
                </div>
                <p className="text-white-50 fs-6">
                  de <span className="text-white fw-bold">{s.tTotal} min</span> totales analizados ·{' '}
                  <span className={`fw-bold ${isCritical ? 'text-danger' : 'text-success'}`}>{impacto}% impacto</span>
                </p>
              </div>

              <div className="col-md-5 p-5 d-flex flex-column justify-content-center text-white" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">TASA DE ERROR</h5>
                  <span className="badge bg-danger fs-6 px-3">{s.fallo} fallos</span>
                </div>
                <div className="progress mb-3" style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className={`progress-bar progress-bar-striped progress-bar-animated ${isCritical ? 'bg-danger' : 'bg-warning'}`}
                    style={{ width: `${Math.min(s.failRate * 4, 100)}%` }}
                  />
                </div>
                <div className="d-flex justify-content-between mb-4">
                  <span className={`fw-bold ${isCritical ? 'text-danger' : 'text-success'}`}>{s.failRate}% tasa de fallo</span>
                  <span className="text-white-50 small">LÍMITE: 15%</span>
                </div>
                <div className="p-3 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-10">
                  <div className="d-flex align-items-center gap-3">
                    <div className={`p-2 rounded-circle ${isCritical ? 'bg-danger' : 'bg-success'} bg-opacity-20`}>
                      {isCritical ? <ShieldAlert size={22} className="text-danger" /> : <ShieldCheck size={22} className="text-success" />}
                    </div>
                    <div>
                      <p className="mb-0 fw-bold small text-uppercase">Estado Operativo</p>
                      <p className="mb-0 small opacity-75">
                        {isCritical
                          ? 'Atención: La tasa de error supera el margen de seguridad.'
                          : 'Óptimo: El sistema se mantiene estable y saludable.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;