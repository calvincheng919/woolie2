import React, { useState, useEffect } from "react";
import { getCoreSDK2 } from '@looker/extension-sdk-react';
import { Looker40SDK} from '@looker/sdk';
import Select from "react-select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Button from "@material-ui/core/Button";
import {getModels, getViews} from '../services/looker';

interface IFormInput {
  firstName: string;
  lastName: string;
  models: {label: string; value: string };
  views: {label: string; value: string};
  dimensions: {label: string; value: string };
}

const Pivotcreator = () => {
  const core40SDK = getCoreSDK2<Looker40SDK>()
  const { control, handleSubmit } = useForm<IFormInput>();
  const [models, setModels] = useState<any | null>(null)
  const [views, setViews] = useState<any | null>(null)

  useEffect( () => {
    getModels(core40SDK) 
      .then( (options:any) => {
        setModels(options)
        }
      )
      .catch((error)=> {
        console.log(error)
      })
  }, [])

  const onSubmit: SubmitHandler<IFormInput> = data => {
    console.log(data)
    // getdata(core40SDK);
  };
  const handleChange = ( async (data:any) => {
    console.log(data.value)
    const viewOptions = await getViews(core40SDK, data.value)
    setViews(viewOptions);
  })


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputLabel >
        First Name:
      </InputLabel>
      <Controller
        name="firstName"
        control={control}
        defaultValue=""
        render={({ field }) => <Input {...field} />}
      />
      <br /><br />
      <InputLabel>
        Select a Model:
      </InputLabel>
      <br />
      <Controller
        name="models"
        control={control}
        render={({ field }) => <Select 
          {...field}
          onChange={handleChange} 
          options={models} 
        />}
      />
      <br /><br />
      <InputLabel>
        Select Dimensions:
      </InputLabel>
      <br />
      <Controller
        name="dimensions"
        control={control}
        render={({ field }) => <Select 
          {...field} 
          options={views} 
        />}
      />
      <br /><br />
      <Button variant="contained" type="submit" color="primary" >Submit</Button>
    </form>
  );
};

export default Pivotcreator