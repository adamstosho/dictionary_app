"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Volume2, BookOpen, Loader2, Mic, MicOff, Star, StarOff, Shuffle, Brain, Calendar, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface SavedWord {
  word: string
  timestamp: number
  definition: string
}

export default function DictionaryApp() {
  const [searchTerm, setSearchTerm] = useState("")
  const [wordData, setWordData] = useState<WordData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [savedWords, setSavedWords] = useState<SavedWord[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [wordOfTheDay, setWordOfTheDay] = useState<WordData | null>(null)
  const [gameMode, setGameMode] = useState(false)
  const [currentGameWord, setCurrentGameWord] = useState<WordData | null>(null)
  const [gameScore, setGameScore] = useState(0)

  // Word of the Day words
  const wordOfTheDayList = [
    "serendipity", "ephemeral", "ubiquitous", "paradigm", "eloquent", 
    "resilient", "authentic", "innovative", "perseverance", "gratitude"
  ]

  // Smart suggestions based on common patterns
  const commonWords = [
    "beautiful", "happiness", "knowledge", "freedom", "success", "love", "peace", "wisdom", "courage", "hope",
    "serendipity", "ephemeral", "ubiquitous", "paradigm", "eloquent", "resilient", "authentic", "innovative"
  ]

  useEffect(() => {
    // Load saved words from localStorage
    const saved = localStorage.getItem('savedWords')
    if (saved) {
      setSavedWords(JSON.parse(saved))
    }

    // Load Word of the Day
    loadWordOfTheDay()
  }, [])

  const loadWordOfTheDay = async () => {
    const today = new Date().getDate()
    const wordIndex = today % wordOfTheDayList.length
    const word = wordOfTheDayList[wordIndex]
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      if (response.ok) {
        const data = await response.json()
        setWordOfTheDay(data[0])
      }
    } catch (err) {
      console.log("Failed to load word of the day")
    }
  }

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

  // Voice Search
  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSearchTerm(transcript)
        searchWord(transcript)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognition.start()
    } else {
      alert("Voice recognition is not supported in this browser.")
    }
  }

  // Save Word
  const saveWord = (word: WordData) => {
    const newSavedWord: SavedWord = {
      word: word.word,
      timestamp: Date.now(),
      definition: word.meanings[0]?.definitions[0]?.definition || "No definition available"
    }
    
    const updatedSavedWords = [...savedWords, newSavedWord]
    setSavedWords(updatedSavedWords)
    localStorage.setItem('savedWords', JSON.stringify(updatedSavedWords))
  }

  const removeSavedWord = (wordToRemove: string) => {
    const updatedSavedWords = savedWords.filter(w => w.word !== wordToRemove)
    setSavedWords(updatedSavedWords)
    localStorage.setItem('savedWords', JSON.stringify(updatedSavedWords))
  }

  const isWordSaved = (word: string) => {
    return savedWords.some(w => w.word === word)
  }

  // Smart Suggestions
  const generateSuggestions = (input: string) => {
    if (input.length < 2) {
      setSuggestions([])
      return
    }
    
    const filtered = commonWords.filter(word => 
      word.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5)
    setSuggestions(filtered)
  }

  // Word Game
  const startWordGame = async () => {
    setGameMode(true)
    setGameScore(0)
    await loadRandomWord()
  }

  const loadRandomWord = async () => {
    const randomWord = commonWords[Math.floor(Math.random() * commonWords.length)]
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentGameWord(data[0])
      }
    } catch (err) {
      console.log("Failed to load game word")
    }
  }

  const handleGameGuess = (isCorrect: boolean) => {
    if (isCorrect) {
      setGameScore(prev => prev + 10)
    }
    loadRandomWord()
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

        {/* Feature Tabs */}
        <Tabs defaultValue="search" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="word-of-day" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Word of Day
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Words
            </TabsTrigger>
            <TabsTrigger value="game" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Word Game
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
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
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        generateSuggestions(e.target.value)
                      }}
                      className="pl-10"
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            onClick={() => {
                              setSearchTerm(suggestion)
                              setSuggestions([])
                              searchWord(suggestion)
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={startVoiceSearch}
                    disabled={isListening}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
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
                      <div className="flex gap-2">
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => isWordSaved(word.word) ? removeSavedWord(word.word) : saveWord(word)}
                        >
                          {isWordSaved(word.word) ? <Star className="h-4 w-4 fill-yellow-400" /> : <Star className="h-4 w-4" />}
                        </Button>
                      </div>
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
          </TabsContent>

          {/* Word of the Day Tab */}
          <TabsContent value="word-of-day">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Word of the Day</h2>
                </div>
                {wordOfTheDay ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-3xl font-bold text-gray-900">{wordOfTheDay.word}</h3>
                        {wordOfTheDay.phonetic && <p className="text-gray-600 text-lg">/{wordOfTheDay.phonetic}/</p>}
                      </div>
                      <div className="flex gap-2">
                        {wordOfTheDay.phonetics.find((p) => p.audio) && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const audioPhonetic = wordOfTheDay.phonetics.find((p) => p.audio)
                              if (audioPhonetic?.audio) {
                                playAudio(audioPhonetic.audio)
                              }
                            }}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => isWordSaved(wordOfTheDay.word) ? removeSavedWord(wordOfTheDay.word) : saveWord(wordOfTheDay)}
                        >
                          {isWordSaved(wordOfTheDay.word) ? <Star className="h-4 w-4 fill-yellow-400" /> : <Star className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {wordOfTheDay.meanings.map((meaning, index) => (
                      <div key={index} className="mb-4">
                        <Badge variant="secondary" className="mb-2">{meaning.partOfSpeech}</Badge>
                        <p className="text-gray-900">{meaning.definitions[0]?.definition}</p>
                        {meaning.definitions[0]?.example && (
                          <p className="text-gray-600 italic mt-2">
                            <span className="font-medium">Example: </span>
                            {meaning.definitions[0].example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Loading word of the day...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Words Tab */}
          <TabsContent value="saved">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Saved Words</h2>
                </div>
                {savedWords.length > 0 ? (
                  <div className="space-y-3">
                    {savedWords.map((savedWord, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-gray-900">{savedWord.word}</h3>
                          <p className="text-sm text-gray-600">{savedWord.definition}</p>
                          <p className="text-xs text-gray-500">
                            Saved on {new Date(savedWord.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchTerm(savedWord.word)
                              searchWord(savedWord.word)
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSavedWord(savedWord.word)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No saved words yet. Search for words and click the star to save them!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Word Game Tab */}
          <TabsContent value="game">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gamepad2 className="h-6 w-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Word Game</h2>
                </div>
                
                {!gameMode ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-6">
                      Test your vocabulary knowledge! Guess the meaning of words and earn points.
                    </p>
                    <Button onClick={startWordGame} className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Start Game
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-900">Score: {gameScore}</p>
                    </div>
                    
                    {currentGameWord && (
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{currentGameWord.word}</h3>
                        <p className="text-gray-600 mb-4">
                          What does "{currentGameWord.word}" mean?
                        </p>
                        
                        <div className="space-y-3">
                          {currentGameWord.meanings[0]?.definitions.slice(0, 3).map((def, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-start text-left h-auto p-4"
                              onClick={() => handleGameGuess(true)}
                            >
                              {def.definition}
                            </Button>
                          ))}
                        </div>
                        
                        <div className="mt-6">
                          <Button
                            variant="outline"
                            onClick={() => handleGameGuess(false)}
                          >
                            I don't know
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => setGameMode(false)}
                    >
                      End Game
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
