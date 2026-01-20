// import React from 'react';

// interface DebugPanelProps {
//   debugInfo: any;
// }

// export const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo }) => {
//   if (!debugInfo) {
//     return <div>Coletando informações de debug...</div>;
//   }

//   const resetDatabase = async () => {
//     if (confirm('Tem certeza que deseja resetar TODOS os dados? Isso não pode ser desfeito.')) {
//       try {
//         if ((window as any).studyDB) {
//           (window as any).studyDB.delete();
//           console.log('Banco resetado. Recarregando...');
//           setTimeout(() => window.location.reload(), 1000);
//         }
//       } catch (error) {
//         console.error('Erro ao resetar banco:', error);
//       }
//     }
//   };

//   return (
//     <div style={{ 
//       background: '#f8f9fa', 
//       border: '1px solid #dee2e6',
//       borderRadius: '8px',
//       padding: '20px',
//       marginBottom: '20px'
//     }}>
//       <h3 style={{ marginTop: 0, color: '#495057' }}>🔧 Informações de Debug</h3>
      
//       <div style={{ 
//         display: 'grid', 
//         gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//         gap: '15px',
//         marginBottom: '20px'
//       }}>
//         <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
//           <h4 style={{ margin: '0 0 5px 0', color: '#3b82f6' }}>Pesos</h4>
//           <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{debugInfo.weightsCount}</div>
//           <div style={{ fontSize: '12px', color: '#6c757d' }}>configurações</div>
//         </div>
        
//         <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
//           <h4 style={{ margin: '0 0 5px 0', color: '#10b981' }}>Objetivos</h4>
//           <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{debugInfo.objectivesCount}</div>
//           <div style={{ fontSize: '12px', color: '#6c757d' }}>ativos</div>
//         </div>
        
//         <div style={{ background: 'white', padding: '15px', borderRadius: '6px' }}>
//           <h4 style={{ margin: '0 0 5px 0', color: '#8b5cf6' }}>Meses</h4>
//           <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{debugInfo.monthlyDataCount}</div>
//           <div style={{ fontSize: '12px', color: '#6c757d' }}>armazenados</div>
//         </div>
//       </div>
      
//       <div style={{ marginBottom: '15px' }}>
//         <h4>Pesos cadastrados:</h4>
//         <div style={{ 
//           display: 'grid', 
//           gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
//           gap: '10px'
//         }}>
//           {debugInfo.weights.map((weight: any) => (
//             <div 
//               key={weight.id} 
//               style={{ 
//                 background: 'white',
//                 padding: '10px',
//                 borderRadius: '6px',
//                 borderLeft: `4px solid ${weight.color}`
//               }}
//             >
//               <div style={{ fontWeight: 'bold' }}>{weight.name}</div>
//               <div style={{ fontSize: '12px', color: '#6c757d' }}>
//                 Importância: {Array(weight.importance || 3).fill('★').join('')} • Ordem: {weight.order}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
      
//       <div style={{ 
//         display: 'flex', 
//         gap: '10px',
//         paddingTop: '15px',
//         borderTop: '1px solid #dee2e6'
//       }}>
//         <button
//           onClick={() => {
//             console.log('Debug info:', debugInfo);
//             alert('Verifique o console (F12) para ver os dados completos');
//           }}
//           style={{
//             padding: '8px 16px',
//             background: '#6c757d',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer',
//             fontSize: '14px'
//           }}
//         >
//           Ver no Console
//         </button>
        
//         <button
//           onClick={resetDatabase}
//           style={{
//             padding: '8px 16px',
//             background: '#dc3545',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer',
//             fontSize: '14px'
//           }}
//         >
//           Resetar Banco
//         </button>
        
//         <button
//           onClick={() => window.location.reload()}
//           style={{
//             padding: '8px 16px',
//             background: '#0dcaf0',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer',
//             fontSize: '14px'
//           }}
//         >
//           Recarregar
//         </button>
//       </div>
//     </div>
//   );
// };