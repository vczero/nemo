## 计算任务例子
### SENTIMENT_CLASSIFICATION
```json
{
    "inputFiles": [
        {
            "id": "2045770316561674240",
            "name": "user_data_oss_path",
            "path": "24Be8jkiG4/dev/CHART/2015709046363910144/2026/04/19/1e43b518-2f5d-4581-b3c1-9fafbc52bcb5.xlsx"
        }
    ],
    "taskName": "wg-情感计算测试",
    "taskParams": {
        "classificationType": "SINGLE_CLASS",
        "categories": [
            {
                "category": "积极",
                "description": "正面情感"
            },
            {
                "category": "消极",
                "description": "负面情感"
            },
            {
                "category": "中性",
                "description": "中性情感"
            }
        ]
    },
    "taskType": "SENTIMENT_CLASSIFICATION"
}
```

### TEXT_SUMMARY
```json
{
  "inputFiles": [
    {
        "id": "2045770316561674240",
        "name": "input_user_oss_path",
        "path":"24Be8jkiG4/dev/CHART/2015709046363910144/2026/04/19/1e43b518-2f5d-4581-b3c1-9fafbc52bcb5.xlsx"
    }
  ],
  "taskName": "wg-文本摘要测试0426",
  "taskParams": {
      "maxSummaryLength": 100,
      "purpose": "测试文本摘要"
  },
  "taskType": "TEXT_SUMMARY"
}
```
