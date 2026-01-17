import React from 'react';

export default function TestApp() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🎯</h1>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Controle de Estudos</h1>
      <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Sistema offline para controle de produtividade</p>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '15px',
        marginTop: '40px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2>Status do Sistema</h2>
        <div style={{
          display: 'inline-block',
          padding: '10px 20px',
          background: '#10b981',
          borderRadius: '20px',
          marginTop: '15px',
          fontWeight: 'bold'
        }}>
          ✅ PRONTO
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <button 
            onClick={() => alert('Sistema funcionando!')}
            style={{
              padding: '15px 30px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Testar Sistema
          </button>
        </div>
      </div>
    </div>
  );
}