import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, Download, PlusCircle, CheckCircle, XCircle, Clock, Database, Trash2, AlertTriangle } from 'lucide-react';
import TablaTests from './components/TablaTests';

function App() {
  const [tests, setTests] = useState(() => {
    const saved = localStorage.getItem('tester_app_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [nuevoTest, setNuevoTest] = useState({ modulo: '', descripcion: '', estado: 'Pendiente', captura: '' });
  const [testSeleccionado, setTestSeleccionado] = useState(null);

  useEffect(() => {
    localStorage.setItem('tester_app_data', JSON.stringify(tests));
  }, [tests]);

  // --- FUNCIÓN DE REINICIO CON ADVERTENCIA ---
  const reiniciarBaseDeDatos = () => {
    const confirmar = window.confirm(
      "⚠️ ¿ESTÁS SEGURO?\n\nEsta acción borrará todos los casos de prueba y capturas guardados localmente. Esta acción no se puede deshacer."
    );
    if (confirmar) {
      setTests([]);
      localStorage.removeItem('tester_app_data');
    }
  };

  const stats = {
    total: tests.length,
    paso: tests.filter(t => t.estado === 'Pasó').length,
    fallo: tests.filter(t => t.estado === 'Falló').length,
    pendiente: tests.filter(t => t.estado === 'Pendiente').length
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
          const MAX_WIDTH = 800;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
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

  const exportarExcel = () => {
    if (tests.length === 0) return alert("No hay datos para exportar");
    const ws = XLSX.utils.json_to_sheet(tests.map(t => ({
      ID: t.id, Modulo: t.modulo, Descripcion: t.descripcion, Estado: t.estado, Captura_B64: t.captura
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_QA");
    XLSX.writeFile(wb, `Reporte_QA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-light min-vh-100 pb-5">
      <div className="container-fluid py-4 px-md-5">
        
        {/* HEADER */}
        <header className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded shadow-sm">
          <div>
            <h1 className="h3 mb-1 text-primary fw-bold">Mindden TestSheet Manager Pro</h1>
            <p className="text-muted mb-0 small fw-bold text-uppercase">Control de Calidad & QA</p>
          </div>
          <div className="d-flex gap-2">
            <label className="btn btn-outline-primary shadow-sm" style={{cursor: 'pointer'}}>
              <FileUp size={18} className="me-2" /> Cargar Excel
              <input type="file" hidden onChange={handleFileUpload} />
            </label>
            <button className="btn btn-success shadow-sm" onClick={exportarExcel}><Download size={18} className="me-2" /> Exportar</button>
          </div>
        </header>

        {/* DASHBOARD + BOTÓN RESET */}
        <div className="row g-4 mb-4 align-items-stretch">
          <div className="col-md-2">
            <div className="card border-0 shadow-sm bg-white p-3 border-start border-primary border-4 h-100">
              <h6 className="text-muted small fw-bold">TOTAL</h6>
              <h3 className="mb-0 fw-bold text-primary">{stats.total}</h3>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm bg-white p-3 border-start border-success border-4 h-100">
              <h6 className="text-muted small fw-bold text-success">PASÓ</h6>
              <h3 className="mb-0 fw-bold text-success">{stats.paso}</h3>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm bg-white p-3 border-start border-danger border-4 h-100">
              <h6 className="text-muted small fw-bold text-danger">FALLÓ</h6>
              <h3 className="mb-0 fw-bold text-danger">{stats.fallo}</h3>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 shadow-sm bg-white p-3 border-start border-warning border-4 h-100">
              <h6 className="text-muted small fw-bold text-warning">PENDIENTE</h6>
              <h3 className="mb-0 fw-bold text-warning">{stats.pendiente}</h3>
            </div>
          </div>
          {/* BOTÓN REINICIAR */}
          <div className="col-md-4 text-end d-flex align-items-center justify-content-end">
            <button 
              className="btn btn-outline-danger border-0 fw-bold d-flex align-items-center gap-2 px-3 py-2 bg-danger bg-opacity-10 rounded-pill"
              onClick={reiniciarBaseDeDatos}
            >
              <Trash2 size={18} /> Limpiar Todo el Proyecto
            </button>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <form className="row g-3 align-items-end" onSubmit={(e) => {
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
          onEliminar={(id) => setTests(tests.filter(t => t.id !== id))}
        />

        {/* MODAL LIGHTBOX */}
        {testSeleccionado && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.85)'}} onClick={() => setTestSeleccionado(null)}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-primary">{testSeleccionado.modulo}</h5>
                  <button type="button" className="btn-close" onClick={() => setTestSeleccionado(null)}></button>
                </div>
                <div className="modal-body text-center p-4">
                  <img src={testSeleccionado.captura} className="img-fluid rounded shadow-lg" style={{ maxHeight: '70vh' }} alt="Evidencia" />
                  <div className="mt-4 p-3 bg-light rounded text-start border small">
                    <strong>Descripción:</strong> {testSeleccionado.descripcion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;