// Shown when `appointment` is not null. Same "state controls visibility"
// pattern as DoctorDetailsModal.
export default function AppointmentConfirmation({ appointment, onClose }) {
  if (!appointment) return null

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center p-4">
            <div className="mb-2" style={{ fontSize: '2.5rem' }}>✅</div>
            <h5 className="fw-bold">Appointment Confirmed</h5>
            <p className="text-secondary small mb-3">Your appointment has been booked.</p>

            <table className="table table-sm text-start">
              <tbody>
                <tr><th>Patient</th><td>{appointment.patientName}</td></tr>
                <tr><th>Doctor</th><td>{appointment.doctorName}</td></tr>
                <tr><th>Department</th><td>{appointment.specialization}</td></tr>
                <tr><th>Date</th><td>{appointment.date}</td></tr>
                <tr><th>Time</th><td>{appointment.time}</td></tr>
                <tr><th>Status</th><td><span className="badge bg-success">{appointment.status}</span></td></tr>
              </tbody>
            </table>

            <button className="btn btn-primary mt-2" onClick={onClose}>
              View My Appointments
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  )
}