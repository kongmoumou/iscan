import React, { useState } from 'react';
import './index.scss';
import Portal from '../Portal';
import { CloseCircleOutlined, RedoOutlined } from '@ant-design/icons';
import { useSpring, useTransition, animated as a } from 'react-spring';
import GridLoader from 'react-spinners/GridLoader';
import { useCapturedImageCtx } from '../../stores/CapturedImage';
import { useCroppedImageCtx } from '../../stores/CroppedImage';

export const STATE = {
  LOADING: 'loading',
  DONE: 'done',
  ERROR: 'error',
};

const noop = () => {};

export default function Result({
  children,
  state = STATE.LOADING,
  onRetry = noop,
}) {
  const [isShow, setIsShow] = useState(true);
  // const [state, setState] = useState(STATE.LOADING);

  const { setCapturedImage } = useCapturedImageCtx();
  const { setCroppedImage } = useCroppedImageCtx();

  const bgTransition = useTransition(isShow, null, {
    from: {
      opacity: 0,
    },
    enter: {
      opacity: 1,
    },
    leave: {
      opacity: 0,
    },
  });

  const containerTransition = useTransition(isShow, null, {
    from: {
      transform: 'translate3d(0, 100%, 0)',
    },
    enter: {
      transform: 'translate3d(0, 0, 0)',
    },
    leave: {
      transform: 'translate3d(0, 100%, 0)',
    },
    onDestroyed: () => {
      setCapturedImage('');
      setCroppedImage('');
    },
  });

  const stateAnimation = useSpring(
    state === STATE.DONE
      ? {
          height: '70vh',
        }
      : {
          height: '15vh',
        }
  );

  const renderChildren = () => {
    switch (state) {
      case STATE.LOADING:
        return (
          <GridLoader
            css={{ margin: 'auto' }}
            size={10}
            color="#181818"
            className="result__spinner"
          />
        );
      case STATE.ERROR:
        return (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <RedoOutlined
              style={{ color: '#181818', fontSize: 40, marginBottom: 10 }}
              onClick={() => {
                onRetry();
              }}
            />
            <div>出现了一些错误，请点击重试~</div>
          </div>
        );
      case STATE.DONE:
      default:
        return children;
    }
  };

  return (
    <Portal>
      {bgTransition.map(
        ({ item, key, props }) =>
          item && <a.div key={key} style={props} className="result__bg" />
      )}
      {containerTransition.map(
        ({ item, key, props }) =>
          item && (
            <a.div
              key={key}
              style={{ ...props, ...stateAnimation }}
              className="result__container"
            >
              <CloseCircleOutlined
                color="#181818"
                className="result__close"
                onClick={() => {
                  setIsShow(false);
                }}
              />
              <div className="result__content">{renderChildren()}</div>
            </a.div>
          )
      )}
    </Portal>
  );
}
