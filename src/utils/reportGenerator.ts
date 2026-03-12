import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateDivergencePDF = (companyName: string, competence: string, data: any[]) => {
  const doc = new jsPDF();

  // Cabeçalho do Relatório
  doc.setFontSize(18);
  doc.text('Relatório de Divergências - ReinfCheck', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Empresa: ${companyName}`, 14, 30);
  doc.text(`Competência: ${competence}`, 14, 36);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 42);

  // Linha divisória
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);

  // Mapeando os dados para a tabela
  const tableRows = data.map((item) => [
    item.invoice?.invoiceNumber || 'N/A',
    item.status === 'ERROR' ? 'ERRO' : 'AVISO',
    `R$ ${item.expectedRetention?.toFixed(2) || '0.00'}`,
    `R$ ${item.reportedRetention?.toFixed(2) || '0.00'}`,
    item.errorMessage
  ]);

  // Gerando a tabela
  autoTable(doc, {
    startY: 50,
    head: [['Nota', 'Status', 'Esperado', 'Informado', 'Descrição do Erro']],
    body: tableRows,
    headStyles: { fillStyle: 'f', fillColor: [37, 99, 235] }, // Azul profissional
    styles: { fontSize: 9 },
    columnStyles: {
      4: { cellWidth: 60 } // Dá mais espaço para a mensagem de erro
    }
  });

  // Rodapé com numeração de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
  }

  // Download do arquivo
  doc.save(`Divergencias_${companyName.replace(/\s+/g, '_')}_${competence.replace('/', '-')}.pdf`);
};