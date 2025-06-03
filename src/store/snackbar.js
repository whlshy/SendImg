import { create } from 'zustand'
import log from '../lib/log'

const initialState = {
  open: false,
  message: null,
  anchorOrigin: { vertical: 'top', horizontal: 'center' },
  autoHideDuration: 3000,
  status: null,
}

const useSnackbarStore = create(
  log((set, get) => ({
    ...initialState,
    setSnackMsg: (data) => set({ ...data, open: true }),
    closeSnackbar: () => set(initialState)
  }))
)

export default useSnackbarStore