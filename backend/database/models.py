import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database.db import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True)
    name = Column(String, nullable=True) # Anonymized default
    age = Column(Integer)
    village = Column(String, default="Rampur")
    district = Column(String, default="Lucknow")
    pincode = Column(String, default="226001")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessments = relationship("Assessment", back_populates="patient")
    referrals = relationship("Referral", back_populates="patient")
    followups = relationship("FollowUp", back_populates="patient")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Demographic & Body
    age = Column(Integer)
    height_cm = Column(Float, default=158.0)
    weight_kg = Column(Float, default=55.0)
    bmi = Column(Float)
    weight_gain = Column(Boolean, default=False)

    # Menstrual
    cycle_length = Column(String) # <21, 21-35, >35, Varies
    cycle_regularity = Column(String) # Regular, Irregular, Missed
    symptom_duration = Column(String) # <1mo, 1-3mo, 3-6mo, >6mo

    # PCOS symptoms
    facial_hair = Column(Boolean, default=False)
    acne = Column(Boolean, default=False)
    hair_loss = Column(Boolean, default=False)
    dark_skin = Column(Boolean, default=False)

    # Medical & History
    thyroid = Column(String, default="No")
    diabetes = Column(String, default="No")
    family_pcos = Column(String, default="No")
    existing_pcos_diagnosis = Column(String, default="Not diagnosed")

    # Lifestyle
    fast_food = Column(String, default="Rarely")
    exercise = Column(String, default="Occasionally")
    diet_quality = Column(String, default="Adequate daily meals")

    # GI & Safety
    diarrhea = Column(Boolean, default=False)
    stomach_pain = Column(Boolean, default=False)
    vomiting = Column(Boolean, default=False)
    bloating = Column(Boolean, default=False)
    blood_in_stool = Column(Boolean, default=False)
    pain_severity = Column(Integer, default=1)
    pain_location = Column(String, default="None")
    wellbeing = Column(String, default="Calm / Stable")

    # Engine Outputs
    risk_probability = Column(Float)
    risk_category = Column(String)
    triage_level = Column(String) # LEVEL 1, LEVEL 2, LEVEL 3
    red_flag_triggered = Column(Boolean, default=False)
    reasons_json = Column(Text) # JSON string of plain language reason cards
    submitted_by_role = Column(String, default="ASHA") # ASHA or Patient

    patient = relationship("Patient", back_populates="assessments")

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    referral_date = Column(DateTime, default=datetime.datetime.utcnow)
    facility_name = Column(String, default="Ayushman Arogya Mandir - Rampur")
    facility_type = Column(String, default="Ayushman Arogya Mandir")
    status = Column(String, default="Pending") # Pending, Referred, Follow-up Due, Completed, Closed
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="referrals")

class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime, nullable=True)
    status = Column(String, default="Pending") # Pending, Overdue, Completed, Unable to Reach
    asha_notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="followups")

class HealthcareCenter(Base):
    __tablename__ = "healthcare_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String) # Ayushman Arogya Mandir, PHC, CHC, District Hospital
    village = Column(String)
    district = Column(String)
    pincode = Column(String)
    address = Column(String)
    distance_km = Column(Float, default=2.5)
    contact_number = Column(String)
    assigned_asha_name = Column(String, default="Sunita Devi (ASHA)")
    assigned_asha_phone = Column(String, default="+91 98765 43210")
    latitude = Column(Float, default=26.8467)
    longitude = Column(Float, default=80.9462)

class AshaUser(Base):
    __tablename__ = "asha_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    name = Column(String)
    center_name = Column(String)
    village = Column(String)
    phone = Column(String)
