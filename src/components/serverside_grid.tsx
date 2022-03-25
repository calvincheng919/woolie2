import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { getCoreSDK2 } from '@looker/extension-sdk-react'
import { Looker40SDK } from '@looker/sdk'

interface IinlineQueryResult {
  success?: boolean;
  rows?:Record<any, any>[];
  lastRow?: number
}

const AGGrid = (): JSX.Element => {
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const core40SDK = getCoreSDK2<Looker40SDK>()
  const [columnDefs, setColumnDefs] = useState([
    { field: "category", minWidth: 220,rowGroup: true, hide: true },
    { field: "department", minWidth: 220,rowGroup: true, hide: true},
    { field: "count_products" , minWidth: 220, aggFunc: 'sum'},
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

  const getLookerData = async (request: any) => {

    const lookerRequest = buildLookerQuery(request) 
    try {
      // debugger;
      const result = await core40SDK.ok(
        core40SDK.run_inline_query(lookerRequest)
      ) as unknown as Record<any, any>[]
      const formattedResult = formatResult(result)
      const finalResult: IinlineQueryResult = {
        success: true,
        rows: formattedResult,
        lastRow: getLastRowIndex(request, result)
      }
      return finalResult;
    } catch (error) {
      console.log('Error invoking inline query', error)
    }
  }

  function formatResult(data: any[]): any[] {
    const formatted = data.map( (item) => {
      let myObj = {}
      Object.keys(item).map( property => {
        Object.defineProperty(myObj, property.split('.')[1], 
        { value: typeof item[property] === 'string'? item[property].trim(): item[property]})
      })
      return myObj
    })
    return formatted
  }

  const datasource = {
    getRows: async function(params:any) {
      console.log('[Datasource] - rows requested by grid: ', params.request);
      const response = await getLookerData(params.request)
      console.log('Looker resp: ',response)
        if (response?.success) {
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

  //** Looker Queries */

  function buildLookerQuery(request: any) {
    const query = {
      result_format: 'json',
      body: {
        model: '4_mile_analytics',
        view: 'order_items',
        fields: getFields(request),
        sorts: getSorting(request),
        filters:  getFilters(request),
        limit: '500',
        total: false
      }
    }
    return query
  }

  function getFields(request: any) {
    const rowGroupCols = request.rowGroupCols;
    const groupKeys = request.groupKeys;
    const valueCols = request.valueCols;

    console.log('request: ', request)
    if (groupKeys.length > 0) {
      const dims = rowGroupCols.map( (item:any) => `inventory_items.${item.id}`);
      const measures = valueCols.map( (item: any) => `inventory_items.${item.id}`); 
      console.log('fields', [...dims, ...measures]) 
      return [...dims, ...measures];
    } 
    return [ 'inventory_items.category', 'inventory_items.count_products']
  }

  function getSorting(request: any) {

    return []
  }

  function getFilters( request: any) {
    const filter:{ [key: string]: string; }= {}
    const rowGroups = request.rowGroupCols; // filter key (the dimension/field to filter)
    const groupKeys = request.groupKeys; // value to filter on

    // I want { rowGroup1: "groupKey1", rowGroup2: "groupKey2" }
    if (groupKeys.length > 0) {
      groupKeys.forEach(function (key:string, i: number) {
        filter[`inventory_items.${rowGroups[i].id}`] = key
      })
    }
    return filter
  }


  //** End Queries */

  function getLastRowIndex(request:any, results:any) {
    if (!results || results.length === 0) {
      return null;
    }
    var currentLastRow = request.startRow + results.length;
    return currentLastRow <= request.endRow ? currentLastRow : -1;
  }

  const onGridReady = useCallback( (params: any) => {
    console.log('grid ready called')
    // inlineQueryClick();
    console.log('params top: ', params)
    params.api.setServerSideDatasource(datasource);
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
        ></AgGridReact>
      </div>
    </div>
  );
}

export default AGGrid;
