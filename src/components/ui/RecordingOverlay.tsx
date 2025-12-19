"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Pause, Square, ChevronUp, ChevronDown } from "lucide-react";

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface RecordingOverlayProps {
  isRecording: boolean;
  onStop: () => void;
  onPause: () => void;
  isPaused?: boolean;
}

// Recording overlay with live transcript using Web Speech API
export function RecordingOverlay({ 
  isRecording, 
  onStop, 
  onPause, 
  isPaused = false 
}: RecordingOverlayProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs to track current state for use in callbacks (avoids stale closure)
  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  
  // Keep refs in sync with props
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  // Initialize and manage Web Speech API
  useEffect(() => {
    // Check browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      console.warn("Web Speech API not supported in this browser");
      return;
    }

    if (isRecording && !isPaused) {
      console.log("Starting speech recognition...");
      
      // Create new recognition instance
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "de-DE";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) {
              console.log("Final transcript:", text);
              setFinalTranscript(prev => [...prev, text]);
            }
          } else {
            interim += result[0].transcript;
          }
        }
        
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: Event & { error?: string }) => {
        console.error("Speech recognition error:", event.error || event);
        // If it's a "no-speech" error, we can safely restart
        if (event.error === "no-speech") {
          console.log("No speech detected, will restart...");
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended, checking if should restart...");
        // Use refs to get current state (avoids stale closure)
        if (isRecordingRef.current && !isPausedRef.current) {
          console.log("Restarting speech recognition...");
          // Small delay before restarting to avoid rapid restart loops
          setTimeout(() => {
            if (recognitionRef.current && isRecordingRef.current && !isPausedRef.current) {
              try {
                recognitionRef.current.start();
                console.log("Speech recognition restarted successfully");
              } catch (e) {
                console.error("Failed to restart recognition:", e);
              }
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      
      try {
        recognition.start();
        console.log("Speech recognition started successfully");
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }

      return () => {
        console.log("Cleaning up speech recognition...");
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignore errors on cleanup
          }
          recognitionRef.current = null;
        }
      };
    } else if (isPaused && recognitionRef.current) {
      // Pause recognition
      console.log("Pausing speech recognition...");
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
  }, [isRecording, isPaused]);

  // Auto-scroll transcript to bottom only if user is already at bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !transcriptEndRef.current) return;
    
    // Check if user is near the bottom (within 100px threshold)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Only auto-scroll if user is already at/near the bottom
    if (isNearBottom) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [finalTranscript, interimTranscript]);

  // Clear transcript when stopping
  useEffect(() => {
    if (!isRecording) {
      setFinalTranscript([]);
      setInterimTranscript("");
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isCollapsed ? "h-[60px]" : "h-[437px]"
      }`}
    >
      {/* Backdrop blur background */}
      <div className="absolute inset-0 backdrop-blur-lg bg-white/[0.04]" />
      
      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-6 top-6 z-10 p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        {isCollapsed ? (
          <ChevronUp className="w-6 h-6 text-white" />
        ) : (
          <ChevronDown className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Main container */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 top-4 bg-[rgba(31,35,41,0.8)] border border-white/10 rounded-[10px] overflow-hidden transition-all duration-300 ${
          isCollapsed 
            ? "w-[400px] h-[44px] px-4 py-3" 
            : "w-[896px] h-[409px] px-6 pt-6 pb-1"
        }`}
      >
        {isCollapsed ? (
          // Collapsed view - just the header
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#d56f6f] rounded-full animate-pulse" />
            <span className="font-mono text-sm text-[#b9b9b9] uppercase">Live Transcript</span>
            <span className="text-sm text-white/60 ml-4">Recording in progress...</span>
          </div>
        ) : (
          // Expanded view
          <div className="flex flex-col gap-4 h-full">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-[#787a7d]" : "bg-[#d56f6f] animate-pulse"}`} />
              <span className="font-mono text-base text-[#b9b9b9] uppercase">Live Transcript</span>
              {!isSupported && (
                <span className="text-xs text-[#d56f6f] ml-2">(Speech recognition not supported in this browser)</span>
              )}
            </div>

            {/* Transcript area */}
            <div className="flex gap-4 flex-1 min-h-0">
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-2">
                {finalTranscript.length === 0 && !interimTranscript ? (
                  <p className="text-base text-[#787a7d] italic">
                    {isSupported 
                      ? "Start speaking... Your words will appear here in real-time."
                      : "Speech recognition is not supported in this browser. Please use Chrome or Edge."
                    }
                  </p>
                ) : (
                  <>
                    {finalTranscript.map((text, index) => (
                      <p key={index} className="text-base text-[#f3f1eb] mb-3 leading-relaxed">
                        {text}
                      </p>
                    ))}
                    {interimTranscript && (
                      <p className="text-base text-[#b9b9b9] italic mb-3 leading-relaxed">
                        {interimTranscript}
                      </p>
                    )}
                    <div ref={transcriptEndRef} />
                  </>
                )}
              </div>
              {/* Scrollbar track */}
              <div className="w-1 bg-[#262b33] rounded-full h-full">
                <div className="w-1 h-16 bg-[#787a7d] rounded-full" />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-12 py-4">
              {/* Pause button */}
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-4 py-2 bg-[#4f5358] rounded-full hover:bg-[#5f6368] transition-colors"
              >
                <Pause className="w-4 h-4 text-white" />
                <span className="text-base text-white">{isPaused ? "RESUME" : "PAUSE"}</span>
              </button>

              {/* Recording indicator */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Pulsing rings */}
                <div className="absolute w-[141px] h-[141px] rounded-full border border-[#d56f6f]/30 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute w-[118px] h-[118px] rounded-full border border-[#d56f6f]/50 animate-ping" style={{ animationDuration: "1.5s" }} />
                <div className="absolute w-[85px] h-[85px] rounded-full border border-[#d56f6f]/70 animate-ping" style={{ animationDuration: "1s" }} />
                
                {/* Center mic icon */}
                <div className="relative z-10 w-14 h-14 bg-[#d56f6f]/20 rounded-full flex items-center justify-center">
                  <Mic className="w-6 h-6 text-[#d56f6f]" />
                </div>
                
                {/* Recording text */}
                <span className="absolute -bottom-8 text-base text-[#d56f6f] whitespace-nowrap">
                  {isPaused ? "PAUSED" : "RECORDING..."}
                </span>
              </div>

              {/* Stop button */}
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-4 py-2 bg-[#4f5358] rounded-full hover:bg-[#5f6368] transition-colors"
              >
                <Square className="w-4 h-4 text-white" />
                <span className="text-base text-white">STOP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Recording button component that toggles state
interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

export function RecordButton({ isRecording, onClick }: RecordButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-4 h-[45px] rounded-full font-normal transition-all duration-200 ${
        isRecording
          ? "bg-[#d56f6f] border border-[#d56f6f] text-[#1e1a1d]"
          : "bg-[var(--accent-primary)] text-[var(--text-dark)]"
      } hover:opacity-90`}
    >
      <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
      <span className="text-base">
        {isRecording ? "Recording..." : "Record Session"}
      </span>
    </button>
  );
}



