import React, { useState, useEffect } from 'react';

// A summary card displaying OEE data for a machine.
export default function OEESummaryCard({ machineName, targetOEE: propTargetOEE, actualOEE: propActualOEE, onClick }) {
  const [displayTargetOEE, setDisplayTargetOEE] = useState(propTargetOEE);
  const [displayActualOEE, setDisplayActualOEE] = useState(propActualOEE);

  const cardStyle = {
    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    border: '1px solid #90caf9',
    borderRadius: 12,
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  };

  const hoverStyle = {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
  };

  const [isHovered, setIsHovered] = useState(false);

  const targetColor = '#fb923c'; 
  const actualColor = '#4ade80'; 

  return (
    <div
      style={isHovered ? { ...cardStyle, ...hoverStyle } : cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 style={{ 
        margin: '0 0 15px 0', 
        fontSize: '1.5em', 
        color: '#1565c0', 
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        {machineName}
      </h3>

      {/* Column Chart with Legends */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '20px',
        gap: '15px'
      }}>
        {/* Chart Container */}
        <div style={{
          width: '100%',
          height: '200px',
          position: 'relative',
          background: '#f3f4f6',
          borderRadius: '8px',
          overflow: 'visible', 
          paddingTop: '30px', 
          marginTop: '15px' 
        }}>
          {/* Target Column */}
          <div style={{
            position: 'absolute',
            left: '20%',
            bottom: 0,
            width: '30px',
            height: `${displayTargetOEE !== null ? displayTargetOEE : 0}%`,
            backgroundColor: targetColor,
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s ease-out'
          }}>
            {/* Percentage displayed above the bar */}
            <div style={{
              position: 'absolute',
              top: '-25px', 
              left: '-5px',
              width: '40px',
              textAlign: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: targetColor,
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {displayTargetOEE !== null ? `${displayTargetOEE}%` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Actual Column */}
          <div style={{
            position: 'absolute',
            left: '70%',
            bottom: 0,
            width: '30px',
            height: `${displayActualOEE !== null ? displayActualOEE : 0}%`,
            backgroundColor: actualColor,
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.3s ease-out'
          }}>
            {/* Percentage displayed above the bar */}
            <div style={{
              position: 'absolute',
              top: '-25px', 
              left: '-5px',
              width: '40px',
              textAlign: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: actualColor,
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                {displayActualOEE !== null ? `${displayActualOEE}%` : '-'}
              </span>
            </div>
          </div>



          {/* Y-axis labels */}
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '0',
            bottom: '2px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#64748b'
          }}>
            <span>100%</span>
            <span>80%</span>
            <span>60%</span>
            <span>40%</span>
            <span>20%</span>
            <span>0%</span>
          </div>
        </div>

        {/* Legends */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          width: '100%',
          marginTop: '18px',
          padding: '8px 0',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(30,64,175,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              background: 'linear-gradient(135deg, #fdba74, #fb923c)',
              borderRadius: '3px',
              boxShadow: '0 1px 4px rgba(251,146,60,0.15)'
            }}></div>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#fb923c',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px #fff9',
            }}>Target</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              background: 'linear-gradient(135deg, #6ee7b7, #22d3ee)',
              borderRadius: '3px',
              boxShadow: '0 1px 4px rgba(34,211,238,0.15)'
            }}></div>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#22d3ee',
              letterSpacing: '0.5px',
              textShadow: '0 1px 2px #fff9',
            }}>Actual</span>
          </div>
        </div>
      </div>
    </div>
  );
}
