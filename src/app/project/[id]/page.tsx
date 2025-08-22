'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Project, ProjectImage, Style } from '@/types/database'
import { ImageComparison } from '@/components/ImageComparison'
import { 
  ArrowLeft, 
  Calendar, 
  Palette,
  Download,
  Share2,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProjectPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [images, setImages] = useState<ProjectImage[]>([])
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && user) {
      fetchProject()
      fetchProjectImages()
    }
  }, [id, user])

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchProjectImages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_images')
        .select(`
          *,
          style:styles(*)
        `)
        .eq('project_id', id)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
      if (data && data.length > 0) {
        setSelectedImage(data[0])
      }
    } catch (error) {
      console.error('Error fetching project images:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (path: string) => {
    if (!path) return null
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    return data.publicUrl
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const shareImage = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${project?.name} - AI Room Styling`,
          text: 'Check out my room transformation with AI!',
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Project URL copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(project.created_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {images.length} {images.length === 1 ? 'render' : 'renders'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-white/20 max-w-md mx-auto">
              <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Renders Yet</h3>
              <p className="text-gray-600 mb-6">
                This project doesn't have any rendered images yet. Go back to the dashboard to create your first render.
              </p>
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Start Creating
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Image Viewer */}
            <div className="lg:col-span-2">
              {selectedImage && (
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedImage.style?.name} Style
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {formatDate(selectedImage.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {selectedImage.after_path && (
                        <>
                          <button
                            onClick={() => downloadImage(
                              getImageUrl(selectedImage.after_path!)!,
                              `${project.name}-${selectedImage.style?.name}-transformed.png`
                            )}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => shareImage(getImageUrl(selectedImage.after_path!)!)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Share"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedImage.before_path && selectedImage.after_path ? (
                    <ImageComparison
                      beforeUrl={getImageUrl(selectedImage.before_path)!}
                      afterUrl={getImageUrl(selectedImage.after_path)!}
                      beforeLabel="Original"
                      afterLabel={`${selectedImage.style?.name} Style`}
                    />
                  ) : selectedImage.before_path ? (
                    <div className="aspect-video relative rounded-xl overflow-hidden">
                      <Image
                        src={getImageUrl(selectedImage.before_path)!}
                        alt="Original room"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Image Gallery */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Renders</h3>
                
                <div className="space-y-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => setSelectedImage(image)}
                      className={`cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                        selectedImage?.id === image.id
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100">
                            {image.after_path ? (
                              <Image
                                src={getImageUrl(image.after_path)!}
                                alt={`${image.style?.name} style`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Palette className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {image.style?.name || 'Unknown Style'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(image.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {image.style?.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {image.style.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
