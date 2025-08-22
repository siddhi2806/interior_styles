'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Project, ProjectImage } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { Calendar, Camera, Palette, ArrowRight } from 'lucide-react'

interface ProjectCardProps {
  project: Project
  onSelect: () => void
  isSelected: boolean
}

export function ProjectCard({ project, onSelect, isSelected }: ProjectCardProps) {
  const [images, setImages] = useState<ProjectImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjectImages()
  }, [project.id])

  const fetchProjectImages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_images')
        .select(`
          *,
          style:styles(*)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching project images:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div
      onClick={onSelect}
      className={`project-card bg-white/80 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 cursor-pointer hover:shadow-lg ${
        isSelected 
          ? 'border-indigo-300 ring-2 ring-indigo-200 shadow-lg' 
          : 'border-white/20 hover:border-indigo-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
        <div className="flex items-center space-x-1 text-gray-500 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(project.created_at)}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-gray-600">
            <Camera className="h-4 w-4" />
            <span className="text-sm">
              {images.length} {images.length === 1 ? 'render' : 'renders'}
            </span>
          </div>

          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Palette className="h-4 w-4" />
                <span className="text-sm">Latest styles:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {images.slice(0, 3).map((image, index) => (
                  <span
                    key={index}
                    className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                  >
                    {image.style?.name || 'Unknown'}
                  </span>
                ))}
                {images.length > 3 && (
                  <span className="inline-block text-gray-500 text-xs px-2 py-1">
                    +{images.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {images.length === 0 && (
            <p className="text-gray-500 text-sm">No renders yet. Click to start creating!</p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        {isSelected && (
          <p className="text-indigo-600 text-sm font-medium">Selected for rendering</p>
        )}
        
        {images.length > 0 && (
          <Link
            href={`/project/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
          >
            <span>View Gallery</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
