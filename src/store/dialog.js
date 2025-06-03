import { create } from 'zustand'
import log from '../lib/log'

const initialState = {
  open: false,
  title: "",
  content: null,
  actions: null,
  body: null,
}

const useDialogStore = create(
  log((set, get) => ({
    ...initialState,
    setDialog: (data) => set({ ...initialState, ...data, open: true }),
    closeDialog: () => set({ open: false })
  }))
)

export default useDialogStore