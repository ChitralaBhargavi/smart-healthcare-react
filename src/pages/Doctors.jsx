import { useState, useEffect, useMemo } from 'react'
import DoctorCard from '../components/DoctorCard.jsx'
import DoctorFilter from '../components/DoctorFilter.jsx'
import DoctorDetailsModal from '../components/DoctorDetailsModal.jsx'
import { apiRequest } from '../utils/api.js'

export default function Doctors() {
  // ---- state ----
  const [doctors, setDoctors] = useState([])       // holds the fetched JSON data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [specialization, setSpecialization] = useState('All')
  const [selectedDoctor, setSelectedDoctor] = useState(null) // drives the modal

  // ---- Fetch API + JSON (this is the React version of Phase 5) ----
  // useEffect with an empty dependency array [] means "run once, when the
  // component first mounts" — the React equivalent of window.onload.
  useEffect(() => {
    apiRequest('/doctors')
      .then((data) => {
        setDoctors(data.doctors || data)
        setLoading(false)
      })
      .catch((err) => {
        setError('Unable to load doctor information. Please try again later.')
        setLoading(false)
        console.error(err)
      })
  }, [])

  // ---- derive the specialization list from the data itself ----
  const specializations = useMemo(
    () => [...new Set(doctors.map((d) => d.specialization))],
    [doctors]
  )

  // ---- filtering logic (recomputed whenever inputs change) ----
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSpecialization =
        specialization === 'All' || doc.specialization === specialization
      return matchesSearch && matchesSpecialization
    })
  }, [doctors, searchTerm, specialization])

  return (
    <section className="py-5">
      <div className="container">
        <h3 className="fw-bold mb-4">Our Doctors</h3>

        <DoctorFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          specialization={specialization}
          onSpecializationChange={setSpecialization}
          specializations={specializations}
        />

        {loading && <p className="text-secondary">Loading doctors…</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && filteredDoctors.length === 0 && (
          <div className="alert alert-warning">
            No doctors found for the selected specialization.
          </div>
        )}

        <div className="doctor-grid">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewDetails={setSelectedDoctor}
            />
          ))}
        </div>
      </div>

      <DoctorDetailsModal
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      />
    </section>
  )
}
