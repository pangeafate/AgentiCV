/**
 * UI Component Mocks
 * Following GL-TESTING-GUIDELINES.md
 */

import React from 'react';

/**
 * Mock React Router components
 */
export const RouterMocks = {
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default'
  })),
  useParams: jest.fn(() => ({})),
  MemoryRouter: ({ children }) => React.createElement('div', { 'data-testid': 'memory-router' }, children),
  Link: ({ to, children, ...props }) => 
    React.createElement('a', { href: to, ...props, 'data-testid': 'router-link' }, children)
};

/**
 * Mock file input component for upload testing
 */
export const FileInputMock = React.forwardRef(({ onChange, accept, multiple, ...props }, ref) => {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event);
    }
  };

  return React.createElement('input', {
    ref,
    type: 'file',
    accept,
    multiple,
    onChange: handleChange,
    'data-testid': 'file-input-mock',
    ...props
  });
});

FileInputMock.displayName = 'FileInputMock';

/**
 * Mock progress component for upload testing
 */
export const ProgressMock = ({ value, max = 100, children, ...props }) => 
  React.createElement('div', {
    'data-testid': 'progress-mock',
    'data-value': value,
    'data-max': max,
    ...props
  }, children || `${value}%`);

/**
 * Mock modal/dialog component
 */
export const ModalMock = ({ isOpen, onClose, children, title, ...props }) => {
  if (!isOpen) return null;
  
  return React.createElement('div', {
    'data-testid': 'modal-mock',
    'data-title': title,
    role: 'dialog',
    'aria-modal': 'true',
    ...props
  }, [
    React.createElement('button', {
      key: 'close-btn',
      onClick: onClose,
      'data-testid': 'modal-close',
      'aria-label': 'Close'
    }, '×'),
    React.createElement('div', {
      key: 'content',
      'data-testid': 'modal-content'
    }, children)
  ]);
};

/**
 * Mock loading spinner component
 */
export const LoadingSpinnerMock = ({ size = 'medium', color = 'primary', ...props }) =>
  React.createElement('div', {
    'data-testid': 'loading-spinner',
    'data-size': size,
    'data-color': color,
    className: `spinner-${size} spinner-${color}`,
    ...props
  }, 'Loading...');

/**
 * Mock button component with loading state
 */
export const ButtonMock = ({ 
  children, 
  loading = false, 
  disabled = false, 
  variant = 'primary',
  size = 'medium',
  onClick,
  ...props 
}) => {
  const handleClick = (event) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return React.createElement('button', {
    onClick: handleClick,
    disabled: disabled || loading,
    'data-testid': 'button-mock',
    'data-loading': loading,
    'data-variant': variant,
    'data-size': size,
    className: `btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''}`,
    ...props
  }, loading ? 'Loading...' : children);
};

/**
 * Mock form components
 */
export const FormMocks = {
  Input: ({ label, error, ...props }) =>
    React.createElement('div', { 'data-testid': 'input-wrapper' }, [
      label && React.createElement('label', { key: 'label' }, label),
      React.createElement('input', {
        key: 'input',
        'data-testid': 'form-input',
        'data-error': !!error,
        ...props
      }),
      error && React.createElement('span', {
        key: 'error',
        'data-testid': 'input-error',
        className: 'error'
      }, error)
    ]),

  TextArea: ({ label, error, ...props }) =>
    React.createElement('div', { 'data-testid': 'textarea-wrapper' }, [
      label && React.createElement('label', { key: 'label' }, label),
      React.createElement('textarea', {
        key: 'textarea',
        'data-testid': 'form-textarea',
        'data-error': !!error,
        ...props
      }),
      error && React.createElement('span', {
        key: 'error',
        'data-testid': 'textarea-error',
        className: 'error'
      }, error)
    ]),

  Select: ({ label, error, options = [], ...props }) =>
    React.createElement('div', { 'data-testid': 'select-wrapper' }, [
      label && React.createElement('label', { key: 'label' }, label),
      React.createElement('select', {
        key: 'select',
        'data-testid': 'form-select',
        'data-error': !!error,
        ...props
      }, options.map((option, index) =>
        React.createElement('option', {
          key: index,
          value: option.value
        }, option.label)
      )),
      error && React.createElement('span', {
        key: 'error',
        'data-testid': 'select-error',
        className: 'error'
      }, error)
    ])
};

/**
 * Mock toast/notification component
 */
export const ToastMock = ({ type = 'info', message, onClose, ...props }) =>
  React.createElement('div', {
    'data-testid': 'toast-mock',
    'data-type': type,
    className: `toast toast-${type}`,
    role: 'alert',
    ...props
  }, [
    React.createElement('span', {
      key: 'message',
      'data-testid': 'toast-message'
    }, message),
    onClose && React.createElement('button', {
      key: 'close',
      onClick: onClose,
      'data-testid': 'toast-close',
      'aria-label': 'Close notification'
    }, '×')
  ]);

/**
 * Mock drag and drop component
 */
export const DropzoneMock = ({ 
  onDrop, 
  onDragOver, 
  onDragLeave,
  accept = '',
  multiple = false,
  disabled = false,
  children,
  ...props 
}) => {
  const handleDrop = (event) => {
    event.preventDefault();
    if (!disabled && onDrop) {
      const files = Array.from(event.dataTransfer?.files || []);
      onDrop(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled && onDragOver) {
      onDragOver(event);
    }
  };

  const handleDragLeave = (event) => {
    if (!disabled && onDragLeave) {
      onDragLeave(event);
    }
  };

  return React.createElement('div', {
    onDrop: handleDrop,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    'data-testid': 'dropzone-mock',
    'data-accept': accept,
    'data-multiple': multiple,
    'data-disabled': disabled,
    className: `dropzone ${disabled ? 'dropzone-disabled' : ''}`,
    ...props
  }, children);
};

/**
 * Factory for creating custom component mocks
 */
export const ComponentMockFactory = {
  /**
   * Create a simple component mock with custom props
   */
  createSimpleMock: (displayName, defaultProps = {}) => {
    const MockComponent = (props) =>
      React.createElement('div', {
        'data-testid': `${displayName.toLowerCase()}-mock`,
        ...defaultProps,
        ...props
      }, props.children);
    
    MockComponent.displayName = `${displayName}Mock`;
    return MockComponent;
  },

  /**
   * Create a mock with controlled state
   */
  createStatefulMock: (displayName, initialState = {}) => {
    const MockComponent = (props) => {
      const [state, setState] = React.useState({ ...initialState, ...props.initialState });
      
      React.useImperativeHandle(props.ref, () => ({
        getState: () => state,
        setState: (newState) => setState(prev => ({ ...prev, ...newState }))
      }));

      return React.createElement('div', {
        'data-testid': `${displayName.toLowerCase()}-stateful-mock`,
        'data-state': JSON.stringify(state),
        ...props
      }, props.children);
    };
    
    MockComponent.displayName = `${displayName}StatefulMock`;
    return React.forwardRef(MockComponent);
  }
};