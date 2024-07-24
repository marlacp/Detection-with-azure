import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { apiKeyDocumentDetect, endpointDocumentDetect } from './utils/Apikeys';
const IdentityCardDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [boundingBox, setBoundingBox] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    detectIdCard(imageSrc);
  }, [webcamRef]);

  const apiKey = apiKeyDocumentDetect;
  const endpoint = endpointDocumentDetect;

  const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));

  const detectIdCard = async (imageData) => {
    const base64Image = imageData.split(",")[1];
    const blob = base64ToBlob(base64Image, 'image/jpeg');

    try {
      const poller = await client.beginAnalyzeDocument("prebuilt-idDocument", blob);
      const response = await poller.pollUntilDone();
      console.log("response", response);
      if (response.pages.length > 0) {
        const page = response.pages[0];
        const words = page.words;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        words.forEach(word => {
          word.polygon.forEach(point => {
            if (point.x < minX) minX = point.x;
            if (point.y < minY) minY = point.y;
            if (point.x > maxX) maxX = point.x;
            if (point.y > maxY) maxY = point.y;
          });
        });

        const boundingBox = {
          Left: minX,
          Top: minY,
          Width: maxX - minX,
          Height: maxY - minY,
          Object: 'ID Card'
        };
        
        setBoundingBox(boundingBox);
      }
    } catch (error) {
      console.error("Azure Form Recognizer API error:", error);
    }
  };

  useEffect(() => {
    if (boundingBox && webcamRef.current) {
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

      ctx.strokeRect(
        boundingBox.Left * scaleWidth,
        boundingBox.Top * scaleHeight,
        boundingBox.Width * scaleWidth,
        boundingBox.Height * scaleHeight
      );
      ctx.font = "12px Arial";
      ctx.fillStyle = "red";
      ctx.fillText(boundingBox.Object, boundingBox.Left * scaleWidth, boundingBox.Top * scaleHeight - 5);
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
      <button onClick={capture} style={{ position: 'absolute', zIndex: 1 }}>Detect ID Card</button>
    </div>
  );
};

export default IdentityCardDetection;
