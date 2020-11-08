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

import Toast from 'antd-mobile/es/toast';
import 'antd-mobile/es/toast/style/index.css';
// for loading animation
import 'antd-mobile/es/icon/style/index.css';

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper.scss';

// icon
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

// face detection
import * as faceApi from 'face-api.js';
import {
  interpolateAgePredictions,
  gender2Emoji,
  expression2Emoji,
} from './utils/faceHelper';
import AnimeApi from './components/AnimeApi';
import BaiduApi from './components/BaiduApi';
import FanyiApi from './components/FanyiApi';

// image congtext
import { useCapturedImageCtx } from './stores/CapturedImage';
import { useCroppedImageCtx } from './stores/CroppedImage';

// Toast config
Toast.config({ duration: 1, mask: false });

const apiList = [
  {
    name: '识物',
    component: BaiduApi,
  },
  {
    name: '识文',
    component: FanyiApi,
  },
  {
    name: '识人',
    component: null,
    canCapture: false,
    front: true,
  },
  {
    name: '识番',
    component: AnimeApi,
  },
];

const videoConstraints = {
  // NOTE: width -> height ?
  // height: window.innerWidth * devicePixelRatio * 2.5,
  // width: window.innerHeight * 0.7 * devicePixelRatio * 2.5,
  height: window.innerWidth * devicePixelRatio * 1.5,
  width: (window.innerHeight - 64) * devicePixelRatio * 1.5,
  facingMode: 'environment',
};

const frontVideoConstraints = {
  height: window.innerWidth * devicePixelRatio,
  width: (window.innerHeight - 64) * devicePixelRatio,
  facingMode: 'user',
};

const WebcamCapture = ({
  onCropDone,
  camConstraints = videoConstraints,
  shouldShowCapture = true,
}) => {
  const webcamRef = useRef(null);
  const cropperRef = useRef();

  // const [capturedImg, setCaptureImg] = useState();
  const {
    capturedImage: capturedImg,
    setCapturedImage: setCaptureImg,
  } = useCapturedImageCtx();

  // const [croppedImg, setCroppedImg] = useState();
  const {
    croppedImage: croppedImg,
    setCroppedImage: setCroppedImg,
  } = useCroppedImageCtx();

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

  // use prop now
  // const [cam, setCam] = useState(1);
  // const handleSwitchCam = useCallback(() => {
  //   setCam((currentCam) => (currentCam === 1 ? 0 : 1));
  // }, []);

  const cam = camConstraints === videoConstraints ? 1 : 0;

  // face effect
  const [videoLoaded, setVideoLoaded] = useState(false);
  const frameIdRef = useRef();
  useLayoutEffect(() => {
    // 后置不检测
    if (cam === 1) {
      console.log('使用后置 cam');
      return () => {
        setVideoLoaded(false);
      };
    }

    if (!videoLoaded) {
      // do nothing
      return;
    }

    console.log('detecting...');

    // show loading toast
    if (!faceApi.nets.tinyFaceDetector.isLoaded) {
      Toast.loading('加载模型中...', 15);
    }

    async function initFaceApi() {
      await faceApi.nets.tinyFaceDetector.load('/models');
      await faceApi.nets.ageGenderNet.load('/models');
      await faceApi.nets.faceExpressionNet.load('/models');
    }

    async function detectFace() {
      const videoEl = webcamRef.current.video;

      const result = await faceApi
        // .detectSingleFace(videoEl, new faceApi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 }))
        .detectSingleFace(videoEl, new faceApi.TinyFaceDetectorOptions())
        .withAgeAndGender()
        .withFaceExpressions();

      // console.info('frame Id', frameIdRef.current);

      if (result) {
        const canvas = document.querySelector('.face__overlay');
        if (canvas) {
          const dims = faceApi.matchDimensions(canvas, videoEl, true);

          const resizedResult = faceApi.resizeResults(result, dims);

          console.log(resizedResult);
          // draw default detection box
          // faceApi.draw.drawDetections(canvas, resizedResult);
          const { age, gender, genderProbability, expressions } = resizedResult;

          const interpolatedAge = interpolateAgePredictions(age);

          Toast.info(
            `性别: ${gender2Emoji(gender)}\n年龄: ${interpolatedAge.toFixed(
              1
            )}\n表情: ${expression2Emoji(
              expressions?.asSortedArray()[0].expression
            )}`
          );

          // interpolate gender predictions over last 30 frames
          // to make the displayed age more stable
          // draw default result label
          // new faceApi.draw.DrawTextField(
          //   [
          //     `${faceApi.utils.round(interpolatedAge, 0)} years`,
          //     `${gender} (${faceApi.utils.round(genderProbability)})`,
          //   ],
          //   result.detection.box.bottomLeft
          // ).draw(canvas);
          new faceApi.draw.DrawBox(resizedResult.detection.box, {
            boxColor: '#07c160',
            lineWidth: 5,
          }).draw(canvas);
        }
      }

      frameIdRef.current = requestAnimationFrame(detectFace);
    }

    initFaceApi().then(() => {
      console.info('face model loaded~');
      Toast.hide();
      detectFace();
    });

    // clear face api effect
    return () => {
      if (frameIdRef.current) {
        console.log('cancel face api task');
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      setVideoLoaded(false);
    };
  }, [cam, videoLoaded]);

  const { transform, opacity } = useSpring({
    opacity: cam ? 1 : 0,
    transform: `perspective(1000px) rotateY(${cam ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  if (croppedImg) {
    return (
      <>
      <div className="cropped-img__container">
        <img src={croppedImg} style={{ width: '100%' }} />
      </div>
        {/* <div>
          <button onClick={handleBackClick}>back</button>
        </div> */}
      </>
    );
  }

  if (capturedImg) {
    return (
      <>
        <Cropper
          src={capturedImg}
          style={{ height: '100%', width: '100%' }}
          className="cam-cropper"
          // Cropper.js options
          dragMode="move"
          background={false}
          initialAspectRatio={1}
          guides={false}
          crop={handleCrop}
          ref={cropperRef}
        />
        <div key="captured">
          <button className="crop-btn back" onClick={handleBackClick}>
            <CloseOutlined style={{ fontSize: 20, color: '#07c160' }} />
          </button>
          <button className="crop-btn done" onClick={handleDoneClick}>
            <CheckOutlined style={{ fontSize: 20, color: '#fa5151' }} />
          </button>
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
                ref={webcamRef}
                screenshotFormat="image/jpeg"
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
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              imageSmoothing={false}
              forceScreenshotSourceSize={true}
            />
          )}
        </a.div>
      </div>
      <div key="streaming">
        <button
          className={`capture-btn ${shouldShowCapture ? '' : 'hidden'}`}
          onClick={capture}
        />
        {/* <button onClick={handleSwitchCam}>switch cam</button> */}
      </div>
    </>
  );
};

function App() {
  const [img, setImg] = useState();
  const apiComRef = useRef(apiList[0].component);
  const [currentApi, setCurrentApi] = useState(0);

  const camConstraints = apiList[currentApi].front
    ? frontVideoConstraints
    : videoConstraints;
  const shouldShowCapture =
    apiList[currentApi].canCapture === false ? false : true;

  return (
    <div className="App">
      <div className="app__main">
        <WebcamCapture
          onCropDone={(croppedImg) => {
            setImg(croppedImg);
          }}
          camConstraints={camConstraints}
          shouldShowCapture={shouldShowCapture}
        />
      </div>
      <div className="selector__container">
        <Swiper
          className="selector__swiper"
          centeredSlides
          slideToClickedSlide
          spaceBetween={50}
          slidesPerView="auto"
          onSlideChange={(e) => {
            window.navigator.vibrate(50);
            console.log('slide change', e);
            apiComRef.current = apiList[e.activeIndex].component;
            setCurrentApi(e.activeIndex);
          }}
          // onSwiper={(swiper) => console.log(swiper)}
        >
          {apiList.map((api) => {
            return <SwiperSlide>{api.name}</SwiperSlide>;
          })}
        </Swiper>
        <div className="selector__indicator" />
      </div>
      {img && apiComRef.current && <apiComRef.current img={img} />}
    </div>
  );
}

export default App;
