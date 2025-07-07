class StoryReader {
  constructor() {
    this.stories = []
    this.currentStory = null
    this.currentChapter = null
    this.currentView = "loading"
    this.contentCache = new Map()

    this.init()
  }

  async init() {
    try {
      await this.loadStoriesIndex()
      this.setupEventListeners()
      this.showStoryList()
    } catch (error) {
      console.error("Error initializing app:", error)
      this.showError("Failed to load stories")
    }
  }

  async loadStoriesIndex() {
    this.updateLoadingText("Loading story index...")
    const response = await fetch("stories-index.json")
    const data = await response.json()
    this.stories = data.stories
  }

  async loadStoryContent(contentFile) {
    if (this.contentCache.has(contentFile)) {
      return this.contentCache.get(contentFile)
    }

    this.updateLoadingText("Loading story content...")
    try {
      const response = await fetch(contentFile)
      const content = await response.text()
      this.contentCache.set(contentFile, content)
      return content
    } catch (error) {
      console.error("Error loading content:", error)
      return "Error loading story content."
    }
  }

  async loadChaptersData(chaptersFile) {
    if (this.contentCache.has(chaptersFile)) {
      return this.contentCache.get(chaptersFile)
    }

    this.updateLoadingText("Loading chapters...")
    try {
      const response = await fetch(chaptersFile)
      const data = await response.json()
      this.contentCache.set(chaptersFile, data)
      return data
    } catch (error) {
      console.error("Error loading chapters:", error)
      return null
    }
  }

  updateLoadingText(text) {
    const loadingText = document.getElementById("loading-text")
    if (loadingText) {
      loadingText.textContent = text
    }
  }

  setupEventListeners() {
    // Back buttons
    document.getElementById("back-to-stories").addEventListener("click", () => {
      this.showStoryList()
    })

    document.getElementById("back-from-reading").addEventListener("click", () => {
      if (this.currentStory && (this.currentStory.type === "series" || this.currentStory.type === "novel")) {
        this.showSeriesView(this.currentStory)
      } else {
        this.showStoryList()
      }
    })

    // Chapter navigation
    document.getElementById("prev-chapter").addEventListener("click", () => {
      this.navigateChapter("prev")
    })

    document.getElementById("next-chapter").addEventListener("click", () => {
      this.navigateChapter("next")
    })

    // Reading progress tracking
    window.addEventListener("scroll", () => {
      this.updateReadingProgress()
    })
  }

  showView(viewId) {
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.add("hidden")
    })
    document.getElementById(viewId).classList.remove("hidden")
    this.currentView = viewId
  }

  showStoryList() {
    this.currentStory = null
    this.currentChapter = null
    this.renderStoryList()
    this.showView("story-list")
  }

  async showSeriesView(story) {
    this.showView("loading")
    this.currentStory = story
    this.currentChapter = null

    try {
      await this.renderSeriesView()
      this.showView("series-view")
    } catch (error) {
      console.error("Error loading series:", error)
      this.showError("Failed to load series")
    }
  }

  async showReadingView(story, chapter = null) {
    this.showView("loading")
    this.currentStory = story
    this.currentChapter = chapter

    try {
      await this.renderReadingView()
      this.showView("reading-view")
      this.updateReadingProgress()
    } catch (error) {
      console.error("Error loading content:", error)
      this.showError("Failed to load story content")
    }
  }

  renderStoryList() {
    const grid = document.getElementById("stories-grid")
    grid.innerHTML = ""

    this.stories.forEach((story) => {
      const card = this.createStoryCard(story)
      grid.appendChild(card)
    })
  }

  createStoryCard(story) {
    const card = document.createElement("div")
    card.className = "story-card"

    const title = this.getStoryTitle(story)
    const author = this.getStoryAuthor(story)
    const description = this.getStoryDescription(story)

    // Determine story type badge
    let typeBadge = ""
    switch (story.type) {
      case "short-story":
        typeBadge = '<div class="badge badge-short-story"><i class="fas fa-book"></i> Short Story</div>'
        break
      case "series":
        typeBadge = '<div class="badge badge-series"><i class="fas fa-book-open"></i> Series</div>'
        break
      case "novel":
        typeBadge = '<div class="badge badge-novel"><i class="fas fa-book"></i> Novel</div>'
        break
      default:
        typeBadge = '<div class="badge badge-short-story"><i class="fas fa-book"></i> Story</div>'
    }

    card.innerHTML = `
      <div class="story-header">
        <div>
          <h3 class="story-title">${title}</h3>
          ${
            author
              ? `
            <div class="story-author">
              <i class="fas fa-user"></i>
              by ${author}
            </div>
          `
              : ""
          }
          ${story.genre ? `<div class="badge badge-genre">${story.genre}</div>` : ""}
        </div>
        <div class="story-badges">
          ${typeBadge}
          ${story.status ? `<div class="badge badge-${story.status}">${story.status}</div>` : ""}
        </div>
      </div>
      ${description ? `<p class="story-description">${description}</p>` : ""}
      <div class="story-footer">
        <div class="story-meta">
          ${story.wordCount ? `<span><i class="fas fa-file-word"></i> ${story.wordCount.toLocaleString()} words</span>` : ""}
          ${story.readingTime ? `<span><i class="fas fa-clock"></i> ~${story.readingTime} min read</span>` : ""}
          ${story.totalChapters ? `<span><i class="fas fa-hashtag"></i> ${story.totalChapters} chapters</span>` : ""}
          ${story.publishDate ? `<span><i class="fas fa-calendar"></i> ${story.publishDate}</span>` : ""}
        </div>
        <button class="read-button">
          ${story.type === "series" || story.type === "novel" ? "View Chapters" : "Read Story"}
        </button>
      </div>
    `

    card.addEventListener("click", () => {
      if (story.type === "series" || story.type === "novel") {
        this.showSeriesView(story)
      } else {
        this.showReadingView(story)
      }
    })

    return card
  }

  async renderSeriesView() {
    const story = this.currentStory
    const title = this.getStoryTitle(story)
    const author = this.getStoryAuthor(story)
    const description = this.getStoryDescription(story)

    // Load chapters data
    const chaptersData = await this.loadChaptersData(story.chaptersFile)
    if (!chaptersData) {
      throw new Error("Failed to load chapters data")
    }

    document.getElementById("series-info").innerHTML = `
      <div class="series-header">
        <div>
          <h1 class="series-title">${title}</h1>
          ${
            author
              ? `
            <div class="story-author">
              <i class="fas fa-user"></i>
              by ${author}
            </div>
          `
              : ""
          }
        </div>
        <div class="story-badges">
          <div class="badge badge-${story.type}"><i class="fas fa-book-open"></i> ${story.type === "novel" ? "Novel" : "Series"}</div>
          ${story.status ? `<div class="badge badge-${story.status}">${story.status}</div>` : ""}
          ${story.genre ? `<div class="badge badge-genre">${story.genre}</div>` : ""}
        </div>
      </div>
      ${description ? `<p class="series-description">${description}</p>` : ""}
      <div class="series-meta">
        <span><i class="fas fa-hashtag"></i> ${story.totalChapters} chapters</span>
        ${story.totalWordCount ? `<span><i class="fas fa-file-word"></i> ${story.totalWordCount.toLocaleString()} total words</span>` : ""}
        ${story.averageReadingTime ? `<span><i class="fas fa-clock"></i> ~${story.averageReadingTime} min total read</span>` : ""}
      </div>
    `

    const chaptersList = document.getElementById("chapters-list")
    chaptersList.innerHTML = ""

    if (chaptersData.chapters) {
      chaptersData.chapters.forEach((chapter) => {
        const chapterCard = this.createChapterCard(chapter)
        chaptersList.appendChild(chapterCard)
      })
    }
  }

  createChapterCard(chapter) {
    const card = document.createElement("div")
    card.className = "chapter-card"

    card.innerHTML = `
      <div class="chapter-header">
        <div>
          <h4 class="chapter-title">Chapter ${chapter.chapterNumber}: ${chapter.title}</h4>
          ${chapter.subtitle ? `<p class="chapter-subtitle">${chapter.subtitle}</p>` : ""}
        </div>
        <div class="chapter-meta">
          ${chapter.publishDate ? `<div>${chapter.publishDate}</div>` : ""}
          ${chapter.wordCount ? `<div>${chapter.wordCount.toLocaleString()} words</div>` : ""}
          ${chapter.readingTime ? `<div>~${chapter.readingTime} min</div>` : ""}
        </div>
      </div>
    `

    card.addEventListener("click", () => {
      this.showReadingView(this.currentStory, chapter)
    })

    return card
  }

  async renderReadingView() {
    const story = this.currentStory
    const chapter = this.currentChapter

    // Update back button text
    const backText = document.getElementById("back-text")
    backText.textContent = story.type === "series" || story.type === "novel" ? "Back to Chapters" : "Back to Stories"

    // Handle chapter navigation
    const chapterNav = document.getElementById("chapter-navigation")
    if (chapter) {
      chapterNav.classList.remove("hidden")
      await this.updateChapterNavigation()
    } else {
      chapterNav.classList.add("hidden")
    }

    // Render content
    const content = document.getElementById("story-content")
    if (chapter) {
      await this.renderChapterContent(content, story, chapter)
    } else {
      await this.renderStoryContent(content, story)
    }
  }

  async renderChapterContent(container, story, chapter) {
    const title = this.getStoryTitle(story)
    const content = await this.loadStoryContent(chapter.contentFile)

    container.innerHTML = `
      <header class="content-header">
        <div class="content-series">${title}</div>
        <h1 class="content-title">${chapter.title}</h1>
        ${chapter.subtitle ? `<h2 class="content-subtitle">${chapter.subtitle}</h2>` : ""}
        <div class="content-meta">
          ${
            chapter.publishDate
              ? `
            <div class="content-author">
              <i class="fas fa-calendar"></i>
              Published: ${chapter.publishDate}
            </div>
          `
              : ""
          }
          ${
            chapter.wordCount
              ? `
            <div class="content-author">
              <i class="fas fa-file-word"></i>
              ${chapter.wordCount.toLocaleString()} words
            </div>
          `
              : ""
          }
          ${
            chapter.readingTime
              ? `
            <div class="content-author">
              <i class="fas fa-clock"></i>
              ~${chapter.readingTime} min read
            </div>
          `
              : ""
          }
        </div>
      </header>
      <div class="content-text">
        ${this.formatContent(content)}
      </div>
    `
  }

  async renderStoryContent(container, story) {
    const title = this.getStoryTitle(story)
    const author = this.getStoryAuthor(story)
    const description = this.getStoryDescription(story)
    const content = await this.loadStoryContent(story.contentFile)

    container.innerHTML = `
      <header class="content-header">
        <h1 class="content-title">${title}</h1>
        <div class="content-meta">
          ${
            author
              ? `
            <div class="content-author">
              <i class="fas fa-user"></i>
              by ${author}
            </div>
          `
              : ""
          }
          ${story.genre ? `<div class="badge badge-genre">${story.genre}</div>` : ""}
          ${
            story.publishDate
              ? `
            <div class="content-author">
              <i class="fas fa-calendar"></i>
              ${story.publishDate}
            </div>
          `
              : ""
          }
          ${
            story.wordCount
              ? `
            <div class="content-author">
              <i class="fas fa-file-word"></i>
              ${story.wordCount.toLocaleString()} words
            </div>
          `
              : ""
          }
          ${
            story.readingTime
              ? `
            <div class="content-author">
              <i class="fas fa-clock"></i>
              ~${story.readingTime} min read
            </div>
          `
              : ""
          }
        </div>
        ${description ? `<p class="content-description">${description}</p>` : ""}
      </header>
      <div class="content-text">
        ${this.formatContent(content)}
      </div>
    `
  }

  async updateChapterNavigation() {
    const story = this.currentStory
    const chapter = this.currentChapter

    if (!chapter) return

    // Load chapters data to get navigation info
    const chaptersData = await this.loadChaptersData(story.chaptersFile)
    if (!chaptersData || !chaptersData.chapters) return

    const currentIndex = chaptersData.chapters.findIndex((ch) => ch.id === chapter.id)
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < chaptersData.chapters.length - 1

    const prevBtn = document.getElementById("prev-chapter")
    const nextBtn = document.getElementById("next-chapter")
    const progress = document.getElementById("chapter-progress")

    prevBtn.disabled = !hasPrev
    nextBtn.disabled = !hasNext
    progress.textContent = `Chapter ${chapter.chapterNumber} of ${story.totalChapters}`

    // Store chapters data for navigation
    this.currentChaptersData = chaptersData.chapters
  }

  async navigateChapter(direction) {
    const story = this.currentStory
    const chapter = this.currentChapter

    if (!this.currentChaptersData || !chapter) return

    const currentIndex = this.currentChaptersData.findIndex((ch) => ch.id === chapter.id)
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1

    if (newIndex >= 0 && newIndex < this.currentChaptersData.length) {
      this.currentChapter = this.currentChaptersData[newIndex]
      await this.renderReadingView()
    }
  }

  formatContent(content) {
    // Handle both plain text and markdown-style content
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Convert markdown headers
        if (line.startsWith("# ")) {
          return `<h1>${line.substring(2)}</h1>`
        } else if (line.startsWith("## ")) {
          return `<h2>${line.substring(3)}</h2>`
        } else {
          return `<p>${line}</p>`
        }
      })
      .join("")
  }

  updateReadingProgress() {
    const contentElement = document.querySelector(".content-text")
    const progressFill = document.getElementById("progress-fill")
    const wordCountElement = document.getElementById("word-count")
    const readingTimeElement = document.getElementById("reading-time")

    if (!contentElement || !progressFill) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = (scrollTop / scrollHeight) * 100

    progressFill.style.width = `${Math.min(scrollPercent, 100)}%`

    // Update word count and reading time
    const text = contentElement.textContent || ""
    const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
    const readingTime = Math.ceil(wordCount / 200) // Assuming 200 words per minute

    if (wordCountElement) {
      wordCountElement.textContent = `${wordCount.toLocaleString()} words`
    }
    if (readingTimeElement) {
      readingTimeElement.textContent = `~${readingTime} min read`
    }
  }

  getStoryTitle(story) {
    return story.title || story.name || "Untitled Story"
  }

  getStoryAuthor(story) {
    return story.author || story.creator || null
  }

  getStoryDescription(story) {
    return story.description || story.summary || null
  }

  showError(message) {
    document.getElementById("loading").innerHTML = `
      <div class="loading-content">
        <i class="fas fa-exclamation-triangle loading-icon" style="color: #dc2626;"></i>
        <p>${message}</p>
      </div>
    `
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new StoryReader()
})
