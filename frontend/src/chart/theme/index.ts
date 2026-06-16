import * as echarts from 'echarts';
import academy from "./academy";
import g2 from "./g2";
import g2_academy from "./g2_academy";
import v5 from "./v5";
import vintage from "./vintage";
import gray from "./gray";

echarts.registerTheme('academy', academy);
echarts.registerTheme('g2', g2);
echarts.registerTheme('g2_academy', g2_academy);
echarts.registerTheme('v5', v5);
echarts.registerTheme('vintage', vintage);
echarts.registerTheme('gray', gray);

export const THEMES = {
  academy,
  g2,
  g2_academy,
  v5,
  vintage,
  gray,
}