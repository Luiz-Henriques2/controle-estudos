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
    if (editForm.weight === undefined || editForm.weight < 0) {
      alert('Peso deve ser um número positivo');
      return;
    }
    if (editForm.target === undefined || editForm.target < 0) {
      alert('Alvo deve ser um número positivo');
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
      weight: 1,
      color: '#6366f1',
      order: (weights.length || 0) + 1,
      target: 1
    };

    try {
      await db.addWeight(newWeight);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao adicionar peso:', error);
      alert('Erro ao adicionar atividade');
    }
  };

  const deleteWeight = async (id?: number) => {
    if (!id) return;
    if (!confirm('Tem certeza que deseja remover esta atividade? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await db.deleteWeight(id);
      await loadWeights();
    } catch (error) {
      console.error('Erro ao remover peso:', error);
      alert('Erro ao remover atividade');
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
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Fechar
          </button>
        )}
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
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Peso</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Alvo (h)</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Cor</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {weights.map((weight, index) => (
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
                      <input
                        type="number"
                        step="0.1"
                        value={editForm.weight || 0}
                        onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                        style={{
                          width: '80px',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.target || 0}
                        onChange={(e) => setEditForm({ ...editForm, target: parseFloat(e.target.value) })}
                        style={{
                          width: '80px',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}
                      />
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
                      {weight.weight}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                      {weight.target || '-'}
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
                      <button
                        onClick={() => deleteWeight(weight.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Remover
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
