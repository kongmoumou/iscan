import React, { useEffect, useRef, useCallback, useState } from 'react';
import './App.css';
import Webcam from 'react-webcam';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import useSWR from 'swr';
import axios from './utils/axios';

const videoConstraints = {
  // width: window.innerWidth,
  // height: window.innerHeight * 0.7,
  facingMode: 'environment',
};

const fetchAnimeSearchRes = (image) => {
  return axios.post('https://trace.moe/api/search', {
    image,
  });
};

const AniemePreview = ({ data }) => {
  useEffect(() => {
    // alert(JSON.stringify(data));
  }, []);

  return (
    <div>
      <img
        src={`https://trace.moe/thumbnail.php?anilist_id=${
          data?.anilist_id
        }&file=${encodeURIComponent(data?.filename)}&t=${data?.at}&token=${
          data?.tokenthumb
        }`}
        style={{ width: '100%', display: 'block' }}
      />
      <div>{data?.title_chinese}</div>
    </div>
  );
};

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const cropperRef = useRef();

  const [capturedImg, setCaptureImg] = useState();
  const [croppedImg, setCroppedImg] = useState();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();

    setCaptureImg(imageSrc);
  }, []);

  const handleCrop = useCallback(() => {
    // alert(cropperRef.current.cropper.getCroppedCanvas().toDataURL());
  }, []);

  const handleDoneClick = useCallback(() => {
    setCroppedImg(
      cropperRef.current.cropper
        .getCroppedCanvas({
          imageSmoothingEnabled: false,
          imageSmoothingQuality: 'high',
        })
        .toDataURL()
    );
  }, []);
  const handleBackClick = useCallback(() => {
    setCaptureImg(null);
    setCroppedImg(null);
  }, []);

  const { data, isValidating, error } = useSWR(croppedImg, fetchAnimeSearchRes);

  if (croppedImg) {
    return (
      <>
        <img src={croppedImg} />
        <div>
          <button onClick={handleBackClick}>back</button>
        </div>
        <div>
          {isValidating && 'loading...'}
          {!isValidating &&
            !!data?.data?.docs?.length &&
            data.data.docs.map((doc, i) => (
              <AniemePreview key={i} data={doc} />
            ))}
          {error ? String(error) : null}
        </div>
      </>
    );
  }

  if (capturedImg) {
    return (
      <>
        <Cropper
          src={capturedImg}
          // style={{ height: 400, width: '100%' }}
          // Cropper.js options
          initialAspectRatio={16 / 9}
          guides={false}
          crop={handleCrop}
          ref={cropperRef}
        />
        <div>
          <button onClick={handleBackClick}>back</button>
          <button onClick={handleDoneClick}>done</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Webcam
        audio={false}
        height={window.innerHeight * 0.7}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={window.innerWidth}
        videoConstraints={videoConstraints}
        imageSmoothing={false}
        forceScreenshotSourceSize={true}
      />
      <div>
        <button onClick={capture}>Capture photo</button>
      </div>
    </>
  );
};

function App() {
  return (
    <div className="App">
      <WebcamCapture />
    </div>
  );
}

export default App;
