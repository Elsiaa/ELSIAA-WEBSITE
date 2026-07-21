import { LiveGraphic } from "./LiveGraphic";

/*
  Design division graphic — the artist at work, white studio.
  Full scene always in frame: the designer seated head-to-shoe with his
  chair, desk of notebooks and markers, Apple desktop mid-layout, iPad
  under his stylus and the easel canvas beside him — permanently alive
  and actively designing on a seamless loop, edges blended into the page.
*/
export function AssemblingArtist() {
  return (
    <LiveGraphic
      src="/assets/artist_work_v3.mp4"
      poster="/assets/artist_work_poster_v3.jpg"
    />
  );
}
