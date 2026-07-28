import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type PropsWithChildren,
} from 'react'

export type AppPath =
  | '/'
  | '/dashboard'
  | '/estadias'
  | '/embarques'
  | '/captacao'
  | '/relatorios'
  | '/administracao'

const allowedPaths = new Set<AppPath>([
  '/',
  '/dashboard',
  '/estadias',
  '/embarques',
  '/captacao',
  '/relatorios',
  '/administracao',
])

function readPath(): AppPath {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return allowedPaths.has(path as AppPath) ? (path as AppPath) : '/'
}

type RouterValue = {
  path: AppPath
  navigate: (path: AppPath, replace?: boolean) => void
}

const RouterContext = createContext<RouterValue | null>(null)

export function AppRouter({ children }: PropsWithChildren) {
  const [path, setPath] = useState<AppPath>(readPath)

  useEffect(() => {
    const handlePopState = () => setPath(readPath())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const value = useMemo<RouterValue>(
    () => ({
      path,
      navigate: (nextPath, replace = false) => {
        if (replace) window.history.replaceState(null, '', nextPath)
        else window.history.pushState(null, '', nextPath)
        setPath(nextPath)
        window.scrollTo({ top: 0, behavior: 'auto' })
      },
    }),
    [path],
  )

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useAppRouter() {
  const context = useContext(RouterContext)
  if (!context) throw new Error('useAppRouter deve ser usado dentro de AppRouter')
  return context
}

export function AppLink({
  to,
  className,
  children,
  ...props
}: PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
    to: AppPath
    className?: string | ((active: boolean) => string)
  }
>) {
  const { path, navigate } = useAppRouter()
  const resolvedClassName = typeof className === 'function' ? className(path === to) : className

  return (
    <a
      {...props}
      href={to}
      className={resolvedClassName}
      onClick={(event) => {
        props.onClick?.(event)
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault()
          navigate(to)
        }
      }}
    >
      {children}
    </a>
  )
}
