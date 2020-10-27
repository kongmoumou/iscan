import { useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children }) {
  const portalRootEl = useMemo(() => {
    return document.createElement('div');
  }, []);

  useLayoutEffect(() => {
    document.body.appendChild(portalRootEl);
    return () => {
      document.body.removeChild(portalRootEl);
    };
  }, []);

  return createPortal(children, portalRootEl);
}
