import PropTypes from 'prop-types';

import Button from '../Button';
import TextInput from '../TextInput';

const Form1 = ({ formData, isLoading }) => {
  // Debug: See if the values actually update as you type/select
  console.log('values:', formData.values);

  return (
    <form className="h-full relative" onSubmit={formData.handleSubmit}>
      <div className="mb-6">
        <h1 className="text-on-surface text-3xl font-bold">
          Create your account
        </h1>
      </div>

      <div className="mb-4">
        <TextInput
          id="name"
          name="name"
          label="Name"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.name || ''}
          error={formData.touched.name ? formData.errors.name : ''}
        />
      </div>

      <div className="mb-4">
        <TextInput
          id="email"
          name="email"
          label="Email"
          type="email"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.email || ''}
          error={formData.touched.email ? formData.errors.email : ''}
        />
      </div>

      <div className="mb-4">
        <TextInput
          id="organization"
          name="organization"
          label="Organization"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.organization || ''}
          error={
            formData.touched.organization ? formData.errors.organization : ''
          }
        />
      </div>

      <div className="mb-4">
        <label htmlFor="department" className="label">
          Department
        </label>
        <select
          id="department"
          name="department"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.department || ''}
          className="input"
        >
          <option value="">Select department</option>
          <option value="CSE">CSE</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
          <option value="IT">IT</option>
          <option value="CSE (AI&ML)">CSE (AI&ML)</option>
          <option value="CSE (Data Science)">CSE (Data Science)</option>
        </select>
        {formData.touched.department && formData.errors.department && (
          <span className="text-red-500 text-xs">
            {formData.errors.department}
          </span>
        )}
      </div>

      <div className="mb-4">
        <TextInput
          id="academic_year"
          name="academic_year"
          label="Academic Year"
          type="number"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.academic_year || ''}
          error={
            formData.touched.academic_year ? formData.errors.academic_year : ''
          }
        />
      </div>

      <div className="mb-4">
        <TextInput
          id="roll_number"
          name="roll_number"
          label="Roll Number"
          onFocus={formData.handleFocus}
          onBlur={formData.handleBlur}
          onChange={formData.handleChange}
          value={formData.values.roll_number || ''}
          error={
            formData.touched.roll_number ? formData.errors.roll_number : ''
          }
        />
      </div>

      <div className="w-full">
        <Button type="submit" isLoading={isLoading}>
          Continue
        </Button>
      </div>
    </form>
  );
};

Form1.propTypes = {
  formData: PropTypes.shape({
    handleFocus: PropTypes.func.isRequired,
    handleBlur: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.shape({
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      organization: PropTypes.string,
      department: PropTypes.string,
      academic_year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      roll_number: PropTypes.string,
    }),
    touched: PropTypes.shape({
      name: PropTypes.bool.isRequired,
      email: PropTypes.bool.isRequired,
      organization: PropTypes.bool,
      department: PropTypes.bool,
      academic_year: PropTypes.bool,
      roll_number: PropTypes.bool,
    }),
    errors: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      organization: PropTypes.string,
      department: PropTypes.string,
      academic_year: PropTypes.string,
      roll_number: PropTypes.string,
    }),
  }).isRequired,
  isLoading: PropTypes.bool,
};

Form1.defaultProps = {
  isLoading: false,
};

export default Form1;
