import { createContext, useContext, useRef, useEffect } from 'react'
import { useStore, type StoreApi } from 'zustand'
import { createEditorStore } from './editorStore'
import type { EditorStore } from './types'

const EditorStoreContext = createContext<StoreApi<EditorStore> | null>(null)

export function ChartEditorProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<StoreApi<EditorStore> | null>(null)
  if (!storeRef.current) {
    storeRef.current = createEditorStore()
  }

  useEffect(() => {
    return () => {
      storeRef.current?.getState().reset()
    }
  }, [])

  return (
    <EditorStoreContext.Provider value={storeRef.current}>
      {children}
    </EditorStoreContext.Provider>
  )
}

export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useEditorStore must be used within a ChartEditorProvider')
  }
  return useStore(store, selector)
}
