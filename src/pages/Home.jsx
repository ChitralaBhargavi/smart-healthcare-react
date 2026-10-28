export default function Home() {
  return (
    <>
      {/* HERO */}
      <header className="hero">
        <div className="container">
          <div className="row align-items-center gy-4">
            <div className="col-lg-6">
              <h1 className="display-5 fw-bold">
                Your <span className="text-primary">Health</span>, Our Priority
              </h1>

              <p className="lead text-secondary">
                Find the right doctor, book appointments easily and manage
                your healthcare journey with SmartCare.
              </p>

              <div className="mt-4">
                <a href="/doctors" className="btn btn-primary me-2">
                  Find a Doctor
                </a>

                <a href="/appointments" className="btn btn-outline-primary">
                  Book Appointment
                </a>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <div className="hero-image-wrap">
                <img
                  src="https://placehold.co/420x420/E8F0FE/2F6FED?text=SmartCare"
                  alt="SmartCare healthcare"
                  className="img-fluid rounded-circle hero-image"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ABOUT SMARTCARE */}
      <section id="about" className="py-5 bg-light">
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">About SmartCare</h2>

            <p className="text-secondary">
              A simple and convenient healthcare appointment platform
              designed to connect patients with healthcare professionals.
            </p>
          </div>

          <div className="row gy-4">
            <div className="col-lg-6">
              <h4 className="fw-bold mb-3">
                What is SmartCare?
              </h4>

              <p className="text-secondary">
                SmartCare is a Smart Healthcare Appointment System that helps
                patients discover doctors, explore their professional
                information, filter doctors by specialization, and book
                appointments easily.
              </p>

              <p className="text-secondary">
                The platform provides a simple and user-friendly interface
                that brings important healthcare appointment services
                together in one place.
              </p>
            </div>

            <div className="col-lg-6">
              <h4 className="fw-bold mb-3">
                What can SmartCare do?
              </h4>

              <p className="text-secondary">
                Patients can search for doctors, view doctor profiles,
                select a suitable healthcare professional, and schedule
                appointments through the application.
              </p>

              <p className="text-secondary">
                SmartCare is developed as a frontend-focused academic
                project using HTML5, CSS3, Bootstrap 5, JavaScript,
                and React.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR SERVICES */}
      <section id="services" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Our Services</h2>

            <p className="text-secondary">
              SmartCare provides essential healthcare services in one
              convenient platform.
            </p>
          </div>

          <div className="row g-4">

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    👨‍⚕️
                  </div>

                  <h5 className="fw-bold">
                    Find Doctors
                  </h5>

                  <p className="text-secondary">
                    Discover healthcare professionals available on
                    the SmartCare platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    🔍
                  </div>

                  <h5 className="fw-bold">
                    Search and Filter
                  </h5>

                  <p className="text-secondary">
                    Search and filter doctors according to their
                    specialization and available information.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    📋
                  </div>

                  <h5 className="fw-bold">
                    Doctor Profiles
                  </h5>

                  <p className="text-secondary">
                    View doctor information, specialization and
                    professional details.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    📅
                  </div>

                  <h5 className="fw-bold">
                    Book Appointments
                  </h5>

                  <p className="text-secondary">
                    Select your preferred doctor, date and time to
                    book an appointment.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    🗓️
                  </div>

                  <h5 className="fw-bold">
                    Manage Appointments
                  </h5>

                  <p className="text-secondary">
                    View and keep track of your booked healthcare
                    appointments.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="service-icon mb-3">
                    👤
                  </div>

                  <h5 className="fw-bold">
                    Patient Account
                  </h5>

                  <p className="text-secondary">
                    Create an account and access your personalized
                    healthcare appointment information.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-5 bg-light">
        <div className="container" style={{ maxWidth: "900px" }}>
          <div className="text-center mb-5">
            <h2 className="fw-bold">
              Contact Us
            </h2>

            <p className="text-secondary">
              Have questions about SmartCare? Get in touch with us.
            </p>
          </div>

          <div className="row g-4">

            <div className="col-md-4">
              <div className="p-3 text-center">
                <div className="service-icon mb-2">
                  📍
                </div>

                <h6 className="fw-bold">
                  Address
                </h6>

                <p className="small text-secondary">
                  SmartCare Health Center
                  <br />
                  Hyderabad, Telangana, India
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3 text-center">
                <div className="service-icon mb-2">
                  ✉️
                </div>

                <h6 className="fw-bold">
                  Email
                </h6>

                <p className="small text-secondary">
                  support@smartcare.example
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3 text-center">
                <div className="service-icon mb-2">
                  📞
                </div>

                <h6 className="fw-bold">
                  Phone
                </h6>

                <p className="small text-secondary">
                  +91 98765 43210
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}