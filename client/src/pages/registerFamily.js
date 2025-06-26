"use client"

import { useState } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import axios from "axios"
import "./registerFamily.css"

export default function FamilyRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialValues = {
    //Family Demographics
    Name: "",
    Address: "",
    Contact: "",
    Email: "",
    
    //Household Composition
    NumChildren: "",
    NumSeniors: "",
    NumAdults: "",
    MedicalCondition: "no",
    SpecialNeeds: "",
    HouseIncome: "",
    EmploymentStatus:"unemployed",
    PreviousAid:"",
  }

  const validationSchema = Yup.object().shape({
    //Family Demographics validation
    Name: Yup.string().required("Family name is required"),
    Address: Yup.string().required("Address is required"),
    Contact: Yup.string().required("Contact number is required"),
    Email: Yup.string().email("Invalid email format"),
    
    //Household Composition validation
    NumChildren: Yup.number().integer().min(0, "Must be 0 or greater").required("Number of children is required"),
    NumSeniors: Yup.number().integer().min(0, "Must be 0 or greater").required("Number of elderly is required"),
    NumAdults: Yup.number().integer().min(0, "Must be 0 or greater").required("Number of adults is required"),
    MedicalCondition: Yup.string().required("Medical condition selection is required"),
    SpecialNeeds: Yup.string(),
    HouseIncome: Yup.number().integer(),
    EmploymentStatus: Yup.string(),
    PreviousAid: Yup.string(),
  })

  const onSubmit = async (data, { setSubmitting, resetForm }) => {
    setIsSubmitting(true)
    
    try {
      //Register family
      const familyData = {
        Name: data.Name,
        Address: data.Address,
        Contact: data.Contact,
        Email: data.Email,
      }

      const familyResponse = await axios.post("http://localhost:3001/FamilyTableRoute", familyData)
      console.log("Family registration successful")
      
      const createdFamily = familyResponse.data
      if (createdFamily && createdFamily.FamilyID) {
        //Register household composition with the returned FamilyID
        const householdData = {
          FamilyID: createdFamily.FamilyID,
          NumChildren: data.NumChildren,
          NumSeniors: data.NumSeniors,
          NumAdults: data.NumAdults,
          MedicalCondition: data.MedicalCondition === "yes",
          SpecialNeeds: data.SpecialNeeds,
          HouseIncome: data.HouseIncome,
          EmploymentStatus: data.EmploymentStatus,
          PreviousAid: data.PreviousAid
        }

        await axios.post("http://localhost:3001/HouseCompRoute", householdData)
        console.log("Household composition registration successful")
        
        alert(`Family registration completed successfully! Family ID: ${createdFamily.FamilyID}`)
        resetForm()
      } else {
        throw new Error("Family ID not returned from registration")
      }
    } catch (error) {
      console.error("Registration failed:", error)
      alert("Registration failed. Please try again.")
    } finally {
      setSubmitting(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-family-container">
      <h1>Register New Family</h1>
      <p className="form-description">Complete the form below to register a new family and assess their needs.</p>

      <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={validationSchema}>
        {({ values, setFieldValue, isSubmitting, resetForm }) => (
          <Form>
            {/*Family Demographics*/}
            <div className="form-section">
              <h2>Family Demographics</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Family Representative's Name</label>
                  <Field name="Name">
                    {({ field }) => <input {...field} type="text" placeholder="e.g., Dela Cruz" required />}
                  </Field>
                  <ErrorMessage
                    name="Name"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
                <div className="form-group">
                  <label>Primary Contact Phone</label>
                  <Field name="Contact">
                    {({ field }) => <input {...field} type="tel" placeholder="+63 123-456-7890" required />}
                  </Field>
                  <ErrorMessage
                    name="Contact"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
              </div>
              <div className="form-row">
              <div className="form-group">
                <label>Email Address (Optional)</label>
                <Field name="Email">
                  {({ field }) => <input {...field} type="email" placeholder="email@example.com" />}
                </Field>
                <ErrorMessage
                  name="Email"
                  component="div"
                  style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <Field name="Address">
                  {({ field }) => <input {...field} type="text" placeholder="6th Street" required />}
                </Field>
                <ErrorMessage
                  name="Address"
                  component="div"
                  style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                />
              </div>
              </div>
            </div>

            {/*Household Composition*/}
            <div className="form-section">
              <h2>Household Details</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Number of children (0-17)</label>
                  <Field name="NumChildren">
                    {({ field }) => <input {...field} type="number" min="0"  placeholder="0" required />}
                  </Field>
                  <ErrorMessage
                    name="NumChildren"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
                <div className="form-group">
                  <label>Number of elderly (65+)</label>
                  <Field name="NumSeniors">
                    {({ field }) => <input {...field} type="number" min="0" placeholder="0" required />}
                  </Field>
                  <ErrorMessage
                    name="NumSeniors"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Number of adults (18 - 64)</label>
                  <Field name="NumAdults">
                    {({ field }) => <input {...field} type="number" min="0" placeholder="0" required />}
                  </Field>
                  <ErrorMessage
                    name="NumAdults"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
                <div className="form-group">
                  <label>Any medical concerns?</label>
                  <Field name="MedicalCondition">
                    {({ field }) => (
                      <select {...field} required>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="MedicalCondition"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
              </div>
            </div>
            
            {/* Special Needs */}
            <div className="form-section">
              <h2>Special Needs / Disabilities (if any)</h2>
              <div className="form-group">
                <Field name="SpecialNeeds">
                  {({ field }) => (
                    <textarea
                      {...field}
                      placeholder="Detail any special needs or disabilities within the family..."
                      rows="3"
                    />
                  )}
                </Field>
                <ErrorMessage
                  name="SpecialNeeds"
                  component="div"
                  style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                />
              </div>
            </div>

          {/* Financial Information */}
          <div className="form-section">
            <h2>Financial Information</h2>
            <div className="form-row">
              <div className="form-group">
                  <label>Employment Status</label>
                  <Field name="EmploymentStatus">
                    {({ field }) => (
                      <select {...field} required>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Employed">Employed</option>
                      </select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="EmploymentStatus"
                    component="div"
                    style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                  />
                </div>
              <div className="form-group">
                <label>Monthly Household Income</label>
                <Field name="HouseIncome">
                  {({ field }) => <input {...field} type="text" placeholder="Enter amount" required />}
                </Field>
                <ErrorMessage
                  name="HouseIncome"
                  component="div"
                  style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
                />
              </div>
            </div>
          </div>

          {/* Previous Aid History */}
          <div className="form-section">
            <h2>Previous Aid History / Notes</h2>
            <div className="form-group">
              <Field name="PreviousAid">
                {({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Provide details of any past aid received or relevant financial notes..."
                    rows="3"
                  />
                )}
              </Field>
              <ErrorMessage
                name="PreviousAid"
                component="div"
                style={{ color: "#e74c3c", fontSize: "11px", marginTop: "5px" }}
              />
            </div>
          </div>

            {/* Buttons */}
            <div className="form-actions">
              <button type="button" className="reset-button" onClick={() => resetForm()}>
                Reset Form
              </button>
              <button type="submit" className="submit-button" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Register Family"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}