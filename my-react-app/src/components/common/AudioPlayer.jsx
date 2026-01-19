// src/components/common/AudioPlayer.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Loader } from 'lucide-react';

const AudioPlayer = ({ src, duration, title = "Call Recording" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forceNewTab, setForceNewTab] = useState(false);
  const audioRef = useRef(null);

  // Check if this is a Google Drive link that might have CORS issues
  const isGoogleDriveLink = src.includes('drive.google.com');

  // Debug logging
  console.log('AudioPlayer props:', { src, duration, title, isGoogleDriveLink });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Reset states when src changes
    setIsLoading(true);
    setError(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setForceNewTab(false);

    const handleLoadedData = () => {
      console.log('Audio loaded successfully');
      setIsLoading(false);
      setForceNewTab(false); // If it loads successfully, don't force new tab
    };
    
    const handleError = (e) => {
      console.error('Audio load error:', e);
      // Try to fetch as blob for CORS workaround
      fetchAudioAsBlob();
    };
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    const fetchAudioAsBlob = async () => {
      try {
        console.log('Attempting to fetch audio as blob...');
        
        // For Google Drive links, try alternative approaches
        let fetchUrl = src;
        if (src.includes('drive.google.com')) {
          // Try different Google Drive URL formats
          const fileId = src.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
          if (fileId) {
            // Try the direct download URL
            fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          }
        }
        
        // Try with no-cors mode first (this will be opaque but might work)
        let response;
        try {
          response = await fetch(fetchUrl, {
            mode: 'no-cors',
            credentials: 'omit'
          });
        } catch (noCorsError) {
          console.log('no-cors failed, trying cors mode');
          response = await fetch(fetchUrl, {
            mode: 'cors',
            credentials: 'omit'
          });
        }
        
        if (!response.ok && response.type !== 'opaque') {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // For opaque responses, we can't read the blob, so fall back to new tab
        if (response.type === 'opaque') {
          console.log('Opaque response, falling back to new tab');
          setForceNewTab(true);
          setIsLoading(false);
          return;
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Update audio src with blob URL
        audio.src = objectUrl;
        audio.load();
        
        // Clean up object URL when component unmounts
        return () => URL.revokeObjectURL(objectUrl);
      } catch (blobError) {
        console.error('Blob fetch failed:', blobError);
        
        // If blob fetch fails, fall back to new tab option
        setForceNewTab(true);
        setIsLoading(false);
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Set crossOrigin for CORS handling
    audio.crossOrigin = 'anonymous';
    
    // Try to load the audio directly first
    audio.load();

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * audio.duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <VolumeX className="w-8 h-8 mx-auto" />
        </div>
        <p className="text-red-800 font-medium mb-2">Audio Playback Error</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.open(src, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Open in New Tab
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              // Try to reload
              const audio = audioRef.current;
              if (audio) {
                audio.load();
              }
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Retry
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Download Audio
          </button>
        </div>
      </div>
    );
  }

  // If it's a Google Drive link and forced to new tab, try iframe embed first
  if (forceNewTab && isGoogleDriveLink) {
    const fileId = src.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
    const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                Duration: {duration ? formatTime(duration) : 'Unknown'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download Audio"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {embedUrl ? (
          <div className="mb-4">
            <iframe
              src={embedUrl}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay"
              className="rounded-lg border border-gray-200"
              title="Audio Player"
            />
          </div>
        ) : null}

        <div className="text-center">
          <p className="text-gray-600 text-sm mb-3">
            If the audio doesn't play above, use the button below:
          </p>
          <button
            onClick={() => window.open(src, '_blank')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            🎵 Open Audio in New Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            {isLoading ? (
              <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <Volume2 className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              Duration: {duration ? formatTime(duration) : 'Unknown'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Download recording"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div
            className="h-2 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-2 bg-blue-600 rounded-full relative"
              style={{
                width: audioRef.current?.duration
                  ? `${(currentTime / audioRef.current.duration) * 100}%`
                  : '0%'
              }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow-md"></div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <div className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || duration)}
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;