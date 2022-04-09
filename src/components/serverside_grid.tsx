import React, { useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import { getCoreSDK2 } from '@looker/extension-sdk-react';
import { Looker40SDK } from '@looker/sdk';
import { getLookerData } from '../services/looker';
import {
  IGridProps,
  IinlineQueryResult,
} from "../types/IProjectTypes";

const AGGrid = ({ colConfig, model, view }:any): JSX.Element => {
  const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const core40SDK = getCoreSDK2<Looker40SDK>();
  const modelview = {model, view};
  const [err, setErr] =  useState<any | null>(null);
  const colDefParams = {};
  // const [columnDefs, setColumnDefs] = useState([
  //   // { field: "created_at_year", minWidth: 220, pivot: true},
  //   { field: "department", minWidth: 220, pivot: true },
  //   { field: "category", minWidth: 220, rowGroup: true },
  //   { field: "brand", minWidth: 220, rowGroup: true },
  //   // { field: "name", minWidth: 220,rowGroup: true, hide: true },
  //   // { field: "created_at_month", minWidth: 220,rowGroup: true, hide: true},
  //   // { field: "created_at_day_of_week", minWidth: 220,rowGroup: true, hide: true},
  //   {
  //     headerName: "Count",
  //     field: "count-products",
  //     minWidth: 220,
  //     aggFunc: "sum",
  //     filter: true,
  //   },
  //   {
  //     headerName: "Total Retail Price",
  //     field: "total-retail-price",
  //     minWidth: 220,
  //     hide: true,
  //     aggFunc: "sum",
  //   },
  //   {
  //     headerName: "Total Cost",
  //     field: "total-cost",
  //     minWidth: 220,
  //     hide: true,
  //     aggFunc: "sum",
  //   },
  // ]);

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
    getRows: async function (params: any) {
      console.log('in datasource before looker', modelview)
      try {
        const response: any = await getLookerData(params.request, modelview, core40SDK);
        console.log('looker response', response.rows)
        addPivotColDefs(params.request, response, params.columnApi);
        if (response?.success) {
          params.success({
            rowData: response.rows,
            rowCount: response.lastRow,
          });
        } else {
          params.fail();
        }
      } catch (err) {
        setErr('Something went wrong, Looker is not returning anything')
      }
    },
  };

  //** Construct Pivot Columns */

  const addPivotColDefs = (
    request: any,
    response: IinlineQueryResult,
    columnApi: any
  ) => {
    // check if pivot colDefs already exist
    let existingPivotColDefs = columnApi.getSecondaryColumns();
    if (existingPivotColDefs && existingPivotColDefs.length > 0) {
      return;
    }
    let pivotColDefs = createPivotColDefs(request, response.pivotFields);
    columnApi.setSecondaryColumns(pivotColDefs);
  };

  const createPivotColDefs = (request: any, pivotFields: any) => {
    function addColDef(colId: string, parts: string[], res: any[]) {
      if (parts.length === 0) return [];
      var first = parts.shift();
      var existing = res.filter(function (r) {
        return "groupId" in r && r.groupId === first;
      })[0];
      if (existing) {
        existing["children"] = addColDef(colId, parts, existing.children);
      } else {
        var colDef: any = {};
        var isGroup = parts.length > 0;
        if (isGroup) {
          colDef["groupId"] = first;
          colDef["headerName"] = first;
        } else {
          // debugger;
          var valueCol = request.valueCols.filter(function (r: any) {
            return r.field === first;
          })[0];
          colDef["colId"] = colId;
          colDef["headerName"] = valueCol.displayName;
          colDef["field"] = colId;
        }
        var children = addColDef(colId, parts, []);
        children.length > 0 ? (colDef["children"] = children) : null;
        res.push(colDef);
      }
      return res;
    }
    if (request.pivotMode && request.pivotCols.length > 0) {
      var secondaryCols: any = [];
      pivotFields.forEach(function (field: string) {
        addColDef(field, field.split("_"), secondaryCols);
      });
      return secondaryCols;
    }
    return [];
  };

  const onGridReady = useCallback((params: any) => {
    params.api.setServerSideDatasource(datasource);
  }, []);

  return (
    <>
    { err
      ? <div style={{paddingTop: "15px", color: "red", fontWeight: "bold"}}>{err}</div> 
      : <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            columnDefs={colConfig}
            defaultColDef={defaultColDef}
            rowModelType="serverSide"
            serverSideStoreType={"full"}
            onGridReady={onGridReady}
            autoGroupColumnDef={autoGroupColumnDef}
            animateRows={true}
            pivotMode={true}
          ></AgGridReact>
        </div>
      </div>
    }
    </>

  );
};

export default AGGrid;
