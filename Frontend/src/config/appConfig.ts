export type DataMode = 'dexie' | 'api';
const LOCAL = 'https://localhost:53946/api/v1'

// const LOCAL = 'http://localhost:7878/api/v1'
const DEV = 'https://stall.atribsglobal.com/api/v1'
export const appConfig = {
  dataMode: ((import.meta.env.VITE_DATA_MODE as DataMode | undefined) ?? 'api'),
  apiBaseUrl: DEV,
  defaultEventCode: import.meta.env.VITE_DEFAULT_EVENT_CODE ?? 'MSME-HOSUR-2026'
} as const;


