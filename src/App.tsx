// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
  * This is a sample Looker Extension written in typescript and React. It imports one component, <HelloWorld>.
  * HelloWorld makes a simple call to the Looker API using the Extension Framework's built in authentication,
  * and returns the logged in user.
*/
import React from 'react'
import { ExtensionProvider2 } from '@looker/extension-sdk-react'
import { hot } from 'react-hot-loader/root'
import { HelloWorld } from './HelloWorld'
import { Looker40SDK } from '@looker/sdk'
import AGGrid from './components/serverside_grid'
import LookerData from './context/LookerContext'

const initialParams = {
  groupKeys: [],
  pivotCols: [{id: 'department', aggFunc: undefined, displayName: 'Department', field: 'department'}],
  pivotMode: true,
  rowGroupCols: [
    {id: 'category', aggFunc: undefined, displayName: 'Category', field: 'category'},
    {id: 'brand', aggFunc: undefined, displayName: 'Brand', field: 'brand'},
    {id: 'name', aggFunc: undefined, displayName: 'Name', field: 'name'},
  ],
  valueCols: [
    {id: 'count-products', aggFunc: 'sum', displayName: 'Count', field: 'count-products'},
    {id: 'total-retail-price', aggFunc: 'sum', displayName: 'Total Retail Price', field: 'total-retail-price'},
  ]
}


export const App = hot(() => (
  <ExtensionProvider2 type={Looker40SDK}>
    <LookerData initialParams={initialParams} >
      <AGGrid />
    </LookerData>
  </ExtensionProvider2>
))
