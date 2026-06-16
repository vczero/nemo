import { theme } from 'antd'

const { defaultAlgorithm, darkAlgorithm } = theme

const nautilusTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#0066cc',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorBgLayout: '#f5f7fa',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#e8e8e8',
    colorText: '#1a1a1a',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: '"Consolas", "Monaco", "Courier New", monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      siderBg: '#ffffff',
      bodyBg: '#f5f7fa',
    },
    Menu: {
      itemSelectedBg: 'rgba(0, 102, 204, 0.1)',
      itemHoverBg: 'rgba(0, 102, 204, 0.06)',
      itemHeight: 40,
      itemMarginInline: 4,
      itemMarginBlock: 4,
      itemPaddingInline: 12,
      itemBorderRadius: 6,
      itemSelectedColor: '#0066cc',
      itemColor: '#666666',
    },
    Button: {
      defaultBg: '#0066cc',
      defaultColor: '#ffffff',
      defaultBorderColor: '#0066cc',
      primaryShadow: '0 4px 15px rgba(0, 102, 204, 0.3)',
      defaultHoverBg: '#0052a3',
      defaultActiveBg: '#003d7a',
    },
    Card: {
      colorBorderSecondary: '#e8e8e8',
      boxShadowTertiary: '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    Input: {
      colorBorder: '#d9d9d9',
      activeBorderColor: '#0066cc',
      hoverBorderColor: '#40a9ff',
      colorBgContainer: '#ffffff',
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#1a1a1a',
      borderColor: '#e8e8e8',
      rowHoverBg: 'rgba(0, 102, 204, 0.04)',
    },
    Tabs: {
      inkBarColor: '#0066cc',
      itemActiveColor: '#0066cc',
      itemSelectedColor: '#0066cc',
      itemHoverColor: '#40a9ff',
      itemColor: '#666666',
    },
    Dropdown: {
      colorBgElevated: '#ffffff',
      boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
    Form: {
      labelColor: '#1a1a1a',
      labelRequiredMarkColor: '#ff4d4f',
    },
  },
}

export default nautilusTheme
