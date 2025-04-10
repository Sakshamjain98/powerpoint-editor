import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";

/**
 * Export the current canvas as a PPTX file
 * @param {fabric.Canvas} canvas - The Fabric.js canvas to export
 * @param {string} fileName - The filename for the exported file
 * @param {Object} options - Additional export options
 * @returns {Promise<boolean>} - Success status
 */
export function exportAsPPTX(canvas, fileName = "Presentation", options = {}) {
  if (!canvas) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    try {
      const pptx = new pptxgen();

      // Set presentation properties
      pptx.title = fileName;
      pptx.subject = "Created with PowerPoint Editor";
      pptx.author = "PowerPoint Editor User";

      // Create a slide
      const slide = pptx.addSlide();

      // Set background if specified in options
      if (options.background) {
        slide.background = { color: options.background };
      }

      // Convert current canvas to image and add to slide
      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // Add the full canvas image to slide (fit to slide dimensions)
      slide.addImage({
        data: imgData,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%"
      });

      // Also add each individual object to maintain editability
      const objects = canvas.getObjects();
      objects.forEach(obj => {
        const left = obj.left / canvas.width;
        const top = obj.top / canvas.height;
        const width = obj.width / canvas.width;
        const height = obj.height / canvas.height;

        if (obj.type === "i-text" || obj.type === "text") {
          slide.addText(obj.text || "", {
            x: left,
            y: top,
            w: width,
            h: height,
            fontSize: (obj.fontSize || 24) / 2,
            bold: obj.fontWeight === "bold",
            italic: obj.fontStyle === "italic",
            underline: obj.underline,
            color: obj.fill || "#000000",
            align: obj.textAlign || "left",
            fontFace: obj.fontFamily || "Arial",
          });
        } else if (obj.type === "rect") {
          slide.addShape("rect", {
            x: left,
            y: top,
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || null, 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100 // 100% transparent if no stroke
            },
            rotate: obj.angle || 0,
          });
        } else if (obj.type === "circle") {
          slide.addShape("ellipse", {
            x: left,
            y: top,
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || null, 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100 // 100% transparent if no stroke
            },
            rotate: obj.angle || 0,
          });
        } else if (obj.type === "triangle") {
          slide.addShape("triangle", {
            x: left,
            y: top,
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || null, 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100 // 100% transparent if no stroke
            },
            rotate: obj.angle || 0,
          });
        } else if (obj.type === "image" && obj.getSrc()) {
          // For images, we need to extract data URL
          slide.addImage({
            data: obj.getSrc(),
            x: left,
            y: top,
            w: width,
            h: height,
            rotate: obj.angle || 0,
          });
        }
      });

      // Save the file
      pptx.writeFile({ fileName: `${fileName}.pptx` })
        .then(() => resolve(true))
        .catch(error => {
          console.error("Error saving PPTX:", error);
          reject(error);
        });
    } catch (error) {
      console.error("Error exporting to PPTX:", error);
      reject(error);
      return false;
    }
  });
}

/**
 * Export the current canvas as a PDF file
 * @param {fabric.Canvas} canvas - The Fabric.js canvas to export
 * @param {string} fileName - The filename for the exported file
 * @param {Object} options - Additional export options
 * @returns {boolean} - Success status
 */
export function exportAsPDF(canvas, fileName = "Presentation", options = {}) {
  if (!canvas) return false;

  try {
    const defaultOptions = {
      format: "a4",
      orientation: "landscape",
      unit: "mm",
      ...options,
    };

    const pdf = new jsPDF(
      defaultOptions.orientation,
      defaultOptions.unit,
      defaultOptions.format
    );

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate the scale to fit the canvas content in the PDF
    const scale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight) * 0.9; // 90% of available space

    // Center the image on the page
    const x = (pdfWidth - canvasWidth * scale) / 2;
    const y = (pdfHeight - canvasHeight * scale) / 2;

    // Get image data directly from canvas
    const imgData = canvas.toDataURL("image/png", 1.0);

    // Add the image to the PDF
    pdf.addImage(
      imgData,
      "PNG",
      x,
      y,
      canvasWidth * scale,
      canvasHeight * scale
    );

    // Save the PDF
    pdf.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return false;
  }
}

/**
 * Export the current canvas as a PNG image
 * @param {fabric.Canvas} canvas - The Fabric.js canvas to export
 * @param {string} fileName - The filename for the exported file
 * @param {Object} options - Additional export options
 * @returns {boolean} - Success status
 */
export function exportAsPNG(canvas, fileName = "Canvas", options = {}) {
  if (!canvas) return false;

  try {
    const defaultOptions = {
      format: "png",
      quality: 1,
      multiplier: 1,
      enableRetinaScaling: true,
      ...options,
    };

    const dataURL = canvas.toDataURL(defaultOptions);
    saveAs(dataURL, `${fileName}.png`);
    return true;
  } catch (error) {
    console.error("Error exporting to PNG:", error);
    return false;
  }
}

/**
 * Export the current canvas as an SVG image
 * @param {fabric.Canvas} canvas - The Fabric.js canvas to export
 * @param {string} fileName - The filename for the exported file
 * @returns {boolean} - Success status
 */
export function exportAsSVG(canvas, fileName = "Canvas") {
  if (!canvas) return false;

  try {
    const svgData = canvas.toSVG();
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    saveAs(blob, `${fileName}.svg`);
    return true;
  } catch (error) {
    console.error("Error exporting to SVG:", error);
    return false;
  }
}

/**
 * Export the current presentation with multiple slides to PPTX
 * @param {Array<{canvas: fabric.Canvas, background: string}>} slides - Array of slide data
 * @param {string} fileName - The filename for the exported file
 * @returns {Promise<boolean>} - Success status
 */
export function exportPresentationToPPTX(slides, fileName = "Presentation") {
  if (!slides || !slides.length) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    try {
      const pptx = new pptxgen();

      // Set presentation properties
      pptx.title = fileName;
      pptx.subject = "Created with PowerPoint Editor";
      pptx.author = "PowerPoint Editor User";

      // Process each slide
      slides.forEach((slideData) => {
        const { canvas, background } = slideData;
        if (!canvas) return;

        // Create a slide
        const slide = pptx.addSlide();

        // Set background if specified
        if (background) {
          slide.background = { color: background };
        }

        // Add the slide content as an image
        const imgData = canvas.toDataURL("image/png", 1.0);
        slide.addImage({
          data: imgData,
          x: 0,
          y: 0,
          w: "100%",
          h: "100%"
        });
      });

      // Save the file
      pptx.writeFile({ fileName: `${fileName}.pptx` })
        .then(() => resolve(true))
        .catch(error => {
          console.error("Error saving PPTX:", error);
          reject(error);
        });
    } catch (error) {
      console.error("Error exporting presentation to PPTX:", error);
      reject(error);
      return false;
    }
  });
}

/**
 * Export the current presentation with multiple slides to PDF
 * @param {Array<{canvas: fabric.Canvas}>} slides - Array of slide canvases
 * @param {string} fileName - The filename for the exported file
 * @param {Object} options - Additional export options
 * @returns {boolean} - Success status
 */
export function exportPresentationToPDF(slides, fileName = "Presentation", options = {}) {
  if (!slides || !slides.length) return false;

  try {
    const defaultOptions = {
      format: "a4",
      orientation: "landscape",
      unit: "mm",
      ...options,
    };

    const pdf = new jsPDF(
      defaultOptions.orientation,
      defaultOptions.unit,
      defaultOptions.format
    );

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Process each slide
    slides.forEach((slideData, index) => {
      const canvas = slideData.canvas;
      if (!canvas) return;

      // Add a new page for slides after the first one
      if (index > 0) {
        pdf.addPage(defaultOptions.format, defaultOptions.orientation);
      }

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculate the scale to fit the canvas content in the PDF
      const scale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight) * 0.9;

      // Center the image on the page
      const x = (pdfWidth - canvasWidth * scale) / 2;
      const y = (pdfHeight - canvasHeight * scale) / 2;

      // Get image data directly from canvas
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Add the image to the PDF
      pdf.addImage(
        imgData,
        "PNG",
        x,
        y,
        canvasWidth * scale,
        canvasHeight * scale
      );
    });

    // Save the PDF
    pdf.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error("Error exporting presentation to PDF:", error);
    return false;
  }
}