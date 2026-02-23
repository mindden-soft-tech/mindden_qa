import * as XLSX from 'xlsx';

export const descargarExcel = (data) => {
  try {
    if (!data || data.length === 0) return alert("No hay datos para exportar");

    // Preparamos los datos con nombres de columnas limpios
    const worksheet = XLSX.utils.json_to_sheet(data.map(t => ({
      ID: t.id,
      Modulo: t.modulo,
      Descripcion: t.descripcion,
      Estado: t.estado,
      Captura_B64: t.captura || "Sin imagen"
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tests");

    // Generamos un array buffer en lugar de un string directo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Creamos un Blob para la descarga segura
    const finalData = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(finalData);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Testing_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error crítico al exportar:", error);
    alert("Error al generar el archivo. Intenta con imágenes más pequeñas o menos cantidad.");
  }
};