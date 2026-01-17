import React, { useState, useEffect } from 'react';
import { db } from '../../core/data/database';
import { ActivityWeights } from '../../core/models/types';
import { DayTargetEditor } from './DayTargetEditor';

interface WeightEditorProps {
  onClose?: () => void;
}

export const WeightEditor: React.FC<WeightEditorProps> = ({ onClose }) => {
  const [weights, setWeights] = useState<ActivityWeights[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDayTargets, setEditingDayTargets] = useState<ActivityWeights | null>(null);
  const [editForm, setEditForm] = useState<Partial<ActivityWeights>>({});

  useEffect(() => {
    loadWeights();
  }, []);

  const loadWeights = async () => {
    try {
      const allWeights = await db.getWeights();
      setWeights(allWeights.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (error) {
      console.error('Erro ao carregar pesos:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (weight: ActivityWeights) => {
    setEditingId(weight.id || null);
    setEditForm({ ...weight });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editForm.name?.trim()) {
      alert('Nome da atividade é obrigatório');
      return;
    }
    if (editForm.importance === undefined || editForm.importance < 1 || editForm.importance > 5) {
      alert('Importância deve ser entre 1 e 5 estrelas');
      return;
    }

    try {
      if (editingId) {
        await db.updateWeight(editingId, editForm as ActivityWeights);
      }
      await loadWeights();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Erro ao salvar peso:', error);
      alert('Erro ao salvar alterações');
    }
  };

  const saveDayTargets = async (targetsByDay: Record<string, number>) => {
    if (!editingDayTargets?.id) return;

    try {
      await db.updateWeight(editingDayTargets.id, { targetsByDay });
      await loadWeights();
      setEditingDayTargets(null);
    } catch (error) {
      console.error('Erro ao salvar metas por dia:', error);
      alert('Erro ao salvar metas');
    }
  };

  const addNewWeight = async () => {
    const newWeight: ActivityWeights = {
      name: 'Nova Atividade',
      importance: 3,
      color: '#6366f1',
      order: (weights.length || 0) + 1,
      targetsByDay: {}
    };

    try {
      await db.addWeight(newWeight);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao adicionar peso:', error);
      alert('Erro ao adicionar atividade');
    }
  };

  const hideWeight = async (id?: number) => {
    if (!id) return;

    try {
      await db.updateWeight(id, { hidden: true } as Partial<ActivityWeights>);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao ocultar peso:', error);
      alert('Erro ao ocultar atividade');
    }
  };

  const showWeight = async (id?: number) => {
    if (!id) return;

    try {
      await db.updateWeight(id, { hidden: false } as Partial<ActivityWeights>);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao mostrar peso:', error);
      alert('Erro ao mostrar atividade');
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const updatedWeights = [...weights];
    const temp = updatedWeights[index].order || index;
    updatedWeights[index].order = updatedWeights[index - 1].order || index - 1;
    updatedWeights[index - 1].order = temp;

    try {
      await db.updateWeight(updatedWeights[index].id!, updatedWeights[index]);
      await db.updateWeight(updatedWeights[index - 1].id!, updatedWeights[index - 1]);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
  };

  const moveDown = async (index: number) => {
    if (index === weights.length - 1) return;
    const updatedWeights = [...weights];
    const temp = updatedWeights[index].order || index;
    updatedWeights[index].order = updatedWeights[index + 1].order || index + 1;
    updatedWeights[index + 1].order = temp;

    try {
      await db.updateWeight(updatedWeights[index].id!, updatedWeights[index]);
      await db.updateWeight(updatedWeights[index + 1].id!, updatedWeights[index + 1]);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (editingDayTargets) {
    return (
      <DayTargetEditor
        weight={editingDayTargets}
        onSave={saveDayTargets}
        onClose={() => setEditingDayTargets(null)}
      />
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Gerenciar Atividades</h2>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Nome</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Importância</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Cor</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {weights.filter(w => !w.hidden).map((weight, index) => (
              <tr key={weight.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                {editingId === weight.id ? (
                  <>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setEditForm({ ...editForm, importance: star })}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '24px',
                              padding: '0',
                              opacity: star <= (editForm.importance || 0) ? 1 : 0.3,
                              transition: 'opacity 0.2s'
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="color"
                        value={editForm.color || '#000000'}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        style={{
                          width: '50px',
                          height: '32px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '6px',
                          fontSize: '12px'
                        }}
                      >
                        ✓ Salvar
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕ Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            background: weight.color,
                            borderRadius: '3px'
                          }}
                        />
                        <span style={{ fontWeight: '500' }}>{weight.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                      <div style={{ fontSize: '18px', letterSpacing: '2px' }}>
                        {Array(weight.importance || 3).fill('★').join('')}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          background: weight.color,
                          borderRadius: '4px',
                          margin: '0 auto'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        style={{
                          padding: '4px 8px',
                          background: index === 0 ? '#d1d5db' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          marginRight: '4px',
                          fontSize: '12px'
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === weights.length - 1}
                        style={{
                          padding: '4px 8px',
                          background: index === weights.length - 1 ? '#d1d5db' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: index === weights.length - 1 ? 'not-allowed' : 'pointer',
                          marginRight: '4px',
                          fontSize: '12px'
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => startEdit(weight)}
                        style={{
                          padding: '4px 8px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginRight: '4px',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setEditingDayTargets(weight)}
                        style={{
                          padding: '4px 8px',
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginRight: '4px',
                          fontSize: '12px'
                        }}
                      >
                        📅 Metas
                      </button>
                      {weight.hidden ? (
                        <button
                          onClick={() => showWeight(weight.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          👁️ Mostrar
                        </button>
                      ) : (
                        <button
                          onClick={() => hideWeight(weight.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          👁️‍🗨️ Ocultar
                        </button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {weights.some(w => w.hidden) && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
            👁️‍🗨️ Atividades Ocultas ({weights.filter(w => w.hidden).length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {weights.filter(w => w.hidden).map(weight => (
              <div key={weight.id} style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'white',
                borderRadius: '4px',
                border: `1px solid ${weight.color}40`,
                fontSize: '13px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: weight.color,
                  borderRadius: '2px'
                }} />
                <span>{weight.name}</span>
                <button
                  onClick={() => showWeight(weight.id)}
                  style={{
                    padding: '3px 8px',
                    background: weight.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    marginLeft: '4px'
                  }}
                >
                  Mostrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={addNewWeight}
        style={{
          padding: '12px 20px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        + Adicionar Nova Atividade
      </button>
    </div>
  );
};
