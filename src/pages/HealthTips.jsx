export default function HealthTips() {
  const healthTips = [
    {
      title: "Stay Hydrated",
      icon: "💧",
      description:
        "Drink enough water throughout the day to keep your body hydrated and support overall health.",
    },
    {
      title: "Eat a Balanced Diet",
      icon: "🥗",
      description:
        "Include fruits, vegetables, whole grains, proteins, and other nutritious foods in your daily meals.",
    },
    {
      title: "Exercise Regularly",
      icon: "🏃",
      description:
        "Regular physical activity can help improve fitness, energy levels, and overall well-being.",
    },
    {
      title: "Get Enough Sleep",
      icon: "😴",
      description:
        "Maintain a consistent sleep schedule and aim for enough quality sleep to help your body recover.",
    },
    {
      title: "Take Care of Your Mental Health",
      icon: "🧠",
      description:
        "Take breaks, spend time with people you trust, and make time for activities that help you relax.",
    },
    {
      title: "Practice Good Hygiene",
      icon: "🧼",
      description:
        "Wash your hands regularly, maintain personal hygiene, and follow healthy habits to reduce the spread of infections.",
    },
  ]

  return (
    <section className="py-5">
      <div className="container">
        
        {/* Page Heading */}
        <div className="text-center mb-5">
          <h2 className="fw-bold">Health Tips</h2>
          <p className="text-muted">
            Simple healthy habits for a healthier lifestyle
          </p>
        </div>

        {/* Health Tips Cards */}
        <div className="row g-4">
          {healthTips.map((tip, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body text-center p-4">
                  
                  <div className="fs-1 mb-3">
                    {tip.icon}
                  </div>

                  <h5 className="fw-bold mb-3">
                    {tip.title}
                  </h5>

                  <p className="text-muted mb-0">
                    {tip.description}
                  </p>

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="alert alert-info mt-5 text-center">
          <strong>Remember:</strong> Small healthy habits can make a big
          difference over time.
        </div>

      </div>
    </section>
  )
}