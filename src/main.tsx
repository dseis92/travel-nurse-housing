import React from 'react'
import ReactDOM from 'react-dom/client'
import Root from './Root'
import './index.css'
import './neumo/airbnb-theme.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
