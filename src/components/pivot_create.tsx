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

interface IFormInput {
  firstName: string;
  lastName: string;
  models: { label: string; value: string };
  views: { label: string; value: string };
  dimensions: { label: string[]; value: string[] };
  pivots: { label: string[]; value: string[] };
  measures: { label: string[]; value: string[] };
}

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

  const colorOptions = [
    { value: "red", label: "Red" },
    { value: "green", label: "Green" },
    { value: "yellow", label: "Yellow" },
    { value: "blue", label: "Blue" },
    { value: "orange", label: "Orange" },
    { value: "purple", label: "Purple" },
  ];

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

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log("form data", data);
    // getdata(core40SDK);
  };

  const handleChange = async (e: any, field: any) => {
    console.log(field.name);
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
          console.log(fields);
        })
        .catch((err) => console.log(err));
      // getUIFields(core40SDK);
    }

    field.onChange({ value: e.value, label: e.label });
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputLabel>First Name:</InputLabel>
        <Controller
          name="firstName"
          control={control}
          defaultValue=""
          render={({ field }) => <Input {...field} />}
        />
        <br />
        <br />
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
            name="views"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                closeMenuOnSelect={false}
                components={animatedComponents}
                defaultValue={[colorOptions[4], colorOptions[5]]}
                isMulti
                options={colorOptions}
              />
            )}
          />

          <InputLabel>Select Measures:</InputLabel>
          <br />
          <Controller
            name="views"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                closeMenuOnSelect={false}
                components={animatedComponents}
                defaultValue={[colorOptions[4], colorOptions[5]]}
                isMulti
                options={colorOptions}
              />
            )}
          />
        </div>
        <Button variant="contained" type="submit" color="primary">
          Submit
        </Button>
      </form>
      <AGGrid />
    </>
  );
};

export default Pivotcreator