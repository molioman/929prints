export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About 929 Prints</h1>
      <p className="text-xl text-gray-600 mb-10 leading-relaxed">
        We are a custom printing company dedicated to delivering high-quality prints with fast turnaround and exceptional customer service.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: 'Orders Completed', value: '10,000+' },
          { label: 'Happy Customers', value: '2,500+' },
          { label: 'Years in Business', value: '5+' },
        ].map(stat => (
          <div key={stat.label} className="text-center bg-indigo-50 rounded-2xl p-8">
            <p className="text-4xl font-bold text-indigo-600 mb-2">{stat.value}</p>
            <p className="text-gray-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Founded with a passion for quality and creativity, 929 Prints has been helping businesses and individuals bring their visions to life through custom printing solutions.
        From banners and business cards to custom apparel and promotional materials, we have the expertise to handle any project.
      </p>
      <p className="text-gray-600 leading-relaxed">
        We use the latest printing technology and premium materials to ensure every order meets our high standards. Our team works closely with each customer to understand their needs and deliver results that exceed expectations.
      </p>
    </div>
  )
}
