export default {
  key: 'gray',
  color: [
    '#262626',
    '#999999',
    '#404040',
    '#BFBFBF',
    '#000000',
    '#808080',
    '#666666',
    '#E6E6E6',
    '#1A1A1A',
    '#B3B3B3',
  ],
  backgroundColor: 'rgba(255, 255, 255, 1)',
  textStyle: {},
  title: {
    textStyle: {
      color: '#464646',
    },
    subtextStyle: {
      color: '#6E7079',
    },
  },
  line: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false,
  },
  radar: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false,
  },
  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: '#000000',
    },
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
  },
  candlestick: {
    itemStyle: {
      color: '#000000',
      color0: '#dedede',
      borderColor: '#000000',
      borderColor0: '#dedede',
      borderWidth: 1,
    },
  },
  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#000000',
    },
    lineStyle: {
      width: 1,
      color: '#aaa',
    },
    symbolSize: 4,
    symbol: 'emptyCircle',
    smooth: false,
    color: [
      '#000000',
      '#999999',
      '#404040',
      '#BFBFBF',
      '#262626',
      '#808080',
      '#666666',
      '#E6E6E6',
      '#1A1A1A',
      '#B3B3B3',
    ],
    label: {
      color: '#dedede',
    },
  },
  map: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  geo: {
    itemStyle: {
      areaColor: '#eee',
      borderColor: '#444',
      borderWidth: 0.5,
    },
    label: {
      color: '#000',
    },
    emphasis: {
      itemStyle: {
        areaColor: 'rgba(255,215,0,0.8)',
        borderColor: '#444',
        borderWidth: 1,
      },
      label: {
        color: 'rgb(100,0,0)',
      },
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisLabel: {
      show: true,
      color: '#000000',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#dedede'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisLabel: {
      show: true,
      color: '#000000',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#dedede'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisLabel: {
      show: true,
      color: '#000000',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#dedede'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#000000',
      },
    },
    axisLabel: {
      show: true,
      color: '#000000',
    },
    splitLine: {
      show: false,
      lineStyle: {
        color: ['#E0E6F1'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['rgba(250,250,250,0.2)', 'rgba(210,219,238,0.2)'],
      },
    },
  },
  toolbox: {
    iconStyle: {
      borderColor: '#999',
    },
    emphasis: {
      iconStyle: {
        borderColor: '#666',
      },
    },
  },
  legend: {
    textStyle: {
      color: '#000000',
    },
    left: 'center',
    right: 'auto',
    top: 0,
    bottom: 10,
  },
  tooltip: {
    axisPointer: {
      lineStyle: {
        color: '#ccc',
        width: 1,
      },
      crossStyle: {
        color: '#ccc',
        width: 1,
      },
    },
  },
  timeline: {
    lineStyle: {
      color: '#DAE1F5',
      width: 2,
    },
    itemStyle: {
      color: '#A4B1D7',
      borderWidth: 1,
    },
    controlStyle: {
      color: '#A4B1D7',
      borderColor: '#A4B1D7',
      borderWidth: 1,
    },
    checkpointStyle: {
      color: '#316bf3',
      borderColor: '#fff',
    },
    label: {
      color: '#A4B1D7',
    },
    emphasis: {
      itemStyle: {
        color: '#FFF',
      },
      controlStyle: {
        color: '#A4B1D7',
        borderColor: '#A4B1D7',
        borderWidth: 1,
      },
      label: {
        color: '#A4B1D7',
      },
    },
  },
  visualMap: {
    color: ['#000000', '#f7f7f7'],
  },
  markPoint: {
    label: {
      color: '#dedede',
    },
    emphasis: {
      label: {
        color: '#dedede',
      },
    },
  },
  grid: {
    left: '10%',
    right: '10%',
    top: 60,
    bottom: 70,
  },
}
