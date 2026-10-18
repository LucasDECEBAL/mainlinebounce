import React from "react";
import { Composition } from "remotion";
import { Trailer, TOTAL_FRAMES } from "./Trailer";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TrailerLandscape"
        component={Trailer}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ vertical: false }}
      />
      <Composition
        id="TrailerVertical"
        component={Trailer}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />
    </>
  );
};
