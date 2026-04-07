import { useState, useEffect } from 'react'
import QRGenerator from './components/QRGenerator'
import './App.css'

function App() {
  const [dark, setDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <main className="app">
      <button
        className="theme-toggle"
        onClick={() => setDark(d => !d)}
        aria-label="Toggle theme"
      >
        {dark ? '☀️' : '🌙'}
      </button>
      <QRGenerator />
    </main>
  )
}

export default App
