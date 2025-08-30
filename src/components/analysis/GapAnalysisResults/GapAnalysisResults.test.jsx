/**
 * GapAnalysisResults Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, createMockCV, createMockJobDescription, createMockAnalysis } from '@/test';
import GapAnalysisResults from './GapAnalysisResults';

// Mock HighlightedContent component to simplify testing
jest.mock('../HighlightedContent', () => {
  return function MockHighlightedContent({ type, data, highlighting }) {
    return (
      <div data-testid={`highlighted-content-${type}`}>
        <div>Type: {type}</div>
        <div>Data: {JSON.stringify(data)}</div>
        <div>Highlights: {highlighting?.length || 0}</div>
      </div>
    );
  };
});

const { getWrapper } = setupTest();

describe('GapAnalysisResults Component', () => {
  const mockCV = createMockCV();
  const mockJD = createMockJobDescription();
  const mockAnalysis = createMockAnalysis();

  const defaultProps = {
    cvData: mockCV,
    jdData: mockJD,
    cvHighlighting: mockAnalysis.cv_highlighting,
    jdHighlighting: mockAnalysis.jd_highlighting,
    matchScores: mockAnalysis.match_score
  };

  describe('Component Rendering', () => {
    it('should render analysis header', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByText('Gap Analysis Results')).toBeInTheDocument();
    });

    it('should display match scores section', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByText('Match Scores')).toBeInTheDocument();
      expect(screen.getByText(/Overall Match:/)).toBeInTheDocument();
      expect(screen.getByText(/75%/)).toBeInTheDocument(); // Overall score from mock
    });

    it('should display all score categories', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByText(/Skills Match:/)).toBeInTheDocument();
      expect(screen.getByText(/70%/)).toBeInTheDocument();
      
      expect(screen.getByText(/Experience Match:/)).toBeInTheDocument();
      expect(screen.getByText(/80%/)).toBeInTheDocument();
      
      expect(screen.getByText(/Education Match:/)).toBeInTheDocument();
      expect(screen.getByText(/90%/)).toBeInTheDocument();
      
      expect(screen.getByText(/Qualifications:/)).toBeInTheDocument();
      expect(screen.getByText(/65%/)).toBeInTheDocument();
    });

    it('should render CV and JD sections', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByText('CV Analysis')).toBeInTheDocument();
      expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
    });

    it('should pass correct props to HighlightedContent components', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      const cvContent = screen.getByTestId('highlighted-content-cv');
      expect(cvContent).toBeInTheDocument();
      expect(cvContent).toHaveTextContent('Type: cv');
      expect(cvContent).toHaveTextContent('Highlights: 2'); // 2 highlights from mock
      
      const jdContent = screen.getByTestId('highlighted-content-jd');
      expect(jdContent).toBeInTheDocument();
      expect(jdContent).toHaveTextContent('Type: jd');
      expect(jdContent).toHaveTextContent('Highlights: 2'); // 2 highlights from mock
    });
  });

  describe('Score Color Coding', () => {
    it('should apply green color for high scores (>= 80)', () => {
      const highScoreProps = {
        ...defaultProps,
        matchScores: {
          overall: 85,
          skills: 90,
          experience: 95,
          education: 100,
          qualifications: 80
        }
      };
      
      render(<GapAnalysisResults {...highScoreProps} />);
      
      const overallScore = screen.getByText(/85%/);
      expect(overallScore).toHaveStyle({ color: '#00ff00' });
    });

    it('should apply orange color for medium scores (60-79)', () => {
      const mediumScoreProps = {
        ...defaultProps,
        matchScores: {
          overall: 70,
          skills: 65,
          experience: 75,
          education: 60,
          qualifications: 79
        }
      };
      
      render(<GapAnalysisResults {...mediumScoreProps} />);
      
      const overallScore = screen.getByText(/70%/);
      expect(overallScore).toHaveStyle({ color: '#ffa500' });
    });

    it('should apply red color for low scores (< 60)', () => {
      const lowScoreProps = {
        ...defaultProps,
        matchScores: {
          overall: 45,
          skills: 30,
          experience: 50,
          education: 40,
          qualifications: 55
        }
      };
      
      render(<GapAnalysisResults {...lowScoreProps} />);
      
      const overallScore = screen.getByText(/45%/);
      expect(overallScore).toHaveStyle({ color: '#ff6b6b' });
    });
  });

  describe('Missing Data Handling', () => {
    it('should handle missing CV data', () => {
      render(<GapAnalysisResults {...defaultProps} cvData={null} />);
      
      expect(screen.getByText('Gap Analysis Results')).toBeInTheDocument();
      expect(screen.getByTestId('highlighted-content-cv')).toHaveTextContent('Data: null');
    });

    it('should handle missing JD data', () => {
      render(<GapAnalysisResults {...defaultProps} jdData={null} />);
      
      expect(screen.getByText('Gap Analysis Results')).toBeInTheDocument();
      expect(screen.getByTestId('highlighted-content-jd')).toHaveTextContent('Data: null');
    });

    it('should handle missing match scores', () => {
      render(<GapAnalysisResults {...defaultProps} matchScores={null} />);
      
      expect(screen.getByText('Match Scores')).toBeInTheDocument();
      expect(screen.getByText(/Overall Match:/)).toBeInTheDocument();
      expect(screen.getByText(/0%/)).toBeInTheDocument(); // Should default to 0
    });

    it('should handle partial match scores', () => {
      const partialScores = {
        overall: 75,
        skills: 80
        // Missing experience, education, qualifications
      };
      
      render(<GapAnalysisResults {...defaultProps} matchScores={partialScores} />);
      
      expect(screen.getByText(/75%/)).toBeInTheDocument(); // Overall present
      expect(screen.getByText(/80%/)).toBeInTheDocument(); // Skills present
      expect(screen.getAllByText(/0%/).length).toBeGreaterThan(0); // Others default to 0
    });

    it('should handle empty highlighting arrays', () => {
      render(<GapAnalysisResults 
        {...defaultProps} 
        cvHighlighting={[]} 
        jdHighlighting={[]} 
      />);
      
      expect(screen.getByTestId('highlighted-content-cv')).toHaveTextContent('Highlights: 0');
      expect(screen.getByTestId('highlighted-content-jd')).toHaveTextContent('Highlights: 0');
    });

    it('should handle undefined highlighting arrays', () => {
      render(<GapAnalysisResults 
        {...defaultProps} 
        cvHighlighting={undefined} 
        jdHighlighting={undefined} 
      />);
      
      expect(screen.getByTestId('highlighted-content-cv')).toHaveTextContent('Highlights: 0');
      expect(screen.getByTestId('highlighted-content-jd')).toHaveTextContent('Highlights: 0');
    });
  });

  describe('Recommendations Section', () => {
    it('should display recommendations when provided', () => {
      const propsWithRecommendations = {
        ...defaultProps,
        recommendations: [
          'Learn TypeScript to improve match score',
          'Gain experience with GraphQL',
          'Add testing experience with Jest'
        ]
      };
      
      render(<GapAnalysisResults {...propsWithRecommendations} />);
      
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
      expect(screen.getByText(/Learn TypeScript/)).toBeInTheDocument();
      expect(screen.getByText(/Gain experience with GraphQL/)).toBeInTheDocument();
      expect(screen.getByText(/Add testing experience with Jest/)).toBeInTheDocument();
    });

    it('should not show recommendations section when empty', () => {
      render(<GapAnalysisResults {...defaultProps} recommendations={[]} />);
      
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });

    it('should not show recommendations section when undefined', () => {
      render(<GapAnalysisResults {...defaultProps} recommendations={undefined} />);
      
      expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should display color legend', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByText('Legend:')).toBeInTheDocument();
      expect(screen.getByText('Match')).toBeInTheDocument();
      expect(screen.getByText('Potential')).toBeInTheDocument();
      expect(screen.getByText('Gap')).toBeInTheDocument();
    });
  });

  describe('Score Bar Visualization', () => {
    it('should render score bars with correct width', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      // Find score bars by their parent containers
      const scoreBars = screen.getAllByText(/Match:/).map(element => {
        const bar = element.parentElement.querySelector('[style*="width"]');
        return bar;
      }).filter(Boolean);
      
      expect(scoreBars.length).toBeGreaterThan(0);
      
      // Check that bars have width corresponding to scores
      scoreBars.forEach(bar => {
        const width = bar.style.width;
        expect(width).toMatch(/\d+%/);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(<GapAnalysisResults {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Export Results/i })).toBeInTheDocument();
    });

    it('should handle export button click', async () => {
      const user = userEvent.setup();
      
      // Mock console.log to verify export action
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<GapAnalysisResults {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /Export Results/i });
      await user.click(exportButton);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Export'));
      
      consoleSpy.mockRestore();
    });
  });
});