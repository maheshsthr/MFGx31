import { Component } from 'react';
import ErrorPage from './ErrorPage';

/**
 * Catches render-time errors anywhere in the tree and shows a readable message
 * instead of an unmountable (blank) page. Also reports the error to the console
 * so it shows up in Vite's dev overlay / browser console.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Render error caught by ErrorBoundary:', error, info?.componentStack);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const fallback = this.props.fallback ?? <ErrorPage type="500" />;
    return fallback;
  }
}
