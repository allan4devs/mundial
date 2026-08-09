import { MAIN_TOUR_PATH } from '../../../data/mapData';
import type { TourGroup } from '../../../types';

interface TourRunnerProps {
  group: TourGroup;
}

export default function TourRunner({ group }: TourRunnerProps) {
  return (
    <g>
      <circle r="9" fill={group.color} stroke="#ffffff" strokeWidth="4">
        <animateMotion
          dur={`${26 + group.progress / 4}s`}
          repeatCount="indefinite"
          path={MAIN_TOUR_PATH}
          keyPoints={`${group.progress / 100};1;0;${group.progress / 100}`}
          keyTimes="0;0.45;0.46;1"
          calcMode="linear"
        />
      </circle>
    </g>
  );
}
