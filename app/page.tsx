"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Book, User, Calendar, Hash, ChevronLeft, ChevronRight, BookOpen } from "lucide-react"

interface Chapter {
  id: string
  chapterNumber: number
  title: string
  subtitle?: string
  publishDate?: string
  content: string
}

interface Story {
  id: number
  title?: string
  name?: string
  author?: string
  creator?: string
  description?: string
  summary?: string
  genre?: string
  status?: string
  publishDate?: string
  type?: "series" | "standalone"
  totalChapters?: number
  chapters?: Chapter[]
  content?: string
  [key: string]: any // Allow for custom fields
}

interface StoriesData {
  stories: Story[]
}

export default function StoryReader() {
  const [stories, setStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch("/stories.json")
        const data: StoriesData = await response.json()
        setStories(data.stories)
      } catch (error) {
        console.error("Error fetching stories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  const formatContent = (content: string) => {
    return content.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    ))
  }

  const getStoryTitle = (story: Story) => {
    return story.title || story.name || "Untitled Story"
  }

  const getStoryAuthor = (story: Story) => {
    return story.author || story.creator || null
  }

  const getStoryDescription = (story: Story) => {
    return story.description || story.summary || null
  }

  const navigateChapter = (direction: "prev" | "next") => {
    if (!selectedStory?.chapters || !currentChapter) return

    const currentIndex = selectedStory.chapters.findIndex((ch) => ch.id === currentChapter.id)
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1

    if (newIndex >= 0 && newIndex < selectedStory.chapters.length) {
      setCurrentChapter(selectedStory.chapters[newIndex])
    }
  }

  const resetView = () => {
    setSelectedStory(null)
    setCurrentChapter(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Book className="h-12 w-12 text-amber-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-amber-800">Loading stories...</p>
        </div>
      </div>
    )
  }

  // Reading a specific chapter
  if (currentChapter && selectedStory) {
    const currentIndex = selectedStory.chapters?.findIndex((ch) => ch.id === currentChapter.id) ?? -1
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < (selectedStory.chapters?.length ?? 0) - 1

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Button onClick={() => setCurrentChapter(null)} variant="outline" className="bg-white/80 hover:bg-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chapters
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigateChapter("prev")}
                disabled={!hasPrev}
                variant="outline"
                size="sm"
                className="bg-white/80 hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Chapter {currentChapter.chapterNumber} of {selectedStory.totalChapters}
              </Badge>
              <Button
                onClick={() => navigateChapter("next")}
                disabled={!hasNext}
                variant="outline"
                size="sm"
                className="bg-white/80 hover:bg-white"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <article className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-12">
            <header className="mb-8 border-b border-amber-200 pb-6">
              <div className="text-sm text-amber-600 mb-2 font-medium">{getStoryTitle(selectedStory)}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                {currentChapter.title}
              </h1>
              {currentChapter.subtitle && <h2 className="text-xl text-gray-600 mb-3">{currentChapter.subtitle}</h2>}
              {currentChapter.publishDate && (
                <div className="flex items-center text-amber-700 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Published: {currentChapter.publishDate}</span>
                </div>
              )}
            </header>

            <div className="prose prose-lg prose-amber max-w-none">
              <div className="text-gray-800 text-lg leading-relaxed">{formatContent(currentChapter.content)}</div>
            </div>
          </article>
        </div>
      </div>
    )
  }

  // Viewing series chapters
  if (selectedStory && selectedStory.type === "series") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button onClick={resetView} variant="outline" className="mb-6 bg-white/80 hover:bg-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>

          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{getStoryTitle(selectedStory)}</h1>
                {getStoryAuthor(selectedStory) && (
                  <div className="flex items-center text-amber-700 mb-3">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">by {getStoryAuthor(selectedStory)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Series
                </Badge>
                {selectedStory.status && (
                  <Badge variant={selectedStory.status === "ongoing" ? "default" : "secondary"}>
                    {selectedStory.status}
                  </Badge>
                )}
                {selectedStory.genre && <Badge variant="outline">{selectedStory.genre}</Badge>}
              </div>
            </div>

            {getStoryDescription(selectedStory) && (
              <p className="text-lg text-gray-600 leading-relaxed mb-6">{getStoryDescription(selectedStory)}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Hash className="h-4 w-4 mr-1" />
                {selectedStory.totalChapters} chapters
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chapters</h2>
            {selectedStory.chapters?.map((chapter) => (
              <Card
                key={chapter.id}
                className="bg-white/90 backdrop-blur-sm hover:bg-white/95 transition-all duration-300 hover:shadow-lg cursor-pointer border-amber-200"
                onClick={() => setCurrentChapter(chapter)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900 hover:text-amber-700 transition-colors">
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </CardTitle>
                    {chapter.publishDate && (
                      <Badge variant="outline" className="text-xs">
                        {chapter.publishDate}
                      </Badge>
                    )}
                  </div>
                  {chapter.subtitle && <p className="text-gray-600 text-sm mt-1">{chapter.subtitle}</p>}
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Reading a standalone story
  if (selectedStory && selectedStory.type !== "series") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button onClick={resetView} variant="outline" className="mb-6 bg-white/80 hover:bg-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stories
          </Button>

          <article className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-12">
            <header className="mb-8 border-b border-amber-200 pb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {getStoryTitle(selectedStory)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {getStoryAuthor(selectedStory) && (
                  <div className="flex items-center text-amber-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">by {getStoryAuthor(selectedStory)}</span>
                  </div>
                )}

                {selectedStory.genre && <Badge variant="outline">{selectedStory.genre}</Badge>}

                {selectedStory.publishDate && (
                  <div className="flex items-center text-amber-700 text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{selectedStory.publishDate}</span>
                  </div>
                )}
              </div>

              {getStoryDescription(selectedStory) && (
                <p className="text-lg text-gray-600 italic leading-relaxed">{getStoryDescription(selectedStory)}</p>
              )}
            </header>

            <div className="prose prose-lg prose-amber max-w-none">
              <div className="text-gray-800 text-lg leading-relaxed">
                {selectedStory.content && formatContent(selectedStory.content)}
              </div>
            </div>
          </article>
        </div>
      </div>
    )
  }

  // Story list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Book className="h-12 w-12 text-amber-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Story Haven</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover captivating tales and immerse yourself in worlds of imagination
          </p>
        </header>

        <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="bg-white/90 backdrop-blur-sm hover:bg-white/95 transition-all duration-300 hover:shadow-lg cursor-pointer border-amber-200"
              onClick={() => setSelectedStory(story)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-gray-900 hover:text-amber-700 transition-colors mb-2">
                      {getStoryTitle(story)}
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {getStoryAuthor(story) && (
                        <div className="flex items-center text-amber-700">
                          <User className="h-4 w-4 mr-2" />
                          <span className="font-medium">by {getStoryAuthor(story)}</span>
                        </div>
                      )}

                      {story.genre && <Badge variant="outline">{story.genre}</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    {story.type === "series" ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Series
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Book className="h-3 w-3 mr-1" />
                        Story
                      </Badge>
                    )}

                    {story.status && (
                      <Badge variant={story.status === "ongoing" ? "default" : "secondary"}>{story.status}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {getStoryDescription(story) && (
                  <CardDescription className="text-gray-600 text-base leading-relaxed mb-4">
                    {getStoryDescription(story)}
                  </CardDescription>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {story.type === "series" && story.totalChapters && (
                      <span className="flex items-center">
                        <Hash className="h-4 w-4 mr-1" />
                        {story.totalChapters} chapters
                      </span>
                    )}

                    {story.publishDate && (
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {story.publishDate}
                      </span>
                    )}
                  </div>

                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedStory(story)
                    }}
                  >
                    {story.type === "series" ? "View Series" : "Read Story"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
