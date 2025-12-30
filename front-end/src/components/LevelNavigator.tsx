import React, { useEffect, useCallback } from 'react';

interface LevelNavigatorProps {
  currentLevel: number;
  totalLevels: number;
  onLevelChange: (level: number) => void;
  disabled?: boolean;
}

export default function LevelNavigator({ 
  currentLevel, 
  totalLevels, 
  onLevelChange, 
  disabled = false 
}: LevelNavigatorProps) {
  
  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (currentLevel > 1) {
          onLevelChange(currentLevel - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentLevel < totalLevels) {
          onLevelChange(currentLevel + 1);
        }
        break;
    }
  }, [currentLevel, totalLevels, onLevelChange, disabled]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle previous button click
  const handlePrevious = () => {
    if (!disabled && currentLevel > 1) {
      onLevelChange(currentLevel - 1);
    }
  };

  // Handle next button click
  const handleNext = () => {
    if (!disabled && currentLevel < totalLevels) {
      onLevelChange(currentLevel + 1);
    }
  };

  // Handle dropdown level selection
  const handleLevelSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled) {
      const selectedLevel = parseInt(event.target.value, 10);
      onLevelChange(selectedLevel);
    }
  };

  // Check boundary conditions for button states
  const isPreviousDisabled = disabled || currentLevel <= 1;
  const isNextDisabled = disabled || currentLevel >= totalLevels;

  return (
    <div 
      className="level-navigator"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        margin: '1rem 0'
      }}
    >
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={isPreviousDisabled}
        className="btn-secondary"
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          minWidth: '100px',
          opacity: isPreviousDisabled ? 0.5 : 1,
          cursor: isPreviousDisabled ? 'not-allowed' : 'pointer'
        }}
        title={isPreviousDisabled ? 'Already at first level' : 'Previous level (Left arrow key)'}
      >
        ← Previous
      </button>

      {/* Level Indicator and Quick Jump Dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#2c3e50'
      }}>
        <span>Level</span>
        <select
          value={currentLevel}
          onChange={handleLevelSelect}
          disabled={disabled}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            backgroundColor: disabled ? '#e9ecef' : 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            minWidth: '60px'
          }}
          title="Quick jump to level"
        >
          {Array.from({ length: totalLevels }, (_, i) => i + 1).map(level => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <span>of {totalLevels}</span>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        className="btn-secondary"
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          minWidth: '100px',
          opacity: isNextDisabled ? 0.5 : 1,
          cursor: isNextDisabled ? 'not-allowed' : 'pointer'
        }}
        title={isNextDisabled ? 'Already at last level' : 'Next level (Right arrow key)'}
      >
        Next →
      </button>

      {/* Keyboard Navigation Hint */}
      <div style={{
        fontSize: '0.75rem',
        color: '#6c757d',
        marginLeft: '1rem',
        fontStyle: 'italic'
      }}>
        Use ← → arrow keys
      </div>
    </div>
  );
}