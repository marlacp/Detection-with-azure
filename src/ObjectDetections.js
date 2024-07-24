import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { ComputerVisionClient } from "@azure/cognitiveservices-computervision";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { apiKeyObjDetect, endpointObjDetect } from './utils/Apikeys';
const ObjectDetections = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [boundingBox, setBoundingBox] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    detectObject(imageSrc);
  }, [webcamRef]);

  const apiKey = apiKeyObjDetect;
  const endpoint = endpointObjDetect;

  const client = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } }),
    endpoint
  );
  const detectObject = async (imageData) => {
    const base64Image = imageData.split(",")[1];
    const blob = base64ToBlob(base64Image, 'image/jpeg');

    try {
      const response = await client.analyzeImageInStream(blob, { visualFeatures: ['Objects'] });
      console.log("response", response);
      const objects = response.objects;
      const boxes = objects.map(obj => ({
        Left: obj.rectangle.x,
        Top: obj.rectangle.y,
        Width: obj.rectangle.w,
        Height: obj.rectangle.h,
        Object: obj.object
      }));
      setBoundingBox(boxes);
    } catch (error) {
      console.error("Azure Computer Vision API error:", error);
    }
  };
//   const detectObject = async (imageData) => {
//     const base64Image = imageData.split(",")[1];
//     const blob = base64ToBlob(base64Image, 'image/jpeg');

//     try {
//       const response = await client.analyzeImageInStream(blob, { visualFeatures: ['Objects'] });
//       console.log("response", response);
//       const objects = response.objects;
//       console.log("objects", objects);
//       const idCard = objects.find(obj => obj.object === 'ID card'); // Detectar ID card
//       console.log("idCard", idCard);
//       if (idCard) {
//         const box = idCard.rectangle;
//         setBoundingBox({
//           Left: box.x,
//           Top: box.y,
//           Width: box.w,
//           Height: box.h
//         });
//       }
//     } catch (error) {
//       console.error("Azure Computer Vision API error:", error);
//     }
//   };

useEffect(() => {
    if (boundingBox && boundingBox.length > 0 && webcamRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const { width, height } = video.getBoundingClientRect();
      const scaleWidth = width / video.videoWidth;
      const scaleHeight = height / video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      
      boundingBox.forEach(box => {
        ctx.strokeRect(
          box.Left * scaleWidth,
          box.Top * scaleHeight,
          box.Width * scaleWidth,
          box.Height * scaleHeight
        );
        ctx.font = "12px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(box.Object, box.Left * scaleWidth, box.Top * scaleHeight - 5);
      });
    }
  }, [boundingBox]);

  function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ position: 'absolute' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <button onClick={capture} style={{ position: 'absolute', zIndex: 1 }}>Detect Object</button>
    </div>
  );
};

export default ObjectDetections;
