import React, { useState, useEffect } from "react";
import { getCoreSDK2 } from '@looker/extension-sdk-react';
import { Looker40SDK} from '@looker/sdk';
import AGGrid from "./serverside_grid";
import Select from "react-select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Button from "@material-ui/core/Button";
import { getModels, getUIFields } from "../services/looker";
import AnimatedMulti from "./multiselect";
import makeAnimated from "react-select/animated";
import {
  IFormInput,
  IGridProps,
  IinlineQueryResult,
} from "../types/IProjectTypes";

const Pivotcreator = () => {
  const core40SDK = getCoreSDK2<Looker40SDK>();
  const { control, handleSubmit } = useForm<IFormInput>();
  const [models, setModels] = useState<any | null>(null);
  const [views, setViews] = useState<any | null>(null);
  const [rawListModelsExplores, setRawListModelsExplores] = useState<
    any | null
  >(null);
  const [selectedModel, setSelectedModel] = useState<any | null>(null);
  const [selectedExplore, setSelectedExplore] = useState<any | null>(null);
  const [dimensions, setDimensions] = useState<any | null>(null);
  const [measures, setMeasures] = useState<any | null>(null);
  const [colConfig, setColConfig] = useState<any | null>(null); 
  const animatedComponents = makeAnimated();

  useEffect(() => {
    getModels(core40SDK)
      .then((list: any) => {
        setRawListModelsExplores(list);
        const formattedList = list.map((item: any) => {
          return { value: item.name, label: item.label };
        });
        setModels(formattedList);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const onSubmit: SubmitHandler<IFormInput> = (data: any) => {
    let gridColsConfig: any = []
    console.log(data)

    data.dimensions?.forEach( (dim:any) => {
      const arr = data.pivots
      for( var i = 0; i < arr.length; i++){ 
        if ( arr[i].value !== dim.value) { 
          gridColsConfig.push({headerName: dim.label, field: dim.value.substring(dim.value.indexOf('.')+1),minWidth: 220, rowGroup: true })
        }
      }
    })
    data.measures.forEach( (meas:any) => gridColsConfig.push({headerName:meas.label, field: meas.value.substring(meas.value.indexOf('.')+1).replace(/_/g, '-'), aggFunc: 'sum', minWidth: 220 })); 
    data.pivots?.forEach( (piv:any) => gridColsConfig.push({headerName:piv.label, field: piv.value.substring(piv.value.indexOf('.')+1), minWidth: 220, pivot: true})); 
    setSelectedModel(data.models.value);
    setSelectedExplore(data.views.value);
    setColConfig(gridColsConfig);
  };

  const handleChange = async (e: any, field: any) => {
    if (field.name === "models") {
      const viewOptions = rawListModelsExplores
        .filter((item: any) => {
          return item.name === e.value;
        })[0]
        .explores.map((explore: any) => {
          return { value: explore.name, label: explore.label };
        });
      setSelectedModel(e.value);
      setViews(viewOptions);
    } else if (field.name === "views") {
      console.log("view", e.value);
      setSelectedExplore(e.value);
      const modelParams = { model: selectedModel, explore: e.value };
      console.log("model params", modelParams);
      getUIFields(core40SDK, modelParams)
        .then((fields) => {
          console.log('UI fields: ', fields);
          setDimensions(fields?.dims);
          setMeasures(fields?.measures);
        })
        .catch((err) => console.log(err));
    }
    field.onChange({ value: e.value, label: e.label });
  };

 
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputLabel>Select a Model:</InputLabel>
        <br />
        <Controller
          name="models"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              onChange={(e) => handleChange(e, field)}
              options={models}
            />
          )}
        />
        <br />
        <br />
        <InputLabel>Select Explore (View):</InputLabel>
        <br />
        <Controller
          name="views"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              onChange={(e) => handleChange(e, field)}
              options={views}
            />
          )}
        />
        <br />
        <br />
        <div>
          <InputLabel>Select Dimensions:</InputLabel>
          <br />
          <Controller
            name="dimensions"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                onChange={field.onChange}
                options={dimensions}
              />
            )}
          />

          <InputLabel>Select Measures:</InputLabel>
          <br />
          <Controller
            name="measures"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                onChange={field.onChange}
                options={measures}
              />
            )}
          />
          <InputLabel>Pivot on Dimensions:</InputLabel>
          <br />
          <Controller
            name="pivots"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                closeMenuOnSelect={false}
                components={animatedComponents}
                isMulti
                onChange={field.onChange}
                options={dimensions}
              />
            )}
          />
        </div>
        <Button variant="contained" type="submit" color="primary">
          Submit
        </Button>
      </form>
      {selectedModel && selectedExplore && colConfig
        ? <AGGrid colConfig = {colConfig} model={selectedModel} view={selectedExplore}/>
        : <div><h1>Grid PlaceHolder</h1></div>
      }
    </>
  );
};

export default Pivotcreator