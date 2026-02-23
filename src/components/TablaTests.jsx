import React, { useState } from 'react';
import { Camera, Eye, ChevronLeft, ChevronRight, Filter, X, Edit3, Trash2, User, Clock } from 'lucide-react';

const TablaTests = ({ tests, onImageUpload, onVerImagen, onCambiarEstado, onEliminar, onEditar }) => {
  const [filtros, setFiltros] = useState({ modulo: '', descripcion: '', estado: '', asignadoA: '' });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  const filtrados = tests.filter(t => {
    return (
      (t.modulo?.toLowerCase().includes(filtros.modulo.toLowerCase())) &&
      (t.descripcion?.toLowerCase().includes(filtros.descripcion.toLowerCase())) &&
      (t.estado?.toLowerCase().includes(filtros.estado.toLowerCase())) &&
      (t.asignadoA?.toLowerCase().includes(filtros.asignadoA.toLowerCase()))
    );
  });

  const totalPaginas = Math.ceil(filtrados.length / elementosPorPagina);
  const elementosVisibles = filtrados.slice((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    setPaginaActual(1);
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden bg-white">
      <div className="table-responsive">
        <table className="table table-hover mb-0 align-middle">
          <thead className="bg-light border-bottom">
            <tr>
              <th className="ps-4 py-3 text-secondary small fw-bold text-uppercase">#</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase">Módulo</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase">Descripción</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase">Asignado a / Tiempo</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase">Estado</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase text-center">Evidencia</th>
              <th className="py-3 text-secondary small fw-bold text-uppercase text-end pe-4">Acciones</th>
            </tr>
            <tr className="bg-white border-bottom">
              <th className="ps-4 py-2"><Filter size={14} className="text-muted" /></th>
              <th className="py-2">
                <input type="text" name="modulo" className="form-control form-control-sm border-light bg-light" placeholder="Módulo..." value={filtros.modulo} onChange={handleFiltroChange} />
              </th>
              <th className="py-2">
                <input type="text" name="descripcion" className="form-control form-control-sm border-light bg-light" placeholder="Buscar..." value={filtros.descripcion} onChange={handleFiltroChange} />
              </th>
              <th className="py-2">
                <input type="text" name="asignadoA" className="form-control form-control-sm border-light bg-light" placeholder="Dev..." value={filtros.asignadoA} onChange={handleFiltroChange} />
              </th>
              <th className="py-2">
                <select name="estado" className="form-select form-select-sm border-light bg-light" value={filtros.estado} onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pasó">Pasó</option>
                  <option value="Falló">Falló</option>
                </select>
              </th>
              <th colSpan="2" className="text-end pe-4">
                <button className="btn btn-sm text-primary p-0 fw-bold small" onClick={() => setFiltros({modulo:'', descripcion:'', estado:'', asignadoA:''})}>
                  <X size={14} /> Limpiar
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {elementosVisibles.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-5 text-muted small">No se encontraron registros</td></tr>
            ) : (
              elementosVisibles.map((test, index) => (
                <tr key={test.id} className="border-bottom border-light">
                  <td className="ps-4 text-muted small fw-bold">
                    {(index + 1) + (paginaActual - 1) * elementosPorPagina}
                  </td>
                  <td><span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 fw-semibold">{test.modulo}</span></td>
                  <td className="small text-wrap" style={{ maxWidth: '250px' }}>{test.descripcion}</td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      <div className="small fw-bold text-dark d-flex align-items-center">
                        <User size={12} className="me-1 text-primary" /> {test.asignadoA || 'Sin asignar'}
                      </div>
                      <div className="small text-muted d-flex align-items-center">
                        <Clock size={12} className="me-1" /> {test.tiempoEstimado || '0'} min
                      </div>
                    </div>
                  </td>
                  <td>
                    <select 
                      className={`form-select form-select-sm border-0 fw-bold ${
                        test.estado === 'Falló' ? 'text-danger bg-danger bg-opacity-10' : 
                        test.estado === 'Pasó' ? 'text-success bg-success bg-opacity-10' : 'text-warning bg-warning bg-opacity-10'
                      }`}
                      value={test.estado}
                      onChange={(e) => onCambiarEstado(test.id, e.target.value)}
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="Pasó">✅ Pasó</option>
                      <option value="Falló">❌ Falló</option>
                    </select>
                  </td>
                  <td className="text-center">
                    {test.captura ? (
                      <button className="btn btn-sm btn-outline-dark border-light shadow-sm px-3 rounded-pill" onClick={() => onVerImagen(test)}>
                        <Eye size={14} className="me-1" /> Ver
                      </button>
                    ) : (
                      <label className="btn btn-sm btn-light border-0 px-3 rounded-pill text-secondary" style={{ cursor: 'pointer' }}>
                        <Camera size={14} className="me-1" /> Foto
                        <input type="file" hidden onChange={(e) => onImageUpload(e, test.id)} accept="image/*" />
                      </label>
                    )}
                  </td>
                  <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-2">
                      <button className="btn btn-light btn-sm text-primary border shadow-sm" onClick={() => onEditar(test)}><Edit3 size={16} /></button>
                      <button className="btn btn-light btn-sm text-danger border shadow-sm" onClick={() => onEliminar(test.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className="px-4 py-3 bg-white border-top d-flex justify-content-center align-items-center gap-3">
          <button className="btn btn-sm btn-white border shadow-sm px-2" onClick={() => setPaginaActual(p => Math.max(1, p-1))} disabled={paginaActual === 1}><ChevronLeft size={16} /></button>
          <span className="small fw-bold">Página {paginaActual} de {totalPaginas}</span>
          <button className="btn btn-sm btn-white border shadow-sm px-2" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p+1))} disabled={paginaActual === totalPaginas}><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default TablaTests;