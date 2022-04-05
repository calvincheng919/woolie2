import React, { useContext, useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
// import { getCoreSDK2 } from '@looker/extension-sdk-react'
// import { Looker40SDK } from '@looker/sdk'
import { LookerDataContext } from '../context/LookerContext';

interface IinlineQueryResult {
  success?: boolean;
  rows?:any;
  lastRow?: number;
  pivotFields?: any;
}

const AGGrid = (): JSX.Element => {

  const context = useContext(LookerDataContext);
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  // const core40SDK = getCoreSDK2<Looker40SDK>()
  const [columnDefs, setColumnDefs] = useState([
    // { field: "created_at_year", minWidth: 220, pivot: true},
    { field: "department", minWidth: 220, pivot: true, enableRowGroup: true, enablePivot: true},
    { field: "category", minWidth: 220,rowGroup: true, enablePivot: true},
    { field: "brand", minWidth: 220,rowGroup: true},
    { field: "name", minWidth: 220,rowGroup: true, hide: true },
    // { field: "created_at_month", minWidth: 220,rowGroup: true, hide: true},
    // { field: "created_at_day_of_week", minWidth: 220,rowGroup: true, hide: true},
    { headerName: 'Count', enableValue: true,field: "count-products" , minWidth: 220, aggFunc: 'sum', filter: true},
    { headerName: 'Total Retail Price', enableValue: true,field: "total-retail-price" , minWidth: 220, hide: true, aggFunc: 'sum'},
    // { field: "total_cost" , minWidth: 220, hide: true, aggFunc: 'sum'},
  ]);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      sortable: true,
      resizable: true,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      minWidth: 200,
    };
  }, []);

  const datasource = {
    getRows: async function(params:any) {
      console.log('[Datasource] - rows requested by grid: ', params.request);
      // debugger;
      await context?.getLookerData(params.request)
      // const response:any = await getLookerData(params.request) - before context implementation
      const response = await context?.lookerData;
      console.log('looker data: ', context?.lookerData)
      addPivotColDefs(params.request,response, params.columnApi);

      if (response.success) {
        // call the success callback
        console.log('response success')
        params.success({
          rowData: response.rows,
          rowCount: response.lastRow,
        });
      } else {
        // inform the grid request failed
        params.fail();
      }
    },
  };  

  //** Pivoting */

  const addPivotColDefs = (request: any, response: IinlineQueryResult, columnApi: any) => {
    // check if pivot colDefs already exist
    let existingPivotColDefs = columnApi.getSecondaryColumns();
    if (existingPivotColDefs && existingPivotColDefs.length > 0) {
      return;
    }

    let pivotColDefs = createPivotColDefs(request, response.pivotFields)
    // supply secondary columns to the grid
    console.log('pivot col defs ', pivotColDefs)
    columnApi.setSecondaryColumns(pivotColDefs);
  }; 

  // create column groupings based on the returned data
  const createPivotColDefs = (request: any, pivotFields: any) => {
    function addColDef(colId:string, parts: string[], res: any[]) {
      if (parts.length === 0) return [];
      var first = parts.shift();
      var existing = res.filter(function (r) {
        return 'groupId' in r && r.groupId === first;
      })[0];
      if (existing) {
        existing['children'] = addColDef(colId, parts, existing.children);
      } else {
        var colDef:any = {};
        var isGroup = parts.length > 0;
        if (isGroup) {
          colDef['groupId'] = first;
          colDef['headerName'] = first;
          colDef['columnGroupShow'] = 'closed'
          colDef['aggFunc'] = 'sum'
        } else {
          // debugger;
          var valueCol = request.valueCols.filter(function (r:any) {
            return r.field === first;
          })[0];
          colDef['colId'] = colId;
          colDef['headerName'] = valueCol.displayName;
          colDef['field'] = colId;
        }
        var children = addColDef(colId, parts, []);
        children.length > 0 ? (colDef['children'] = children) : null;
        res.push(colDef);
      }
      return res;
    }
    if (request.pivotMode && request.pivotCols.length > 0) {
      var secondaryCols: any = [];
      // debugger;
      pivotFields.forEach(function (field: string) {
        addColDef(field, field.split('_'), secondaryCols);
      });
      return secondaryCols;
    }
    return [];
  };

  const onGridReady = useCallback( (params: any) => {
    console.log('grid ready called')
    // inlineQueryClick();
    // console.log('params top: ', params)
    params.api.setServerSideDatasource(datasource);
    // console.log('on grid ready', context?.lookerData)
  }, [])

  return (
    <div style={containerStyle}>
      <div style={gridStyle} className="ag-theme-alpine">
        
        <AgGridReact
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType='serverSide'
          serverSideStoreType={'full'}
          onGridReady={onGridReady}
          autoGroupColumnDef={autoGroupColumnDef}
          animateRows={true}
          pivotMode={true}
          // sideBar={true}
        ></AgGridReact>
      </div>
    </div>
  );
}

export default AGGrid;
