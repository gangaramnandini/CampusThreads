import { useState } from 'react';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Form1 from './Form1';
import Form2 from './Form2';

import useForm from '../../hooks/useForm';
import { useAuth } from '../../contexts/auth-context';
import { signupFormValidator } from '../../utils/validator';

const SignupForm = () => {
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [userData, setUserData] = useState({
    user: null,
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  // eslint-disable-next-line camelcase
  const validateEmail = useMutation(
    ({
      email,
      name,
      organization,
      department,
      // eslint-disable-next-line camelcase
      academic_year,
      // eslint-disable-next-line camelcase
      roll_number,
    }) => {
      return axios.post('/api/auth/signup/validate-email', {
        email,
        name,
        organization,
        department,
        // eslint-disable-next-line camelcase
        academic_year,
        // eslint-disable-next-line camelcase
        roll_number,
      });
    }
  );

  // ALL fields now included for createUser:
  const createUser = useMutation((data) => {
    return axios.post('/api/auth/signup/create-user', data);
  });

  const { validateForm1, validateForm2 } = signupFormValidator;

  const form1 = useForm({
    initialValues: {
      name: '',
      email: '',
      organization: '',
      department: '',
      // eslint-disable-next-line camelcase
      academic_year: '',
      // eslint-disable-next-line camelcase
      roll_number: '',
    },
    validate: validateForm1,
    onSubmit: async (values) => {
      setUserData({ user: values });
      validateEmail.mutate(values, {
        onSuccess: () => {
          setActiveFormIndex((prevIndex) => prevIndex + 1);
        },
        onError: (err) => {
          const error = err.response?.data?.errors || err.response?.data.error;
          if (Array.isArray(error)) {
            const errors = error.reduce((acc, cur) => {
              acc[cur.param] = cur.msg;
              return acc;
            }, {});
            form1.setMultipleFieldsError(errors);
          }
        },
      });
    },
  });

  const form2 = useForm({
    initialValues: {
      password: '',
    },
    validate: validateForm2,
    onSubmit: async (values) => {
      if (!userData.user) return;
      createUser.mutate(
        {
          ...userData.user, // All previous fields from Form1
          password: values.password, // Password from Form2
        },
        {
          onSuccess: (response) => {
            login(
              response.data.user,
              response.data.accessToken,
              response.data.expiresAt
            );
            navigate('success');
          },
          onError: (err) => {
            const error =
              err.response?.data?.errors || err.response?.data?.error;
            if (Array.isArray(error)) {
              const errors = error.reduce((acc, cur) => {
                acc[cur.param] = cur.msg;
                return acc;
              }, {});
              form2.setMultipleFieldsError(errors);
            }
          },
        }
      );
    },
  });

  const renderForm = (formIndex) => {
    switch (formIndex) {
      case 0:
        return <Form1 formData={form1} isLoading={validateEmail.isLoading} />;
      case 1:
        return <Form2 formData={form2} isLoading={createUser.isLoading} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-[calc(100%_-_70px)] w-full z-20 sm:w-[500px] sm:h-[500px] p-6">
      {renderForm(activeFormIndex)}
    </div>
  );
};

export default SignupForm;
