import { useNavigate } from 'react-router-dom';

export default function StoryPage() {
  const navigate = useNavigate();

  return (
    <div className="story-page">
      <header className="story-header">
        <div className="story-title">
          <h1>From Spreadsheet to Serverless</h1>
          <p className="story-subtitle">The ERT Transformation Journey</p>
        </div>
        <nav className="story-nav">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            ← Back to Home
          </button>
        </nav>
      </header>

      <main className="story-main">
        <section className="story-section story-conclusion">
          <div className="story-content">
            <h2>The Result</h2>
            <p>
              What started as a 2000-line Google Apps Script became a modern, 
              scalable serverless application that demonstrates expertise in 
              cloud architecture, full-stack development, and AI-assisted programming.
            </p>
            <div className="story-cta">
              <button
                onClick={() => navigate('/demo')}
                className="btn-primary btn-large"
              >
                Try the Demo
              </button>
              <button
                onClick={() => window.open('/Spreadsheet_to_Serverless_The_ERT_Transformation_Story.pdf', '_blank')}
                className="btn-secondary btn-large"
              >
                📄 View PDF Story
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-secondary btn-large"
              >
                Explore the App
              </button>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 1: The Google Sheets Era</h2>
            <p>
              It all started with a practical problem - preparing for AWS certifications. 
              What began as a simple Google Sheets solution evolved into a complex system 
              with over 2000 lines of Google Apps Script code managing quiz questions, 
              progress tracking, and user interactions.
            </p>
            <div className="story-highlight">
              <strong>The Challenge:</strong> A monolithic code.gs file handling everything from 
              question randomization to progress persistence, with no user isolation or scalability.
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 2: The Kiro Partnership</h2>
            <p>
              Instead of starting from scratch, I brought that massive code.gs file to Kiro 
              with a unique request: reverse-engineer the requirements from the existing functions. 
              This approach preserved years of refined business logic while identifying the 
              core functionality that actually mattered.
            </p>
            <div className="story-highlight">
              <strong>The Breakthrough:</strong> Kiro analyzed the 2000+ lines of script and 
              extracted clean, modern requirements that became the foundation for the new architecture.
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 3: Modern Architecture Vision</h2>
            <p>
              Together, we designed a serverless AWS architecture that would transform 
              the spreadsheet-based system into a scalable, multi-user platform:
            </p>
            <div className="architecture-grid">
              <div className="arch-item">
                <strong>Frontend:</strong> React + TypeScript for type safety and modern UX
              </div>
              <div className="arch-item">
                <strong>Hosting:</strong> AWS Amplify for seamless CI/CD and global distribution
              </div>
              <div className="arch-item">
                <strong>Authentication:</strong> AWS Cognito for secure user management
              </div>
              <div className="arch-item">
                <strong>Database:</strong> MongoDB Atlas for flexible, document-based storage
              </div>
              <div className="arch-item">
                <strong>API:</strong> Lambda functions with Express.js for serverless scalability
              </div>
              <div className="arch-item">
                <strong>Monitoring:</strong> Winston logging with CloudWatch integration
              </div>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 4: The Development Journey</h2>
            <p>The transformation involved several key phases:</p>
            <div className="development-phases">
              <div className="phase">
                <h4>1. Requirements Engineering</h4>
                <p>Extracting business rules from 2000 lines of script</p>
              </div>
              <div className="phase">
                <h4>2. Data Migration</h4>
                <p>Moving from spreadsheet cells to MongoDB collections</p>
              </div>
              <div className="phase">
                <h4>3. User Experience Design</h4>
                <p>Creating an intuitive, responsive interface</p>
              </div>
              <div className="phase">
                <h4>4. State Management</h4>
                <p>Implementing proper session and progress tracking</p>
              </div>
              <div className="phase">
                <h4>5. Security Implementation</h4>
                <p>Adding authentication and data isolation</p>
              </div>
              <div className="phase">
                <h4>6. Testing & Deployment</h4>
                <p>Establishing CI/CD pipelines and monitoring</p>
              </div>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 5: Technical Achievements</h2>
            <p>The final application demonstrates several impressive technical accomplishments:</p>
            <div className="achievements-grid">
              <div className="achievement">
                <h4>🎯 Adaptive Learning</h4>
                <p>Smart question selection that skips mastered content</p>
              </div>
              <div className="achievement">
                <h4>📚 Multi-Exam Support</h4>
                <p>Extensible architecture for various certifications</p>
              </div>
              <div className="achievement">
                <h4>📊 Real-time Progress</h4>
                <p>Immediate feedback and detailed analytics</p>
              </div>
              <div className="achievement">
                <h4>👨‍💼 Admin Capabilities</h4>
                <p>Content management and user administration</p>
              </div>
              <div className="achievement">
                <h4>☁️ Scalable Infrastructure</h4>
                <p>Serverless architecture that scales automatically</p>
              </div>
              <div className="achievement">
                <h4>🚀 Modern DevOps</h4>
                <p>Automated deployments and comprehensive monitoring</p>
              </div>
            </div>
          </div>
        </section>

        <section className="story-section">
          <div className="story-content">
            <h2>Chapter 6: The Portfolio Impact</h2>
            <p>This project showcases a complete skill set for modern software development:</p>
            <div className="skills-showcase">
              <div className="skill-category">
                <h4>Legacy Modernization</h4>
                <p>Successfully migrating complex business logic from legacy systems</p>
              </div>
              <div className="skill-category">
                <h4>Cloud Architecture</h4>
                <p>Designing and implementing serverless solutions on AWS</p>
              </div>
              <div className="skill-category">
                <h4>Full-Stack Development</h4>
                <p>Frontend, backend, and database expertise</p>
              </div>
              <div className="skill-category">
                <h4>AI Collaboration</h4>
                <p>Leveraging AI tools for accelerated development</p>
              </div>
              <div className="skill-category">
                <h4>Problem Solving</h4>
                <p>Transforming a personal tool into a scalable platform</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="story-footer">
        <p>Built with React, TypeScript, AWS Amplify, and AI collaboration</p>
      </footer>
    </div>
  );
}