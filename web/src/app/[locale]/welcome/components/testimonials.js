import { useTranslations } from 'next-intl'

export default function Testimonials() {
  const t = useTranslations('app.welcome.testimonials')

  const testimonials = [
    {
      body: t('user1.body'),
      author: {
        name: t('user1.name'),
        handle: t('user1.handle'),
        imageUrl: '/images/welcome/user/ava5.png',
      },
    },
    {
      body: t('user2.body'),
      author: {
        name: t('user2.name'),
        handle: t('user2.handle'),
        imageUrl: '/images/welcome/user/ava6.png',
      },
    },
    {
      body: t('user3.body'),
      author: {
        name: t('user3.name'),
        handle: t('user3.handle'),
        imageUrl: '/images/welcome/user/ava3.png',
      },
    },
    {
      body: t('user4.body'),
      author: {
        name: t('user4.name'),
        handle: t('user4.handle'),
        imageUrl: '/images/welcome/user/ava4.png',
      },
    },
    {
      body: t('user5.body'),
      author: {
        name: t('user5.name'),
        handle: t('user5.handle'),
        imageUrl: '/images/welcome/user/ava2.png',
      },
    },
    {
      body: t('user6.body'),
      author: {
        name: t('user6.name'),
        handle: t('user6.handle'),
        imageUrl: '/images/welcome/user/ava1.png',
      },
    },
  ]

  return (
    <div className="bg-amber-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-amber-700">{t('title')}</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-900 sm:text-4xl">
            {t('subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author.handle} className="pt-8 sm:inline-block sm:w-full sm:px-4">
                <figure className="rounded-2xl bg-white p-8 text-sm/6 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <blockquote className="text-gray-900">
                    <p className="text-base">{`"${testimonial.body}"`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <img 
                      alt={testimonial.author.name} 
                      src={testimonial.author.imageUrl} 
                      className="h-10 w-10 rounded-full bg-amber-50" 
                    />
                    <div>
                      <div className="font-semibold text-amber-900">{testimonial.author.name}</div>
                      <div className="text-amber-700">{testimonial.author.handle}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
