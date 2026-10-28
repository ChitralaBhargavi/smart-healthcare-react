export default function DoctorCard({ doctor, onViewDetails }) {
  return (
    <div className="card doctor-card h-100">

      <img
        src={`/images/${doctor.image}`}
        className="card-img-top doctor-image"
        alt={doctor.name}
      />

      <div className="card-body d-flex flex-column">

        <h6 className="fw-bold mb-0">
          {doctor.name}
        </h6>

        <p className="small text-primary mb-1">
          {doctor.specialization}
        </p>

        <p className="small text-secondary mb-2">
          {doctor.experience}+ Yrs Exp &nbsp;•&nbsp; ⭐ {doctor.rating}
        </p>

        <p className="small text-secondary mb-3">
          Fee: ₹{doctor.fee}
        </p>

        <p className={`small mb-3 ${doctor.isAvailable === false ? 'text-danger' : 'text-success'}`}>
          {doctor.isAvailable === false
            ? 'Not accepting appointments'
            : doctor.availabilitySchedule?.length
              ? `Accepting appointments: ${doctor.availabilitySchedule.map((entry) => entry.day.slice(0, 3)).join(', ')}`
              : `Available: ${doctor.availableDays} · ${doctor.availableTime}`}
        </p>

        <div className="mt-auto d-flex gap-2">

          <button
            className="btn btn-sm btn-outline-primary w-50"
            onClick={() => onViewDetails(doctor)}
          >
            Details
          </button>

          {doctor.isAvailable === false ? (
            <span className="btn btn-sm btn-secondary w-50 disabled">Unavailable</span>
          ) : (
            <a href={`/appointments?doctorId=${doctor._id || doctor.legacyId || doctor.id}`} className="btn btn-sm btn-primary w-50">
              Book
            </a>
          )}

        </div>

      </div>
    </div>
  )
}