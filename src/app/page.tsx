'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { gsap } from 'gsap'
import { 
  Palette, 
  Zap, 
  Shield, 
  Star,
  ArrowRight,
  Sparkles,
  Camera,
  Wand2
} from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.fromTo('.hero-title', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      )
      
      gsap.fromTo('.hero-subtitle', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.2, ease: 'power3.out' }
      )
      
      gsap.fromTo('.hero-cta', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.4, ease: 'power3.out' }
      )

      // Features animation
      gsap.fromTo('.feature-card',
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.1,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%'
          }
        }
      )
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const features = [
    {
      icon: <Camera className="h-8 w-8" />,
      title: "Upload Your Photo",
      description: "Simply upload a photo of your room and we'll transform it"
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "Choose Your Style",
      description: "Pick from 6 professional interior design styles"
    },
    {
      icon: <Wand2 className="h-8 w-8" />,
      title: "AI Magic",
      description: "Our AI transforms your space while keeping the layout intact"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Instant Results",
      description: "Get professional-quality renderings in seconds"
    }
  ]

  const styles = [
    "Industrial", "Minimalist", "Rustic", 
    "Scandinavian", "Bohemian", "Modern"
  ]

  return (
    <div ref={heroRef} className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="hero-title text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Room
              </span>
              <br />
              with AI Magic
            </h1>
            
            <p className="hero-subtitle text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload a photo and watch as AI transforms your space into stunning interior designs. 
              Get professional results in seconds, not hours.
            </p>

            <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              {user ? (
                <Link
                  href="/dashboard"
                  className="group bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="group bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>Start Designing</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="h-5 w-5" />
                <span>Free 50 credits to start</span>
              </div>
            </div>

            {/* Style Examples */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {styles.map((style, index) => (
                <div 
                  key={style}
                  className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center hover:bg-white/80 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-sm font-medium text-gray-700">{style}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-20 h-20 bg-indigo-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-cyan-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Features Section */}
      <div ref={featuresRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your space in 4 simple steps with our AI-powered interior design tool
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="feature-card text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of users who have already transformed their rooms with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg flex items-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            
            <div className="flex items-center space-x-1 text-indigo-100">
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <span className="ml-2">50 free credits included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
