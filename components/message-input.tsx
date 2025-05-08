"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { ArrowUpIcon, StopIcon } from "./icons"
import { cn } from "@/lib/utils"
import { Mic } from "lucide-react"
import { toast } from "react-hot-toast"
import { motion } from "framer-motion"

export interface MessageInputProps {
  onSend: (message: string) => void
  className?: string
  isInitial?: boolean
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

// Add WAV encoder helper
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // RIFF identifier
  writeString(view, 0, "RIFF")
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true)
  // RIFF type
  writeString(view, 8, "WAVE")
  // format chunk identifier
  writeString(view, 12, "fmt ")
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (1 for PCM)
  view.setUint16(20, 1, true)
  // channel count
  view.setUint16(22, 1, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true)
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true)
  // bits per sample
  view.setUint16(34, 16, true)
  // data chunk identifier
  writeString(view, 36, "data")
  // data chunk length
  view.setUint32(40, samples.length * 2, true)

  // Write the PCM samples
  const length = samples.length
  let index = 44
  for (let i = 0; i < length; i++) {
    view.setInt16(index, samples[i] * 0x7fff, true)
    index += 2
  }

  return buffer
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

export function MessageInput({
  onSend,
  className,
  isInitial = false,
  isLoading = false,
  disabled,
  placeholder,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recordingStartTimeRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioBufferRef = useRef<Float32Array[]>([])
  const sampleRateRef = useRef<number>(44100)

  useEffect(() => {
    // Create audio element for playback
    audioRef.current = new Audio()
    audioRef.current.addEventListener("ended", () => setIsTranscribing(false))

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", () => setIsTranscribing(false))
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      stopRecording()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        const duration = Date.now() - recordingStartTimeRef.current
        setRecordingDuration(duration)
      }, 100)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 24 * 4) // 4 lines maximum
      textarea.style.height = `${newHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading || disabled) return
    onSend(message)
    setMessage("")
  }

  const handleSend = () => {
    if (!message.trim()) return

    if (isLoading && !isInitial) {
      // If loading, store the message and show toast
      setPendingMessage(message)
      toast.error("Please wait for the current response or click stop")
      return
    }

    onSend(message)
    setMessage("")
    setPendingMessage(null)
  }

  const handleStop = () => {
    if (pendingMessage) {
      // Restore pending message if exists
      setMessage(pendingMessage)
      setPendingMessage(null)
    }
    onSend("stop") // Send stop signal to parent
  }

  const detectSilence = (analyser: AnalyserNode, minDecibels: number) => {
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let silenceStart: number | null = null

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / bufferLength

      if (average < minDecibels) {
        if (silenceStart === null) {
          silenceStart = Date.now()
        } else if (Date.now() - silenceStart > 2000) {
          // 2 seconds of silence
          stopRecording()
          return
        }
      } else {
        silenceStart = null
      }

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(() => checkVolume())
      }
    }

    checkVolume()
  }

  const startRecording = async () => {
    try {
      setAudioChunks([])
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.minDecibels = -45
      analyserRef.current.maxDecibels = -10
      analyserRef.current.smoothingTimeConstant = 0.85
      analyserRef.current.fftSize = 1024

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        try {
          if (audioContextRef.current) {
            await audioContextRef.current.close()
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }

          const finalChunks = chunksRef.current
          if (finalChunks.length === 0) {
            toast.error("No audio recorded")
            return
          }

          const audioBlob = new Blob(finalChunks, { type: "audio/webm;codecs=opus" })
          if (audioBlob.size < 1000) {
            toast.error("Recording too short")
            return
          }

          setIsTranscribing(true)
          const formData = new FormData()
          formData.append("file", audioBlob)

          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || "Transcription failed")
            }

            const { transcription } = await response.json()
            if (transcription) {
              setMessage((prev) => prev + (prev ? " " : "") + transcription)
            } else {
              throw new Error("No transcription received")
            }
          } catch (error) {
            console.error("Error transcribing audio:", error)
            toast.error(error instanceof Error ? error.message : "Failed to transcribe audio")
          } finally {
            setIsTranscribing(false)
          }

          chunksRef.current = []
          setAudioChunks([])
        } catch (error) {
          console.error("Error processing recording:", error)
          toast.error("Failed to process recording")
          setIsTranscribing(false)
        }
      }

      setMediaRecorder(recorder)
      recorder.start(250)
      recordingStartTimeRef.current = Date.now()
      setIsRecording(true)

      if (analyserRef.current) {
        detectSilence(analyserRef.current, 10)
      }
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Failed to start recording")
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        console.log("Stopping recording...")

        // Request final data before stopping
        if (mediaRecorder.state === "recording") {
          mediaRecorder.requestData()
        }

        // Small delay to ensure we get the final chunk
        setTimeout(() => {
          try {
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach((track) => {
              track.stop()
              console.log("Track stopped:", track.kind, track.label)
            })
            setIsRecording(false)
          } catch (error) {
            console.error("Error in delayed stop:", error)
          }
        }, 250)

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current)
          silenceTimeoutRef.current = null
        }
      } catch (error) {
        console.error("Error stopping recording:", error)
        toast.error("Failed to stop recording")
      }
    }
  }

  const handleRecordingClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handlePlayback = () => {
    if (!audioRef.current || !lastRecordingUrl) return

    if (isTranscribing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsTranscribing(false)
    } else {
      audioRef.current.play()
      setIsTranscribing(true)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full pb-6 px-4", isInitial ? "flex-1 flex items-center justify-center" : "", className)}
    >
      <div className={cn("mx-auto max-w-3xl", isInitial && "w-full max-w-2xl")}>
        <div className="relative">
          <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 bg-zinc-800/50">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
              }}
              placeholder={placeholder || "Type a message..."}
              className={`w-full pl-6 pr-28 py-6 bg-transparent border-0 focus:ring-0 text-base resize-none outline-none text-white placeholder-zinc-500 transition-all duration-200 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{
                minHeight: "24px",
                maxHeight: "96px", // 4 lines
                height: "auto",
              }}
              rows={1}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />

            <div className="absolute right-4 bottom-4 flex items-center gap-2">
              <div className="relative">
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-red-500 rounded-full opacity-25" />
                  </motion.div>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 hover:bg-zinc-800 hover:text-white rounded-full relative",
                    isRecording && "bg-red-500/10 text-red-500",
                    isTranscribing && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={handleRecordingClick}
                  disabled={disabled || isLoading || isTranscribing}
                >
                  {isTranscribing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                {isRecording && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                    {formatDuration(recordingDuration)}
                  </div>
                )}
                {isTranscribing && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                    Transcribing...
                  </div>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 hover:bg-zinc-800 hover:text-white border rounded-full",
                  isLoading
                    ? "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20"
                    : "bg-zinc-500 text-zinc-700 border-zinc-700",
                )}
                onClick={isLoading ? handleStop : handleSend}
                disabled={(!message.trim() && !isLoading) || disabled || isTranscribing}
              >
                {isLoading ? <StopIcon size={16} /> : <ArrowUpIcon size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
