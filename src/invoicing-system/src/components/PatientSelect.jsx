import React, { useEffect, useState } from 'react';
import { patientService } from '../services/patientService';

const PatientSelect = ({ onSelect }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAllPatients();
        setPatients(data);
      } catch (err) {
        setError(err.message || 'Error fetching patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) return <p>Loading patients...</p>;
  if (error) return <p>{error}</p>;

  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="">Select a patient</option>
      {patients.map((patient) => (
        <option key={patient.id} value={patient.id}>
          {patient.name}
        </option>
      ))}
    </select>
  );
};

export default PatientSelect;