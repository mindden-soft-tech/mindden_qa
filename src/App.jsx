import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, PlusCircle, Save, Camera, Loader2, RefreshCw, 
  LayoutDashboard, CheckCircle2, AlertCircle, Clock, CloudLightning, X, BarChart3, HelpCircle, Lock, LogOut
} from 'lucide-react';

import TablaTests from './components/TablaTests';
import Dashboard from './components/Dashboard';

// Credenciales Harcodeadas
const LOGIN_DATA = {
  user: "Equipo_QA",
  pass: "4xjd@zuHx"
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState(false);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table'); 
  const [toasts, setToasts] = useState([]);
  
  // Configuración AWS y Cloudinary
  const API_URL = "https://52.51.95.132/test_cases";
  const CLOUD_NAME = "dzm6gj8ol"; 
  const UPLOAD_PRESET = "testsheet_preset"; 

  const [nuevoTest, setNuevoTest] = useState({ 
    modulo: '', descripcion: '', estado: 'Pendiente', captura_url: '', asignado_a: '', tiempo_estimado: '' 
  });
  const [testSeleccionado, setTestSeleccionado] = useState(null);
  const [testEnEdicion, setTestEnEdicion] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?activo=eq.true&order=id.desc`);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error en fetch:", error);
      setTests([]);
      showToast("Error de conexión con la API", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthenticated) {
      fetchTests();
    }
  }, [isAuthenticated]);

  const chartData = useMemo(() => {
    const safeTests = Array.isArray(tests) ? tests : [];
    const stats = {
      total: safeTests.length,
      paso: safeTests.filter(t => t.estado === 'Pasó').length,
      fallo: safeTests.filter(t => t.estado === 'Falló').length,
      pendiente: safeTests.filter(t => t.estado === 'Pendiente').length,
      tiempoTotal: safeTests.reduce((acc, t) => acc + (parseInt(t.tiempo_estimado) || 0), 0)
    };
    
    const pieData = [
      { name: 'Pasó', value: stats.paso, color: '#10b981' },
      { name: 'Falló', value: stats.fallo, color: '#ef4444' },
      { name: 'Pendiente', value: stats.pendiente, color: '#f59e0b' }
    ];

    const modulosMap = safeTests.reduce((acc, t) => {
      acc[t.modulo] = (acc[t.modulo] || 0) + 1;
      return acc;
    }, {});
    
    const barData = Object.keys(modulosMap)
      .map(k => ({ name: k.length > 12 ? k.substring(0, 12) + '...' : k, total: modulosMap[k] }))
      .sort((a,b) => b.total - a.total).slice(0, 6);

    return { pieData, barData, stats };
  }, [tests]);

  // Manejo de Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput.user === LOGIN_DATA.user && loginInput.pass === LOGIN_DATA.pass) {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginInput({ user: '', pass: '' });
  };

  const subirACloudinary = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();
      return data.secure_url; 
    } catch (error) {
      showToast("Error subiendo imagen", "danger");
      return null;
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleAñadirTest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Prefer': 'return=representation' 
        },
        body: JSON.stringify({ 
          ...nuevoTest, 
          tiempo_estimado: parseInt(nuevoTest.tiempo_estimado) || 0, 
          activo: true 
        })
      });
      if (response.ok) {
        setNuevoTest({ modulo: '', descripcion: '', estado: 'Pendiente', captura_url: '', asignado_a: '', tiempo_estimado: '' });
        fetchTests();
        showToast("Caso creado correctamente");
      } else {
        showToast("Error al guardar en AWS", "danger");
      }
    } catch (error) {
      showToast("Error de red", "danger");
    }
  };

  const handleActualizarTest = async (id, cambios) => {
    try {
      const response = await fetch(`${API_URL}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal' 
        },
        body: JSON.stringify(cambios)
      });

      if (response.ok || response.status === 204) {
        fetchTests();
        showToast("Registro actualizado");
      } else {
        showToast("Error al sincronizar cambios", "danger");
      }
    } catch (err) {
      showToast("Error de conexión", "danger");
    }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tests);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_QA");
    XLSX.writeFile(wb, `QA_Cloud_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // VISTA DE LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="card border-0 shadow-lg p-4" style={{ width: '100%', maxWidth: '400px', borderRadius: '20px' }}>
          <div className="text-center mb-4">
            <div className="bg-primary rounded-circle d-inline-flex p-3 mb-3 shadow">
              <CloudLightning size={40} className="text-white"/>
            </div>
            <h3 className="fw-bold text-dark mb-1">XYNAXIS QA</h3>
            <p className="text-muted small">Ingresa tus credenciales para continuar</p>
          </div>
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">USUARIO</label>
              <input 
                type="text" 
                className={`form-control bg-light border-0 ${loginError ? 'is-invalid' : ''}`}
                value={loginInput.user} 
                onChange={e => setLoginInput({...loginInput, user: e.target.value})}
                required 
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">CONTRASEÑA</label>
              <div className="position-relative">
                <input 
                  type="password" 
                  className={`form-control bg-light border-0 ${loginError ? 'is-invalid' : ''}`}
                  value={loginInput.pass} 
                  onChange={e => setLoginInput({...loginInput, pass: e.target.value})}
                  required 
                />
              </div>
              {loginError && <div className="text-danger small mt-2 fw-bold">Credenciales incorrectas</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
              <Lock size={18} /> ACCEDER AL SISTEMA
            </button>
          </form>
          <div className="mt-4 text-center">
            <span className="text-muted" style={{ fontSize: '10px' }}>© 2026 XYNAXIS CLOUD v2.0</span>
          </div>
        </div>
      </div>
    );
  }

  // VISTA DE APLICACIÓN (AUTENTICADO)
  return (
    <div className="min-vh-100 position-relative" style={{ backgroundColor: '#f8fafc' }}>
      
      {/* Sistema de Toasts */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast show align-items-center text-white bg-${t.type === 'danger' ? 'danger' : 'success'} border-0 mb-2 shadow-lg animate-slide-in`}>
            <div className="d-flex">
              <div className="toast-body fw-bold small">
                {t.type === 'danger' ? <AlertCircle size={14} className="me-2"/> : <CheckCircle2 size={14} className="me-2"/>}
                {t.message}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}></button>
            </div>
          </div>
        ))}
      </div>

      {isUploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75" style={{zIndex: 9000}}>
          <Loader2 className="text-white animate-spin mb-3" size={50} />
          <h5 className="text-white fw-bold">SUBIENDO EVIDENCIA...</h5>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top py-2">
        <div className="container-fluid px-md-5 text-start">
          <div className="navbar-brand d-flex align-items-center fw-bold gap-2">
            <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
              <CloudLightning size={20} className="text-primary"/>
            </div>
            <span>XYNAXIS <span className="text-info">QA Cloud</span></span>
          </div>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${view === 'table' ? 'btn-light text-primary' : 'btn-outline-light'}`} onClick={() => setView('table')}>
              <LayoutDashboard size={16} className="me-1"/> Listado
            </button>
            <button className={`btn btn-sm ${view === 'dashboard' ? 'btn-light text-primary' : 'btn-outline-light'}`} onClick={() => setView('dashboard')}>
              <BarChart3 size={16} className="me-1"/> Analytics
            </button>
            <div className="vr text-white mx-2"></div>
            <button className="btn btn-sm btn-success fw-bold" onClick={fetchTests} title="Refrescar">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
            </button>
            <button className="btn btn-sm btn-light fw-bold" onClick={exportarExcel} title="Exportar Excel">
                <Download size={16}/>
            </button>
            <button className="btn btn-sm btn-danger fw-bold ms-2" onClick={handleLogout} title="Cerrar Sesión">
                <LogOut size={16}/>
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-md-5">
        {view === 'dashboard' ? (
          <Dashboard chartData={chartData} />
        ) : (
          <>
            {/* Resumen Superior */}
            <div className="row g-3 mb-4 text-start">
              {[
                {k: 'Total Casos', v: chartData.stats.total, icon: <LayoutDashboard/>, color: 'primary'},
                {k: 'Exitosos', v: chartData.stats.paso, icon: <CheckCircle2/>, color: 'success'},
                {k: 'Fallidos', v: chartData.stats.fallo, icon: <AlertCircle/>, color: 'danger'},
                {k: 'Pendientes', v: chartData.stats.pendiente, icon: <HelpCircle/>, color: 'warning'}
              ].map((item) => (
                <div className="col-md-3" key={item.k}>
                  <div className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center justify-content-between h-100">
                    <div>
                      <span className="small text-uppercase fw-bold text-muted" style={{fontSize: '10px'}}>{item.k}</span>
                      <h3 className={`mb-0 fw-bold text-${item.color}`}>{item.v}</h3>
                    </div>
                    <div className={`text-${item.color} opacity-25`}>{item.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario de Creación */}
            <div className="card border-0 shadow-sm mb-4 text-start overflow-hidden">
                <div className="bg-white border-bottom p-3">
                    <h6 className="mb-0 fw-bold text-primary small"><PlusCircle size={14} className="me-2"/>NUEVO REGISTRO DE CALIDAD</h6>
                </div>
                <div className="card-body bg-white">
                    <form className="row g-2 align-items-end" onSubmit={handleAñadirTest}>
                        <div className="col-md-2">
                            <label className="small fw-bold text-muted mb-1" style={{fontSize: '10px'}}>MÓDULO</label>
                            <input type="text" className="form-control form-control-sm bg-light border-0" value={nuevoTest.modulo} onChange={e => setNuevoTest({...nuevoTest, modulo: e.target.value})} placeholder="Ej: Core" required />
                        </div>
                        <div className="col-md-5">
                            <label className="small fw-bold text-muted mb-1" style={{fontSize: '10px'}}>DESCRIPCIÓN</label>
                            <input type="text" className="form-control form-control-sm bg-light border-0" value={nuevoTest.descripcion} onChange={e => setNuevoTest({...nuevoTest, descripcion: e.target.value})} placeholder="Detalle del caso..." required />
                        </div>
                        <div className="col-md-2">
                            <label className="small fw-bold text-muted mb-1" style={{fontSize: '10px'}}>ASIGNADO</label>
                            <input type="text" className="form-control form-control-sm bg-light border-0" value={nuevoTest.asignado_a} onChange={e => setNuevoTest({...nuevoTest, asignado_a: e.target.value})} placeholder="Analista" required />
                        </div>
                        <div className="col-md-1">
                            <label className="small fw-bold text-muted mb-1" style={{fontSize: '10px'}}>MIN</label>
                            <input type="number" className="form-control form-control-sm bg-light border-0" value={nuevoTest.tiempo_estimado} onChange={e => setNuevoTest({...nuevoTest, tiempo_estimado: e.target.value})} required />
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-primary btn-sm w-100 fw-bold py-2 shadow-sm">REGISTRAR</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tabla Principal */}
            <div className="card border-0 shadow-sm overflow-hidden text-start">
                {loading ? (
                    <div className="text-center py-5 bg-white"><Loader2 size={40} className="animate-spin text-primary" /></div>
                ) : (
                    <TablaTests 
                        tests={tests} 
                        onImageUpload={async (e, id) => {
                            const url = await subirACloudinary(e.target.files[0]);
                            if(url) handleActualizarTest(id, { captura_url: url });
                        }} 
                        onVerImagen={(t) => setTestSeleccionado(t)}
                        onCambiarEstado={(id, val) => handleActualizarTest(id, { estado: val })}
                        onEliminar={(id) => { 
                            if(window.confirm("¿Seguro que desea eliminar el registro?")) {
                                handleActualizarTest(id, { activo: false });
                            }
                        }}
                        onEditar={setTestEnEdicion}
                    />
                )}
            </div>
          </>
        )}
      </div>

      {/* Editor Modal */}
      {testEnEdicion && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', zIndex: 1050}}>
          <div className="modal-dialog modal-lg modal-dialog-centered text-start">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-primary">Editar Registro #{testEnEdicion.id}</h5>
                <button type="button" className="btn-close" onClick={() => setTestEnEdicion(null)}></button>
              </div>
              <form onSubmit={(e) => { 
                  e.preventDefault(); 
                  handleActualizarTest(testEnEdicion.id, {
                    modulo: testEnEdicion.modulo,
                    descripcion: testEnEdicion.descripcion,
                    estado: testEnEdicion.estado,
                    asignado_a: testEnEdicion.asignado_a,
                    captura_url: testEnEdicion.captura_url,
                    tiempo_estimado: parseInt(testEnEdicion.tiempo_estimado) || 0
                  }); 
                  setTestEnEdicion(null); 
                }}>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    <div className="col-md-8">
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">MÓDULO</label>
                            <input type="text" className="form-control border-0 bg-light" value={testEnEdicion.modulo} onChange={e => setTestEnEdicion({...testEnEdicion, modulo: e.target.value})} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold text-muted">DESCRIPCIÓN</label>
                            <textarea className="form-control border-0 bg-light" rows="4" value={testEnEdicion.descripcion} onChange={e => setTestEnEdicion({...testEnEdicion, descripcion: e.target.value})} />
                        </div>
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="form-label small fw-bold text-muted">ESTADO</label>
                                <select className="form-select border-0 bg-light" value={testEnEdicion.estado} onChange={e => setTestEnEdicion({...testEnEdicion, estado: e.target.value})}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Pasó">Pasó</option>
                                    <option value="Falló">Falló</option>
                                </select>
                            </div>
                            <div className="col-6">
                                <label className="form-label small fw-bold text-muted">ASIGNADO</label>
                                <input type="text" className="form-control border-0 bg-light" value={testEnEdicion.asignado_a} onChange={e => setTestEnEdicion({...testEnEdicion, asignado_a: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 text-center">
                        <label className="form-label small fw-bold text-muted d-block text-start">EVIDENCIA</label>
                        <div className="rounded bg-dark d-flex align-items-center justify-content-center mb-2 overflow-hidden border" style={{height: '180px'}}>
                            {testEnEdicion.captura_url ? (
                                <img src={testEnEdicion.captura_url} className="w-100 h-100 object-fit-cover shadow" alt="Evidencia" onClick={() => setTestSeleccionado(testEnEdicion)} style={{cursor: 'zoom-in'}} />
                            ) : (
                                <Camera className="text-white opacity-25" size={48}/>
                            )}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={async (e) => {
                            const url = await subirACloudinary(e.target.files[0]);
                            if(url) setTestEnEdicion({...testEnEdicion, captura_url: url});
                        }} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light fw-bold" onClick={() => setTestEnEdicion(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">Actualizar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Imagen */}
      {testSeleccionado && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000}} onClick={() => setTestSeleccionado(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered text-center">
             <div className="position-relative w-100">
                <img src={testSeleccionado.captura_url} className="img-fluid rounded shadow-lg" style={{ maxHeight: '90vh' }} alt="Fullscreen" />
                <button className="btn btn-dark btn-sm position-absolute top-0 end-0 m-3 rounded-circle shadow"><X size={24}/></button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default App;