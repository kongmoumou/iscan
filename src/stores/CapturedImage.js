import { useState } from 'react';
import { createContainer } from 'unstated-next';

const {
  useContainer: useCapturedImageCtx,
  Provider: CapturedImageProvider,
} = createContainer(function useCapturedImage(initState = '') {
  const [capturedImage, setCapturedImage] = useState(initState);

  return { capturedImage, setCapturedImage };
});

export { useCapturedImageCtx, CapturedImageProvider };
