import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Activity, Calendar, List } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Page Exécution - Historique et visualisation des exécutions
 */
export default function Executions() {
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, []);

  async function loadExecutions() {
    try {
      const { data, error } = await supabase
        .from('mms_executions')
        .select(`
          *,
          scenario:mms_scenarios(name, trigger_type)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      console.error('Erreur chargement exécutions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTimeline(executionId) {
    try {
      const { data, error } = await supabase
        .from('mms_timeline_events')
        .select('*')
        .eq('execution_id', executionId)
        .order('step_index', { ascending: true });

      if (error) throw error;
      setTimeline(data || []);
    } catch (error) {
      console.error('Erreur chargement timeline:', error);
    }
  }

  function handleSelectExecution(execution) {
    setSelectedExecution(execution);
    loadTimeline(execution.id);
  }

  const getStatusBadge = (status) => {
    const config = {
      running: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'En cours' },
      completed: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Terminé' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejeté' },
      failed: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Échoué' }
    };
    return config[status] || { color: 'bg-gray-100 text-gray-700', label: status };
  };

  const getTriggerBadge = (triggerType) => {
    const config = {
      failure_event: { color: 'bg-red-100 text-red-700', label: 'Panne' },
      scheduled_event: { color: 'bg-blue-100 text-blue-700', label: 'Planifié' },
      prediction_signal: { color: 'bg-purple-100 text-purple-700', label: 'Prédictif' }
    };
    return config[triggerType] || { color: 'bg-gray-100 text-gray-700', label: triggerType };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Historique des Exécutions
        </h1>
        <p className="text-gray-600">
          Consultez les exécutions passées et analysez les workflows de maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <List className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Exécutions récentes</h2>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {executions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune exécution</p>
                </div>
              ) : (
                executions.map((execution) => {
                  const statusConfig = getStatusBadge(execution.status);
                  const triggerConfig = getTriggerBadge(execution.scenario?.trigger_type);
                  
                  return (
                    <button
                      key={execution.id}
                      onClick={() => handleSelectExecution(execution)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedExecution?.id === execution.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {execution.scenario?.name || 'Scénario inconnu'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className={`px-1.5 py-0.5 rounded ${triggerConfig.color}`}>
                          {triggerConfig.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(execution.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-600">
                          Étape {execution.current_step}/{execution.total_steps}
                        </span>
                        {execution.status === 'completed' && (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        )}
                        {execution.status === 'rejected' && (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Timeline Detail */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {selectedExecution ? (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedExecution.scenario?.name}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(selectedExecution.created_at).toLocaleString('fr-FR')}
                        </span>
                        <span>ID: {selectedExecution.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedExecution.status).color}`}>
                        {getStatusBadge(selectedExecution.status).label}
                      </span>
                      {selectedExecution.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          {selectedExecution.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-6 max-h-[500px] overflow-y-auto">
                  {timeline.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Aucun événement dans la timeline</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeline.map((event, idx) => (
                        <TimelineEvent 
                          key={event.id} 
                          event={event} 
                          isLast={idx === timeline.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Sélectionnez une exécution pour voir la timeline</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant d'affichage d'un événement timeline
 */
function TimelineEvent({ event, isLast }) {
  const isSuccess = event.status === 'success';
  
  return (
    <div className="flex gap-4">
      {/* Status Icon & Line */}
      <div className="flex flex-col items-center">
        {isSuccess ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        )}
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-2" />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <div className={`rounded-lg p-4 ${
          isSuccess 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">
                Étape {event.step_index}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200">
                {event.actor_role}
              </span>
              <span className="text-xs text-gray-600">
                {event.actor_service}
              </span>
              {event.actor_specialization && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {event.actor_specialization}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
            </span>
          </div>

          <div className="text-sm text-gray-700 mb-2">
            <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">
              {event.action}
            </span>
          </div>

          <p className={`text-sm ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {event.message}
          </p>

          {/* Validation Badge & Metadata */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              event.validation === 'allowed'
                ? 'bg-green-200 text-green-800'
                : 'bg-red-200 text-red-800'
            }`}>
              Validation: {event.validation === 'allowed' ? 'Autorisée ✓' : 'Refusée ✗'}
            </span>
            
            {event.metadata?.user_name && (
              <span className="text-xs text-gray-600">
                Utilisateur: {event.metadata.user_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
