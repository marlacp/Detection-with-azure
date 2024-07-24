import React from 'react';
import FaceDetection from './FaceDetection';
import ObjectDetections from './ObjectDetections';
import IdentityCardDetection from './IdentityCardDetection';


function App() {
  return (
    <div className="App">
      <h1>Face Detection Demo Azure</h1>
      {/* <IdentityCardDetection /> */}
      {/* <ObjectDetections /> */}
      <FaceDetection />
    </div>
  );
}

export default App;
