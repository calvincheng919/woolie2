import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { getCoreSDK2 } from '@looker/extension-sdk-react'
import { Looker40SDK } from '@looker/sdk'

interface IinlineQueryResult {
  success?: boolean;
  rows?:any;
  lastRow?: number;
  pivotFields?: any;
}

const AGGrid = (): JSX.Element => {
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const core40SDK = getCoreSDK2<Looker40SDK>()
  const [columnDefs, setColumnDefs] = useState([
    { field: "department", minWidth: 220, pivot: true},
    { field: "category", minWidth: 220,rowGroup: true, hide: true },
    { field: "brand", minWidth: 220,rowGroup: true, hide: true },
    // { field: "name", minWidth: 220,rowGroup: true, hide: true },
    // { field: "created_at_year", minWidth: 220,rowGroup: true, hide: true},
    // { field: "created_at_month", minWidth: 220,rowGroup: true, hide: true},
    // { field: "created_at_day_of_week", minWidth: 220,rowGroup: true, hide: true},
    { field: "count_products" , minWidth: 220, aggFunc: 'sum', filter: true},
    { field: "total_retail_price" , minWidth: 220, hide: true, aggFunc: 'sum'},
    { field: "total_cost" , minWidth: 220, hide: true, aggFunc: 'sum'},
  ]);

  const PREFIX = 'inventory_items'
  const VIEW = 'order_items'
  const MODEL = '4_mile_analytics'

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
    console.log('looker request: ',lookerRequest)
    try {
      // debugger;
      const result = await core40SDK.ok(
        core40SDK.run_inline_query(lookerRequest)
      ) as unknown as Record<any, any>[]
      console.log(result)
      const formattedResult = formatResult(request,result)
      console.log('formatted result: ', formattedResult)

      return formattedResult;
    } catch (error) {
      console.log('Error invoking inline query', error)
    }
  }

  // async function getPivotFields(request: any){
  //   try {
  //     const result = await core40SDK.ok(
  //       core40SDK.run_inline_query(
  //         {
  //           result_format: 'json',
  //           body: {
  //             model: '4_mile_analytics',
  //             view: 'order_items',
  //             fields: ["inventory_items.department"],
  //             limit: '500',
  //             total: false
  //           }
  //         }
  //       )
  //     ) as unknown as Record<any, any>[]
  //     const pivotFields: any[] = result.map( (item: any) => Object.values(item)[0]);
  //     return pivotFields;
  //   }catch (error) {
  //     console.log('Error invoking inline query', error)
  //   }
  // }

  function formatResult(request:any, raw: any): any[] {

    let formatted:any;
    let data;
    // debugger;
    if ( raw.pivots?.length > 0) {
      // interpret looker pivot data to ag grid pivot format
      data = dataTransform(raw)
    } else {
      data = raw.map( (item: any) => {
        let myObj = {}
        Object.keys(item).map( property => {
          Object.defineProperty(myObj, property.split('.')[1], 
          { value: typeof item[property] === 'string'? item[property].trim(): item[property]})
        })
        return myObj
      })
    }
    console.log('formatted data: ', data)
    // const pivotFields = raw.pivots? Object.keys(data[0]).map( key => key): [];
    const pivotFields = ['Men_count_products', 'Women_count_products']
    formatted = {
      success: true,
      rows: data,
      lastRow: getLastRowIndex(request, raw),
      pivotFields 
    }
    return formatted
  }

  function dataTransform(data: any): any {
    
    const valCols = data.fields.measures.map( (measure: any) => measure.name);
    console.log('value columns: ', valCols)
    const final = data.data.map( (item:object) => {
      let returnObj = {}
      Object.keys(item).map( (field, i)=> {
        if (!valCols.includes(field)) {
          returnObj = {
          ...returnObj,
          [field.substring(field.indexOf('.')+1)]: Object.values(item)[i].value,
          }
        } else {
          let metricsObj: object = {...Object.values(item)[i]}
          let metrics = Object.keys(metricsObj).map( (metric,i) => {
            metric = metric.split('|FIELD|').join('_')
            field = field.substring(field.indexOf('.')+1)
            return {
              [`${metric}_${field}`]: Object.values(metricsObj)[i].value
            }
          })
          let finalObj = {}
          metrics.map( (item:object) => {
            finalObj = { 
              ...finalObj,
              [Object.keys(item)[0]]: Object.values(item)[0]
            }
            return finalObj
          })
          // console.log('metrics: ', metrics)
          returnObj = {
          ...returnObj,
          ...finalObj
          }
        }
      })
      return returnObj
    })
    return final;
  }

  const datasource = {
    getRows: async function(params:any) {
      console.log('[Datasource] - rows requested by grid: ', params.request);
      const response:any = await getLookerData(params.request)
      // response.pivotFields = await getPivotFields(params.request)
      // console.log('looker data: ', response)
      addPivotColDefs(response, params.columnApi);
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


  //** Pivoting */

  const addPivotColDefs = (response: IinlineQueryResult, columnApi: any) => {
    // check if pivot colDefs already exist
    let existingPivotColDefs = columnApi.getSecondaryColumns();
    if (existingPivotColDefs && existingPivotColDefs.length > 0) {
      return;
    }
    // create colDefs
    let pivotColDefs = response.pivotFields?.map(function (field: any) {
      // let headerName = field.split('_')[0];
      return { headerName: field, field: field };
    });
    // supply secondary columns to the grid
    columnApi.setSecondaryColumns(pivotColDefs);
  }; 

  //** Looker Queries */

  function buildLookerQuery(request: any) {
    
    const pivots = request.pivotCols.map( (item: any) => `${PREFIX}.${item.id}`);
    const result_format = pivots.length > 0? 'json_detail': 'json';
    const query = {
      result_format,
      body: {
        model: MODEL,
        view: VIEW,
        pivots,
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

    if (groupKeys.length > 0) {
      const dims = [];
      for (let i=0; i <= groupKeys.length; i++) {
        dims.push(`inventory_items.${rowGroupCols[i].id}`)
      }
      console.log('dim fields: ', dims)
      const measures = valueCols.map( (item: any) => `inventory_items.${item.id}`); 
      console.log('fields', [...dims, ...measures]) 
      return [...dims, ...measures];
    } 
    // TODO: These default columns can be passed down as props from a picklist of some kind
    return [ 'inventory_items.department','inventory_items.category', 'inventory_items.count_products']
  }

  function getSorting(request: any) {

    return []
  }

  function getFilters( request: any) {
    const filter:{ [key: string]: string; }= {}
    const rowGroups = request.rowGroupCols; 
    const groupKeys = request.groupKeys; 

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
          animateRows={true}
          pivotMode={true}
        ></AgGridReact>
      </div>
    </div>
  );
}

export default AGGrid;
