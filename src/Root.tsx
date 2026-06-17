import React from "react";
import { Composition } from "remotion";
import { SoccerTactical, SOCCER_TOTAL_FRAMES } from "./SoccerTactical";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SoccerTactical"
    component={SoccerTactical}
    durationInFrames={SOCCER_TOTAL_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);
