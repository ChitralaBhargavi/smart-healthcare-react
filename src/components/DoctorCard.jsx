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

        <div className="mt-auto d-flex gap-2">

          <button
            className="btn btn-sm btn-outline-primary w-50"
            onClick={() => onViewDetails(doctor)}
          >
            Details
          </button>

          <a
            href={`/appointments?doctorId=${doctor.id}`}
            className="btn btn-sm btn-primary w-50"
          >
            Book
          </a>

        </div>

      </div>
    </div>
  )
}