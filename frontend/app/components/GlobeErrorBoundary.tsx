'use client'
import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { crashed: boolean }

export class GlobeErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) {
      return this.props.fallback ?? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b7f70', fontFamily: 'monospace', fontSize: 11 }}>
          3D globe niet beschikbaar op dit apparaat
        </div>
      )
    }
    return this.props.children
  }
}
