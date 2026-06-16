import { useEffect, useState } from 'react'
import { Form, Select, Radio, Cascader } from 'antd'
import { RDBSource } from 'district-data'

const source = new RDBSource({
  version: '2024',
  type: 'gcj02',
})

type MapConfigValue = {
  mapId?: string | number // 'world' or 'china'
  adcodes?: number[] // container
  mapLevel?: string // 'province' | 'city' | 'district'
}

type MapConfigProps = {
  value?: MapConfigValue
  onChange?: (value: MapConfigValue) => void
}

type RegionOption = { label: string; value: number; children: RegionOption[] }

export default function MapConfig({ value, onChange }: MapConfigProps) {
  const [loading, setLoading] = useState(false)
  const [cities, setCities] = useState<RegionOption[]>([])

  const mapId = value?.mapId ?? 'world'
  const adcodes = value?.adcodes || []
  const mapLevel = value?.mapLevel

  // 1. Initial Load: Provinces
  useEffect(() => {
    const loadCities = async () => {
      setLoading(true)
      try {
        const data = await import('@/assets/geo/china_administrative_tree.json')
        setCities(data.default as unknown as RegionOption[])
      } catch (e) {
        console.error('Failed to load cities', e)
      } finally {
        setLoading(false)
      }
    }
    loadCities()
  }, [])

  const handleScopeChange = (val: string) => {
    if (val === 'world') {
      onChange?.({
        ...value,
        mapId: 'world',
        adcodes: undefined,
        mapLevel: undefined,
      })
    } else {
      // Default to China
      onChange?.({
        ...value,
        mapId: 'china',
        adcodes: [],
        mapLevel: undefined,
      })
    }
  }

  const handleCityChange = (val: number[] | undefined) => {
    // Revert to China
    onChange?.({
      ...value,
      adcodes: val,
      mapLevel:
        val?.length === 0 ? 'province' : val?.length === 1 ? 'city' : 'county',
    })
  }

  // const selectedCity = useMemo(() => {
  //     if (!parentAdcode || String(parentAdcode).endsWith('0000') || parentAdcode === 100000) return undefined
  //     return parentAdcode
  // }, [parentAdcode])

  return (
    <div className="flex flex-col gap-0">
      <Form.Item label="地图范围" className="mb-2">
        <Select
          value={mapId as string}
          onChange={handleScopeChange}
          options={[
            { label: '世界地图', value: 'world' },
            { label: '中国', value: 'china' },
          ]}
        />
      </Form.Item>
      {mapId === 'china' && (
        <>
          <Form.Item label="行政区划" className="mb-2">
            <Cascader
              loading={loading}
              options={cities}
              value={adcodes}
              changeOnSelect
              onChange={handleCityChange}
              placeholder="选择行政区 (默认全国)"
              allowClear
            />
          </Form.Item>
          <Form.Item label="展示层级" className="mb-2">
            <Radio.Group
              value={mapLevel}
              onChange={(e) =>
                onChange?.({ ...value, mapLevel: e.target.value })
              }
              buttonStyle="solid"
              size="small"
            >
              {adcodes?.length === 0 && (
                <Radio.Button value="province">省级</Radio.Button>
              )}
              {adcodes?.length === 1 && (
                <Radio.Button value="city">市级</Radio.Button>
              )}
              <Radio.Button value="county">区县级</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </>
      )}
    </div>
  )
}
