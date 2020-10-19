import React, { useEffect, useRef, useCallback, useState } from 'react';
import './App.scss';
import Webcam from 'react-webcam';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import useSWR from 'swr';
import axios from './utils/axios';
import { useSpring, animated as a } from 'react-spring';

const videoConstraints = {
  // NOTE: width -> height ?
  height: window.innerWidth * devicePixelRatio * 2.5,
  width: window.innerHeight * 0.7 * devicePixelRatio * 2.5,
  facingMode: 'environment',
};

const frontVideoConstraints = {
  height: window.innerWidth * devicePixelRatio * 2,
  width: window.innerHeight * 0.7 * devicePixelRatio * 2,
  facingMode: 'user',
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

  useEffect(() => {
    if (webcamRef.current) {
      setTimeout(() => {
        console.info('cam', webcamRef.current);
        console.info(
          'track',
          webcamRef.current.stream.getVideoTracks()[0].getConstraints()
        );
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRef.current]);

  const [cam, setCam] = useState(1);
  const handleSwitchCam = useCallback(() => {
    setCam((currentCam) => (currentCam === 1 ? 0 : 1));
  }, []);

  const { transform, opacity } = useSpring({
    opacity: cam ? 1 : 0,
    transform: `perspective(1000px) rotateY(${cam ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  if (croppedImg) {
    return (
      <>
        <img src={croppedImg} style={{ width: '100%' }} />
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
      <div className="cam__container">
        <a.div
          className="cam__media"
          style={{ opacity: opacity.interpolate((o) => 1 - o), transform }}
        >
          {!cam && (
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
          )}
        </a.div>
        <a.div
          className="cam__media"
          style={{
            opacity,
            transform: transform.interpolate((t) => `${t} rotateY(180deg)`),
          }}
        >
          {!!cam && (
            <Webcam
              audio={false}
              height={window.innerHeight * 0.7}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={window.innerWidth}
              videoConstraints={frontVideoConstraints}
              imageSmoothing={false}
              forceScreenshotSourceSize={true}
              mirrored={true}
            />
          )}
        </a.div>
      </div>
      <div>
        <button onClick={capture}>Capture photo</button>
        <button onClick={handleSwitchCam}>switch cam</button>
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
