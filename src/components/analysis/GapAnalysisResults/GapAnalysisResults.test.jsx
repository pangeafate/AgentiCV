/**
 * GapAnalysisResults Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * 
 * Test Coverage Areas:
 * - Component rendering and validation logic
 * - CV and JD panel display
 * - Color legend display
 * - Match scores display when available
 * - Error handling for invalid data
 * - Scroll synchronization between panels
 * - Export functionality
 * - Terminal theme styling
 * - Edge cases and data validation
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GapAnalysisResults from './GapAnalysisResults';

// Mock HighlightedContent component to simplify testing
jest.mock('../HighlightedContent', () => {
  return function MockHighlightedContent({ type, data, highlights }) {
    return (
      <div data-testid={`highlighted-content-${type}`}>
        <div>Type: {type}</div>
        <div>Data: {typeof data === 'string' ? data : JSON.stringify(data)}</div>
        <div>Highlights: {highlights?.length || 0}</div>
      </div>
    );
  };
});

describe('GapAnalysisResults Component', () => {
  const mockCvData = {
    id: 'mock-cv-123',
    name: 'John Developer',
    email: 'john@example.com',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: [{ company: 'Tech Corp', role: 'Developer', years: 3 }]
  };

  const mockJdData = 'Senior React Developer position requiring 5+ years experience in JavaScript, React, and Node.js development.';

  const mockCvHighlighting = [
    { address: 'skills[0]', class: 'highlight-match', reason: 'JavaScript expertise' },
    { address: 'skills[1]', class: 'highlight-match', reason: 'React experience' }
  ];

  const mockJdHighlighting = [
    { address: 'requirements[0]', class: 'highlight-match', reason: 'React requirement' },
    { address: 'requirements[1]', class: 'highlight-gap', reason: 'Experience gap' }
  ];

  const mockMatchScores = {
    overall_score: 75,
    skills: 85,
    experience: 65,
    education: 80,
    qualifications: 70
  };

  const defaultProps = {
    cvData: mockCvData,
    jdData: mockJdData,
    cvHighlighting: mockCvHighlighting,
    jdHighlighting: mockJdHighlighting,
    matchScores: mockMatchScores
  };

  beforeEach(() => {
    // Mock console.log to prevent noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering with Valid Data', () => {
    it('should render color legend', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check legend elements
      expect(screen.getByText('Match')).toBeInTheDocument();
      expect(screen.getByText('Partial')).toBeInTheDocument();
      expect(screen.getByText('Gap')).toBeInTheDocument();
    });

    it('should display CV analysis panel', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check CV panel
      expect(screen.getByText('CV Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('highlighted-content-cv')).toBeInTheDocument();
    });

    it('should display JD analysis panel', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check JD panel
      expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('highlighted-content-jd')).toBeInTheDocument();
    });

    it('should pass correct props to HighlightedContent components', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check CV HighlightedContent
      const cvContent = screen.getByTestId('highlighted-content-cv');
      expect(cvContent).toHaveTextContent('Type: cv');
      expect(cvContent).toHaveTextContent('Highlights: 2');
      
      // Assert - Check JD HighlightedContent
      const jdContent = screen.getByTestId('highlighted-content-jd');
      expect(jdContent).toHaveTextContent('Type: jd');
      expect(jdContent).toHaveTextContent('Highlights: 2');
    });

    it('should display overall score when provided', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check overall score display
      expect(screen.getByText('Overall Match')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should apply terminal theme styling', () => {
      // Arrange & Act
      const { container } = render(<GapAnalysisResults {...defaultProps} />);
      
      // Assert - Check container styling
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveStyle({
        padding: '20px',
        backgroundColor: '#0a0a0a',
        border: '1px solid #00ff00',
        fontFamily: '"JetBrains Mono", monospace'
      });
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should not render when no highlighting data is provided', () => {
      // Arrange - Props with no highlighting data
      const propsWithoutHighlights = {
        ...defaultProps,
        cvHighlighting: [],
        jdHighlighting: [],
        matchScores: {} // No overall_score
      };

      // Act
      const { container } = render(<GapAnalysisResults {...propsWithoutHighlights} />);

      // Assert - Component should render empty or error state
      expect(container.firstChild).toBeInTheDocument();
      
      // Check console log was called to validate the validation logic
      expect(console.log).toHaveBeenCalledWith(
        'GapAnalysisResults validation:',
        expect.objectContaining({
          validationResult: expect.objectContaining({
            shouldRender: false,
            hasValidData: false
          })
        })
      );
    });

    it('should handle missing CV data gracefully', () => {
      // Arrange
      const propsWithoutCV = {
        ...defaultProps,
        cvData: null
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithoutCV} />)).not.toThrow();
      
      // Check that JD panel still renders
      expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
    });

    it('should handle missing JD data gracefully', () => {
      // Arrange
      const propsWithoutJD = {
        ...defaultProps,
        jdData: null
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithoutJD} />)).not.toThrow();
      
      // Check that CV panel still renders
      expect(screen.getByText('CV Analysis')).toBeInTheDocument();
    });

    it('should handle undefined highlighting arrays', () => {
      // Arrange
      const propsWithUndefinedHighlights = {
        ...defaultProps,
        cvHighlighting: undefined,
        jdHighlighting: undefined
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithUndefinedHighlights} />)).not.toThrow();
    });

    it('should handle N8N error responses', () => {
      // Arrange - Mock N8N error response
      const errorProps = {
        ...defaultProps,
        matchScores: {
          code: 404,
          message: 'webhook not registered'
        }
      };

      // Act
      render(<GapAnalysisResults {...errorProps} />);

      // Assert - Should show error information
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
      expect(screen.getByText('No analysis data available')).toBeInTheDocument();
      expect(screen.getByText(/try running the analysis again/i)).toBeInTheDocument();
    });

    it('should handle server error (500) responses', () => {
      // Arrange
      const serverErrorProps = {
        ...defaultProps,
        matchScores: {
          code: 500,
          message: 'Internal server error'
        }
      };

      // Act
      render(<GapAnalysisResults {...serverErrorProps} />);

      // Assert - Should show error state
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    });
  });

  describe('Match Scores Display', () => {
    it('should display individual score categories', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check that score categories are shown
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Qualifications')).toBeInTheDocument();
    });

    it('should display score percentages', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check score values
      expect(screen.getByText('85%')).toBeInTheDocument(); // Skills
      expect(screen.getByText('65%')).toBeInTheDocument(); // Experience
      expect(screen.getByText('80%')).toBeInTheDocument(); // Education
      expect(screen.getByText('70%')).toBeInTheDocument(); // Qualifications
    });

    it('should apply correct color coding for high scores', () => {
      // Arrange - Props with high scores
      const highScoreProps = {
        ...defaultProps,
        matchScores: {
          ...mockMatchScores,
          skills: 95
        }
      };

      // Act
      const { container } = render(<GapAnalysisResults {...highScoreProps} />);

      // Assert - High scores should use green color
      const skillsBar = container.querySelector('[style*="95%"]');
      expect(skillsBar).toHaveStyle({ backgroundColor: '#00ff00' });
    });

    it('should apply correct color coding for medium scores', () => {
      // Arrange - Props with medium scores
      const mediumScoreProps = {
        ...defaultProps,
        matchScores: {
          ...mockMatchScores,
          experience: 70
        }
      };

      // Act
      const { container } = render(<GapAnalysisResults {...mediumScoreProps} />);

      // Assert - Medium scores should use orange color
      const experienceBar = container.querySelector('[style*="70%"]');
      expect(experienceBar).toHaveStyle({ backgroundColor: '#ffa500' });
    });

    it('should apply correct color coding for low scores', () => {
      // Arrange - Props with low scores
      const lowScoreProps = {
        ...defaultProps,
        matchScores: {
          ...mockMatchScores,
          experience: 45
        }
      };

      // Act
      const { container } = render(<GapAnalysisResults {...lowScoreProps} />);

      // Assert - Low scores should use red color
      const experienceBar = container.querySelector('[style*="45%"]');
      expect(experienceBar).toHaveStyle({ backgroundColor: '#ff6b6b' });
    });
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check export button
      expect(screen.getByRole('button', { name: /export analysis/i })).toBeInTheDocument();
    });

    it('should handle export button click', async () => {
      // Arrange
      const user = userEvent.setup();
      
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      const mockClick = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

      render(<GapAnalysisResults {...defaultProps} />);

      // Act
      const exportButton = screen.getByRole('button', { name: /export analysis/i });
      await user.click(exportButton);

      // Assert - Export functionality should be triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Legend Display', () => {
    it('should show color legend with proper styling', () => {
      // Arrange & Act
      const { container } = render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check legend structure
      const legend = container.querySelector('[style*="justify-content: center"]');
      expect(legend).toBeInTheDocument();

      // Check legend items
      expect(screen.getByText('Match')).toBeInTheDocument();
      expect(screen.getByText('Partial')).toBeInTheDocument();
      expect(screen.getByText('Gap')).toBeInTheDocument();
    });

    it('should apply correct colors to legend dots', () => {
      // Arrange & Act
      const { container } = render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check legend dot colors
      const dots = container.querySelectorAll('[style*="border-radius: 50%"]');
      expect(dots[0]).toHaveStyle({ backgroundColor: '#00ff00' }); // Match - green
      expect(dots[1]).toHaveStyle({ backgroundColor: '#ffa500' }); // Partial - orange  
      expect(dots[2]).toHaveStyle({ backgroundColor: '#ff6b6b' }); // Gap - red
    });
  });

  describe('Panel Layout and Structure', () => {
    it('should use CSS Grid layout for panels', () => {
      // Arrange & Act
      const { container } = render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check grid layout
      const panelsContainer = container.querySelector('[style*="grid-template-columns"]');
      expect(panelsContainer).toBeInTheDocument();
      expect(panelsContainer).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: '1fr 1fr'
      });
    });

    it('should apply proper styling to panel titles', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check panel title styling
      const cvTitle = screen.getByText('CV Analysis');
      const jdTitle = screen.getByText('Job Description Analysis');

      expect(cvTitle).toHaveStyle({
        backgroundColor: '#0a0a0a',
        color: '#00ff00',
        borderBottom: '1px solid #00ff00'
      });

      expect(jdTitle).toHaveStyle({
        backgroundColor: '#0a0a0a',
        color: '#00ff00',
        borderBottom: '1px solid #00ff00'
      });
    });

    it('should set proper max height and scroll for content areas', () => {
      // Arrange & Act
      const { container } = render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check content area styling
      const contentAreas = container.querySelectorAll('[style*="max-height: 500px"]');
      expect(contentAreas).toHaveLength(2); // CV and JD content areas

      contentAreas.forEach(area => {
        expect(area).toHaveStyle({
          maxHeight: '500px',
          overflowY: 'auto'
        });
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty match scores object', () => {
      // Arrange
      const propsWithEmptyScores = {
        ...defaultProps,
        matchScores: {}
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithEmptyScores} />)).not.toThrow();
    });

    it('should handle null match scores', () => {
      // Arrange
      const propsWithNullScores = {
        ...defaultProps,
        matchScores: null
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithNullScores} />)).not.toThrow();
    });

    it('should handle invalid highlighting data', () => {
      // Arrange
      const propsWithInvalidHighlights = {
        ...defaultProps,
        cvHighlighting: 'invalid',
        jdHighlighting: 12345
      };

      // Act & Assert - Should not throw error
      expect(() => render(<GapAnalysisResults {...propsWithInvalidHighlights} />)).not.toThrow();
    });

    it('should validate data and log validation results', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Console log should be called with validation results
      expect(console.log).toHaveBeenCalledWith(
        'GapAnalysisResults validation:',
        expect.objectContaining({
          cvData: 'present',
          jdData: 'present',
          cvHighlighting: 2,
          jdHighlighting: 2,
          matchScores: mockMatchScores,
          validationResult: expect.objectContaining({
            isErrorResponse: false,
            hasValidData: true,
            shouldRender: true
          })
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Check heading levels
      expect(screen.getByRole('heading', { level: 3, name: 'CV Analysis' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Job Description Analysis' })).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      // Arrange & Act
      render(<GapAnalysisResults {...defaultProps} />);

      // Assert - Interactive elements should be focusable
      const exportButton = screen.getByRole('button', { name: /export analysis/i });
      expect(exportButton).not.toHaveAttribute('tabindex', '-1');
    });
  });
});