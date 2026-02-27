import React, { useState } from 'react';
import { Camera, Eye, ChevronLeft, ChevronRight, Filter, X, Edit3, Trash2, User, Clock } from 'lucide-react';

const TablaTests = ({ tests, onImageUpload, onVerImagen, onCambiarEstado, onEliminar, onEditar }) => {
  const [filtros, setFiltros] = useState({ modulo: '', descripcion: '', estado: '', asignado_a: '' });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Adaptado a nombres de base de datos
  const filtrados = tests.filter(t => {
    return (
      (t.modulo?.toLowerCase().includes(filtros.modulo.toLowerCase())) &&
      (t.descripcion?.toLowerCase().includes(filtros.descripcion.toLowerCase())) &&
      (t.estado?.toLowerCase().includes(filtros.estado.toLowerCase())) &&
      (t.asignado_a?.toLowerCase().includes(filtros.asignado_a.toLowerCase()))
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
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 text-muted small fw-bold" style={{width: '120px'}}>MÓDULO</th>
              <th className="py-3 text-muted small fw-bold">DESCRIPCIÓN</th>
              <th className="py-3 text-muted small fw-bold" style={{width: '150px'}}>ESTADO</th>
              <th className="py-3 text-muted small fw-bold" style={{width: '150px'}}>RESPONSABLE</th>
              <th className="py-3 text-muted small fw-bold" style={{width: '100px'}}>TIEMPO</th>
              <th className="py-3 text-muted small fw-bold" style={{width: '120px'}}>EVIDENCIA</th>
              <th className="py-3 text-muted small fw-bold text-end pe-4" style={{width: '120px'}}>ACCIONES</th>
            </tr>
            <tr className="bg-white">
              <th className="ps-3"><input name="modulo" className="form-control form-control-sm border-0 bg-light" placeholder="Filtrar..." onChange={handleFiltroChange}/></th>
              <th><input name="descripcion" className="form-control form-control-sm border-0 bg-light" placeholder="Buscar..." onChange={handleFiltroChange}/></th>
              <th>
                <select name="estado" className="form-select form-select-sm border-0 bg-light" onChange={handleFiltroChange}>
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pasó">Pasó</option>
                  <option value="Falló">Falló</option>
                </select>
              </th>
              <th><input name="asignado_a" className="form-control form-control-sm border-0 bg-light" placeholder="Filtro..." onChange={handleFiltroChange}/></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {elementosVisibles.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-5 text-muted">No se encontraron registros en la nube.</td></tr>
            ) : (
              elementosVisibles.map((test) => (
                <tr key={test.id} className="border-bottom-0">
                  <td className="ps-4"><span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2">{test.modulo}</span></td>
                  <td className="small text-dark fw-medium">{test.descripcion}</td>
                  <td>
                    <select 
                      value={test.estado} 
                      className={`form-select form-select-sm fw-bold border-0 ${
                        test.estado === 'Pasó' ? 'text-success bg-success-subtle' : 
                        test.estado === 'Falló' ? 'text-danger bg-danger-subtle' : 'text-warning bg-warning-subtle'
                      }`}
                      onChange={(e) => onCambiarEstado(test.id, e.target.value)}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pasó">Pasó</option>
                      <option value="Falló">Falló</option>
                    </select>
                  </td>
                  <td className="small"><User size={14} className="me-1 text-muted"/> {test.asignado_a || 'Sin asignar'}</td>
                  <td className="small"><Clock size={14} className="me-1 text-muted"/> {test.tiempo_estimado}m</td>
                  <td>
                    {test.captura_url ? (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => onVerImagen(test)}><Eye size={16} /></button>
                    ) : (
                      <label className="btn btn-sm btn-outline-secondary mb-0">
                        <Camera size={16} />
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