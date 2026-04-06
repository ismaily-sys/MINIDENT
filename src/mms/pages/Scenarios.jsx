import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, XCircle, AlertCircle, Activity, Users, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ExecutionEngine } from '../services/ExecutionEngine';

/**
 * Page Scénarios - Liste des scénarios disponibles
 */
export default function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(null);

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    try {
      const { data, error } = await supabase
        .from('mms_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (error) {
      console.error('Erreur chargement scénarios:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute(scenarioId) {
    // Get first available user for simulation
    const { data: user } = await supabase
      .from('mms_users')
      .select('*')
      .limit(1)
      .single();

    if (!user) {
      alert('Aucun utilisateur disponible pour la simulation');
      return;
    }

    setSelectedScenario(scenarioId);
    setExecuting(true);
    setExecutionProgress({
      currentStep: 0,
      totalSteps: 0,
      events: [],
      status: 'running'
    });

    // Initialize and run execution
    const engine = new ExecutionEngine();
    const initResult = await engine.initialize(scenarioId, user.id);

    if (!initResult.success) {
      alert('Échec initialisation: ' + initResult.error);
      setExecuting(false);
      return;
    }

    // Run scenario with progress callback
    const result = await engine.runScenario((progress) => {
      setExecutionProgress(prev => ({
        ...prev,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        events: [...(prev?.events || []), progress.lastEvent],
        status: 'running'
      }));
    });

    setExecutionProgress(prev => ({
      ...prev,
      status: result.success ? 'completed' : 'rejected'
    }));
    setExecuting(false);
  }

  const getTriggerLabel = (triggerType) => {
    const labels = {
      failure_event: 'Panne',
      scheduled_event: 'Planifié',
      prediction_signal: 'Prédictif'
    };
    return labels[triggerType] || triggerType;
  };

  const getTriggerColor = (triggerType) => {
    const colors = {
      failure_event: 'bg-red-100 text-red-700 border-red-200',
      scheduled_event: 'bg-blue-100 text-blue-700 border-blue-200',
      prediction_signal: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[triggerType] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Scénarios de Maintenance
        </h1>
        <p className="text-gray-600">
          Simulez l'exécution de workflows de maintenance et visualisez les résultats en temps réel
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {scenarios.map((scenario) => {
          const steps = typeof scenario.steps === 'string' 
            ? JSON.parse(scenario.steps) 
            : scenario.steps;
          
          return (
            <div
              key={scenario.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    {scenario.name}
                  </h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTriggerColor(scenario.trigger_type)}`}>
                  {getTriggerLabel(scenario.trigger_type)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {scenario.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <FileText className="w-4 h-4" />
                <span>{steps.length} étapes</span>
              </div>

              {/* Steps Preview */}
              <div className="space-y-2 mb-4">
                {steps.slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                      {step.step || idx + 1}
                    </span>
                    <span className="text-gray-700">{step.actor}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-600 truncate">{step.action}</span>
                  </div>
                ))}
                {steps.length > 3 && (
                  <p className="text-xs text-gray-400 pl-7">
                    +{steps.length - 3} autres étapes
                  </p>
                )}
              </div>

              <button
                onClick={() => handleExecute(scenario.id)}
                disabled={executing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4" />
                {executing && selectedScenario === scenario.id ? 'Exécution...' : 'Exécuter'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Execution Progress Modal */}
      {executing && executionProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Exécution en cours
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Étape {executionProgress.currentStep} / {executionProgress.totalSteps}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-3 bg-gray-50">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(executionProgress.currentStep / (executionProgress.totalSteps || 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {executionProgress.events.map((event, idx) => (
                  <TimelineEvent key={idx} event={event} isActive={idx === executionProgress.events.length - 1} />
                ))}
                
                {executing && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-sm">Traitement...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {!executing && (
              <div className={`px-6 py-4 border-t ${
                executionProgress.status === 'completed' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-2">
                  {executionProgress.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Exécution terminée avec succès</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">Exécution rejetée</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Composant d'affichage d'un événement timeline
 */
function TimelineEvent({ event, isActive }) {
  const isSuccess = event.status === 'success';
  
  return (
    <div className={`flex gap-4 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isSuccess ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-4 ${!isActive ? 'border-l-2 border-gray-200 ml-4' : ''}`}>
        <div className={`rounded-lg p-4 ${
          isSuccess 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        } ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                Étape {event.step_index}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200">
                {event.actor_role}
              </span>
              {event.actor_specialization && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {event.actor_specialization}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
            </span>
          </div>

          <div className="text-sm text-gray-700 mb-2">
            <span className="font-medium">{event.actor_service}</span>
            {' → '}
            <span className="italic">{event.action}</span>
          </div>

          <p className={`text-sm ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {event.message}
          </p>

          {/* Validation Badge */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              event.validation === 'allowed'
                ? 'bg-green-200 text-green-800'
                : 'bg-red-200 text-red-800'
            }`}>
              Validation: {event.validation === 'allowed' ? 'Autorisée' : 'Refusée'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
