import { isInteger } from "lodash"

const VIEW = 'order_items'
const MODEL = '4_mile_analytics'

export const getLookerData = async (request: any, core40SDK:any) => {
    const lookerRequest = buildLookerQuery(request) 
    console.log('looker request: ',lookerRequest)
    try {
      // debugger;
      const result = await core40SDK.ok(
        core40SDK.run_inline_query(lookerRequest)
      ) as unknown as Record<any, any>[]
      console.log('raw looker result: ',result)
      const formattedResult = formatResult(request,result)
      console.log('formatted result: ', formattedResult)
      return formattedResult;
    } catch (error) {
      console.log('Error invoking inline query', error)
    }
}

export const getModels = async (core40SDK: any) => {
  console.log('in get model')
  try {
    const result = await core40SDK.ok(
      core40SDK.all_lookml_models({fields:['name', 'has_content', 'explores']})
    ) as unknown as Record<any, any>[]
    const list = result.filter( (record: any) => record.has_content && record.explores.length > 0)
    console.log(list.map( (item:any) => item.name))
  } catch (error) {
    console.log('Error getting models', error)
  }
}


function formatResult(request:any, raw: any): any[] {

let formatted:any;
let data;
// debugger;
console.log('raw',raw)
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
const pivotFields = raw.pivots? Object.keys(data[0]).filter( (key, i) => i >= raw.fields.dimensions.length): [];
console.log('pivot fields ',pivotFields)
formatted = {
  success: true,
  rows: data,
  lastRow: getLastRowIndex(request, raw),
  pivotFields 
}
formatted.rows.forEach( (record:any) => {
  
  pivotFields.forEach(field => {
    if (record[field] != null  && isInteger(record[field])) {
      record[field] = record[field].toLocaleString("en-US")
    } else if ( record[field] && !isInteger(record[field]) ) {
      record[field] = `${parseFloat(record[field]).toLocaleString("en-US", {style:"currency", currency:"USD"})}`
    } else {
      record[field] = '0'
    }
  })
})

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
        field = field.substring(field.indexOf('.')+1).replace(/_/g, '-')
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

//** Looker Queries */

function buildLookerQuery(request: any) {

  const pivots = request.pivotCols.map( (item: any) => {
    const prefix = item.id.includes('created')? 'order_items': 'inventory_items';
    return `${prefix}.${item.id}`
  });
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
  const pivotCols = request.pivotCols;

  if (groupKeys.length > 0 || pivotCols.length > 0) {
    const dims = [];
    for (let i=0; i <= groupKeys.length; i++) {
      const prefix = groupKeys.includes('created')? 'order_items': 'inventory_items'
      dims.push(`${prefix}.${rowGroupCols[i].id}`)
    }
    console.log('dim fields: ', dims)
    const measures = valueCols.map( (item: any) => `${'inventory_items'}.${item.id.replace(/-/g,'_')}`); 
    const pivots = pivotCols.map( (item: any) => {
      const prefix = item.id.includes('created')? 'order_items': 'inventory_items';
      return `${prefix}.${item.id}`
    });
    console.log('fields', [...dims, ...pivots,...measures]) 
    return [...dims,...pivots, ...measures];
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