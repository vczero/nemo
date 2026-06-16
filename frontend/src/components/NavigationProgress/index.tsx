import { useEffect, useState } from 'react'
import { useNavigation } from 'react-router'

const NavigationProgress = () => {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) return

    setVisible(true)
    setProgress(10)

    const timers: number[] = []
    timers.push(window.setTimeout(() => setProgress(40), 100))
    timers.push(window.setTimeout(() => setProgress(70), 400))
    timers.push(window.setTimeout(() => setProgress(85), 1000))

    return () => {
      timers.forEach(window.clearTimeout)
    }
  }, [isLoading])

  useEffect(() => {
    if (isLoading || !visible) return

    setProgress(100)
    const hideTimer = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 250)

    return () => window.clearTimeout(hideTimer)
  }, [isLoading, visible])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  )
}

export default NavigationProgress
