'use client';

import { Presentation } from "@/lib/types";
import JSZip from "jszip";
import { parseString } from "xml2js";

// Helper function to read file as ArrayBuffer
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Extract PPTX to intermediate JSON format
export const extractPptxToJson = async (file: File): Promise<any> => {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Parse presentation.xml
    const presentationXml = await zip.file("ppt/presentation.xml")?.async("text");
    if (!presentationXml) throw new Error("Invalid PPTX file");
    
    let presentationData: any;
    parseString(presentationXml, (err, result) => {
      if (err) throw err;
      presentationData = result;
    });

    // Get slide count from presentation data
    // Fix: Correct the XML structure based on actual PPTX format
    const slideIds = presentationData?.["p:presentation"]?.["p:sldIdLst"]?.[0]?.["p:sldId"] || [];
    const slideCount = slideIds.length;
    
    if (slideCount === 0) {
      throw new Error("No slides found in the presentation");
    }

    // Parse slide relationships and content
    const slides: any[] = [];

    for (let i = 0; i < slideCount; i++) {
      const slideNum = i + 1;
      const slidePath = `ppt/slides/slide${slideNum}.xml`;
      const slideXml = await zip.file(slidePath)?.async("text");
      if (!slideXml) continue;

      let slideData: any;
      parseString(slideXml, (err, result) => {
        if (err) throw err;
        slideData = result;
      });

      const slideJson = await parseSlide(slideData, zip, slideNum);
      slides.push(slideJson);
    }

    return {
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      slides
    };
  } catch (error) {
    console.error("Error extracting PPTX:", error);
    throw error;
  }
};

// Parse individual slide content
const parseSlide = async (slideData: any, zip: JSZip, slideNum: number): Promise<any> => {
  const shapesArray: any[] = [];  // Fixed: Define a separate array
  const background = parseBackground(slideData);
  
  try {
    // Parse shapes (text boxes, images, etc.)
    const spTree = slideData["p:sld"]?.["p:cSld"]?.[0]?.["p:spTree"]?.[0];
    
    if (spTree) {
      // Process textboxes and other shapes
      const shapes = spTree["p:sp"] || [];
      for (const shape of shapes) {
        try {
          const shapeName = shape["p:nvSpPr"]?.[0]?.["p:cNvPr"]?.[0]?.["$"]?.name?.toLowerCase() || "";
          
          if (shapeName.includes("text") || shape["p:txBody"]) {
            shapesArray.push(parseTextShape(shape));
          } else if (shapeName.includes("picture")) {
            const imageData = await parseImageShape(shape, zip, slideNum);
            if (imageData) shapesArray.push(imageData);
          } else {
            shapesArray.push(parseGeometricShape(shape));
          }
        } catch (err) {
          console.error("Error parsing shape:", err);
          // Continue with next shape
        }
      }
      
      // Process pictures
      const pics = spTree["p:pic"] || [];
      for (const pic of pics) {
        try {
          const imageData = await parseImageShape(pic, zip, slideNum);
          if (imageData) shapesArray.push(imageData);
        } catch (err) {
          console.error("Error parsing picture:", err);
          // Continue with next picture
        }
      }
    }
  } catch (err) {
    console.error("Error parsing slide content:", err);
  }

  return {
    background,
    shapes: shapesArray  // Fixed: Return the correctly populated array
  };
};

// Parse background properties
const parseBackground = (slideData: any): string => {
  try {
    const bgPr = slideData["p:sld"]?.["p:cSld"]?.[0]?.["p:bg"]?.[0]?.["p:bgPr"];
    if (bgPr && bgPr[0]?.["a:solidFill"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.val) {
      return `#${bgPr[0]["a:solidFill"][0]["a:srgbClr"][0]["$"].val}`;
    }
  } catch (err) {
    console.error("Error parsing background:", err);
  }
  
  return "#FFFFFF"; // Default white background
};

// Parse text shape
const parseTextShape = (shape: any): any => {
  try {
    const textProps = shape["p:txBody"]?.[0]?.["a:p"]?.[0]?.["a:r"]?.[0]?.["a:rPr"]?.[0]?.["$"] || {};
    const textContent = shape["p:txBody"]?.[0]?.["a:p"]?.[0]?.["a:r"]?.[0]?.["a:t"]?.[0] || "";
    
    const position = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:off"]?.[0]?.["$"] || { x: "0", y: "0" };
    const size = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:ext"]?.[0]?.["$"] || { cx: "0", cy: "0" };
    
    return {
      type: "text",
      text: textContent,
      left: parseInt(position.x) / 12700, // Convert EMU to pixels (approximate)
      top: parseInt(position.y) / 12700,
      width: parseInt(size.cx) / 12700,
      height: parseInt(size.cy) / 12700,
      fontSize: parseInt(textProps.sz || "1800") / 100, // Convert hundredths of points to points
      fontFamily: textProps.typeface || "Arial",
      color: textProps.fill ? `#${textProps.fill}` : "#000000",
      fontWeight: textProps.b === "1" ? "bold" : "normal",
      fontStyle: textProps.i === "1" ? "italic" : "normal",
      textAlign: textProps.align || "left"
    };
  } catch (err) {
    console.error("Error parsing text shape:", err);
    return {
      type: "text",
      text: "Error loading text",
      left: 0,
      top: 0,
      width: 200,
      height: 50,
      fontSize: 18,
      fontFamily: "Arial",
      color: "#000000"
    };
  }
};

// Parse image shape - fixed version with slideNum parameter
const parseImageShape = async (shape: any, zip: JSZip, slideNum: number): Promise<any> => {
  try {
    // Find the blip element (image reference)
    const blip = shape["p:blipFill"]?.[0]?.["a:blip"]?.[0] || 
                shape["p:pic"]?.[0]?.["p:blipFill"]?.[0]?.["a:blip"]?.[0];
    
    if (!blip || !blip["$"] || !blip["$"]["r:embed"]) {
      return null;
    }
    
    const embedId = blip["$"]["r:embed"];
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsXml = await zip.file(relsPath)?.async("text");
    
    if (!relsXml) return null;
    
    let relsData: any;
    parseString(relsXml, (err, result) => {
      if (err) throw err;
      relsData = result;
    });
    
    // Find the relationship that matches the embed ID
    const relationship = relsData.Relationships.Relationship.find((r: any) => r.$.Id === embedId);
    if (!relationship) return null;
    
    const imagePath = relationship.$.Target;
    const fullImagePath = imagePath.startsWith("../") 
      ? `ppt/${imagePath.substring(3)}` 
      : `ppt/slides/${imagePath}`;
    
    const imageFile = await zip.file(fullImagePath)?.async("uint8array");
    if (!imageFile) return null;
    
    const imageBase64 = btoa(Array.from(imageFile)
      .map(byte => String.fromCharCode(byte))
      .join(''));
    
    const position = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:off"]?.[0]?.["$"] || { x: "0", y: "0" };
    const size = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:ext"]?.[0]?.["$"] || { cx: "0", cy: "0" };
    
    // Determine image type from path
    let imageType = "png";
    if (imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")) {
      imageType = "jpeg";
    } else if (imagePath.endsWith(".gif")) {
      imageType = "gif";
    }
    
    return {
      type: "image",
      src: `data:image/${imageType};base64,${imageBase64}`,
      left: parseInt(position.x) / 12700,
      top: parseInt(position.y) / 12700,
      width: parseInt(size.cx) / 12700,
      height: parseInt(size.cy) / 12700
    };
  } catch (err) {
    console.error("Error parsing image shape:", err);
    return null;
  }
};

// Parse geometric shapes (rectangles, circles, etc.)
const parseGeometricShape = (shape: any): any => {
  try {
    const position = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:off"]?.[0]?.["$"] || { x: "0", y: "0" };
    const size = shape["p:spPr"]?.[0]?.["a:xfrm"]?.[0]?.["a:ext"]?.[0]?.["$"] || { cx: "0", cy: "0" };
    
    let shapeType = "rect";
    if (shape["p:spPr"]?.[0]?.["a:prstGeom"]) {
      const geomType = shape["p:spPr"][0]["a:prstGeom"][0]["$"].prst;
      if (geomType.includes("ellipse")) shapeType = "circle";
      else if (geomType.includes("triangle")) shapeType = "triangle";
    }
    
    const fill = shape["p:spPr"]?.[0]?.["a:solidFill"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.val || "000000";
    const stroke = shape["p:spPr"]?.[0]?.["a:ln"]?.[0]?.["a:solidFill"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.val;
    const strokeWidth = shape["p:spPr"]?.[0]?.["a:ln"]?.[0]?.["$"]?.w || 0;
    
    return {
      type: shapeType,
      left: parseInt(position.x) / 12700,
      top: parseInt(position.y) / 12700,
      width: parseInt(size.cx) / 12700,
      height: parseInt(size.cy) / 12700,
      fill: `#${fill}`,
      stroke: stroke ? `#${stroke}` : undefined,
      strokeWidth: parseInt(strokeWidth) / 12700
    };
  } catch (err) {
    console.error("Error parsing geometric shape:", err);
    return {
      type: "rect",
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      fill: "#000000"
    };
  }
};

// Convert extracted PPTX JSON to Fabric.js compatible format
// Convert extracted PPTX JSON to Fabric.js compatible format
export const convertPptxJsonToFabric = (pptxJson: any): Presentation => {
    return {
      title: pptxJson.title || "Untitled Presentation",
      slides: pptxJson.slides.map((slide: any, index: number) => {
        // Convert each shape to Fabric.js compatible format
        const fabricObjects = slide.shapes.map((shape: any) => {
          // Common properties
          const baseObj = {
            id: `${shape.type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            left: shape.left || 0,
            top: shape.top || 0,
            width: shape.width > 0 ? shape.width : 100,
            height: shape.height > 0 ? shape.height : 50,
            fill: shape.color || shape.fill || "#000000",
            selectable: true,
            hasControls: true
          };
  
          switch (shape.type) {
            case "text":
              return {
                ...baseObj,
                type: "textbox", // Fabric.js uses 'textbox' for multi-line text
                text: shape.text || "",
                fontSize: shape.fontSize || 18,
                fontFamily: shape.fontFamily || "Arial",
                fontWeight: shape.fontWeight || "normal",
                fontStyle: shape.fontStyle || "normal",
                textAlign: shape.textAlign || "left"
              };
  
            case "image":
              return {
                ...baseObj,
                type: "image",
                src: shape.src
              };
  
            case "circle":
              return {
                ...baseObj,
                type: "circle",
                radius: shape.radius || (shape.width / 2),
                originX: "center",
                originY: "center"
              };
  
            default: // rectangle and other shapes
              return {
                ...baseObj,
                type: "rect",
                stroke: shape.stroke || "transparent",
                strokeWidth: shape.strokeWidth || 0
              };
          }
        });
  
        return {
          id: `slide-${index}-${Date.now()}`,
          background: slide.background || "#FFFFFF",
          objects: fabricObjects,
          fabricState: null // Will be populated when rendered
        };
      })
    };
  };
  
  // Convert individual shape to Fabric.js object properties
  const convertShapeToFabric = (shape: any): any => {
    // Common properties for all shapes
    const baseObj = {
      type: shape.type,
      left: shape.left,
      top: shape.top,
      width: shape.width > 0 ? shape.width : 100, // Default width if 0
      height: shape.height > 0 ? shape.height : 50, // Default height if 0
      fill: shape.color || shape.fill || "#000000",
      id: `${shape.type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      originX: "left",
      originY: "top",
      selectable: true,
      hasControls: true
    };
  
    switch (shape.type) {
      case "text":
        return {
          ...baseObj,
          text: shape.text || "", // Handle empty text
          fontSize: shape.fontSize || 18,
          fontFamily: shape.fontFamily || "Arial",
          fontWeight: shape.fontWeight || "normal",
          fontStyle: shape.fontStyle || "normal",
          textAlign: shape.textAlign || "left",
          underline: false,
          linethrough: false,
          textBackgroundColor: "",
          charSpacing: 0
        };
        
      case "image":
        return {
          ...baseObj,
          src: shape.src,
          crossOrigin: "anonymous",
          // Maintain aspect ratio
          scaleX: 1,
          scaleY: 1
        };
        
      case "circle":
        return {
          ...baseObj,
          radius: Math.max(shape.width, shape.height) / 2,
          originX: "center",
          originY: "center"
        };
        
      case "triangle":
        return {
          ...baseObj,
          originX: "center",
          originY: "center"
        };
        
      default: // rectangle and other shapes
        return {
          ...baseObj,
          stroke: shape.stroke || "transparent",
          strokeWidth: shape.strokeWidth || 0,
          rx: shape.rx || 0, // border radius
          ry: shape.ry || 0
        };
    }
  };