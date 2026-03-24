import React, { useEffect, useState } from 'react';
import { patientService } from '../services/patientService';

const PatientSelector = ({ onSelect }) => {
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

  const handleSelect = (patient) => {
    onSelect(patient);
  };

  if (loading) return <div>Loading patients...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3>Select a Patient</h3>
      <ul>
        {patients.map((patient) => (
          <li key={patient.id} onClick={() => handleSelect(patient)}>
            {patient.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientSelector;