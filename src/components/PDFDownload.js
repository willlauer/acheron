'use client';

import { useState } from 'react';

export default function PDFDownload({ 
  targetId = 'main-content', 
  fileName = 'page',
  className = ''
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Dynamic imports for client-side only libraries
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = targetId ? document.getElementById(targetId) : document.body;
      
      if (!element) {
        console.error(`Element with id "${targetId}" not found`);
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          return element.tagName === 'STYLE' && element.textContent?.includes('lab(');
        },
        onclone: (clonedDoc) => {
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => {
            if (style.textContent?.includes('lab(') || style.textContent?.includes('oklab(')) {
              style.remove();
            }
          });
          
          const fallbackStyle = clonedDoc.createElement('style');
          fallbackStyle.textContent = `
            * { color: black !important; }
            .dark\\:text-white { color: black !important; }
            .text-gray-600 { color: #666 !important; }
            .text-gray-400 { color: #999 !important; }
            .bg-zinc-50 { background-color: white !important; }
            .dark\\:bg-black { background-color: white !important; }
            .border-gray-200 { border-color: #e5e7eb !important; }
            .dark\\:border-gray-800 { border-color: #e5e7eb !important; }
          `;
          clonedDoc.head.appendChild(fallbackStyle);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={downloadPDF}
      disabled={isGenerating}
      className={`flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>{isGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
    </button>
  );
}