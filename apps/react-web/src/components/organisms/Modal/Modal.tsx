import React from 'react';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Define the main Modal component with compound component properties
interface ModalComponent extends React.FC<ModalProps> {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
}

const ModalMain: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-content ${className}`}>
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export const Modal = ModalMain as ModalComponent;

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  className = ''
}) => {
  return (
    <div className={`modal-header ${className}`}>
      {children}
      {onClose && (
        <button className="close-btn" onClick={onClose}>×</button>
      )}
    </div>
  );
};

export const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
};

// Compound component
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
