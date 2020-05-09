//import libraries
import React, { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import { useMutation } from '@apollo/react-hooks'
import _ from 'lodash'

//import components
import Card from '../components/Card'
import Layout from '../components/Layout'
import Input from '../components/Input'
import NavLink from '../components/NavLink'

//import helpers
import { signupValidation } from '../helpers/formValidation'
import { SIGNUP_USER } from '../graphql/queries'

//import types
import {
  SignupFormProps,
  Values,
  ErrorDisplayProps
} from '../@types/signup'

const initialValues: Values = {
  email: '',
  username: '',
  password: '',
  firstName: '',
  lastName: ''
}

const ErrorMessage: React.FC<ErrorDisplayProps> = ({ signupErrors }) => {
  const errorMessages = signupErrors.map((message, idx) => {
    const formattedMessage = message.split(':')[1]
    return (
      <div key={idx} className="bg-light m-auto px-5 border-0">
        <h5 className="text-danger">
          {formattedMessage}
        </h5>
      </div>
    )
  })
  return (
    <>
      {errorMessages}
    </>
  )
}

const SignupSuccess: React.FC = () => (
  <Card success title="Account created successfully!">
    <NavLink path="/curriculum" className="btn btn-primary btn-lg mb-3">
      Continue to Curriculum
    </NavLink>
  </Card>
)

const SignupForm: React.FC<SignupFormProps> = ({
  signupErrors,
  handleSubmit
}) => {
  return (
    <Card title="Create Account">
      <ErrorMessage signupErrors={signupErrors} />
      <Formik
        validateOnBlur
        initialValues={initialValues}
        validationSchema={signupValidation}
        onSubmit={handleSubmit}
      >
        <Form data-testid="form">
          <div className="form-group ">
            <Field
              name="email"
              placeholder="Email address"
              type="email"
              data-testid="email"
              as={Input}
            />

            <Field
              name="username"
              placeholder="Username"
              data-testid="username"
              as={Input}
            />

            <Field
              name="password"
              placeholder="Password"
              type="password"
              data-testid="password"
              as={Input}
            />

            <Field
              name="firstName"
              placeholder="First name"
              data-testid="firstName"
              as={Input}
            />

            <Field
              name="lastName"
              placeholder="Last name"
              data-testid="lastName"
              as={Input}
            />

            <button
              className="btn btn-primary btn-lg btn-block mb-3"
              type="submit"
              data-testid="submit"
            >
              Create Account
            </button>
          </div>
        </Form>
      </Formik>
      <p className="text-black-50">
        Already have an account?{' '}
        <NavLink path="/login" className="text-primary">
          Login
        </NavLink>
      </p>
    </Card>
  )
}



const SignUpPage: React.FC = () => {
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [signupErrors, setSignupErrors] = useState([])
  const [signupUser] = useMutation(SIGNUP_USER)
  const handleSubmit = async (values: Values) => {
    try {
      const { data } = await signupUser({ variables: values })
      if (data.signup.success) {
        setSignupSuccess(true)
      }
    } catch (error) {
      const newSignupErrors = [...signupErrors]
      const graphQLErrors = _.get(error, 'graphQLErrors', [])
      const errorMessages = graphQLErrors.reduce((messages: any, error: any) => {
        return [...messages, error.message]
      }, newSignupErrors)
      setSignupErrors(Object.assign([], errorMessages))
    }
  }
  return <Signup handleSubmit={handleSubmit} isSuccess={signupSuccess} signupErrors={signupErrors} />
}

export const Signup: React.FC<SignupFormProps> = ({handleSubmit, isSuccess, signupErrors}) => {
  return (
    <Layout>
      {isSuccess ? (
        <SignupSuccess />
      ) : (
        <SignupForm handleSubmit={handleSubmit} signupErrors={signupErrors} />
      )}
    </Layout>
  )
}

export default SignUpPage
