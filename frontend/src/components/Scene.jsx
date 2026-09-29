import React from 'react';
import { WarpFieldBackground } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame">
      <WarpFieldBackground
        variant="letters"
        speed={15.0}
        streakOpacity={0.60}
        tileOpacity={0.90}
        fov={75}
        hue={0}
        saturation={1.00}
        brightness={1.00}
      />
    </div>
  );
}

export default Scene;
