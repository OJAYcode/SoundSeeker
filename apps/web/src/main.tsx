import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { IdentifyResponse, TrackInfo } from '@soundseeker/shared';
import './styles.css';

type Screen = 'home' | 'listening' | 'identifying' | 'result' | 'message' | 'privacy';
const HISTORY_KEY = 'soundseeker-history';
const mimeTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
const history = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as TrackInfo[];
  } catch {
    return [];
  }
};

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [seconds, setSeconds] = useState(8);
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [note, setNote] = useState('');
  const [recent, setRecent] = useState<TrackInfo[]>(history);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const clean = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((item) => item.stop());
    stream.current = null;
  };
  useEffect(() => clean, []);
  const message = (value: string) => {
    setNote(value);
    setScreen('message');
  };
  const save = (item: TrackInfo) => {
    const next = [
      item,
      ...recent.filter((old) => `${old.title}${old.artists}` !== `${item.title}${item.artists}`),
    ].slice(0, 20);
    setRecent(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };
  const identify = async (audio: Blob) => {
    setScreen('identifying');
    try {
      const form = new FormData();
      form.set('audio', audio, 'recording');
      const response = await fetch('/api/identify', { method: 'POST', body: form });
      const data = (await response.json()) as IdentifyResponse;
      if (!response.ok || data.status === 'error')
        return message(
          data.status === 'error' ? data.message : 'A small interruption. Please try again.',
        );
      if (data.status === 'no_match')
        return message(
          'Nothing clear yet. Move closer to the music, reduce noise, then listen again.',
        );
      if (data.status === 'quota_exceeded')
        return message('We’ve reached today’s listening limit. Please come back tomorrow.');
      setTrack(data.track);
      save(data.track);
      setScreen('result');
    } catch {
      message(
        navigator.onLine
          ? 'Couldn’t reach SoundSeeker. Check your connection and try again.'
          : 'You’re offline. Recent finds are still available.',
      );
    }
  };
  const cancel = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    else {
      clean();
      setScreen('home');
    }
  };
  const listen = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
      return message(
        'Recording is not available in this browser. Try a current version of Safari, Chrome, or Edge.',
      );
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      stream.current = media;
      const type = mimeTypes.find((item) => MediaRecorder.isTypeSupported(item));
      const next = new MediaRecorder(media, type ? { mimeType: type } : undefined);
      recorder.current = next;
      const chunks: BlobPart[] = [];
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      next.onstop = () => {
        clean();
        void identify(new Blob(chunks, { type: next.mimeType }));
      };
      setSeconds(8);
      setScreen('listening');
      next.start();
      timer.current = window.setInterval(
        () =>
          setSeconds((value) => {
            if (value <= 1) {
              next.stop();
              return 0;
            }
            return value - 1;
          }),
        1000,
      );
    } catch (error) {
      message(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone access is off. Enable it for SoundSeeker in browser or device settings, then try again.'
          : 'No microphone found. Connect one or try another device.',
      );
    }
  };
  const home = () => {
    setTrack(null);
    setScreen('home');
  };
  return (
    <main className="app-shell">
      <header className="masthead">
        <span className="mark">◉</span>
        <span>SoundSeeker</span>
        <button className="quiet-button" onClick={() => setScreen('privacy')} type="button">
          Privacy
        </button>
      </header>
      {screen === 'home' && (
        <section className="hero">
          <p className="eyebrow">
            <span>Hear what’s around you</span>
          </p>
          <h1>
            <span>Find the song</span>
            <span className="headline-accent">in the moment.</span>
          </h1>
          <p className="intro">Hold your phone near the music. We’ll listen for eight seconds.</p>
          <button className="listen-button" onClick={() => void listen()} type="button">
            <i>⌁</i>Tap to listen
          </button>
          <p className="ambient-caption">
            <span>Private listening</span>
            <b>·</b>
            <span>Eight seconds</span>
            <b>·</b>
            <span>Any platform</span>
          </p>
          {recent.length > 0 && (
            <section className="history">
              <div>
                <h2>Recent finds</h2>
                <button
                  className="quiet-button"
                  onClick={() => {
                    localStorage.removeItem(HISTORY_KEY);
                    setRecent([]);
                  }}
                  type="button"
                >
                  Clear
                </button>
              </div>
              {recent.map((item) => (
                <button
                  key={`${item.title}${item.artists}`}
                  onClick={() => {
                    setTrack(item);
                    setScreen('result');
                  }}
                  type="button"
                >
                  <i />{' '}
                  <span>
                    <b>{item.title}</b>
                    <small>{item.artists.join(', ')}</small>
                  </span>
                  <em>↗</em>
                </button>
              ))}
            </section>
          )}
        </section>
      )}
      {screen === 'listening' && (
        <section className="state-card">
          <p className="eyebrow">Listening now</p>
          <div className="sound-field">
            <span />
            <span />
            <span />
            <b>{seconds}</b>
          </div>
          <h1>Stay close to the sound.</h1>
          <p className="intro">We’ll stop automatically in a moment.</p>
          <button className="text-button" onClick={cancel} type="button">
            Cancel
          </button>
        </section>
      )}
      {screen === 'identifying' && (
        <section className="state-card">
          <p className="eyebrow">Finding the match</p>
          <div className="spinner" />
          <h1>Listening back.</h1>
          <p className="intro">This usually takes just a few seconds.</p>
        </section>
      )}
      {screen === 'message' && (
        <section className="state-card">
          <p className="eyebrow">SoundSeeker</p>
          <h1>One moment.</h1>
          <p className="intro">{note}</p>
          <button className="listen-button compact" onClick={home} type="button">
            Try again
          </button>
        </section>
      )}
      {screen === 'privacy' && (
        <section className="state-card">
          <p className="eyebrow">Privacy</p>
          <h1>Short and simple.</h1>
          <p className="intro">
            SoundSeeker sends a short recording to ACRCloud only to identify music. We do not store
            recordings. Recent identifications are saved only in this browser until you clear them.
          </p>
          <button className="text-button" onClick={home} type="button">
            Back to SoundSeeker
          </button>
        </section>
      )}
      {screen === 'result' && track && <Result track={track} again={home} />}
      <p className="privacy-note">Audio is used to identify a song, then discarded.</p>
    </main>
  );
}

function Result({ track, again }: { track: TrackInfo; again: () => void }) {
  const platforms: Array<[keyof TrackInfo['platformLinks'], string]> = [
    ['spotify', 'Spotify'],
    ['appleMusic', 'Apple Music'],
    ['youtubeMusic', 'YouTube Music'],
    ['audiomack', 'Audiomack'],
  ];
  return (
    <section className="result">
      <div className="cover">
        {track.coverArtUrl ? <img src={track.coverArtUrl} alt="" /> : '⌁'}
      </div>
      <p className="eyebrow">We found it</p>
      <h1>{track.title}</h1>
      <p className="artist-line">{track.artists.join(', ')}</p>
      {(track.album || track.releaseYear) && (
        <p className="metadata">{[track.album, track.releaseYear].filter(Boolean).join(' · ')}</p>
      )}
      <div className="platforms">
        <p>Take it with you</p>
        {platforms.map(([key, label]) => (
          <a href={track.platformLinks[key]} key={key} target="_blank" rel="noreferrer">
            {track.directPlatforms.includes(key) ? `Open in ${label}` : `Search on ${label}`}{' '}
            <span>↗</span>
          </a>
        ))}
      </div>
      <button className="text-button" onClick={again} type="button">
        Identify another
      </button>
    </section>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
