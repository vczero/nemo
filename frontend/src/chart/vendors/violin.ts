/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// copy and edit from https://github.com/apache/echarts-custom-series/blob/main/custom-series/violin/src/index.ts

import type {
  CustomPathOption,
  CustomRootElementOption,
  CustomSeriesRenderItem,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
} from 'echarts/types/src/chart/custom/CustomSeries.d.ts';
import type {
  EChartsExtensionInstallRegisters,
  EChartsExtension,
} from 'echarts/types/src/extension.d.ts';

function epanechnikovKernel(u: number) {
  return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) : 0;
}

function kernelDensityEstimator(
  kernel: (u: number) => number,
  bandwidth: number,
  data: number[]
) {
  return function (x: number) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += kernel((x - data[i]) / bandwidth);
    }
    return sum / (data.length * bandwidth);
  };
}

const renderItem = (
  params: CustomSeriesRenderItemParams,
  api: CustomSeriesRenderItemAPI
) => {
  let violins: { [key: number]: { firstDataIndex: number; data: number[] } } = {};

  if (params.context.violins == null) {
    params.context.violins = [];
    violins = params.context.violins as any;
    const cnt = params.dataInsideLength;
    for (let i = 0; i < cnt; ++i) {
      const xIndex = api.value(0, i) as number;
      if (violins[xIndex] == null) {
        violins[xIndex] = {
          firstDataIndex: i,
          data: [],
        };
      }
      violins[xIndex].data.push(api.value(1, i) as number);
    }
  } else {
    violins = params.context.violins as any;
  }

  const xValue = api.value(0) as number;
  const yValue = api.value(1) as number;
  const coord = api.coord([xValue, yValue]);

  const bandWidthScale = params.itemPayload.bandWidthScale as number | null;
  const chartBandWidth =
    (api.coord([1, 0])[0] - api.coord([0, 0])[0]) *
    (bandWidthScale == null ? 1 : bandWidthScale);

  const violin = violins[xValue];
  let violinPath: CustomRootElementOption | null = null;

  if (violin && violin.firstDataIndex === params.dataIndexInside) {
    // 修复 2：支持从 payload 传入 kdeBandwidth，如果没传，则提供一个基于数据跨度的简单默认值
    let minData = Math.min(...violin.data);
    let maxData = Math.max(...violin.data);
    if (minData === maxData) {
      minData -= 1;
      maxData += 1;
    }

    const defaultKdeBandwidth = (maxData - minData) * 0.1;
    const kdeBandwidth = (params.itemPayload.kdeBandwidth as number) || defaultKdeBandwidth;

    const kde = kernelDensityEstimator(epanechnikovKernel, kdeBandwidth, violin.data);
    const binCount = (params.itemPayload.binCount as number) || 100;

    // 修复 1：动态生成 xRange，根据真实数据的最大最小值，并向两端各扩展一点（缓冲区域）
    const padding = (maxData - minData) * 0.1; // 上下多预留 10% 的空间让曲线平滑收尾
    const startY = minData - padding;
    const endY = maxData + padding;
    const step = (endY - startY) / (binCount - 1);

    const xRange: number[] = [];
    for (let i = 0; i < binCount; i++) {
      xRange.push(startY + i * step);
    }

    const density = xRange.map((x) => [x, kde(x)]);
    const epsilonDensity = 0.001;
    const polylines: CustomPathOption[] = [];
    const points: [number, number][] = [];

    const pushToPolylines = function () {
      if (points.length > 1) {
        // 构建对称的右侧多边形闭合路径
        for (let j = points.length - 1; j >= 0; --j) {
          points.push([coord[0] * 2 - points[j][0], points[j][1]]);
        }
        const areaOpacity = params.itemPayload.areaOpacity as number | null;
        // console.log(api.visual('color'))
        polylines.push({
          type: 'polygon',
          shape: {
            points: points.slice(),
          },
          style: {
            fill: api.visual('color'),
            opacity: areaOpacity == null ? 0.5 : areaOpacity,
          },
        });

        polylines.push({
          type: 'polygon',
          shape: {
            points: points.slice(),
          },
          style: {
            fill: 'none',
            stroke: api.visual('color'),
            lineWidth: 1,
          },
        });
      }
      points.length = 0;
    };

    for (let i = 0; i < density.length; ++i) {
      // 这里的 density[i][0] 是 Y 轴对应的值
      const pointCoord = api.coord([xValue, density[i][0]]);
      if (density[i][1] < epsilonDensity) {
        pushToPolylines();
        continue;
      }
      // coord[0] 是中心 X 坐标，加上密度计算出的偏移量
      points.push([pointCoord[0] + (chartBandWidth / 2) * density[i][1], pointCoord[1]]);
    }
    pushToPolylines();

    violinPath = {
      type: 'group',
      children: polylines,
      silent: true, // 因为 custom series 为第一条数据渲染整体图形，禁用自身默认的鼠标事件更好
    };
  }

  return violinPath;
};

export default {
  install(registers: EChartsExtensionInstallRegisters) {
    registers.registerCustomSeries(
      'violin',
      renderItem as unknown as CustomSeriesRenderItem
    );
  },
} as EChartsExtension;