import React, { useEffect } from "react";
import Snackbar from "./elements/snackbar/Snackbar"
import Header from './header'
import Main from "./Main"
import { useQuery, useMutation } from "@tanstack/react-query"
import { getAccount, logoutAccount } from '../apis'
import Alert from "./elements/alert/Alert"
import Dialog from './elements/dialog/Dialog'
import useAccountStore from '../store/account'
import useDialogStore from "../store/dialog";

const App = () => {
  const { ...dialog_props } = useDialogStore()

  return (
    <>
      {/* <Header
        title={"WKE Lab"}
        logout={logoutAccountApi.mutate}
      /> */}
      <Main />
      <Alert />
      <Snackbar />
      <Dialog {...dialog_props} />
    </>
  );
};

export default App;