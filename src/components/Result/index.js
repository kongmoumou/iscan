import React, { useState } from 'react';
import './index.scss';
import Portal from '../Portal';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useSpring, useTransition, animated as a } from 'react-spring';
import GridLoader from 'react-spinners/GridLoader';

export const STATE = {
  LOADING: 'loading',
  DONE: 'done',
  ERROR: 'error',
};

export default function Result({ children, state = STATE.LOADING }) {
  const [isShow, setIsShow] = useState(true);
  // const [state, setState] = useState(STATE.LOADING);

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

  // if (!isShow) {
  //   return null;
  // }

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
              <div className="result__content">
                {state === STATE.LOADING ? (
                  <GridLoader
                    css={{ margin: 'auto' }}
                    size={10}
                    color="#181818"
                    className="result__spinner"
                  />
                ) : (
                  children
                )}
              </div>
            </a.div>
          )
      )}
    </Portal>
  );
}
