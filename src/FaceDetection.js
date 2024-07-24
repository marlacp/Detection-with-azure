import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaceClient } from "@azure/cognitiveservices-face";
import { ApiKeyCredentials } from "@azure/ms-rest-js";
import { apiKeyFaceDetect, endpointFaceDetect } from './utils/Apikeys';
const FaceDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [boundingBox, setBoundingBox] = useState(null);


  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    detectFace(imageSrc);
  }, [webcamRef]); 

  const apiKey = apiKeyFaceDetect;
  const endpoint = endpointFaceDetect;

  const faceClient = new FaceClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } }),
    endpoint
  );

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
  
    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  const detectFace = async (imageData) => {

    const base64Image = imageData.split(",")[1];
    const blob = base64ToBlob(base64Image, 'image/jpeg'); // Convertir base64 a Blob

    
    try {
    console.log("entre aqui??")
      const faceResults = await faceClient.face.detectWithStream(
        blob, // Enviar directamente el blob
        {
          returnFaceId: false,
          returnFaceLandmarks: true, 
        //   recognitionModel: 'recognition_01',
        //   returnRecognitionModel: false,
          detectionModel: 'detection_01',
        //   faceIdTimeToLive: 86400
        }
      );

      console.log("faceResults", faceResults);
  
      if (faceResults.length > 0) {
        const faceData = faceResults[0];
        const box = faceData.faceRectangle;
        setBoundingBox({
          Left: box.left,
          Top: box.top,
          Width: box.width,
          Height: box.height
        });
        // Aquí puedes procesar las coordenadas del rectángulo de la cara
      }
    } catch (error) {
      console.error("Azure Face API error:", error);
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
    }
  }, [boundingBox]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ position: 'absolute' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <button onClick={capture} style={{ position: 'absolute', zIndex: 1 }}>Detect Face</button>
    </div>
  );
};

export default FaceDetection;
