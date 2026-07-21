import { LiveGraphic } from "./LiveGraphic";

/*
  Automation division graphic — a team of many-handed robots, white studio.
  Robots doing several human jobs at once, permanently alive: typing,
  writing, phone, headset. Plays when in view, pauses off-screen, edges
  blended into the page.
*/
export function WorkingRobot() {
  return (
    <LiveGraphic
      src="/assets/robot_work_v2.mp4"
      poster="/assets/robot_work_poster_v2.jpg"
    />
  );
}
