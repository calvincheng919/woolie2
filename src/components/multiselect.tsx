import React from "react";

import Select from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

export default function AnimatedMulti() {
  const colorOptions = [
    { value: "red", label: "Red" },
    { value: "green", label: "Green" },
    { value: "yellow", label: "Yellow" },
    { value: "blue", label: "Blue" },
    { value: "orange", label: "Orange" },
    { value: "purple", label: "Purple" },
  ];
  return (
    <Select
      closeMenuOnSelect={false}
      components={animatedComponents}
      defaultValue={[colorOptions[4], colorOptions[5]]}
      isMulti
      options={colorOptions}
    />
  );
}
