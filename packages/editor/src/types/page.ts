/** Page layout computation types */

export interface PageDimensions {
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export interface PageLayout {
  headerHeight: number;
  footerHeight: number;
  bodyHeight: number;
  contentWidth: number;
}

export interface BlockMeasurement {
  nodeKey: string;
  height: number;
  type: string;
}

export interface PageAssignment {
  pageIndex: number;
  blockKeys: string[];
  totalHeight: number;
}
