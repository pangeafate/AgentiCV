import React, { useState, useEffect } from 'react';

const JDInput = ({ onJDReady, sessionId }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MIN_CHARS = 100;

  useEffect(() => {
    const savedJD = sessionStorage.getItem(`jd_${sessionId}`);
    if (savedJD) {
      setJobDescription(savedJD);
      setCharCount(savedJD.length);
      onJDReady(savedJD, savedJD.length >= MIN_CHARS);
    }
  }, [sessionId]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setJobDescription(text);
    setCharCount(text.length);
    sessionStorage.setItem(`jd_${sessionId}`, text);
    onJDReady(text, text.length >= MIN_CHARS);
  };

  const handleClear = () => {
    setJobDescription('');
    setCharCount(0);
    sessionStorage.removeItem(`jd_${sessionId}`);
    onJDReady('', false);
  };

  const handleSampleJD = () => {
    const sample = `We are seeking a Senior Software Engineer to join our growing team.

Required Skills:
- 5+ years of experience in software development
- Proficiency in Python, JavaScript, and React
- Experience with cloud platforms (AWS, Azure, or GCP)
- Strong understanding of RESTful APIs and microservices
- Experience with Docker and containerization

Responsibilities:
- Design and implement scalable backend services
- Collaborate with cross-functional teams
- Mentor junior developers
- Participate in code reviews and architectural decisions

Qualifications:
- Bachelor's degree in Computer Science or related field
- Excellent problem-solving skills
- Strong communication abilities`;
    
    setJobDescription(sample);
    setCharCount(sample.length);
    sessionStorage.setItem(`jd_${sessionId}`, sample);
    onJDReady(sample, true);
  };

  const isValid = charCount >= MIN_CHARS;

  return (
    <div className="jd-input-container" style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Job Description</h3>
        <div style={styles.actions}>
          <button onClick={handleSampleJD} style={styles.button}>
            Sample JD
          </button>
          <button onClick={handleClear} style={styles.button}>
            Clear
          </button>
        </div>
      </div>
      
      <textarea
        value={jobDescription}
        onChange={handleTextChange}
        placeholder="Paste the job description here (minimum 100 characters)..."
        style={styles.textarea}
      />
      
      <div style={styles.footer}>
        <span style={{
          ...styles.charCount,
          color: isValid ? '#00ff00' : '#ff6b6b'
        }}>
          {charCount} / {MIN_CHARS} characters
        </span>
        {isValid && <span style={styles.valid}>✓ Ready</span>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    fontFamily: '"JetBrains Mono", monospace'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  title: {
    color: '#00ff00',
    margin: 0,
    fontSize: '1.2rem'
  },
  actions: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.3s'
  },
  textarea: {
    width: '100%',
    minHeight: '300px',
    padding: '15px',
    backgroundColor: '#1a1a1a',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px'
  },
  charCount: {
    fontSize: '12px'
  },
  valid: {
    color: '#00ff00',
    fontSize: '14px'
  }
};

export default JDInput;