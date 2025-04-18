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
      // Make sure pptxgen is available
      if (typeof pptxgen !== 'function') {
        console.error("pptxgen library not found");
        reject(new Error("pptxgen library not found"));
        return;
      }

      const pptx = new pptxgen();

      // Set presentation properties
      pptx.title = fileName;
      pptx.subject = "Created with PowerPoint Editor";
      pptx.author = "PowerPoint Editor User";

      // Create a slide
      const slide = pptx.addSlide();

      // Set background if specified in options or from currentSlide
      if (options.background) {
        slide.background = { color: options.background };
      } else if (canvas.backgroundColor) {
        // Use canvas background if available
        slide.background = { color: canvas.backgroundColor };
      }

      // Get slide dimensions
      const slideWidth = canvas.width*0.17;
      const slideHeight = canvas.height*0.27;

      // Get all canvas objects in the correct z-order
      const objects = canvas.getObjects();
      
      // Process objects in the correct z-order (from back to front)
      objects.forEach(obj => {
        // Skip objects with no width or height
        if (obj.width === 0 || obj.height === 0) return;
        
        // Convert object position to PowerPoint's percentage-based coordinates
        // Adjust for object's center point vs top-left origin
        const scaleX = obj.scaleX || 10;
        const scaleY = obj.scaleY || 10;
        const objWidth = obj.width * scaleX;
        const objHeight = obj.height * scaleY;
        
        // Calculate object position (PowerPoint uses percentages)
        // We need to take into account the center point vs top-left
        let left, top;
        
        if (obj.originX === 'center') {
          left = obj.left / slideWidth;
          top = obj.top / slideHeight;
        } else {
          // If origin is left/top, adjust to center point for PowerPoint
          left = (obj.left + objWidth / 2) / slideWidth;
          top = (obj.top + objHeight / 2) / slideHeight;
        }
        
        // Convert width/height to PowerPoint's percentage
        const width = objWidth / slideWidth;
        const height = objHeight / slideHeight;
        
        // Common transformation properties
        const rotation = obj.angle || 0;
        const flipH = obj.flipX || false;
        const flipV = obj.flipY || false;
        
        // Handle different object types
        if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
          // Handle text objects
          slide.addText(obj.text || "", {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fontSize: (obj.fontSize || 24) / 2, // PowerPoint font sizes are roughly half of canvas
            bold: obj.fontWeight === "bold",
            italic: obj.fontStyle === "italic",
            underline: obj.underline,
            color: obj.fill || "#000000",
            align: obj.textAlign || "left",
            fontFace: obj.fontFamily || "Arial",
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "rect") {
          // Handle rectangle shapes
          slide.addShape("rect", {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || "transparent", 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100
            },
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "circle") {
          // Handle circle shapes
          slide.addShape("ellipse", {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || "transparent", 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100
            },
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "ellipse") {
          // Handle ellipse shapes
          slide.addShape("ellipse", {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || "transparent", 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100
            },
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "triangle") {
          // Handle triangle shapes
          slide.addShape("triangle", {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || "transparent", 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100
            },
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "polygon") {
          // Handle polygons (star, pentagon, hexagon, octagon)
          // Determine shape type based on points count
          let shapeType = "rect"; // default fallback
          
          if (obj.points && obj.points.length) {
            const pointCount = obj.points.length;
            if (pointCount === 5) shapeType = "pentagon";
            else if (pointCount === 6) shapeType = "hexagon";
            else if (pointCount === 8) shapeType = "octagon";
            else if (pointCount === 10) shapeType = "star"; // 5-point star has 10 points
          }
          
          slide.addShape(shapeType, {
            x: left - width/2, // Convert from center to left origin
            y: top - height/2, // Convert from center to top origin
            w: width,
            h: height,
            fill: { color: obj.fill || "#000000" },
            line: { 
              color: obj.stroke || "transparent", 
              width: (obj.strokeWidth || 0) / 2,
              transparency: obj.stroke ? 0 : 100
            },
            rotate: rotation,
            flipH: flipH,
            flipV: flipV
          });
        } else if (obj.type === "path") {
          // For paths (complex shapes, arrows, etc.) or freehand drawings,
          // We'll export them as images to maintain fidelity
          try {
            // Create a temporary canvas for this object
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Set the canvas size to match the object dimensions
            tempCanvas.width = Math.ceil(objWidth);
            tempCanvas.height = Math.ceil(objHeight);
            
            // Create a new fabric canvas just for this object
            const objCanvas = new fabric.StaticCanvas(null, {
              width: Math.ceil(objWidth),
              height: Math.ceil(objHeight)
            });
            
            // Clone the object and center it on the canvas
            fabric.util.object.clone(obj, function(clonedObj) {
              clonedObj.set({
                left: objWidth / 2,
                top: objHeight / 2,
                originX: 'center',
                originY: 'center'
              });
              
              objCanvas.add(clonedObj);
              objCanvas.renderAll();
              
              // Get the image data
              const imgData = objCanvas.toDataURL('image/png');
              
              // Add as image to the slide
              slide.addImage({
                data: imgData,
                x: left - width/2, // Convert from center to left origin
                y: top - height/2, // Convert from center to top origin
                w: width,
                h: height,
                rotate: rotation,
                flipH: flipH,
                flipV: flipV
              });
            });
          } catch (pathError) {
            console.error("Error adding path to PPTX:", pathError);
          }
        } else if (obj.type === "image" && obj.getSrc) {
          // Handle images
          try {
            // For images, get the source data
            const imgSrc = obj.getSrc();
            
            // Add image to slide
            slide.addImage({
              data: imgSrc,
              x: left - width/2, // Convert from center to left origin
              y: top - height/2, // Convert from center to top origin
              w: width,
              h: height,
              rotate: rotation,
              flipH: flipH,
              flipV: flipV
            });
          } catch (imgError) {
            console.error("Error adding image to PPTX:", imgError);
          }
        } else if (obj.isDrawingMode || (obj.type === "path" && obj.path && obj.path.length > 0)) {
          // Handle free drawing paths and complex paths
          try {
            // Create a temporary fabric canvas
            const objCanvas = new fabric.StaticCanvas(null, {
              width: Math.max(canvas.width, 800),
              height: Math.max(canvas.height, 600)
            });
            
            // Clone the object to prevent modifications
            fabric.util.object.clone(obj, function(clonedObj) {
              objCanvas.add(clonedObj);
              objCanvas.renderAll();
              
              // Get the image data
              const imgData = objCanvas.toDataURL('image/png');
              
              // Add as image to the slide
              slide.addImage({
                data: imgData,
                x: left - width/2, // Convert from center to left origin
                y: top - height/2, // Convert from center to top origin
                w: width,
                h: height,
                rotate: rotation,
                flipH: flipH,
                flipV: flipV
              });
            });
          } catch (drawError) {
            console.error("Error adding drawing to PPTX:", drawError);
          }
        }
      });

      // If we have a slide with objects from the current slide only, add additional slides
      if (options.exportAllSlides && options.slides && options.slides.length > 0) {
        // Function to handle exporting additional slides would go here
        // This would need integration with your slide management code
      }

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