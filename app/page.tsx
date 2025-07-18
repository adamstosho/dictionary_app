"use client"

import type React from "react"

import { useState } from "react"
import { Search, Volume2, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Phonetic {
  text?: string
  audio?: string
}

interface Definition {
  definition: string
  example?: string
  synonyms?: string[]
  antonyms?: string[]
}

interface Meaning {
  partOfSpeech: string
  definitions: Definition[]
  synonyms?: string[]
  antonyms?: string[]
}

interface WordData {
  word: string
  phonetic?: string
  phonetics: Phonetic[]
  meanings: Meaning[]
  license?: {
    name: string
    url: string
  }
  sourceUrls?: string[]
}

export default function DictionaryApp() {
  const [searchTerm, setSearchTerm] = useState("")
  const [wordData, setWordData] = useState<WordData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const searchWord = async (word: string) => {
    if (!word.trim()) return

    setLoading(true)
    setError("")
    setWordData(null)

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.trim()}`)

      if (!response.ok) {
        throw new Error("Word not found")
      }

      const data = await response.json()
      setWordData(data)
    } catch (err) {
      setError("Word not found. Please try a different word.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchWord(searchTerm)
  }

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play().catch((err) => console.log("Audio playback failed:", err))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Redox Dictionary</h1>
          </div>
          <p className="text-gray-600">Discover meanings, pronunciations, and examples</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter a word to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading || !searchTerm.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Word Results */}
        {wordData &&
          wordData.map((word, index) => (
            <Card key={index} className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{word.word}</CardTitle>
                    {word.phonetic && <p className="text-gray-600 text-lg">/{word.phonetic}/</p>}
                  </div>
                  {word.phonetics.find((p) => p.audio) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const audioPhonetic = word.phonetics.find((p) => p.audio)
                        if (audioPhonetic?.audio) {
                          playAudio(audioPhonetic.audio)
                        }
                      }}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {word.meanings.map((meaning, meaningIndex) => (
                  <div key={meaningIndex} className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary" className="text-sm">
                        {meaning.partOfSpeech}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {meaning.definitions.map((definition, defIndex) => (
                        <div key={defIndex} className="pl-4 border-l-2 border-gray-200">
                          <p className="text-gray-900 mb-2">{definition.definition}</p>
                          {definition.example && (
                            <p className="text-gray-600 italic">
                              <span className="font-medium">Example: </span>
                              {definition.example}
                            </p>
                          )}
                          {definition.synonyms && definition.synonyms.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">Synonyms: </span>
                              <span className="text-sm text-blue-600">{definition.synonyms.join(", ")}</span>
                            </div>
                          )}
                          {definition.antonyms && definition.antonyms.length > 0 && (
                            <div className="mt-1">
                              <span className="text-sm font-medium text-gray-700">Antonyms: </span>
                              <span className="text-sm text-red-600">{definition.antonyms.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {meaning.synonyms && meaning.synonyms.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">More Synonyms: </span>
                        <span className="text-blue-700">{meaning.synonyms.join(", ")}</span>
                      </div>
                    )}

                    {meaning.antonyms && meaning.antonyms.length > 0 && (
                      <div className="mt-2 p-3 bg-red-50 rounded-lg">
                        <span className="font-medium text-red-900">Antonyms: </span>
                        <span className="text-red-700">{meaning.antonyms.join(", ")}</span>
                      </div>
                    )}

                    {meaningIndex < word.meanings.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}

                {word.sourceUrls && word.sourceUrls.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Source: </span>
                      <a
                        href={word.sourceUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {word.sourceUrls[0]}
                      </a>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

        {/* Welcome Message */}
        {!wordData && !loading && !error && (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Dictionary</h2>
              <p className="text-gray-600 mb-6">
                Search for any word to get detailed definitions, pronunciations, examples, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["serendipity", "ephemeral", "ubiquitous", "paradigm"].map((word) => (
                  <Button
                    key={word}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm(word)
                      searchWord(word)
                    }}
                  >
                    Try "{word}"
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
