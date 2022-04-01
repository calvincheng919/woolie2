import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { getCoreSDK2 } from '@looker/extension-sdk-react'
import { Looker40SDK } from '@looker/sdk'


interface AppContextInterface {
  data: Record<any, any[]> | null;
}

export const LookerDataContext = React.createContext<AppContextInterface | null>(null);

function LookerData(props: any) {

  const [lookerData, setLookerData] = useState(null);

  const state = {
    lookerData,
    getLookerData: setLookerData
  };

  return (
    <LookerDataContext.Provider value = {state}>
      {props.children}
    </LookerDataContext.Provider>
  );
}

export default LookerData