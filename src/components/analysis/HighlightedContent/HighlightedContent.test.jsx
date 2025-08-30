/**
 * HighlightedContent Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { setupTest, createMockCV, createMockJobDescription } from '@/test';
import HighlightedContent from './HighlightedContent';

const { getWrapper } = setupTest();

describe('HighlightedContent Component', () => {
  const mockCVData = createMockCV();
  const mockJDData = createMockJobDescription();
  
  const mockCVHighlighting = [
    {
      address: 'skills[0]',
      class: 'highlight-match',
      reason: 'JavaScript is a required skill'
    },
    {
      address: 'skills[1]',
      class: 'highlight-match',
      reason: 'React is a required skill'
    },
    {
      address: 'experience[0]',
      class: 'highlight-potential',
      reason: 'Related experience but different context'
    }
  ];
  
  const mockJDHighlighting = [
    {
      address: 'required_skills[0]',
      class: 'highlight-match',
      reason: 'Candidate has React experience'
    },
    {
      address: 'required_skills[1]',
      class: 'highlight-gap',
      reason: 'Candidate lacks TypeScript experience'
    }
  ];

  describe('CV Content Rendering', () => {
    it('should render personal information section', () => {
      render(<HighlightedContent type="cv" data={mockCVData} highlighting={[]} />);
      
      expect(screen.getByText('PERSONAL INFORMATION')).toBeInTheDocument();
      expect(screen.getByText(mockCVData.name)).toBeInTheDocument();
      expect(screen.getByText(mockCVData.email)).toBeInTheDocument();
      expect(screen.getByText(mockCVData.phone)).toBeInTheDocument();
      expect(screen.getByText(mockCVData.location)).toBeInTheDocument();
    });

    it('should render summary section', () => {
      render(<HighlightedContent type="cv" data={mockCVData} highlighting={[]} />);
      
      expect(screen.getByText('SUMMARY')).toBeInTheDocument();
      expect(screen.getByText(mockCVData.summary)).toBeInTheDocument();
    });

    it('should render skills section', () => {
      render(<HighlightedContent type="cv" data={mockCVData} highlighting={[]} />);
      
      expect(screen.getByText('SKILLS')).toBeInTheDocument();
      mockCVData.skills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });

    it('should render experience section', () => {
      render(<HighlightedContent type="cv" data={mockCVData} highlighting={[]} />);
      
      expect(screen.getByText('EXPERIENCE')).toBeInTheDocument();
      mockCVData.experience.forEach(exp => {
        expect(screen.getByText(exp.position)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(exp.company))).toBeInTheDocument();
      });
    });

    it('should render education section', () => {
      render(<HighlightedContent type="cv" data={mockCVData} highlighting={[]} />);
      
      expect(screen.getByText('EDUCATION')).toBeInTheDocument();
      mockCVData.education.forEach(edu => {
        expect(screen.getByText(edu.degree)).toBeInTheDocument();
        expect(screen.getByText(edu.institution)).toBeInTheDocument();
      });
    });

    it('should handle missing CV sections gracefully', () => {
      const partialCV = {
        personal: { name: 'Test User' },
        skills: ['JavaScript']
        // Missing other sections
      };
      
      render(<HighlightedContent type="cv" data={partialCV} highlighting={[]} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.queryByText('EXPERIENCE')).not.toBeInTheDocument();
      expect(screen.queryByText('EDUCATION')).not.toBeInTheDocument();
    });
  });

  describe('JD Content Rendering', () => {
    it('should render job title and company info', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText(mockJDData.job_title)).toBeInTheDocument();
      expect(screen.getByText(mockJDData.company_name)).toBeInTheDocument();
      expect(screen.getByText(mockJDData.location)).toBeInTheDocument();
    });

    it('should render required skills section', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText('REQUIRED SKILLS')).toBeInTheDocument();
      mockJDData.required_skills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });

    it('should render preferred skills section', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText('PREFERRED SKILLS')).toBeInTheDocument();
      mockJDData.preferred_skills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });

    it('should render experience requirements', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText('EXPERIENCE REQUIREMENTS')).toBeInTheDocument();
      mockJDData.required_experience.forEach(req => {
        expect(screen.getByText(req)).toBeInTheDocument();
      });
    });

    it('should render education requirements', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText('EDUCATION REQUIREMENTS')).toBeInTheDocument();
      mockJDData.required_education.forEach(edu => {
        expect(screen.getByText(edu)).toBeInTheDocument();
      });
    });

    it('should render key responsibilities', () => {
      render(<HighlightedContent type="jd" data={mockJDData} highlighting={[]} />);
      
      expect(screen.getByText('KEY RESPONSIBILITIES')).toBeInTheDocument();
      mockJDData.key_responsibilities.forEach(resp => {
        expect(screen.getByText(resp)).toBeInTheDocument();
      });
    });
  });

  describe('Highlighting Functionality', () => {
    it('should apply match highlighting to CV skills', () => {
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={mockCVHighlighting} 
      />);
      
      const javascriptSkill = screen.getByText('JavaScript');
      expect(javascriptSkill.parentElement).toHaveStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.2)'
      });
    });

    it('should apply gap highlighting to JD requirements', () => {
      render(<HighlightedContent 
        type="jd" 
        data={mockJDData} 
        highlighting={mockJDHighlighting} 
      />);
      
      const typescriptSkill = screen.getByText('TypeScript');
      expect(typescriptSkill.parentElement).toHaveStyle({
        backgroundColor: 'rgba(255, 107, 107, 0.2)'
      });
    });

    it('should show highlight reason as tooltip', () => {
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={mockCVHighlighting} 
      />);
      
      const javascriptSkill = screen.getByText('JavaScript');
      expect(javascriptSkill.parentElement).toHaveAttribute(
        'title', 
        'JavaScript is a required skill'
      );
    });

    it('should handle empty highlighting array', () => {
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={[]} 
      />);
      
      // Should render without any highlighting
      const skills = screen.getAllByText(/JavaScript|React|Node.js/);
      skills.forEach(skill => {
        expect(skill.parentElement).not.toHaveStyle({
          backgroundColor: expect.any(String)
        });
      });
    });

    it('should handle undefined highlighting', () => {
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={undefined} 
      />);
      
      // Should render without errors
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  describe('Highlight Classes', () => {
    it('should apply correct styles for highlight-match class', () => {
      const matchHighlight = [{
        address: 'skills[0]',
        class: 'highlight-match',
        reason: 'Perfect match'
      }];
      
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={matchHighlight} 
      />);
      
      const skill = screen.getByText('JavaScript');
      expect(skill.parentElement).toHaveStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        border: '1px solid rgba(0, 255, 0, 0.5)'
      });
    });

    it('should apply correct styles for highlight-potential class', () => {
      const potentialHighlight = [{
        address: 'skills[0]',
        class: 'highlight-potential',
        reason: 'Potential match'
      }];
      
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={potentialHighlight} 
      />);
      
      const skill = screen.getByText('JavaScript');
      expect(skill.parentElement).toHaveStyle({
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        border: '1px solid rgba(255, 165, 0, 0.5)'
      });
    });

    it('should apply correct styles for highlight-gap class', () => {
      const gapHighlight = [{
        address: 'skills[0]',
        class: 'highlight-gap',
        reason: 'Missing skill'
      }];
      
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={gapHighlight} 
      />);
      
      const skill = screen.getByText('JavaScript');
      expect(skill.parentElement).toHaveStyle({
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        border: '1px solid rgba(255, 107, 107, 0.5)'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data gracefully', () => {
      render(<HighlightedContent type="cv" data={null} highlighting={[]} />);
      
      expect(screen.getByText('No CV data available')).toBeInTheDocument();
    });

    it('should handle undefined data gracefully', () => {
      render(<HighlightedContent type="jd" data={undefined} highlighting={[]} />);
      
      expect(screen.getByText('No JD data available')).toBeInTheDocument();
    });

    it('should handle invalid highlight addresses', () => {
      const invalidHighlight = [{
        address: 'invalid[999]',
        class: 'highlight-match',
        reason: 'Invalid address'
      }];
      
      // Should not crash
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={invalidHighlight} 
      />);
      
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('should handle complex nested addresses', () => {
      const nestedHighlight = [{
        address: 'experience[0]',
        class: 'highlight-match',
        reason: 'Experience match'
      }];
      
      render(<HighlightedContent 
        type="cv" 
        data={mockCVData} 
        highlighting={nestedHighlight} 
      />);
      
      const experience = screen.getByText(mockCVData.experience[0].position);
      expect(experience.parentElement).toHaveStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.2)'
      });
    });
  });
});