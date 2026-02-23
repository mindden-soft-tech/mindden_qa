import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, Download, PlusCircle, Trash2, Save, X, Camera } from 'lucide-react';
import TablaTests from './components/TablaTests';

function App() {
  const [tests, setTests] = useState(() => {
    const saved = localStorage.getItem('tester_app_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [nuevoTest, setNuevoTest] = useState({ modulo: '', descripcion: '', estado: 'Pendiente', captura: '' });
  const [testSeleccionado, setTestSeleccionado] = useState(null);
  const [testEnEdicion, setTestEnEdicion] = useState(null);

  useEffect(() => {
    localStorage.setItem('tester_app_data', JSON.stringify(tests));
  }, [tests]);

  const reiniciarBaseDeDatos = () => {
    if (window.confirm("⚠️ ¿BORRAR TODO EL PROYECTO? Esta acción no se puede deshacer.")) {
      setTests([]);
      localStorage.removeItem('tester_app_data');
    }
  };

  const optimizarImagen = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setTests(data.map((item, idx) => ({
        id: item.ID || Date.now() + idx,
        modulo: item.Modulo || '',
        descripcion: item.Descripcion || '',
        estado: item.Estado || 'Pendiente',
        captura: item.Captura_B64 || ''
      })));
    };
    reader.readAsBinaryString(file);
  };

  // FUNCIÓN CORREGIDA PARA EXPORTAR EXCEL
  const exportarExcel = () => {
    if (tests.length === 0) return alert("No hay datos para exportar");
    
    // Mapeo explícito para asegurar que todas las columnas existan
    const dataParaExcel = tests.map(t => ({
      ID: t.id,
      Modulo: t.modulo || '',
      Descripcion: t.descripcion || '',
      Estado: t.estado || 'Pendiente',
      Captura_B64: t.captura || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_QA");
    
    // Forzar la descarga del archivo
    XLSX.writeFile(wb, `Reporte_QA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleGuardarCambios = (e) => {
    e.preventDefault();
    setTests(tests.map(t => t.id === testEnEdicion.id ? testEnEdicion : t));
    setTestEnEdicion(null);
  };

  const stats = {
    total: tests.length,
    paso: tests.filter(t => t.estado === 'Pasó').length,
    fallo: tests.filter(t => t.estado === 'Falló').length,
    pendiente: tests.filter(t => t.estado === 'Pendiente').length
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="container-fluid py-4 px-md-5">
        
        {/* HEADER */}
        <header className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded shadow-sm">
          <div>
            <h1 className="h3 mb-1 text-primary fw-bold">Mindden TestSheet Manager Pro</h1>
            <p className="text-muted mb-0 small fw-bold">QA CONTROL PANEL</p>
          </div>
          <div className="d-flex gap-2">
            <label className="btn btn-outline-primary shadow-sm fw-bold" style={{cursor: 'pointer'}}>
              <FileUp size={18} className="me-2" /> Cargar Excel
              <input type="file" hidden onChange={handleFileUpload} />
            </label>
            <button className="btn btn-success shadow-sm fw-bold" onClick={exportarExcel}><Download size={18} className="me-2" /> Exportar</button>
          </div>
        </header>

        {/* DASHBOARD */}
        <div className="row g-4 mb-4 align-items-stretch">
          {[
            {label: 'TOTAL', val: stats.total, color: 'primary'},
            {label: 'PASÓ', val: stats.paso, color: 'success'},
            {label: 'FALLÓ', val: stats.fallo, color: 'danger'},
            {label: 'PENDIENTE', val: stats.pendiente, color: 'warning'}
          ].map((s, i) => (
            <div className="col-md-2" key={i}>
              <div className={`card border-0 shadow-sm bg-white p-3 border-start border-${s.color} border-4 h-100`}>
                <h6 className={`text-${s.color} small fw-bold text-uppercase`}>{s.label}</h6>
                <h3 className="mb-0 fw-bold">{s.val}</h3>
              </div>
            </div>
          ))}
          <div className="col-md-4 text-end d-flex align-items-center justify-content-end">
            {/* CORRECCIÓN DEL BOTÓN: btn-outline-danger puro para evitar problemas de hover */}
            <button className="btn btn-outline-danger fw-bold px-4 py-2 rounded-pill shadow-sm" onClick={reiniciarBaseDeDatos}>
              <Trash2 size={18} className="me-2"/> Limpiar Proyecto
            </button>
          </div>
        </div>

        {/* FORMULARIO RÁPIDO */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4 text-center">
            <form className="row g-3 align-items-end justify-content-center" onSubmit={(e) => {
              e.preventDefault();
              setTests([...tests, { ...nuevoTest, id: Date.now() }]);
              setNuevoTest({ modulo: '', descripcion: '', estado: 'Pendiente', captura: '' });
            }}>
              <div className="col-md-3">
                <input type="text" className="form-control" placeholder="Módulo..." value={nuevoTest.modulo} onChange={e => setNuevoTest({...nuevoTest, modulo: e.target.value})} required />
              </div>
              <div className="col-md-7">
                <input type="text" className="form-control" placeholder="Descripción de la prueba..." value={nuevoTest.descripcion} onChange={e => setNuevoTest({...nuevoTest, descripcion: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100 shadow-sm fw-bold"><PlusCircle size={20} className="me-1"/> Añadir</button>
              </div>
            </form>
          </div>
        </div>

        <TablaTests 
          tests={tests} 
          onImageUpload={async (e, id) => {
            const img = await optimizarImagen(e.target.files[0]);
            setTests(tests.map(t => t.id === id ? { ...t, captura: img } : t));
          }} 
          onVerImagen={setTestSeleccionado}
          onCambiarEstado={(id, val) => setTests(tests.map(t => t.id === id ? { ...t, estado: val } : t))}
          onEliminar={(id) => { if(window.confirm("¿Eliminar registro?")) setTests(tests.filter(t => t.id !== id)) }}
          onEditar={setTestEnEdicion}
        />

        {/* MODAL DE EDICIÓN - modal-lg */}
        {testEnEdicion && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-primary text-white border-0 py-3">
                  <h5 className="modal-title fw-bold">Modificar Caso de Prueba</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setTestEnEdicion(null)}></button>
                </div>
                <form onSubmit={handleGuardarCambios}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-md-7">
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">MÓDULO</label>
                          <input type="text" className="form-control border-primary-subtle" value={testEnEdicion.modulo} onChange={e => setTestEnEdicion({...testEnEdicion, modulo: e.target.value})} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold text-muted">DESCRIPCIÓN</label>
                          <textarea className="form-control border-primary-subtle" rows="6" value={testEnEdicion.descripcion} onChange={e => setTestEnEdicion({...testEnEdicion, descripcion: e.target.value})} required />
                        </div>
                        <div>
                          <label className="form-label small fw-bold text-muted">ESTADO</label>
                          <select className="form-select border-primary-subtle fw-bold" value={testEnEdicion.estado} onChange={e => setTestEnEdicion({...testEnEdicion, estado: e.target.value})}>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pasó">Pasó</option>
                            <option value="Falló">Falló</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-bold text-muted">EVIDENCIA / FOTO</label>
                        <div className="border rounded p-3 bg-light text-center h-100 d-flex flex-column align-items-center justify-content-center shadow-inner" style={{minHeight: '280px'}}>
                          {testEnEdicion.captura ? (
                            <>
                              <img src={testEnEdicion.captura} className="img-fluid rounded mb-3 shadow" style={{maxHeight: '220px'}} alt="Previsualización" />
                              <button type="button" className="btn btn-sm btn-outline-danger w-100 mb-2" onClick={() => setTestEnEdicion({...testEnEdicion, captura: ''})}>Eliminar Foto</button>
                            </>
                          ) : (
                            <div className="py-4 text-muted">
                              <Camera size={48} className="opacity-25 mb-2" />
                              <p className="small">Sin imagen adjunta</p>
                            </div>
                          )}
                          <div className="w-100">
                            <input type="file" className="form-control form-control-sm" accept="image/*" onChange={async (e) => {
                              if(e.target.files[0]) {
                                const img = await optimizarImagen(e.target.files[0]);
                                setTestEnEdicion({...testEnEdicion, captura: img});
                              }
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light border-0 py-3">
                    <button type="button" className="btn btn-white border px-4" onClick={() => setTestEnEdicion(null)}>Cerrar</button>
                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm d-flex align-items-center">
                      <Save size={18} className="me-2"/> Actualizar Información
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX IMAGEN */}
        {testSeleccionado && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)'}} onClick={() => setTestSeleccionado(null)}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content bg-transparent border-0">
                <div className="text-end mb-2">
                  <button className="btn btn-light rounded-circle p-2" onClick={() => setTestSeleccionado(null)}><X size={24}/></button>
                </div>
                <img src={testSeleccionado.captura} className="img-fluid rounded shadow-lg" style={{ maxHeight: '85vh', objectFit: 'contain' }} alt="Evidencia" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;