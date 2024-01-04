import { useState } from "react";
export const useForm = (initState) => {
  const [formData, setState] = useState(initState);
  const onChange = (e) => {
    setState({ ...formData, [e.target.name]: e.target.value });
  };
  return {
    formData,
    onChange,
  };
};
