import React from "react";
import { getCoreSDK, getCoreSDK2 } from '@looker/extension-sdk-react';
import { Looker40SDK, Looker31SDK} from '@looker/sdk';
import Select from "react-select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Button from "@material-ui/core/Button";
import {getModels} from '../services/looker';

interface IFormInput {
  firstName: string;
  lastName: string;
  iceCreamType: {label: string; value: string };
}

const Pivotcreator = () => {
  const core40SDK = getCoreSDK2<Looker40SDK>()
  const { control, handleSubmit } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = data => {
    console.log(data)
    getdata(core40SDK);
  };

  async function getdata(sdk:any) {
    await getModels(sdk);
  }

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
        name="iceCreamType"
        control={control}
        render={({ field }) => <Select 
          {...field} 
          options={[
            { value: "chocolate", label: "Chocolate" },
            { value: "strawberry", label: "Strawberry" },
            { value: "vanilla", label: "Vanilla" }
          ]} 
        />}
      />
      <br /><br />
      <InputLabel>
        Select Dimensions:
      </InputLabel>
      <br />
      <Controller
        name="iceCreamType"
        control={control}
        render={({ field }) => <Select 
          {...field} 
          options={[
            { value: "chocolate", label: "Chocolate" },
            { value: "strawberry", label: "Strawberry" },
            { value: "vanilla", label: "Vanilla" }
          ]} 
        />}
      />
      <br /><br />
      <Button variant="contained" type="submit" color="primary" >Submit</Button>
    </form>
  );
};

export default Pivotcreator