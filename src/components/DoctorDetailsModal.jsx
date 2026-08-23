// A simple modal built with Bootstrap's modal CSS classes, but shown/hidden
// using React state (the `doctor` prop) instead of Bootstrap's data-bs-toggle.
// This is the React way: UI = function(state), not manual DOM show/hide.
export default function DoctorDetailsModal({ doctor, onClose }) {
  if (!doctor) return null // nothing selected -> render nothing

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Doctor Details</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body d-flex gap-3">
              <img
                src={`https://placehold.co/120x120/E8F0FE/2F6FED?text=${encodeURIComponent(doctor.name.split(' ')[1] || 'Dr')}`}
                alt={doctor.name}
                className="rounded"
                width="100"
                height="100"
              />
              <div>
                <h6 className="fw-bold mb-0">{doctor.name}</h6>
                <p className="text-primary small mb-1">{doctor.specialization}</p>
                <p className="small mb-1">⭐ {doctor.rating} Rated</p>
                <ul className="list-unstyled small mb-0">
                  <li><strong>Experience:</strong> {doctor.experience}+ Years</li>
                  <li><strong>Qualification:</strong> {doctor.qualification}</li>
                  <li><strong>Hospital:</strong> {doctor.hospital}</li>
                  <li><strong>Available Days:</strong> {doctor.availableDays}</li>
                  <li><strong>Available Time:</strong> {doctor.availableTime}</li>
                  <li><strong>Consultation Fee:</strong> ₹{doctor.fee}</li>
                </ul>
                <p className="small text-secondary mt-2 mb-0">{doctor.about}</p>
              </div>
            </div>
            <div className="modal-footer">
              <a href={`/appointments?doctorId=${doctor.id}`} className="btn btn-primary">
                Book Appointment
              </a>
              <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {/* backdrop */}
      <div className="modal-backdrop show"></div>
    </>
  )
}
