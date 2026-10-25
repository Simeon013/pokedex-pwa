import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router';
import { useSettings } from '@/store/settings';
import { router } from './router';

export default function App() {
  const motion = useSettings((s) => s.motion);
  return (
    // LazyMotion + `m` : seules les fonctionnalités d'animation DOM sont chargées (bundle réduit).
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={motion === 'system' ? 'user' : motion === 'reduced' ? 'always' : 'never'}>
        <RouterProvider router={router} />
      </MotionConfig>
    </LazyMotion>
  );
}
