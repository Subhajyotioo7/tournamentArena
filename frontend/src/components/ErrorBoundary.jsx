import { Component } from 'react';
import ErrorPage from '../pages/ErrorPage';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled frontend error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage title="Page unavailable" message="The application hit an unexpected error. Refresh the page or return home." />;
    }

    return this.props.children;
  }
}
