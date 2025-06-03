import { create } from 'zustand'
import log from '../lib/log'

const initialState = {
  isSidebarOpen: true,
}

const useAppStore = create(
  log((set, get) => ({
    ...initialState,
    setSidebarOpen: (tf = null) => set(state => ({ isSidebarOpen: tf !== null ? tf : !state.isSidebarOpen }))
  }))
)

export default useAppStore