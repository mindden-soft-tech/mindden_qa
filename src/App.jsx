import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, Download, PlusCircle, Trash2, Save, X, Camera, Clock, User, Loader2, CloudLightning } from 'lucide-react';
import TablaTests from './components/TablaTests';

function App() {
  const [tests, setTests] = useState(() => {
    const saved = localStorage.getItem('tester_app_data');
    return saved ? JSON.parse(saved) : [];
  });

  // =========================================================
  // ✅ CONFIGURACIÓN CLOUDINARY (dzm6gj8ol / testsheet_preset)
  // =========================================================
  const CLOUD_NAME = "dzm6gj8ol"; 
  const UPLOAD_PRESET = "testsheet_preset"; 
  // =========================================================

  const [nuevoTest, setNuevoTest] = useState({ 
    modulo: '', descripcion: '', estado: 'Pendiente', captura: '', asignadoA: '', tiempoEstimado: '' 
  });
  const [testSeleccionado, setTestSeleccionado] = useState(null);
  const [testEnEdicion, setTestEnEdicion] = useState(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    localStorage.setItem('tester_app_data', JSON.stringify(tests));
  }, [tests]);

  const reiniciarBaseDeDatos = () => {
    if (window.confirm("⚠️ ¿BORRAR TODO EL PROYECTO? Esta acción no se puede deshacer.")) {
      setTests([]);
      localStorage.removeItem('tester_app_data');
    }
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
        body: formData,
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Fallo en la subida a la nube");
      }
      
      setIsUploading(false);
      return data.secure_url; 
    } catch (error) {
      console.error("Error en Cloudinary:", error);
      alert(`❌ Error al guardar imagen: ${error.message}`);
      setIsUploading(false);
      return null;
    }
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
        modulo: item.Modulo || item.Módulo || '',
        descripcion: item.Descripcion || item.Descripción || '',
        estado: item.Estado || 'Pendiente',
        asignadoA: item.Asignado_A || '',
        tiempoEstimado: item.Tiempo_Minutos || '',
        captura: item.URL_Evidencia || item.Captura_URL || item.Captura_B64 || ''
      })));
    };
    reader.readAsBinaryString(file);
  };

  const exportarExcel = async () => {
    if (tests.length === 0) return alert("No hay datos para exportar");
    
    setIsExporting(true);

    setTimeout(() => {
      try {
        const dataParaExcel = tests.map((t, index) => ({
          "ID": t.id,
          "Modulo": t.modulo || '',
          "Descripcion": t.descripcion || '',
          "Asignado_A": t.asignadoA || '',
          "Tiempo_Minutos": t.tiempoEstimado || '',
          "Estado": t.estado || 'Pendiente',
          "URL_Evidencia": t.captura || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte_QA");

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const finalData = new Blob([excelBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = window.URL.createObjectURL(finalData);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Reporte_QA_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error al exportar:", error);
        alert("Error al generar el Excel.");
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // ✅ CORRECCIÓN: Función robusta para guardar cambios incluyendo la nueva imagen
  const handleGuardarCambios = (e) => {
    e.preventDefault();
    setTests(tests.map(t => t.id === testEnEdicion.id ? { ...testEnEdicion } : t));
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
      {isUploading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75" style={{zIndex: 9999}}>
          <Loader2 className="text-white animate-spin mb-3" size={60} />
          <h4 className="text-white fw-bold">GUARDANDO EN LA NUBE...</h4>
        </div>
      )}

      <div className="container-fluid py-4 px-md-5">
        <header className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded shadow-sm">
          <div>
            <h1 className="h3 mb-1 text-primary fw-bold">Mindden TestSheet Manager Pro</h1>
            <p className="text-muted mb-0 small fw-bold">QA CONTROL PANEL <CloudLightning size={14} className="text-warning" /></p>
          </div>
          <div className="d-flex gap-2">
            <label className="btn btn-outline-primary fw-bold" style={{cursor: 'pointer'}}>
              <FileUp size={18} className="me-2" /> Cargar
              <input type="file" hidden onChange={handleFileUpload} accept=".xlsx" />
            </label>
            <button 
              className="btn btn-success fw-bold d-flex align-items-center" 
              onClick={exportarExcel}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={18} className="me-2 animate-spin" /> Generando...
                </>
              ) : (
                <>
                  <Download size={18} className="me-2" /> Exportar Excel
                </>
              )}
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="row g-4 mb-4">
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
          <div className="col-md-4 d-flex align-items-center justify-content-end">
            <button className="btn btn-outline-danger fw-bold rounded-pill" onClick={reiniciarBaseDeDatos}>
              <Trash2 size={18} className="me-2"/> Limpiar Todo
            </button>
          </div>
        </div>

        {/* Formulario Añadir */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <form className="row g-3 align-items-end" onSubmit={(e) => {
              e.preventDefault();
              setTests([...tests, { ...nuevoTest, id: Date.now() }]);
              setNuevoTest({ modulo: '', descripcion: '', estado: 'Pendiente', captura: '', asignadoA: '', tiempoEstimado: '' });
            }}>
              <div className="col-md-2">
                <label className="small fw-bold text-muted">MÓDULO</label>
                <input type="text" className="form-control" placeholder="Ej: Login" value={nuevoTest.modulo} onChange={e => setNuevoTest({...nuevoTest, modulo: e.target.value})} required />
              </div>
              <div className="col-md-4">
                <label className="small fw-bold text-muted">DESCRIPCIÓN</label>
                <input type="text" className="form-control" placeholder="¿Qué falló?" value={nuevoTest.descripcion} onChange={e => setNuevoTest({...nuevoTest, descripcion: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <label className="small fw-bold text-muted">ASIGNADO A</label>
                <input type="text" className="form-control" placeholder="Nombre Dev" value={nuevoTest.asignadoA} onChange={e => setNuevoTest({...nuevoTest, asignadoA: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <label className="small fw-bold text-muted">TIEMPO ESTIMADO (MIN)</label>
                <input type="number" className="form-control" placeholder="Ej: 30" value={nuevoTest.tiempoEstimado} onChange={e => setNuevoTest({...nuevoTest, tiempoEstimado: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100 fw-bold"><PlusCircle size={20} className="me-1"/> Añadir</button>
              </div>
            </form>
          </div>
        </div>

        <TablaTests 
          tests={tests} 
          onImageUpload={async (e, id) => {
            if(e.target.files[0]) {
              const url = await subirACloudinary(e.target.files[0]);
              if(url) {
                setTests(tests.map(t => t.id === id ? { ...t, captura: url } : t));
              }
            }
          }} 
          onVerImagen={setTestSeleccionado}
          onCambiarEstado={(id, val) => setTests(tests.map(t => t.id === id ? { ...t, estado: val } : t))}
          onEliminar={(id) => { if(window.confirm("¿Eliminar?")) setTests(tests.filter(t => t.id !== id)) }}
          onEditar={setTestEnEdicion}
        />

        {/* Modal Editar Corregido */}
        {testEnEdicion && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050}}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">Editar Caso de Prueba</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setTestEnEdicion(null)}></button>
                </div>
                <form onSubmit={handleGuardarCambios}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-md-7">
                        <div className="mb-3">
                          <label className="form-label small fw-bold">MÓDULO</label>
                          <input type="text" className="form-control" value={testEnEdicion.modulo} onChange={e => setTestEnEdicion({...testEnEdicion, modulo: e.target.value})} />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">DESCRIPCIÓN</label>
                          <textarea className="form-control" rows="3" value={testEnEdicion.descripcion} onChange={e => setTestEnEdicion({...testEnEdicion, descripcion: e.target.value})} />
                        </div>
                        <div className="row mb-3">
                          <div className="col">
                            <label className="form-label small fw-bold">ASIGNADO A</label>
                            <input type="text" className="form-control" value={testEnEdicion.asignadoA} onChange={e => setTestEnEdicion({...testEnEdicion, asignadoA: e.target.value})} />
                          </div>
                          <div className="col">
                            <label className="form-label small fw-bold">TIEMPO (MIN)</label>
                            <input type="number" className="form-control" value={testEnEdicion.tiempoEstimado} onChange={e => setTestEnEdicion({...testEnEdicion, tiempoEstimado: e.target.value})} />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">ESTADO</label>
                          <select className="form-select fw-bold" value={testEnEdicion.estado} onChange={e => setTestEnEdicion({...testEnEdicion, estado: e.target.value})}>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pasó">Pasó</option>
                            <option value="Falló">Falló</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-bold">EVIDENCIA EN LA NUBE</label>
                        <div className="border rounded p-2 bg-light text-center">
                          {testEnEdicion.captura && <img src={testEnEdicion.captura} className="img-fluid rounded mb-2 shadow-sm" style={{maxHeight: '150px'}} alt="Evidencia" />}
                          <input type="file" className="form-control form-control-sm" onChange={async (e) => {
                            if(e.target.files[0]) {
                              // ✅ CORRECCIÓN: Subir a Cloudinary y actualizar el estado temporal del modal inmediatamente
                              const url = await subirACloudinary(e.target.files[0]);
                              if(url) setTestEnEdicion(prev => ({...prev, captura: url}));
                            }
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setTestEnEdicion(null)}>Cerrar</button>
                    <button type="submit" className="btn btn-primary px-4 fw-bold"><Save size={18} className="me-2"/> Guardar Cambios</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {testSeleccionado && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1100}} onClick={() => setTestSeleccionado(null)}>
            <div className="modal-dialog modal-xl modal-dialog-centered text-center">
              <img src={testSeleccionado.captura} className="img-fluid rounded shadow-lg" style={{ maxHeight: '90vh' }} alt="Evidencia Full" />
            </div>
          </div>
        )}
      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;