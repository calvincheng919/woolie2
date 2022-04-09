export interface IinlineQueryResult {
  success?: boolean;
  rows?: any;
  lastRow?: number;
  pivotFields?: any;
}

export interface IColConfig {
  headerName?: string
  field: string;
  minWidth?: number;
  rowGroup?: boolean;
  pivot?: boolean;
  aggFunc?: string;
  hide?: boolean;
}

export interface IGridProps {
  [key: string]: IColConfig
}


interface IFieldItems {
  label: string;
  value: string;
}

interface IFields {
  [key: string]: IFieldItems
}
export interface IFormInput {
  models?: { label: string; value: string };
  views?: { label: string; value: string };
  dimensions?: IFields;
  pivots?: IFields;
  measures?: IFields;
}