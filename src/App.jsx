import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import "./App.css"

const App = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const generatePDF = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Use Promise.all to handle async image loading
    const imagePromises = selectedFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Calculate scaling to fit image on page while maintaining aspect ratio
            const imgRatio = img.width / img.height;
            const pageRatio = pageWidth / pageHeight;

            let width, height;
            if (imgRatio > pageRatio) {
              // Image is wider relative to page
              width = pageWidth - 20; // 10mm margin on each side
              height = width / imgRatio;
            } else {
              // Image is taller relative to page
              height = pageHeight - 20; // 10mm margin on top and bottom
              width = height * imgRatio;
            }

            // Calculate position to center the image
            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            // Add page for all images except the first
            if (index > 0) {
              doc.addPage();
            }

            // Add the image to the PDF
            doc.addImage(e.target.result, 'JPEG', x, y, width, height);

            resolve();
          };
          img.onerror = reject;
          img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    // Save PDF after all images are processed
    Promise.all(imagePromises)
      .then(() => {
        doc.save('photos.pdf');
      })
      .catch((error) => {
        console.error('Error processing images:', error);
        alert('Failed to generate PDF. Please try again.');
      });
  };

  const removeImage = (indexToRemove) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    const newUrls = previewUrls.filter((_, index) => index !== indexToRemove);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  return (
    <div className="photo-to-pdf-container">
      <h1>Photo to PDF Converter</h1>
      <div className="file-input-container">
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
      
      {previewUrls.length > 0 && (
        <div className="preview-grid">
          {previewUrls.map((url, index) => (
            <div key={index} className="preview-item">
              <img 
                src={url} 
                alt={`Preview ${index + 1}`} 
              />
              <button 
                onClick={() => removeImage(index)}
                className="remove-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={generatePDF} 
        disabled={selectedFiles.length === 0}
        className="generate-pdf-button"
      >
        Generate PDF
      </button>
    </div>
  );
};

export default App;