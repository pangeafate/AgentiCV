import React from 'react';

const HighlightedContent = ({ data, highlights = [], type }) => {
  // Helper function to check if an item should be highlighted
  const getHighlightForAddress = (address) => {
    return highlights.find(h => h.address === address);
  };

  // Parse address like "skills[0]" to get the field and index
  const parseAddress = (address) => {
    const match = address.match(/(\w+)\[(\d+)\]/);
    if (match) {
      return { field: match[1], index: parseInt(match[2]) };
    }
    return null;
  };

  const renderCVData = () => {
    if (!data) return <p>No CV data available</p>;

    return (
      <div>
        {/* Personal Info */}
        {data.full_name && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>PERSONAL</h4>
            <p>Name: {data.full_name}</p>
            {data.email && <p>Email: {data.email}</p>}
            {data.phone && <p>Phone: {data.phone}</p>}
            {data.location && <p>Location: {data.location}</p>}
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>SKILLS</h4>
            <ul style={styles.list}>
              {data.skills.map((skill, idx) => {
                const highlight = getHighlightForAddress(`skills[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {skill}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>EXPERIENCE</h4>
            {data.experience.map((exp, idx) => {
              const highlight = getHighlightForAddress(`experience[${idx}]`);
              const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
              return (
                <div 
                  key={idx} 
                  style={{ ...styles.experience, ...highlightStyle }}
                  title={highlight?.reason}
                >
                  {exp.position && <strong>{exp.position}</strong>}
                  {exp.company && <span> at {exp.company}</span>}
                  {exp.duration && <span> ({exp.duration})</span>}
                  {exp.responsibilities && (
                    <ul style={styles.subList}>
                      {exp.responsibilities.map((resp, ridx) => (
                        <li key={ridx}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>EDUCATION</h4>
            {data.education.map((edu, idx) => {
              const highlight = getHighlightForAddress(`education[${idx}]`);
              const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
              return (
                <div 
                  key={idx} 
                  style={{ ...styles.education, ...highlightStyle }}
                  title={highlight?.reason}
                >
                  {edu.degree && <strong>{edu.degree}</strong>}
                  {edu.field && <span> in {edu.field}</span>}
                  {edu.institution && <div>{edu.institution}</div>}
                  {edu.graduation && <div>{edu.graduation}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderJDData = () => {
    if (!data) return <p>No JD data available</p>;

    return (
      <div>
        {/* Job Title */}
        {data.job_title && (
          <div style={styles.section}>
            <h3 style={styles.jobTitle}>{data.job_title}</h3>
            {data.company_name && <p>{data.company_name}</p>}
            {data.location && <p>{data.location}</p>}
          </div>
        )}

        {/* Required Skills */}
        {data.required_skills && data.required_skills.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>REQUIRED SKILLS</h4>
            <ul style={styles.list}>
              {data.required_skills.map((skill, idx) => {
                const highlight = getHighlightForAddress(`required_skills[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {skill}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Preferred Skills */}
        {data.preferred_skills && data.preferred_skills.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>PREFERRED SKILLS</h4>
            <ul style={styles.list}>
              {data.preferred_skills.map((skill, idx) => {
                const highlight = getHighlightForAddress(`preferred_skills[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {skill}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Requirements */}
        {data.required_experience && data.required_experience.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>EXPERIENCE REQUIREMENTS</h4>
            <ul style={styles.list}>
              {data.required_experience.map((req, idx) => {
                const highlight = getHighlightForAddress(`required_experience[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {req}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Education Requirements */}
        {data.required_education && data.required_education.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>EDUCATION REQUIREMENTS</h4>
            <ul style={styles.list}>
              {data.required_education.map((edu, idx) => {
                const highlight = getHighlightForAddress(`required_education[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {edu}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Responsibilities */}
        {data.key_responsibilities && data.key_responsibilities.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>KEY RESPONSIBILITIES</h4>
            <ul style={styles.list}>
              {data.key_responsibilities.map((resp, idx) => {
                const highlight = getHighlightForAddress(`key_responsibilities[${idx}]`);
                const highlightStyle = highlight ? getHighlightStyle(highlight.class) : {};
                return (
                  <li 
                    key={idx} 
                    style={{ ...styles.listItem, ...highlightStyle }}
                    title={highlight?.reason}
                  >
                    {resp}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const getHighlightStyle = (highlightClass) => {
    switch (highlightClass) {
      case 'highlight-match':
        return styles.highlightMatch;
      case 'highlight-potential':
        return styles.highlightPotential;
      case 'highlight-gap':
        return styles.highlightGap;
      default:
        return {};
    }
  };

  // Main render logic
  return (
    <div style={styles.container}>
      {type === 'cv' ? renderCVData() : renderJDData()}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    color: '#00ff00'
  },
  section: {
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '4px'
  },
  sectionTitle: {
    color: '#00ff00',
    fontSize: '14px',
    marginBottom: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottom: '1px solid #00ff00',
    paddingBottom: '5px'
  },
  jobTitle: {
    color: '#00ff00',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  list: {
    marginLeft: '20px',
    listStyle: 'disc'
  },
  subList: {
    marginLeft: '20px',
    marginTop: '5px',
    listStyle: 'circle'
  },
  listItem: {
    marginBottom: '5px',
    padding: '2px 4px',
    borderRadius: '2px',
    transition: 'background-color 0.3s'
  },
  experience: {
    marginBottom: '15px',
    padding: '8px',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  },
  education: {
    marginBottom: '10px',
    padding: '8px',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  },
  highlightMatch: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    border: '1px solid rgba(0, 255, 0, 0.5)'
  },
  highlightPotential: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    border: '1px solid rgba(255, 165, 0, 0.5)'
  },
  highlightGap: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    border: '1px solid rgba(255, 107, 107, 0.5)'
  }
};

export default HighlightedContent;