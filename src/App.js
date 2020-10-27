import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import './App.scss';
import Webcam from 'react-webcam';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { useSpring, animated as a } from 'react-spring';
import { useUpdateEffect } from 'react-use';

// TODO: update
import Result from './components/Result';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper.scss';

// face detection
import * as faceApi from 'face-api.js';
import { interpolateAgePredictions } from './utils/faceHelper';
import AnimeApi from './components/AnimeApi';

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

const WebcamCapture = ({ onCropDone }) => {
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

  useUpdateEffect(() => {
    // eslint-disable-next-line no-unused-expressions
    typeof onCropDone === 'function' ? onCropDone(croppedImg) : null;
  }, [croppedImg]);

  useEffect(() => {
    if (webcamRef.current) {
      setTimeout(() => {
        console.info('cam', webcamRef.current);
        console.info(
          'track',
          webcamRef.current.stream?.getVideoTracks()[0].getConstraints()
        );
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webcamRef.current]);

  const [cam, setCam] = useState(1);
  const handleSwitchCam = useCallback(() => {
    setCam((currentCam) => (currentCam === 1 ? 0 : 1));
  }, []);

  // face effect
  const [videoLoaded, setVideoLoaded] = useState(false);
  const frameIdRef = useRef();
  useLayoutEffect(() => {
    // 后置不检测
    if (cam === 1 || !videoLoaded) {
      return () => {
        setVideoLoaded(false);
      };
    }

    // already init
    if (frameIdRef.current) {
      return () => {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      };
    }

    async function initFaceApi() {
      await faceApi.nets.tinyFaceDetector.load('/models');
      await faceApi.nets.ageGenderNet.load('/models');
    }

    async function detectFace() {
      const videoEl = webcamRef.current.video;

      const result = await faceApi
        // .detectSingleFace(videoEl, new faceApi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
        .detectSingleFace(videoEl, new faceApi.TinyFaceDetectorOptions())
        .withAgeAndGender();

      // updateTimeStats(Date.now() - ts);
      console.info('frame Id', frameIdRef.current);

      if (result) {
        const canvas = document.querySelector('.face__overlay');
        if (canvas) {
          const dims = faceApi.matchDimensions(canvas, videoEl, true);

          const resizedResult = faceApi.resizeResults(result, dims);

          console.log(resizedResult);
          // draw box
          faceApi.draw.drawDetections(canvas, resizedResult);
          const { age, gender, genderProbability } = resizedResult;

          // interpolate gender predictions over last 30 frames
          // to make the displayed age more stable
          const interpolatedAge = interpolateAgePredictions(age);
          new faceApi.draw.DrawTextField(
            [
              `${faceApi.utils.round(interpolatedAge, 0)} years`,
              `${gender} (${faceApi.utils.round(genderProbability)})`,
            ],
            result.detection.box.bottomLeft
          ).draw(canvas);
        }
      }

      frameIdRef.current = requestAnimationFrame(detectFace);
    }

    initFaceApi().then(() => {
      console.info('face model loaded~');
      detectFace();
    });
  }, [cam, videoLoaded]);

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
            <>
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
                // NOTE: init face-api after loaded!!!
                onLoadedMetadata={() => setVideoLoaded(true)}
              />
              <canvas className="face__overlay" />
            </>
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
              videoConstraints={videoConstraints}
              imageSmoothing={false}
              forceScreenshotSourceSize={true}
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
  const [shouldShowDrawer, setShouldShowDrawer] = useState(0);
  const [img, setImg] = useState();

  return (
    <div className="App">
      <WebcamCapture
        onCropDone={(croppedImg) => {
          setImg(croppedImg);
        }}
      />
      <button
        onClick={() => {
          setShouldShowDrawer((state) => state + 1);
        }}
      >
        show drawer
      </button>
      {!!shouldShowDrawer && <Result key={shouldShowDrawer} />}
      <div className="selector__container">
        <Swiper
          className="selector__swiper"
          centeredSlides
          slideToClickedSlide
          spaceBetween={50}
          slidesPerView="auto"
          onSlideChange={(e) => console.log('slide change', e)}
          // onSwiper={(swiper) => console.log(swiper)}
        >
          <SwiperSlide>识物</SwiperSlide>
          <SwiperSlide>识文</SwiperSlide>
          <SwiperSlide>识人</SwiperSlide>
          <SwiperSlide>识番</SwiperSlide>
        </Swiper>
        <div className="selector__indicator" />
      </div>
      {img && <AnimeApi img={img} />}
    </div>
  );
}

export default App;
