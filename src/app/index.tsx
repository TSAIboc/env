"use client";
import './style.scss';
import { useEffect } from 'react';

import CanvasDraw from '@component/Canvas';

const Index = () => {
  useEffect(() => {
    document.oncontextmenu = () => { return false; }
  }, []);

  return (
    <>
      <div className='canvas'>
        <CanvasDraw />
      </div>
    </>
  )
}

export default Index;