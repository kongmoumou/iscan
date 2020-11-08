import { useState } from 'react';
import { createContainer } from 'unstated-next';

const {
  useContainer: useCroppedImageCtx,
  Provider: CroppedImageProvider,
} = createContainer(function useCroppedImage(initState = '') {
  const [croppedImage, setCroppedImage] = useState(initState);

  return { croppedImage, setCroppedImage };
});

export { useCroppedImageCtx, CroppedImageProvider };
