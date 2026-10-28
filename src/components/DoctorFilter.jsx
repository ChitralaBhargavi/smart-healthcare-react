// Controlled-input pattern: the input's value is driven by React state
// (searchTerm/specialization live in the PARENT), and every keystroke
// calls back up via onSearchChange / onSpecializationChange.
// This is the React equivalent of addEventListener('input', ...) + DOM filtering.
export default function DoctorFilter({
  searchTerm,
  onSearchChange,
  specialization,
  onSpecializationChange,
  specializations,
}) {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-6">
        <label className="form-label small fw-bold">Search Doctor</label>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label small fw-bold">Specialization</label>
        <select
          className="form-select"
          value={specialization}
          onChange={(e) => onSpecializationChange(e.target.value)}
        >
          <option value="All">All Specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
